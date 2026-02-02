import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { speQueue } from '#services/spe_queue_service'
import { EncryptionService } from '#services/encryption_service'
import { DateService } from '#services/date_service'

export default class SpeDispatcherMiddleware {
 async handle(ctx: HttpContext, next: NextFn) {
  await next()

  const method = ctx.request.method()
  const param_request = ctx.request.params()
  const allowedMethods = ['POST', 'PUT', 'DELETE']

  if (
   allowedMethods.includes(method) &&
   ctx.response.getStatus() >= 200 &&
   ctx.response.getStatus() < 300
  ) {
   let result_response = ctx.response.getBody()
   result_response = EncryptionService.decrypt(result_response.nonce, result_response.ciphertext)
   result_response = JSON.parse(result_response)
   let old_source = result_response || {}
   const collection = param_request.col || ctx.route?.pattern.split('/')[1] || 'unknown'
   let dataId = ctx.params.id
   if (method === 'POST') {
    const body = ctx.response.getBody()
    dataId = body?.id || body?._id || body?.insertedId
   }
   if (!dataId) return
   const jobPayload = {
    data_request: method === 'DELETE' ? {} : ctx.request.body(),
    method_request: method,
    param_request: {
     col: collection,
     id: String(dataId),
    },
    timestamp_request: DateService.now(),
    old_source: old_source,
   }
   speQueue.add('process_spe', jobPayload).catch((err) => {
    console.error('❌ Failed to dispatch SPE Job:', err.message)
   })
  }
 }
}
