import { Worker, Job } from 'bullmq'
import { database } from '#services/mongodb_service'
import { SPE_QUEUE_NAME } from '#services/spe_queue_service'
import { DateService } from '#services/date_service'
import env from '#start/env'
import vm from 'vm'
import { ObjectId } from 'mongodb'

interface SPEPayload {
 data_request: any
 method_request: string
 param_request: {
  col: string
  id: string
 }
 timestamp_request: number
 old_source: any
}

interface TriggerConfig {
 source: string
 event: string
 mapping: any[]
}

interface SPEConfig {
 _id: ObjectId
 feature_name: string
 id_engine_collection: string
 triggers: TriggerConfig[]
 status: string
}

export let speWorker: Worker | undefined

const connection = {
 host: env.get('REDIS_HOST', '127.0.0.1'),
 port: env.get('REDIS_PORT', 6379),
 password: env.get('REDIS_PASSWORD', ''),
}

const getDeepValue = (obj: any, path: string) => {
 if (!obj || !path) return null
 const cleanPath = path.replace(/^(id_data\.|source\.|item\.|old_source\.|old\.)/, '')
 return cleanPath.split('.').reduce((acc, part) => acc && acc[part], obj)
}

const executeFormula = async (code: string, context: any) => {
 if (!code) return null
 const db = database.data
 const sandbox = {
  source: context.source || {},
  old_source: context.old_source || null,
  id_data: context.id_data || null,
  old: context.old || null,
  item: context.item || {},
  Math: Math,
  Date: Date,
  ObjectId: ObjectId,
  get: (path: string) => getDeepValue(context.item || context.source, path),
  lookup: async (col: string, id: any, proj = {}) => {
   if (!id || !db) return null
   const query =
    typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id }
   return await db.collection(col).findOne(query, { projection: proj })
  },
  lookupList: async (col: string, query = {}, proj = {}, limit = 100) => {
   if (!db) return []
   return await db.collection(col).find(query, { projection: proj }).limit(limit).toArray()
  },
 }

 try {
  vm.createContext(sandbox)
  const scriptCode = `(async function() { try { return ${code}; } catch(e) { return null; } })()`
  const script = new vm.Script(scriptCode)
  return await script.runInContext(sandbox, { timeout: 3000 })
 } catch (error) {
  return null
 }
}
const processMapping = async (
 nodes: any[],
 sourceData: any,
 oldData: any = null,
 currentScope: any = null,
 old_source: any = null,
 id_data: any = null
): Promise<any> => {
 const result: any = {}
 const activeSource = currentScope || sourceData

 for (const node of nodes) {
  const { target_key, transformation_type, expression, meta_data } = node
  const dataType = (meta_data?.data_type || 'string').toLowerCase()
  const children = meta_data?.children || []

  let assignedValue: any = null

  try {
   if (transformation_type === 'direct') {
    assignedValue = getDeepValue(activeSource, expression)
   } else if (transformation_type === 'formula') {
    assignedValue = await executeFormula(expression, {
     source: sourceData,
     old: oldData,
     item: activeSource,
     old_source: old_source,
     id_data: id_data,
    })
   } else if (transformation_type === 'static') {
    assignedValue = expression
   }

   let finalValue: any = null

   if (dataType === 'object') {
    finalValue = assignedValue && typeof assignedValue === 'object' ? { ...assignedValue } : {}
    if (children.length > 0) {
     const childrenResult = await processMapping(children, sourceData, oldData, finalValue)
     finalValue = { ...finalValue, ...childrenResult }
    }
   } else if (dataType === 'array') {
    const baseList = Array.isArray(assignedValue) ? assignedValue : []
    if (children.length > 0 && baseList.length > 0) {
     finalValue = await Promise.all(
      baseList.map(async (loopItem: any) => {
       return await processMapping(children, sourceData, oldData, loopItem)
      })
     )
    } else {
     finalValue = baseList
    }
   } else {
    finalValue = castValue(assignedValue, dataType)
   }

   result[target_key] = finalValue
  } catch (err) {
   console.error(`[Mapping Error] Key: ${target_key} |`, err.message)
   result[target_key] = null
  }
 }

 return result
}
const castValue = (value: any, type: string) => {
 if (value === null || value === undefined) return null

 switch (type.toLowerCase()) {
  case 'number':
   const num = Number(value)
   return isNaN(num) ? 0 : num
  case 'boolean':
   if (typeof value === 'string' && value.toLowerCase() === 'false') return false
   return Boolean(value)
  case 'objectid':
   try {
    return new ObjectId(value)
   } catch {
    return value
   }
  case 'string':
   return typeof value === 'object' ? JSON.stringify(value) : String(value)
  default:
   return value
 }
}
const simulateFormula = async (code: string, context: { source: any; old: any; item?: any }) => {
 if (!code) return null
 const db = database.data
 if (!db) throw new Error('Database connection is not ready')
 const sandbox = {
  source: context.source || {},
  old: context.old || null,
  item: context.item || context.source,
  Math: Math,
  Date: Date,
  ObjectId: ObjectId,
  lookup: async (col: string, id: any, proj = {}) => {
   if (!id) return null
   const query =
    typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id }
   return await db.collection(col).findOne(query, { projection: proj })
  },
  lookupList: async (col: string, query = {}, proj = {}, limit = 100) => {
   return await db.collection(col).find(query, { projection: proj }).limit(limit).toArray()
  },
  get: (path: string) => {
   const cleanPath = path.replace(/^(source\.|item\.|old\.)/, '')
   return cleanPath
    .split('.')
    .reduce((acc, part) => acc && acc[part], context.item || context.source)
  },
 }

 try {
  vm.createContext(sandbox)

  const wrappedCode = `(async function() { 
    try { 
      return ${code}; 
    } catch(e) { 
      return "Runtime Error: " + e.message; 
    } 
  })()`

  const script = new vm.Script(wrappedCode)

  return await script.runInContext(sandbox, { timeout: 3000 })
 } catch (error) {
  return `Compilation Error: ${error.message}`
 }
}

export const testFormula = async (payload: {
 formula: string
 configId: string
 sourceId: string
}) => {
 const db = database.data
 if (!db) throw new Error('Koneksi database belum siap')
 const config = await db.collection('smart_projection_engine').findOne({
  _id: new ObjectId(payload.configId),
 })
 if (!config) throw new Error('Konfigurasi SPE tidak ditemukan')
 const sourceCollection = config.triggers[0]?.source
 const sourceData =
  (await db.collection(sourceCollection).findOne({}, { sort: { _id: -1 } })) || null
 const targetCollection = config.id_engine_collection
 const lastEntry = await db
  .collection(targetCollection)
  .find({})
  .sort({ _id: -1 })
  .limit(1)
  .toArray()
 const oldData = lastEntry.length > 0 ? lastEntry[0] : null
 const output = await simulateFormula(payload.formula, {
  source: sourceData,
  old: oldData,
 })
 return {
  success: true,
  info: {
   source_found: !!sourceData,
   last_timeline_version: oldData?._version || 0,
  },
  output: output,
 }
}

export const startSPEWorker = () => {
 speWorker = new Worker<SPEPayload>(
  SPE_QUEUE_NAME,
  async (job: Job<SPEPayload>) => {
   const { data_request, method_request, param_request, timestamp_request, old_source } = job.data
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
   console.log(`[SPE Worker] Processing ${param_request.id} (${eventType})`)
   try {
    const db = database.data
    if (!db) throw new Error('Database connection not ready')
    const speCollection = db.collection('smart_projection_engine')
    const config = (await speCollection.findOne({
     status: 'active',
     triggers: {
      $elemMatch: {
       source: param_request.col,
       event: eventType,
      },
     },
    })) as unknown as SPEConfig
    if (!config) {
     return
    }
    const activeTrigger = config.triggers.find(
     (t) => t.source === param_request.col && t.event === eventType
    )
    if (!activeTrigger || !activeTrigger.mapping) return
    const targetCollection = db.collection(config.id_engine_collection)
    const lastEntryCursor = await targetCollection.find({}).sort({ _id: -1 }).limit(1).toArray()
    let oldData: any = lastEntryCursor.length > 0 ? lastEntryCursor[0] : null
    const transformedData = await processMapping(
     activeTrigger.mapping,
     data_request,
     oldData,
     null,
     old_source,
     param_request.id || null
    )
    const finalDoc = {
     ...transformedData,
     id_data: param_request.id,
     source_collection: param_request.col,
     event_type: eventType,
     triggered_at:timestamp_request,
     updated_at: DateService.now() ,
     job_id: job.id,
     meta_data: {
      new_source: data_request || null,
      old_source: old_source || null,
     },
     _version: oldData ? (oldData._version || 0) + 1 : 1,
    }
    await targetCollection.insertOne(finalDoc)
    console.log(
     `[SPE Worker] Success Timeline Update: ${config.feature_name} (v${finalDoc._version})`
    )
   } catch (err) {
    console.error(`[SPE Worker] Job Failed for ${param_request.id}:`, err)
    throw err
   }
  },
  {
   connection,
   concurrency: 1,
   limiter: {
    max: 100,
    duration: 1000,
   },
  }
 )
 speWorker.on('failed', (job, err) => {
  console.error(`[SPE Worker] ❌ Job ${job?.id} failed permanently: ${err.message}`)
 })
 speWorker.on('completed', (job) => {
  console.info(`[SPE Worker] ✅ Job ${job.id} completed`)
 })
 return speWorker
}
