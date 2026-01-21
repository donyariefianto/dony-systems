import '@fortawesome/fontawesome-free/css/all.min.css'

document.getElementById('login-form').onsubmit = async (e) => {
 e.preventDefault()
 const btn = document.getElementById('btn-login')
 const originalText = 'Masuk ke Sistem'

 btn.disabled = true
 btn.innerHTML = `<i class="fas fa-circle-notch fa-spin mr-2"></i> MEMVERIFIKASI...`
 const payload = Object.fromEntries(new FormData(e.target))

 try {
  const res = await fetch('/authentication/v2/login', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify(payload),
  })

  const result = await res.json().catch(() => ({}))

  if (res.ok) {
   localStorage.setItem('auth_token', result.accessToken)
   localStorage.setItem('users', JSON.stringify(result.user))
   showToast('Login Berhasil! Mengalihkan...', 'success')
   setTimeout(() => {
    window.location.href = '/'
   }, 1000)
  } else {
   const errorMsg =
    result.message ||
    (res.status === 401 ? 'Username atau Password salah' : 'Gagal masuk ke sistem')
   showToast(errorMsg, 'error')
  }
 } catch (err) {
  console.error('Network Error:', err)
  showToast('Tidak dapat terhubung ke server', 'error')
 } finally {
  btn.disabled = false
  btn.innerHTML = originalText
 }
}

function showToast(message, type = 'success') {
 const container = document.getElementById('toast-container')
 if (!container) return

 const toast = document.createElement('div')

 const isError = type === 'error' || type === 'danger'
 const bgColor = isError ? 'bg-red-500' : 'bg-emerald-500'
 const icon = isError ? 'fa-exclamation-circle' : 'fa-check-circle'

 toast.className = `${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 text-xs font-bold uppercase tracking-wider pointer-events-auto`
 toast.innerHTML = `
        <i class="fas ${icon} text-sm"></i> 
        <span>${message}</span>
    `

 container.appendChild(toast)

 setTimeout(() => {
  toast.classList.add('opacity-0', 'translate-x-full', 'transition-all', 'duration-500')
  setTimeout(() => toast.remove(), 500)
 }, 4000)
}
