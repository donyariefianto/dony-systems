import { database } from '#services/mongodb_service'
import { ObjectId } from 'mongodb'
import vm from 'vm'

export class SmartProjectionEngineService {
 static async executeEngine(data_request, method_request, param_request) {
  try {
   const source_data = data_request
   const trigger_collection = param_request.col
   const id_data = param_request.id
   switch (method_request) {
    case 'POST':
     method_request = 'onInsert'
     break
    case 'PUT':
     method_request = 'onUpdate'
     break
    case 'DELETE':
     method_request = 'onDelete'
     break
   }
   const collections = database.data?.collection('smart_projection_engine')
   let find_engine_trigger = await collections?.findOne({
    'status': 'active',
    'trigger.collection': trigger_collection,
    'trigger.event': method_request,
   })
   if (!find_engine_trigger || find_engine_trigger.mapping.length===0) {
    return
   }
   let engine_collection = find_engine_trigger.engine_collection
   const collections_current = database.data?.collection(engine_collection)
   let data_current = await collections_current?.findOne({},{},{sort:{updated_at:-1}})
   let fields = find_engine_trigger.mapping
   let result_smart_projection_engine = this.processNestedProjection(source_data, fields)
   if (result_smart_projection_engine.errors) {
    // insert log error
    return
   }
  //  save result 
   await collections_current?.insertOne(result_smart_projection_engine.data)
  } catch (error) {
    // insert log error
  }
 }
 static getDeepValue(obj, path) {
  if (!path || !obj) return null
  const cleanPath = path.startsWith('source.') ? path.slice(7) : path
  return cleanPath.split('.').reduce((acc, part) => {
   return acc && acc[part] !== undefined ? acc[part] : null
  }, obj)
 }
 static executeFormula(code, context) {
  if (!code || typeof code !== 'string') return null
  try {
   const script = new vm.Script(`(function() { return ${code} })()`)
   return script.runInContext(context, { timeout: 100 })
  } catch (e) {
   throw new Error(`Formula Error: ${e.message}`)
  }
 }
 static castValue(value, type) {
  if (value === null || value === undefined) return null
  switch (type) {
   case 'string':
    return String(value)
   case 'number':
    const n = Number(value)
    return isNaN(n) ? 0 : n
   case 'boolean':
    return !!value
   case 'array':
    return Array.isArray(value) ? value : []
   case 'object':
    return typeof value === 'object' ? value : {}
   default:
    return value
  }
 }
 static processNestedProjection(sourceData, nestedMapping) {
  const result = {}
  const errors = []
  const sandboxContext = {
   source: sourceData,
   Math: Math,
   Date: Date,
  }
  const context = vm.createContext(sandboxContext)
  const transformLevel = (rules, targetParent) => {
   rules.forEach((rule) => {
    const { target_key, transformation_type, expression, meta_data } = rule
    const dataType = (meta_data?.data_type || 'string').toLowerCase()
    const children = meta_data?.children || []
    try {
     if (dataType === 'object') {
      targetParent[target_key] = {}
      transformLevel(children, targetParent[target_key])
     } else if (dataType === 'array') {
      targetParent[target_key] = []
      const placeholderObj = {}
      transformLevel(children, placeholderObj)
      if (Object.keys(placeholderObj).length > 0) {
       targetParent[target_key].push(placeholderObj)
      }
     } else {
      let value = null
      switch (transformation_type) {
       case 'direct':
        value = this.getDeepValue(sourceData, expression)
        break
       case 'static':
        value = expression
        break
       case 'formula':
        value = this.executeFormula(expression, context)
        break
      }
      targetParent[target_key] = this.castValue(value, dataType)
     }
    } catch (err) {
     errors.push({ field: target_key, error: err.message })
     targetParent[target_key] = null
    }
   })
  }
  transformLevel(nestedMapping, result)
  return { data: result, errors: errors.length > 0 ? errors : null }
 }
}
