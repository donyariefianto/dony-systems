import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { speQueue } from '#services/spe_queue_service'

export default class SpeDispatcherMiddleware {
 async handle(ctx: HttpContext, next: NextFn) {
  /**
   * 1. Jalankan request dulu sampai selesai (ke Controller & DB)
   */
  await next()

  const method = ctx.request.method()
  const param_request = ctx.request.params()
  const allowedMethods = ['POST', 'PUT', 'DELETE']

  // Hanya proses jika method sesuai dan request sukses (status 2xx)
  if (
   allowedMethods.includes(method) &&
   ctx.response.getStatus() >= 200 &&
   ctx.response.getStatus() < 300
  ) {
   // Ambil metadata dari route atau params
   // Asumsi: Nama koleksi ditentukan di route params atau meta
   const collection = param_request.col || ctx.route?.pattern.split('/')[1] || 'unknown'

   // Ambil ID (Untuk PUT/DELETE dari params, untuk POST biasanya dari response body)
   let dataId = ctx.params.id
   if (method === 'POST') {
    const body = ctx.response.getBody()
    dataId = body?.id || body?._id || body?.insertedId
   }

   if (!dataId) return

   /**
    * 2. Bungkus Job Payload
    */
   const jobPayload = {
    data_request: method === 'DELETE' ? {} : ctx.request.body(),
    method_request: method,
    param_request: {
     col: collection,
     id: String(dataId),
    },
    timestamp_request: Date.now(),
   }

   /**
    * 3. Kirim ke Redis (BullMQ)
    * Kita tidak menggunakan 'await' di sini agar tidak menghalangi response ke user
    */
   speQueue.add('process_spe', jobPayload).catch((err) => {
    console.error('❌ Failed to dispatch SPE Job:', err.message)
   })
  }
 }
}
