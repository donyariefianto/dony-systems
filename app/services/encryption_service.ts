import crypto from 'node:crypto'
import env from '#start/env'

export class EncryptionService {
 private static readonly KEY = crypto.createHash('sha256').update(env.get('APP_KEY')).digest()
 private static readonly ALGO = 'aes-256-gcm'

 static encryptForBrowser(text: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(this.ALGO, this.KEY, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}.${encrypted}.${tag}`
 }
}
