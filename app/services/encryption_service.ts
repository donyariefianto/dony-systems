import { sha256 } from '@noble/hashes/sha2.js'
import { randomBytes, bytesToHex, utf8ToBytes } from '@noble/ciphers/utils.js'
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js'
import env from '#start/env'

export class EncryptionService {
 private static SECRET_PASSPHRASE = env.get('APP_KEY')
 private static getKey(): Uint8Array {
  return sha256(utf8ToBytes(this.SECRET_PASSPHRASE))
 }

 static encrypt(text: string) {
  const key = this.getKey()
  const nonce = randomBytes(24)
  const cipher = xchacha20poly1305(key, nonce)
  const dataBytes = utf8ToBytes(text)
  const encryptedData = cipher.encrypt(dataBytes)
  return {
   nonce: bytesToHex(nonce),
   ciphertext: bytesToHex(encryptedData),
  }
 }
}
