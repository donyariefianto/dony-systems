import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { SmartProjectionEngineService } from '#services/smart_projection_engine_service'

export default class SmartProjectionEngineMiddleware {
 async handle(ctx: HttpContext, next: NextFn) {
  let { params, request } = ctx
  let data_request = request.all()
  let method_request = request.method()
  let param_request = request.params()
  await SmartProjectionEngineService.executeEngine(data_request, method_request, param_request)
  const output = await next()
  return output
 }
}
