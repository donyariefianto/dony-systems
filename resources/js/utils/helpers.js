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
  // Tampilkan Matahari saat mode gelap aktif
  icon.classList.remove('fa-moon')
  icon.classList.add('fa-sun')
  btn.classList.add('text-yellow-400', 'border-yellow-500/50')
  btn.classList.remove('text-slate-500')
 } else {
  // Tampilkan Bulan saat mode terang aktif
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
 // 1. Simpan preferensi
 localStorage.setItem('theme', isDark ? 'dark' : 'light')

 // 2. Update tampilan tombol
 updateThemeUI(isDark)

 // 3. Beritahu sistem (termasuk ECharts) bahwa tema berubah
 window.dispatchEvent(new Event('themeChanged'))
}

export function initTheme() {
 const savedTheme = localStorage.getItem('theme')
 const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
 const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark)

 // 1. Set class pada HTML
 if (isDark) {
  document.documentElement.classList.add('dark')
 } else {
  document.documentElement.classList.remove('dark')
 }

 // 2. SINKRONISASI ICON (Penting agar UI tidak mismatch saat refresh)
 // Gunakan setTimeout atau panggil setelah DOM ready
 setTimeout(() => updateThemeUI(isDark), 100)
}
