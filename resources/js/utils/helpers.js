import Swal from 'sweetalert2/dist/sweetalert2.js'

export function logout() {
 localStorage.clear()
 window.location.href = '/login'
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
 confirmText = 'Ya, Lanjutkan',
 cancelText = 'Batal',
 dangerMode = false,
}) {
 const confirmButtonColor = dangerMode ? '#ef4444' : '#2563eb'
 const cancelButtonColor = '#9ca3af'

 const result = await Swal.fire({
  title: title,
  text: text,
  icon: icon,
  showCancelButton: true,
  confirmButtonColor: confirmButtonColor,
  cancelButtonColor: cancelButtonColor,
  confirmButtonText: confirmText,
  cancelButtonText: cancelText,
  reverseButtons: true,

  customClass: {
   popup: 'rounded-2xl',
   confirmButton: 'rounded-xl px-5 py-2.5 font-bold shadow-lg',
   cancelButton: 'rounded-xl px-5 py-2.5 font-bold',
  },
 })

 return result.isConfirmed
}
