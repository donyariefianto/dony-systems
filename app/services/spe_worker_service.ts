import { Worker, Job } from 'bullmq'
import { database } from '#services/mongodb_service' // Pastikan path ini sesuai service mongoDB kamu
import { SPE_QUEUE_NAME } from '#services/spe_queue_service'
import env from '#start/env'
import vm from 'vm'
import { ObjectId } from 'mongodb'

// --- Interfaces & Types ---
interface SPEPayload {
 data_request: any // Data baru dari request (payload)
 method_request: string // POST, PUT, DELETE
 param_request: {
  col: string // Nama collection sumber
  id: string // ID data sumber
 }
 timestamp_request: number
}

interface TriggerConfig {
 source: string
 event: string
 mapping: any[] // Struktur mapping recursive
}

interface SPEConfig {
 _id: ObjectId
 feature_name: string
 id_engine_collection: string
 triggers: TriggerConfig[]
 status: string
}

// Variabel global untuk instance worker agar bisa di-shutdown
export let speWorker: Worker | undefined

// Konfigurasi Redis
const connection = {
 host: env.get('REDIS_HOST', '127.0.0.1'),
 port: env.get('REDIS_PORT', 6379),
 password: env.get('REDIS_PASSWORD', ''),
}

/**
 * Helper: Mengambil nilai deep secara aman (Sesuai logic getDeepValue Anda)
 */
const getDeepValue = (obj: any, path: string) => {
 if (!obj || !path) return null
 const cleanPath = path.replace(/^(source\.|item\.|old\.)/, '')
 return cleanPath.split('.').reduce((acc, part) => acc && acc[part], obj)
}

const executeFormula = async (code: string, context: any) => {
 if (!code) return null

 const db = database.data
 const sandbox = {
  source: context.source || {},
  old: context.old || null,
  item: context.item || {},
  Math: Math,
  Date: Date,
  ObjectId: ObjectId,

  // Helper: get(path) aman dari scope saat ini
  get: (path: string) => getDeepValue(context.item || context.source, path),

  // Helper: lookup (Async) sesuai README
  lookup: async (col: string, id: any, proj = {}) => {
   if (!id || !db) return null
   const query =
    typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id }
   return await db.collection(col).findOne(query, { projection: proj })
  },

  // Helper: lookupList (Async) sesuai README
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

/**
 * Core Logic: Memproses Mapping secara Rekursif (Production Level)
 */
const processMapping = async (
 nodes: any[],
 sourceData: any,
 oldData: any = null,
 currentScope: any = null
): Promise<any> => {
 const result: any = {}
 const activeSource = currentScope || sourceData // Menentukan scope (item loop atau source utama)

 for (const node of nodes) {
  const { target_key, transformation_type, expression, meta_data } = node
  const dataType = (meta_data?.data_type || 'string').toLowerCase()
  const children = meta_data?.children || []

  let assignedValue: any = null

  try {
   // 1. Eksekusi Transformasi Dasar
   if (transformation_type === 'direct') {
    assignedValue = getDeepValue(activeSource, expression)
   } else if (transformation_type === 'formula') {
    // Mendukung lookup dan lookupList di dalam formula
    assignedValue = await executeFormula(expression, {
     source: sourceData,
     old: oldData,
     item: activeSource,
    })
   } else if (transformation_type === 'static') {
    assignedValue = expression
   }

   // 2. Penanganan Tipe Data & Struktur Bersarang (Nested)
   let finalValue: any = null

   if (dataType === 'object') {
    // Jika object, gabungkan hasil transformasi awal dengan hasil rekursif children
    finalValue = assignedValue && typeof assignedValue === 'object' ? { ...assignedValue } : {}
    if (children.length > 0) {
     const childrenResult = await processMapping(children, sourceData, oldData, finalValue)
     finalValue = { ...finalValue, ...childrenResult }
    }
   } else if (dataType === 'array') {
    // Jika array, lakukan mapping untuk setiap item di dalam list
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
    // Casting untuk tipe data primitif (string, number, boolean, objectid)
    finalValue = castValue(assignedValue, dataType)
   }

   // 3. Masukkan ke dalam Object Result
   result[target_key] = finalValue
  } catch (err) {
   console.error(`[Mapping Error] Key: ${target_key} |`, err.message)
   result[target_key] = null // Safety fallback
  }
 }

 return result
}

/**
 * Helper: Casting Tipe Data (Sesuai logic service Anda)
 */
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

 // Sandbox dengan data pendukung nyata (Real Data Access)
 const sandbox = {
  source: context.source || {},
  old: context.old || null,
  item: context.item || context.source,
  Math: Math,
  Date: Date,
  ObjectId: ObjectId,

  // Helper: Ambil data nyata dari koleksi lain
  lookup: async (col: string, id: any, proj = {}) => {
   if (!id) return null
   const query =
    typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id }
   return await db.collection(col).findOne(query, { projection: proj })
  },

  // Helper: Ambil list data nyata dari koleksi lain
  lookupList: async (col: string, query = {}, proj = {}, limit = 100) => {
   return await db.collection(col).find(query, { projection: proj }).limit(limit).toArray()
  },

  // Helper: Get path aman
  get: (path: string) => {
   const cleanPath = path.replace(/^(source\.|item\.|old\.)/, '')
   return cleanPath
    .split('.')
    .reduce((acc, part) => acc && acc[part], context.item || context.source)
  },
 }

 try {
  vm.createContext(sandbox)
  // Dibungkus async IIFE untuk mendukung await di dalam formula user
  const wrappedCode = `(async function() { 
        try { 
          return ${code}; 
        } catch(e) { 
          return "Runtime Error: " + e.message; 
        } 
      })()`

  const script = new vm.Script(wrappedCode)
  // Timeout 3 detik agar simulator tidak menggantung jika ada query berat
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

 // 1. Ambil Konfigurasi SPE untuk mengetahui target & trigger
 const config = await db.collection('smart_projection_engine').findOne({
  _id: new ObjectId(payload.configId),
 })
 if (!config) throw new Error('Konfigurasi SPE tidak ditemukan')

 // 2. Ambil SOURCE DATA (Data asli dari koleksi pemicu)
 const sourceCollection = config.triggers[0]?.source
 const query: any = ObjectId.isValid(payload.sourceId)
  ? { _id: new ObjectId(payload.sourceId) }
  : { _id: payload.sourceId }

 const sourceData = await db.collection(sourceCollection).findOne(query)
 if (!sourceData) throw new Error(`Data tidak ditemukan di koleksi ${sourceCollection}`)

 // 3. Ambil OLD DATA (Data terakhir di koleksi timeline/target)
 const targetCollection = config.id_engine_collection
 const lastEntry = await db
  .collection(targetCollection)
  .find({ id_data: payload.sourceId })
  .sort({ created_at: -1 })
  .limit(1)
  .toArray()

 const oldData = lastEntry.length > 0 ? lastEntry[0] : null

 // 4. Jalankan Eksekusi di Sandbox (Gunakan fungsi executeFormula yang sudah kita buat)
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

/**
 * Fungsi Utama Worker
 */
export const startSPEWorker = () => {
 speWorker = new Worker<SPEPayload>(
  SPE_QUEUE_NAME,
  async (job: Job<SPEPayload>) => {
   const { data_request, method_request, param_request, timestamp_request } = job.data

   // A. Tentukan Event Type
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
     return // Abaikan method lain
   }

   console.log(`[SPE Worker] Processing ${param_request.id} (${eventType})`)

   try {
    const db = database.data
    if (!db) throw new Error('Database connection not ready')

    // B. Cari Konfigurasi SPE yang cocok (Multi-trigger check)
    // Kita cari dokumen yang punya trigger matching di dalam array-nya
    const speCollection = db.collection('smart_projection_engine') // Sesuaikan nama collection config
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
     // Tidak ada config yang cocok, job selesai (bukan error)
     return
    }

    // C. Ambil Mapping yang SPESIFIK untuk trigger ini
    // Karena satu config bisa punya banyak trigger, kita harus ambil mapping milik trigger yang *kena*
    const activeTrigger = config.triggers.find(
     (t) => t.source === param_request.col && t.event === eventType
    )
    if (!activeTrigger || !activeTrigger.mapping) return

    // D. TIMELINE LOGIC: Cari Data Terakhir (Old Data)
    // Query ke Target Collection, cari ID data yang sama, urutkan Created At Descending

    const targetCollection = db.collection(config.id_engine_collection)

    const lastEntryCursor = await targetCollection.find({}).sort({ _id: -1 }).limit(1).toArray()

    const oldData = lastEntryCursor.length > 0 ? lastEntryCursor[0] : null
    console.log(oldData)

    // E. Eksekusi Transformasi
    const transformedData = await processMapping(activeTrigger.mapping, data_request, oldData)

    // F. Finalisasi Payload (Append Only)
    // Kita tambahkan metadata wajib untuk Timeline
    const finalDoc = {
     ...transformedData,
     id_data: param_request.id, // ID Referensi ke data asli
     source_collection: param_request.col, // Asal data
     event_type: eventType, // Apa yang terjadi
     triggered_at: new Date(timestamp_request), // Kapan user klik save
     created_at: new Date(), // Kapan data ini masuk timeline
     job_id: job.id, // Untuk audit trail/debugging
     _version: oldData ? (oldData._version || 0) + 1 : 1, // Versi data (opsional tapi bagus)
    }

    // G. Simpan ke MongoDB (Insert One)
    await targetCollection.insertOne(finalDoc)

    console.log(
     `[SPE Worker] Success Timeline Update: ${config.feature_name} (v${finalDoc._version})`
    )
   } catch (err) {
    console.error(`[SPE Worker] Job Failed for ${param_request.id}:`, err)
    throw err // Lempar error agar BullMQ tahu job ini gagal (dan bisa retry)
   }
  },
  {
   connection,
   concurrency: 1, // WAJIB 1: Agar urutan timeline FIFO terjamin per worker
   limiter: {
    max: 100,
    duration: 1000, // Rate limit (opsional, jaga-jaga database overload)
   },
  }
 )

 // Event Listeners untuk Monitoring
 speWorker.on('failed', (job, err) => {
  console.error(`[SPE Worker] ❌ Job ${job?.id} failed permanently: ${err.message}`)
 })

 speWorker.on('completed', (job) => {
  // Opsional: Hapus log sukses agar console bersih
  console.info(`[SPE Worker] ✅ Job ${job.id} completed`)
 })

 return speWorker
}
