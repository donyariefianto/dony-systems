import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import jwt from 'jsonwebtoken'
import env from '#start/env'
export default class AuthenticationMiddleware {
 async handle(ctx: HttpContext, next: NextFn) {
  const authHeader = ctx.request.header('authoriztion')
  const { authorization } = ctx.request.headers()
  const token = authorization && authorization.split(' ')[1]
  if (!token) return ctx.response.unauthorized()

  jwt.verify(token, env.get('ACCESS_SECRET'), async (err, user) => {
   if (err) {
    if (err.name == 'TokenExpiredError') {
     return ctx.response.unauthorized({
      message: err.message,
      code: 'TokenExpiredError',
     })
    }
    return ctx.response.forbidden()
   }
   ctx.response.user = user
   const output = await next()
   return output
  })
 }
}
