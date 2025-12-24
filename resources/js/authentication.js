// Logika khusus login agar tidak mengganggu app.js utama
document.getElementById('login-form').onsubmit = async (e) => {
 e.preventDefault()
 const btn = document.getElementById('btn-login')
 btn.disabled = true
 btn.innerText = 'MEMVERIFIKASI...'

 const payload = Object.fromEntries(new FormData(e.target))

 try {
  const res = await fetch('/authentication/login', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify(payload),
  })

  const result = await res.json()

  if (res.ok && result.token) {
   localStorage.setItem('auth_token', result.token)
   localStorage.setItem('user_info', JSON.stringify(result.user))
   window.location.href = '/' // Redirect ke dashboard
  } else {
   alert(result.message || 'Username atau Password salah')
  }
 } catch (err) {
  alert('Gagal terhubung ke server')
 } finally {
  btn.disabled = false
  btn.innerText = 'Masuk ke Sistem'
 }
}
