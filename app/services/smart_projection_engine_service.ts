import { database } from '#services/mongodb_service'
import { ObjectId } from 'mongodb'
import vm from 'vm'

export class SmartProjectionEngineService {
 static async executeEngine(data_request: any, method_request: any, param_request: any) {
  try {
   const isEmpty = Object.keys(data_request).length === 0;
   if (isEmpty) return
   const source_data = data_request
   const trigger_collection = param_request.col
   const id_data = param_request.id

   let eventType = ''
   switch (method_request) {
    case 'POST':
     eventType = 'onInsert'
     break
    case 'PUT':
     eventType = 'onUpdate'
     break
    case 'DELETE':
     eventType = 'onDelete'
     break
    default:
     return
   }

   const speCollection = database.data?.collection('smart_projection_engine')
   const config = await speCollection?.findOne({
    'status': 'active',
    'trigger.collection': trigger_collection,
    'trigger.event': eventType,
   })

   if (!config || !config.mapping || config.mapping.length === 0) {
    return
   }

   const targetCollectionName = config.engine_collection
   if (!targetCollectionName) {
    console.error(`SPE Error: Target collection not defined for ${config.feature_name}`)
    return
   }
   const targetCollection = database.data?.collection(targetCollectionName)

   let oldData: any = await targetCollection?.find({}).sort({ _id: -1 }).limit(1).toArray()
   oldData = oldData[0]

   const result = await this.processNestedProjection(source_data, config.mapping, oldData)

   if (result.data) {
    await targetCollection?.insertOne(result.data)
   }
  } catch (error) {
   console.error('SPE Execution Error:', error)
  }
 }

 static async processNestedProjection(
  sourceData: any,
  mappingRules: any[],
  oldData: any = null,
  currentScope: any = null
) {
  const result: any = {}
  const activeSource = currentScope || sourceData

  // 1. Siapkan Sandbox Context (Mendukung Async & Helper Master Data)
  const sandboxContext = vm.createContext({
    source: sourceData,
    old: oldData,
    item: activeSource,
    Math: Math,
    Date: Date,
    ObjectId: ObjectId,
    // Helper untuk mengambil nilai nested secara aman
    get: (path: string) => this.getDeepValue(activeSource, path),
    // Helper untuk mencari satu data master (findOne)
    lookup: async (col: string, id: any, proj = {}) => {
      if (!id) return null
      const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id }
      return await database.data?.collection(col).findOne(query, { projection: proj })
    },
    // Helper untuk mencari banyak data master (find to array)
    lookupList: async (col: string, query = {}, proj = {}, limit = 100) => {
      return (await database.data?.collection(col).find(query, { projection: proj }).limit(limit).toArray()) || []
    },
  })

  /**
   * Helper Rekursif Internal untuk memproses setiap level aturan
   */
  const transformLevel = async (rules: any[], container: any) => {
    if (!Array.isArray(rules)) return

    for (const rule of rules) {
      const { target_key, transformation_type, expression, meta_data } = rule
      const dataType = (meta_data?.data_type || 'string').toLowerCase()
      const children = meta_data?.children || []

      let finalValue: any = null

      try {
        // A. AMBIL NILAI DARI ASSIGNMENT (Direct / Formula / Static)
        let assignedValue: any = null
        if (transformation_type === 'direct') {
          assignedValue = this.getDeepValue(activeSource, expression)
        } else if (transformation_type === 'formula') {
          assignedValue = await this.executeFormula(expression, sandboxContext)
        } else if (transformation_type === 'static') {
          assignedValue = expression
        }

        // B. PROSES BERDASARKAN TIPE DATA (OBJECT/ARRAY/PRIMITIVE)
        if (dataType === 'object') {
          // Gunakan hasil assignment sebagai base object, atau {} jika kosong
          finalValue = assignedValue && typeof assignedValue === 'object' ? { ...assignedValue } : {}
          
          // Jika memiliki anak di UI, lakukan pengisian field di dalam object tersebut
          if (children.length > 0) {
            await transformLevel(children, finalValue)
          }
        } 
        else if (dataType === 'array') {
          // Gunakan hasil assignment (seperti lookupList) sebagai base list
          const baseList = Array.isArray(assignedValue) ? assignedValue : []

          if (children.length > 0) {
            if (baseList.length > 0) {
              // MODE TEMPLATE: Gunakan children sebagai aturan transformasi untuk setiap item di baseList
              finalValue = await Promise.all(
                baseList.map(async (loopItem: any) => {
                  const childResult = await SmartProjectionEngineService.processNestedProjection(
                    sourceData,
                    children,
                    oldData,
                    loopItem
                  )
                  return childResult.data
                })
              )
            } else {
              // MODE STATIC: Jika base list kosong tetapi children ada, proses berdasarkan index (0, 1, 2)
              finalValue = []
              await transformLevel(children, finalValue)
            }
          } else {
            finalValue = baseList
          }
        } 
        else {
          // TIPE PRIMITIF (String, Number, Boolean, dsb)
          finalValue = this.castValue(assignedValue, dataType)
        }

        // C. PENEMPATAN HASIL PADA CONTAINER (Object Property atau Array Index)
        if (Array.isArray(container)) {
          const index = parseInt(target_key, 10)
          if (!isNaN(index)) {
            container[index] = finalValue
          } else {
            container.push(finalValue)
          }
        } else {
          container[target_key] = finalValue
        }

      } catch (err) {
        // Proteksi jika terjadi error pada field spesifik
        if (!Array.isArray(container)) container[target_key] = null
      }
    }
  }

  // Jalankan transformasi pada level paling atas
  await transformLevel(mappingRules, result)

  return { data: result }
}

 static getDeepValue(obj: any, path: string, defaultValue: any = null) {
  if (!obj || typeof obj !== 'object' || !path) {
   return defaultValue
  }

  const cleanPath = String(path).replace(/^(source\.|item\.|old\.)/, '')

  if (!cleanPath) return obj

  const keys = cleanPath.split('.')
  let current = obj

  for (const key of keys) {
   if (current === null || current === undefined) {
    return defaultValue
   }
   current = current[key]
  }

  return current !== undefined ? current : defaultValue
 }

 static async executeFormula(code: string, context: any) {
  if (!code || typeof code !== 'string') return null
  try {
   const scriptCode = `(async function() { try { return ${code}; } catch(e) { return null; } })()`
   const script = new vm.Script(scriptCode)
   return await script.runInContext(context, { timeout: 2100 })
  } catch (e) {
   return e
  }
 }

 static castValue(value: any, type: string) {
  if (value === null || value === undefined) return null

  switch (type.toLowerCase()) {
   case 'string':
    return typeof value === 'object' ? JSON.stringify(value) : String(value)
   case 'number':
    const num = Number(value)
    return isNaN(num) ? 0 : num
   case 'boolean':
    if (typeof value === 'string' && value.toLowerCase() === 'false') return false
    return Boolean(value)
   case 'array':
    return Array.isArray(value) ? value : [value]
   case 'object':
    return typeof value === 'object' && !Array.isArray(value) ? value : {}
   case 'objectid':
    try {
     return new ObjectId(value)
    } catch (e) {
     return value
    }
   default:
    return value
  }
 }
}
