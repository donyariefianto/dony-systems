import Swal from 'sweetalert2/dist/sweetalert2.js'
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { utf8ToBytes, bytesToUtf8 } from '@noble/ciphers/utils.js'
import { hexToBytes } from '@noble/hashes/utils.js'
import { AppState } from '../core/state'
import { renderSidebar } from '../modules/auth.js'
import { apiFetch } from '../core/api.js'

function getKey() {
 const secret_key = String(AppState.app_key)
 return sha256(utf8ToBytes(secret_key))
}

export function decryptData(nonceHex, ciphertextHex) {
 try {
  const key = getKey()
  const nonce = hexToBytes(nonceHex)
  const ciphertext = hexToBytes(ciphertextHex)
  const cipher = xchacha20poly1305(key, nonce)
  const decryptedBytes = cipher.decrypt(ciphertext)
  return bytesToUtf8(decryptedBytes)
 } catch (error) {
  console.error('❌ Gagal Dekripsi (Cek Key atau Data Rusak):', error)
  return null
 }
}

export async function logout() {
 const token = localStorage.getItem('auth_token')
 const response = await fetch('authentication/v2/logout', {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${token}` },
 })
 if (response.status === 403) {
  return showToast('SINI', 'failed')
 }
 console.log(response)
}

export function showToast(message, type = 'success') {
 const container = document.getElementById('toast-container')
 const toast = document.createElement('div')
 const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
 const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'

 toast.className = `${bgColor} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-right duration-300 text-xs font-bold uppercase tracking-wider`
 toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`

 container.appendChild(toast)

 setTimeout(() => {
  toast.classList.add('opacity-0', 'transition-opacity', 'duration-500')
  setTimeout(() => toast.remove(), 500)
 }, 3000)
}

export function toggleSidebar() {
 const sidebar = document.getElementById('sidebar')
 const overlay = document.getElementById('overlay')

 if (window.innerWidth < 1024) {
  sidebar.classList.toggle('-translate-x-full')
  overlay.classList.toggle('hidden')
  document.body.style.overflow = sidebar.classList.contains('-translate-x-full') ? '' : 'hidden'
 }
}

export function closeModal() {
 const modal = document.getElementById('crud-modal')
 const container = document.getElementById('modal-container')

 modal.classList.replace('opacity-100', 'opacity-0')
 container.classList.replace('scale-100', 'scale-95')

 setTimeout(() => modal.classList.add('hidden'), 300)
}

/**
 * Menampilkan Dialog Konfirmasi Global yang Konsisten
 * @param {Object} options - Konfigurasi dialog
 * @param {string} options.title - Judul dialog
 * @param {string} options.text - Isi pesan
 * @param {string} [options.icon='warning'] - Ikon (warning, error, success, info)
 * @param {string} [options.confirmText='Ya, Lanjutkan'] - Teks tombol konfirmasi
 * @param {string} [options.cancelText='Batal'] - Teks tombol batal
 * @param {boolean} [options.dangerMode=false] - Jika true, tombol konfirmasi jadi Merah (untuk delete)
 * @returns {Promise<boolean>} - True jika user klik Confirm, False jika Cancel
 */
export async function showConfirmDialog({
 title,
 text,
 icon = 'warning',
 confirmText = 'Yes, Proceed',
 cancelText = 'Cancel',
 dangerMode = false,
}) {
 const primaryColor = dangerMode
  ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-200'
  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-200'
 const iconColor = dangerMode ? '#e11d48' : '#2563eb'

 const result = await Swal.fire({
  title: title,
  html: `<span class="text-sm text-slate-500 font-medium leading-relaxed">${text}</span>`,
  icon: icon,
  iconColor: iconColor,

  focusCancel: dangerMode,

  showCancelButton: true,
  confirmButtonText: confirmText,
  cancelButtonText: cancelText,
  reverseButtons: true,

  width: '26rem',
  padding: '1.5rem',
  background: '#ffffff',

  backdrop: `
        rgba(15, 23, 42, 0.4)
        backdrop-filter: blur(4px)
        left top
        no-repeat
    `,

  customClass: {
   container: 'font-sans',
   popup: 'rounded-3xl shadow-2xl border border-slate-100',
   title: 'text-lg font-black text-slate-800 tracking-tight mb-2',
   icon: 'text-xs',
   confirmButton: `rounded-xl px-6 py-3 text-sm font-bold shadow-lg shadow-slate-200/50 text-white transition-all transform active:scale-95 ${primaryColor} outline-none focus:ring-4`,
   cancelButton:
    'rounded-xl px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors focus:bg-slate-50 outline-none mr-2',
   actions: 'gap-2 mt-4',
  },

  buttonsStyling: false,
 })

 return result.isConfirmed
}

export async function refreshSidebarMenu() {
 const btn = document.getElementById('btn-refresh-menu')
 const icon = btn.querySelector('i')
 const menuContainer = document.getElementById('menu-container')

 icon.classList.add('fa-spin', 'text-blue-600')
 btn.disabled = true
 menuContainer.classList.add('opacity-50', 'pointer-events-none')
 try {
  const response = await apiFetch('api/list-menu')
  let data = await response.json()
  data = decryptData(data.nonce, data.ciphertext)
  data = JSON.parse(data)
  renderSidebar(data.sidemenu)
  AppState.menuData = data.sidemenu
  showToast('Menu sidebar diperbarui', 'success')
 } catch (error) {
  console.log(error)

  showToast('Gagal memperbarui menu', 'error')
 } finally {
  setTimeout(() => {
   icon.classList.remove('fa-spin', 'text-blue-600')
   btn.disabled = false
   menuContainer.classList.remove('opacity-50', 'pointer-events-none')
  }, 600)
 }
}

/**
 * Fungsi Helper untuk sinkronisasi tampilan tombol theme
 */
const updateThemeUI = (isDark) => {
 const btn = document.getElementById('btn-theme-toggle')
 if (!btn) return

 const icon = btn.querySelector('i')
 if (!icon) return

 if (isDark) {
  icon.classList.remove('fa-moon')
  icon.classList.add('fa-sun')
  btn.classList.add('text-yellow-400', 'border-yellow-500/50')
  btn.classList.remove('text-slate-500')
 } else {
  icon.classList.remove('fa-sun')
  icon.classList.add('fa-moon')
  btn.classList.remove('text-yellow-400', 'border-yellow-500/50')
  btn.classList.add('text-slate-500')
 }
}

export const toggleTheme = function () {
 const html = document.documentElement
 const isDark = html.classList.toggle('dark')
 console.log('Mode Gelap Aktif:', isDark)

 localStorage.setItem('theme', isDark ? 'dark' : 'light')

 updateThemeUI(isDark)

 window.dispatchEvent(new Event('themeChanged'))
}

export function initTheme() {
 const savedTheme = localStorage.getItem('theme')
 const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
 const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark)

 if (isDark) {
  document.documentElement.classList.add('dark')
 } else {
  document.documentElement.classList.remove('dark')
 }

 setTimeout(() => updateThemeUI(isDark), 100)
}

/**
 * PRODUCTION-READY Relative Time Formatter
 *
 * Fitur utama:
 * 1. Menerima berbagai format datetime
 * 2. Error handling yang robust
 * 3. Timezone-aware (support UTC, ISO, local)
 * 4. Pluralization yang benar
 * 5. Configurable dengan default values
 * 6. TypeScript support (dengan JSDoc)
 * 7. Performance optimized
 * 8. Testable dan maintainable
 */

/**
 * @typedef {Object} FormatOptions
 * @property {string} [locale='en-US'] - Locale untuk formatting
 * @property {boolean} [showSeconds=true] - Tampilkan "just now" untuk <60 detik
 * @property {boolean} [capitalize=true] - Kapitalisasi huruf pertama
 * @property {string} [fallback='-'] - Fallback text untuk invalid dates
 * @property {boolean} [allowFuture=false] - Izinkan waktu di masa depan
 * @property {Object} [dateStyle] - Style untuk tanggal lengkap
 * @property {string} [justNowText='Just now'] - Text untuk "just now"
 * @property {string} [yesterdayText='Yesterday'] - Text untuk yesterday
 */

/**
 * Parse berbagai format datetime menjadi Date object
 * @param {Date|string|number} dateInput - Input date
 * @returns {Date|null} Valid Date object atau null
 */
function parseDate(dateInput) {
 if (!dateInput) return null

 if (dateInput instanceof Date) {
  return isNaN(dateInput.getTime()) ? null : new Date(dateInput.getTime())
 }

 if (typeof dateInput === 'number') {
  const isSeconds = dateInput < 1000000000000
  return new Date(isSeconds ? dateInput * 1000 : dateInput)
 }

 if (typeof dateInput === 'string') {
  const cleanStr = dateInput
   .trim()
   .replace(/['"]/g, '')
   .replace(/\s{2,}/g, ' ')

  const date = new Date(cleanStr)
  if (!isNaN(date.getTime())) return date

  if (/^\d+$/.test(cleanStr)) {
   const timestamp = parseInt(cleanStr, 10)
   const isSeconds = timestamp < 1000000000000
   return new Date(isSeconds ? timestamp * 1000 : timestamp)
  }

  return parseNonISODate(cleanStr)
 }

 return null
}

/**
 * Parse non-ISO date formats
 * @param {string} dateStr - Date string
 * @returns {Date|null} Parsed date atau null
 */
function parseNonISODate(dateStr) {
 const parsers = [
  (str) => {
   const match = str.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/i
   )
   if (match) {
    const [, y, m, d, h, min, s] = match
    return new Date(y, m - 1, d, h, min, s)
   }
   return null
  },

  (str) => {
   const match = str.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i
   )
   if (match) {
    let [, m, d, y, h, min, s, ampm] = match
    h = h ? parseInt(h, 10) : 0
    if (ampm) {
     if (ampm.toUpperCase() === 'PM' && h < 12) h += 12
     if (ampm.toUpperCase() === 'AM' && h === 12) h = 0
    }
    return new Date(y, m - 1, d, h, min || 0, s || 0)
   }
   return null
  },

  (str) => {
   const match = str.match(
    /^(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
   )
   if (match) {
    const [, d, m, y, h, min, s] = match
    return new Date(y, m - 1, d, h || 0, min || 0, s || 0)
   }
   return null
  },

  (str) => {
   const monthNames = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
   }

   const match = str.match(
    /^([a-z]{3,})\s+(\d{1,2}),?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?/i
   )
   if (match) {
    const [, month, day, year, h, min, s, ampm] = match
    const monthIdx = monthNames[month.toLowerCase().substring(0, 3)]
    if (monthIdx === undefined) return null

    let hour = h ? parseInt(h, 10) : 0
    if (ampm) {
     if (ampm.toUpperCase() === 'PM' && hour < 12) hour += 12
     if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0
    }

    return new Date(year, monthIdx, day, hour, min || 0, s || 0)
   }
   return null
  },
 ]

 for (const parser of parsers) {
  try {
   const date = parser(dateStr)
   if (date && !isNaN(date.getTime())) {
    return date
   }
  } catch {}
 }

 return null
}

/**
 * Format relative time dengan berbagai opsi
 * @param {Date|string|number} dateInput - Input date
 * @param {FormatOptions} [options={}] - Formatting options
 * @returns {string} Formatted relative time
 */
function formatRelativeTime(dateInput, options = {}) {
 const {
  locale = 'en-US',
  showSeconds = true,
  capitalize = true,
  fallback = '-',
  allowFuture = false,
  dateStyle = { day: 'numeric', month: 'short', year: 'numeric' },
  justNowText = 'Just now',
  yesterdayText = 'Yesterday',
 } = options

 const date = parseDate(dateInput)
 if (!date) return fallback

 const now = new Date()

 if (!allowFuture && date > now) {
  return justNowText
 }

 const diffMs = now.getTime() - date.getTime()
 const diffSeconds = Math.floor(diffMs / 1000)
 const diffMinutes = Math.floor(diffSeconds / 60)
 const diffHours = Math.floor(diffMinutes / 60)
 const diffDays = Math.floor(diffHours / 24)
 const diffWeeks = Math.floor(diffDays / 7)

 const formatText = (text) => {
  return capitalize && text ? text.charAt(0).toUpperCase() + text.slice(1) : text
 }

 const pluralize = (count, singular, plural) => {
  return count === 1 ? singular : plural
 }

 if (showSeconds && diffSeconds < 60) {
  return formatText(justNowText)
 }

 if (diffMinutes < 60) {
  const text = `${diffMinutes} ${pluralize(diffMinutes, 'minute', 'minutes')} ago`
  return formatText(text)
 }

 if (diffHours < 24) {
  const text = `${diffHours} ${pluralize(diffHours, 'hour', 'hours')} ago`
  return formatText(text)
 }

 if (diffDays === 1) {
  return formatText(yesterdayText)
 }

 if (diffDays < 7) {
  const text = `${diffDays} ${pluralize(diffDays, 'day', 'days')} ago`
  return formatText(text)
 }

 if (diffWeeks < 4) {
  const text = `${diffWeeks} ${pluralize(diffWeeks, 'week', 'weeks')} ago`
  return formatText(text)
 }

 const isCurrentYear = date.getFullYear() === now.getFullYear()
 const formatOptions = { ...dateStyle }

 if (isCurrentYear && !formatOptions.year) {
  formatOptions.year = undefined
 }

 try {
  return date.toLocaleDateString(locale, formatOptions)
 } catch {
  return date.toISOString().split('T')[0]
 }
}

/**
 * Versi dengan cache untuk performa (optional)
 */
const createCachedRelativeTimeFormatter = (options = {}) => {
 const cache = new Map()
 const maxCacheSize = 1000

 return (dateInput) => {
  const cacheKey = typeof dateInput === 'object' ? JSON.stringify(dateInput) : String(dateInput)

  if (cache.has(cacheKey)) {
   return cache.get(cacheKey)
  }

  const result = formatRelativeTime(dateInput, options)

  if (cache.size >= maxCacheSize) {
   const firstKey = cache.keys().next().value
   cache.delete(firstKey)
  }

  cache.set(cacheKey, result)
  return result
 }
}

/**
 * Utility functions untuk penggunaan umum
 */
const relativeTimeUtils = {
 format: formatRelativeTime,

 createCachedFormatter: createCachedRelativeTimeFormatter,

 formatWithFuture: (dateInput, options = {}) => {
  return formatRelativeTime(dateInput, { ...options, allowFuture: true })
 },

 formatShort: (dateInput, options = {}) => {
  return formatRelativeTime(dateInput, { ...options, showSeconds: false })
 },

 isValidDate: (dateInput) => {
  return parseDate(dateInput) !== null
 },

 parseDate: parseDate,
}

if (typeof module !== 'undefined' && module.exports) {
 module.exports = relativeTimeUtils
} else if (typeof define === 'function' && define.amd) {
 define([], () => relativeTimeUtils)
} else if (typeof window !== 'undefined') {
 window.formatRelativeTime = formatRelativeTime
 window.relativeTimeUtils = relativeTimeUtils
}

export { formatRelativeTime, parseDate, relativeTimeUtils }
