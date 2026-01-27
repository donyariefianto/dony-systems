import { database } from '#services/mongodb_service'
import { ObjectId } from 'mongodb'
import vm from 'vm'

export class SmartProjectionEngineService {
 static async executeEngine(data_request: any, method_request: any, param_request: any) {
  try {
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

   const IDCollectionName = config.id_engine_collection
   if (!IDCollectionName) {
    console.error(`SPE Error: ID Target collection not defined for ${config.feature_name}`)
    return
   }
   const targetCollection = database.data?.collection("projection")
   const query_data_projection = {id:IDCollectionName}
   let oldData: any = await targetCollection?.findOne(query_data_projection) || null
   if (oldData) oldData.id_data = id_data
   const result = await this.processNestedProjection(source_data, config.mapping, oldData)
   if (result.data) {
    let result_projection = result.data
    result_projection['id'] = IDCollectionName
    result_projection['updated_at'] = new Date()
    await targetCollection?.replaceOne(query_data_projection,result_projection,{upsert:true})    
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

  const sandboxContext = vm.createContext({
   source: sourceData,
   old: oldData,
   item: activeSource,
   Math: Math,
   Date: Date,
   ObjectId: ObjectId,

   get: (path: string) => this.getDeepValue(activeSource, path),

   lookup: async (col: string, id: any, proj = {}) => {
    if (!id) return null
    const query =
     typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id }
    return await database.data?.collection(col).findOne(query, { projection: proj })
   },

   lookupList: async (col: string, query = {}, proj = {}, limit = 100) => {
    return (
     (await database.data
      ?.collection(col)
      .find(query, { projection: proj })
      .limit(limit)
      .toArray()) || []
    )
   },
  })

  const transformLevel = async (rules: any[], container: any) => {
   if (!Array.isArray(rules)) return

   for (const rule of rules) {
    const { target_key, transformation_type, expression, meta_data } = rule
    const dataType = (meta_data?.data_type || 'string').toLowerCase()
    const children = meta_data?.children || []

    let finalValue: any = null

    try {
     let assignedValue: any = null
     if (transformation_type === 'direct') {
      assignedValue = this.getDeepValue(activeSource, expression)
     } else if (transformation_type === 'formula') {
      assignedValue = await this.executeFormula(expression, sandboxContext)
     } else if (transformation_type === 'static') {
      assignedValue = expression
     }

     if (dataType === 'object') {
      finalValue = assignedValue && typeof assignedValue === 'object' ? { ...assignedValue } : {}

      if (children.length > 0) {
       await transformLevel(children, finalValue)
      }
     } else if (dataType === 'array') {
      const baseList = Array.isArray(assignedValue) ? assignedValue : []

      if (children.length > 0) {
       if (baseList.length > 0) {
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
        finalValue = []
        await transformLevel(children, finalValue)
       }
      } else {
       finalValue = baseList
      }
     } else {
      finalValue = this.castValue(assignedValue, dataType)
     }

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
     if (!Array.isArray(container)) container[target_key] = null
    }
   }
  }

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

 static async testFormula(payload: { code: string; source: any; old: any }) {
  const { code, source, old } = payload

  if (!code) throw new Error('Formula code is required')

  const sandboxContext = vm.createContext({
   source: source || {},
   old: old || null,
   item: source || {},
   Math: Math,
   Date: Date,
   ObjectId: ObjectId,

   get: (path: string) => this.getDeepValue(source, path),
   lookup: async (col: string, id: any, proj = {}) => {
    if (!id) return null
    const query =
     typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id }
    return await database.data?.collection(col).findOne(query, { projection: proj })
   },
   lookupList: async (col: string, query = {}, proj = {}, limit = 10) => {
    return (
     (await database.data
      ?.collection(col)
      .find(query, { projection: proj })
      .limit(limit)
      .toArray()) || []
    )
   },
  })

  try {
   const scriptCode = `(async function() { 
            try { 
                return ${code}; 
            } catch(e) { 
                throw new Error(e.message); 
            } 
        })()`

   const script = new vm.Script(scriptCode)
   const result = await script.runInContext(sandboxContext, { timeout: 2000 })

   return { success: true, result }
  } catch (e: any) {
   return { success: false, error: e.message }
  }
 }
}
