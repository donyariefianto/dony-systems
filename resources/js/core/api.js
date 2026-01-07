import { CONFIG } from '../config/constants.js'
import { logout } from '../utils/helpers.js'

export async function apiFetch(endpoint, options = {}) {
 const token = localStorage.getItem('auth_token')

 // Default Headers
 const headers = {
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
  ...options.headers,
 }

 try {
  const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
   ...options,
   headers,
  })

  if (response.status === 401) {
   logout()
   return null // Stop execution
  }

  return response
 } catch (error) {
  console.error('API Network Error:', error)
  throw error
 }
}
