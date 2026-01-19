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

   const targetCollectionName = config.engine_collection
   if (!targetCollectionName) {
    console.error(`SPE Error: Target collection not defined for ${config.feature_name}`)
    return
   }
   const targetCollection = database.data?.collection(targetCollectionName)

   let oldData: any = await targetCollection?.find({}).sort({ _id: -1 }).limit(1).toArray()
   oldData = oldData[0]

   const result = this.processNestedProjection(source_data, config.mapping, oldData)

   if (result.data) {
    await targetCollection?.insertOne(result.data)
   }
  } catch (error) {
   console.error('SPE Execution Error:', error)
  }
 }

 static processNestedProjection(
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

   get: (path: string) => this.getDeepValue(activeSource, path),
   ObjectId: ObjectId,
   console: { log: () => {} },
  })

  const transformLevel = (rules: any[], container: any) => {
   if (!Array.isArray(rules)) return

   rules.forEach((rule) => {
    const { target_key, transformation_type, expression, meta_data } = rule
    const dataType = (meta_data?.data_type || 'string').toLowerCase()
    const children = meta_data?.children || []

    let finalValue: any = null

    try {
     if (dataType === 'object') {
      finalValue = {}
      transformLevel(children, finalValue)
     } else if (dataType === 'array') {
      finalValue = []

      const isDynamicLoop = expression && String(expression).trim() !== ''

      if (isDynamicLoop) {
       const sourceArray =
        transformation_type === 'formula'
         ? this.executeFormula(expression, sandboxContext)
         : this.getDeepValue(activeSource, expression)

       if (Array.isArray(sourceArray)) {
        finalValue = sourceArray.map((loopItem: any) => {
         const childResult = this.processNestedProjection(sourceData, children, oldData, loopItem)
         return childResult.data
        })
       }
      } else {
       transformLevel(children, finalValue)
      }
     } else {
      if (transformation_type === 'direct') {
       finalValue = this.getDeepValue(activeSource, expression)
      } else if (transformation_type === 'formula') {
       finalValue = this.executeFormula(expression, sandboxContext)
      } else {
       finalValue = expression
      }
      finalValue = this.castValue(finalValue, dataType)
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
   })
  }

  transformLevel(mappingRules, result)
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

 static executeFormula(code: string, context: any) {
  if (!code || typeof code !== 'string') return null
  try {
   const scriptCode = `(function() { try { return ${code}; } catch(e) { return null; } })()`
   const script = new vm.Script(scriptCode)
   return script.runInContext(context, { timeout: 100 })
  } catch (e) {
   return null
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
