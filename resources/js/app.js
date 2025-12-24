/**
 * TB SAHABAT - DYNAMIC ENGINE v4.0 (Production Ready)
 * Fitur: Auth Guard, Secure API Fetch, Nested Menu, Pagination, & Search
 */

// --- 1. STATE GLOBAL & CONFIG ---
window.API_BASE_URL = '/'
window.menuData = []
window.currentModule = null
window.currentPage = 1
window.pageSize = 5
window.searchQuery = ''

/**
 * 2. AUTH GUARD & INITIALIZATION
 * Memastikan sesi pengguna valid sebelum memuat aplikasi.
 */
async function initApp() {
 const token = localStorage.getItem('auth_token')
 const isLoginPage = window.location.pathname.includes('login')

 // Redirect ke login jika tidak ada token
 if (!token && !isLoginPage) {
  window.location.href = '/login'
  return
 }

 // Redirect ke dashboard jika sudah login tapi akses halaman login
 if (token && isLoginPage) {
  window.location.href = '/'
  return
 }

 if (token) {
  try {
   const response = await fetch(window.API_BASE_URL + 'api/menu', {
    headers: { Authorization: `Bearer ${token}` }, // Mengirim token di header
   })

   // Jika token expired atau tidak valid (401), paksa logout
   if (response.status === 401) {
    window.logout()
    return
   }

   const data = await response.json()
   window.menuData = data.daftar_sidemenu

   // Sinkronisasi Nama User di Header
   const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}')
   const nameEl = document.querySelector('.text-xs.font-bold.text-gray-800')
   if (nameEl && userInfo.name) nameEl.innerText = userInfo.name

   renderSidebar(window.menuData)
   handleInitialRouting()
  } catch (error) {
   console.error('Critical Error: Gagal memuat menu.', error)
  }
 }
}

/**
 * 3. CORE ENGINE: NAVIGATION & ROUTING
 */
window.navigate = function (path) {
 const cleanPath = path.replace(/^#\/?/, '')
 const config = findMenuByPath(cleanPath, window.menuData)

 if (!config) return

 window.currentModule = config
 window.currentPage = 1
 window.location.hash = '/' + cleanPath

 // Update UI Judul & Active State [cite: 3, 4]
 const titleEl = document.getElementById('page-title')
 if (titleEl) titleEl.innerText = config.name

 document.querySelectorAll('.menu-item').forEach((el) => {
  el.classList.toggle('menu-active', el.getAttribute('data-path') === cleanPath)
 })

 renderView(config)
 if (config.type === 'tableview') window.fetchTableData()

 // Tutup sidebar otomatis di mobile
 if (window.innerWidth < 1024) window.toggleSidebar()
}

// Fungsi pencarian menu rekursif
function findMenuByPath(path, menus) {
 if (!menus) return null
 for (const m of menus) {
  if (m.path === path) return m
  if (m.daftar_sub_sidemenu) {
   const found = findMenuByPath(path, m.daftar_sub_sidemenu)
   if (found) return found
  }
 }
 return null
}

/**
 * 4. CRUD ENGINE: READ (Fetch Data)
 */
window.fetchTableData = async function () {
 const tbody = document.getElementById('table-data-body')
 if (!tbody || !window.currentModule) return

 tbody.innerHTML =
  '<tr><td colspan="100%" class="p-10 text-center text-gray-400 italic text-xs uppercase tracking-widest">Memuat data...</td></tr>'

 try {
  const token = localStorage.getItem('auth_token')
  const colName = window.currentModule.config.collectionName
  const url = `${window.API_BASE_URL}api/collections/${colName}?page=${window.currentPage}&limit=${window.pageSize}&search=${window.searchQuery}`

  const response = await fetch(url, {
   headers: { Authorization: `Bearer ${token}` }, // Security Header
  })

  if (response.status === 401) return window.logout()

  const result = await response.json()
  const data = result.data || []

  if (data.length === 0) {
   tbody.innerHTML =
    '<tr><td colspan="100%" class="p-10 text-center text-gray-400 italic text-xs uppercase">Data Kosong</td></tr>'
   renderPaginationControls(0)
   return
  }

  tbody.innerHTML = data
   .map(
    (item) => `
    <tr class="hover:bg-gray-50/50 transition border-b border-gray-50">
        ${window.currentModule.config.fields
         .map(
          (f) => `
            <td class="p-4 text-sm text-gray-600">${item[f.name] || '-'}</td>
        `
         )
         .join('')}
        <td class="p-4 text-right">
            <button onclick="window.editData('${item._id}')" class="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"><i class="fas fa-edit"></i></button>
            <button onclick="window.deleteData('${item._id}')" class="text-red-400 hover:bg-red-50 p-2 rounded-lg transition ml-1"><i class="fas fa-trash"></i></button>
        </td>
    </tr>`
   )
   .join('')

  renderPaginationControls(result.totalPages)
 } catch (err) {
  tbody.innerHTML =
   '<tr><td colspan="100%" class="p-10 text-center text-red-400 font-bold">Gagal Koneksi Database</td></tr>'
 }
}

/**
 * 5. CRUD ENGINE: CREATE, UPDATE, DELETE
 */
if (!window.isSubmitHandlerAttached) {
 document.addEventListener('submit', async function (e) {
  if (e.target && e.target.id === 'dynamic-form') {
   e.preventDefault()

   const submitBtn = e.target.querySelector('button[type="submit"]')
   if (submitBtn) {
    submitBtn.disabled = true
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Memproses...`
   }

   const id = e.target.dataset.editingId
   const token = localStorage.getItem('auth_token')
   const method = id ? 'PUT' : 'POST'
   const colName = window.currentModule.config.collectionName
   const url = `${window.API_BASE_URL}api/collections/${colName}${id ? '/' + id : ''}`

   try {
    const response = await fetch(url, {
     method: method,
     headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
     },
     body: JSON.stringify(Object.fromEntries(new FormData(e.target).entries())),
    })

    if (response.status === 401) return window.logout()

    if (response.ok) {
     window.closeModal()
     window.fetchTableData()
     window.showToast('Data berhasil di simpan')
    }
   } catch (err) {
    console.error('Submit Error:', err)
   } finally {
    if (submitBtn) submitBtn.disabled = false
   }
  }
 })
 window.isSubmitHandlerAttached = true
}

window.deleteData = async function (id) {
 // Gunakan SweetAlert2 untuk konfirmasi
 Swal.fire({
  title: 'HAPUS DATA?',
  text: 'Data yang dihapus tidak dapat dikembalikan!',
  icon: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#2563eb',
  cancelButtonColor: '#f3f4f6',
  confirmButtonText: 'YA, HAPUS!',
  cancelButtonText: 'BATAL',
  reverseButtons: true,
  customClass: {
   cancelButton: 'text-gray-500 border border-gray-200',
  },
 }).then(async (result) => {
  if (result.isConfirmed) {
   try {
    const colName = window.currentModule.config.collectionName
    const response = await fetch(`${window.API_BASE_URL}api/collections/${colName}/${id}`, {
     method: 'DELETE',
     headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }, //
    })

    if (response.status === 401) return window.logout()

    if (response.ok) {
     window.fetchTableData() // Refresh tabel
     window.showToast('Data berhasil dihapus')
    } else {
     throw new Error('Gagal menghapus')
    }
   } catch (err) {
    Swal.fire('ERROR!', 'Gagal menghubungi server.', 'error')
   }
  }
 })
}

window.editData = async function (id) {
 try {
  const response = await fetch(
   `${window.API_BASE_URL}api/collections/${window.currentModule.config.collectionName}/${id}`,
   {
    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
   }
  )
  if (response.status === 401) return window.logout()
  const data = await response.json()
  window.openCrudModal(data)
 } catch (err) {
  window.showToast('Gagal mengambil data untuk diedit')
 }
}

/**
 * 6. UI RENDERERS & MODAL UTILITIES
 */
function renderSidebar(menus) {
 const container = document.getElementById('menu-container')
 if (!container) return

 container.innerHTML = menus
  .map((menu) => {
   if (menu.daftar_sub_sidemenu) {
    return `
    <div class="mb-4">
     <p class="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">${menu.name}</p>
     <div class="space-y-1">
      ${menu.daftar_sub_sidemenu
       .map(
        (sub) => `
       <button onclick="window.navigate('${sub.path}')" data-path="${sub.path}" class="menu-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-800 text-left">
        <i class="${sub.icon} w-5 text-center text-xs text-gray-400"></i><span>${sub.name}</span>
       </button>
      `
       )
       .join('')}
     </div>
    </div>`
   }
   return `
   <button onclick="window.navigate('${menu.path}')" data-path="${menu.path}" class="menu-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-800 mb-1 text-left">
    <i class="${menu.icon} w-5 text-center text-xs text-gray-400"></i><span>${menu.name}</span>
   </button>`
  })
  .join('')
}

function renderView(config) {
 const main = document.getElementById('main-view')
 if (!main) return

 if (config.type === 'tableview') {
  main.innerHTML = `
   <div class="space-y-6 animate-in fade-in duration-500">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
     <div>
      <h1 class="text-2xl font-bold text-gray-800">${config.name}</h1>
      <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Inventory System / ${config.name}</p>
     </div>
     <div class="flex flex-wrap items-center gap-3">
      <div class="relative">
       <input type="text" placeholder="Cari..." oninput="window.doSearch(this.value)" class="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-xs w-full md:w-64 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all">
      </div>
      <button onclick="window.openCrudModal()" class="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
       <i class="fas fa-plus mr-2"></i> Tambah Data
      </button>
     </div>
    </div>
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
     <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
       <thead class="bg-gray-50/50 border-b border-gray-100">
        <tr>
         ${config.config.fields.map((f) => `<th class="p-4 text-[10px] text-gray-400 uppercase tracking-widest font-black">${f.label}</th>`).join('')}
         <th class="p-4 text-[10px] text-gray-400 uppercase tracking-widest font-black text-right">Aksi</th>
        </tr>
       </thead>
       <tbody id="table-data-body"></tbody>
      </table>
     </div>
     <div id="pagination-container" class="p-4 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between"></div>
    </div>
   </div>`
 } else if (config.type === 'settings') {
  renderSettingsView(config, main)
 } 
 else if (config.type === 'dashboard' || config.type === 'chartview') {
  renderDashboardView(config, main);
 }
 else {
  main.innerHTML = `<div class="p-20 flex flex-col items-center justify-center text-center">
   <div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
    <i class="fas fa-layer-group text-blue-500 text-2xl"></i>
   </div>
   <h2 class="text-lg font-bold text-gray-800">Modul ${config.name}</h2>
   <p class="text-sm text-gray-500">Modul tipe "${config.type}" dalam tahap pengembangan.</p>
  </div>`
 }
}
async function renderDashboardView(config, container) {
  // Skeleton Loading saat menunggu API
  container.innerHTML = `
    <div class="animate-pulse space-y-6">
      <div class="h-8 w-48 bg-gray-200 rounded"></div>
      <div class="grid grid-cols-4 gap-4"><div class="h-24 bg-gray-100 rounded-xl"></div></div>
    </div>`;

  try {
    const response = await fetch(`${window.API_BASE_URL}api/dashboard-stats`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });
    const result = await response.json();
    const { widgets } = result.data;

    container.innerHTML = `
      <div class="space-y-6 animate-in fade-in duration-500">
        <header>
          <h1 class="text-2xl font-bold text-gray-800">${config.name}</h1>
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Laporan Real-time</p>
        </header>
        <div id="widget-grid" class="grid grid-cols-1 md:grid-cols-4 gap-6"></div>
      </div>`;

    const grid = document.getElementById('widget-grid');

    // Loop otomatis berdasarkan data dari Backend
    widgets.forEach((w, i) => {
      const id = `chart-${i}`;
      // Tentukan lebar kolom (1 sampai 4)
      const colSpan = w.width === 'full' ? 'md:col-span-4' : w.width === 'half' ? 'md:col-span-2' : 'md:col-span-1';
      
      const cardHtml = `
        <div class="${colSpan} bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">${w.title}</h3>
          ${w.type === 'stat' ? `<h2 class="text-2xl font-black text-gray-800">${w.value}</h2>` : `<canvas id="${id}" height="250"></canvas>`}
        </div>`;
      
      grid.insertAdjacentHTML('beforeend', cardHtml);

      if (w.type === 'chart') {
        setTimeout(() => renderDynamicChart(id, w), 50);
      }
    });
  } catch (e) {
    container.innerHTML = `<div class="p-10 text-center text-red-500 font-bold uppercase text-xs">Gagal memuat dashboard</div>`;
  }
}

function renderDynamicChart(id, data) {
  const ctx = document.getElementById(id).getContext('2d');
  new Chart(ctx, {
    type: data.chartType, // 'line', 'bar', 'doughnut'
    data: data.chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: data.chartType === 'doughnut' } }
    }
  });
}

async function renderSettingsView(config, container) {
 container.innerHTML = `<div class="p-10 text-center text-gray-400 italic text-xs uppercase">Memuat konfigurasi...</div>`

 try {
  const token = localStorage.getItem('auth_token')
  // Asumsi endpoint: GET /api/settings
  const response = await fetch(`${window.API_BASE_URL}api/settings`, {
   headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 401) return window.logout()
  const settings = await response.json() // Data setting dari DB

  // Template HTML untuk Settings
  container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Pengaturan Sistem</h1>
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Konfigurasi Aplikasi & Toko</p>
          </div>
          <button onclick="saveSettings()" id="btn-save-settings" class="bg-blue-600 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2">
            <i class="fas fa-save"></i> Simpan Perubahan
          </button>
        </div>

        <form id="settings-form" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm md:col-span-2">
            <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase">
              <i class="fas fa-store text-blue-500"></i> Identitas Toko
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Toko</label>
                <input type="text" name="shop_name" value="${settings.shop_name || ''}" class="w-full p-3 border rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500/20 outline-none transition">
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No. Telepon / WA</label>
                <input type="text" name="shop_phone" value="${settings.shop_phone || ''}" class="w-full p-3 border rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500/20 outline-none transition">
              </div>
              <div class="space-y-1 md:col-span-2">
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alamat Lengkap</label>
                <textarea name="shop_address" rows="2" class="w-full p-3 border rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500/20 outline-none transition">${settings.shop_address || ''}</textarea>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase">
              <i class="fas fa-cogs text-blue-500"></i> Sistem
            </h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs font-bold text-gray-700">Maintenance Mode</div>
                  <div class="text-[10px] text-gray-400">Hanya admin yang bisa login</div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="maintenance_mode" class="sr-only peer" ${settings.maintenance_mode ? 'checked' : ''}>
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs font-bold text-gray-700">Notifikasi Email</div>
                  <div class="text-[10px] text-gray-400">Kirim laporan harian ke owner</div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="email_notification" class="sr-only peer" ${settings.email_notification ? 'checked' : ''}>
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase">
              <i class="fas fa-shield-alt text-blue-500"></i> Keamanan
            </h3>
            <div class="space-y-3">
               <div class="space-y-1">
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Session Timeout (Menit)</label>
                <input type="number" name="session_timeout" value="${settings.session_timeout || 60}" class="w-full p-3 border rounded-xl text-sm bg-gray-50 outline-none">
              </div>
              <button type="button" class="w-full py-2 border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 transition uppercase tracking-widest mt-2">
                Reset Semua Password Staff
              </button>
            </div>
          </div>

        </form>
      </div>
    `
 } catch (err) {
  container.innerHTML = `<div class="p-10 text-center text-red-500 font-bold">Gagal memuat pengaturan.</div>`
  console.error(err)
 }
}
/**
 * 7. MODAL & PAGINATION UTILITIES
 */
window.openCrudModal = function (existingData = null) {
 const modal = document.getElementById('crud-modal')
 const container = document.getElementById('modal-container')
 const form = document.getElementById('dynamic-form')

 // Reset Form
 delete form.dataset.editingId
 form.reset()

 const fields = window.currentModule.config.fields || []
 document.getElementById('modal-title').innerText = existingData
  ? `Edit ${window.currentModule.name}`
  : `Tambah ${window.currentModule.name}`

 if (existingData) form.dataset.editingId = existingData._id

 // Render Input dengan Style Modern
 form.innerHTML = fields
  .map((field) => {
   const val = existingData ? existingData[field.name] : field.default || ''
   return `
      <div class="space-y-1.5">
        <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
          ${field.label}
        </label>
        <input 
          type="${field.type}" 
          name="${field.name}" 
          value="${val}" 
          placeholder="Masukkan ${field.label}..."
          class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-gray-300"
          ${field.required ? 'required' : ''}
        >
      </div>
    `
  })
  .join('')

 // Animasi Masuk
 modal.classList.remove('hidden')
 setTimeout(() => {
  modal.classList.replace('opacity-0', 'opacity-100')
  container.classList.replace('scale-95', 'scale-100')
 }, 10)
}

window.closeModal = () => {
 const modal = document.getElementById('crud-modal')
 const container = document.getElementById('modal-container')

 modal.classList.replace('opacity-100', 'opacity-0')
 container.classList.replace('scale-100', 'scale-95')

 setTimeout(() => {
  modal.classList.add('hidden')
 }, 300)
}

window.closeModal = () => {
 const modal = document.getElementById('crud-modal')
 modal.classList.replace('opacity-100', 'opacity-0')
 setTimeout(() => modal.classList.add('hidden'), 300)
}

window.showToast = function (message, type = 'success') {
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

function renderPaginationControls(totalPages) {
 const container = document.getElementById('pagination-container')
 if (!container || totalPages <= 1) {
  container.innerHTML = ''
  return
 }

 container.innerHTML = `
  <div class="text-xs text-gray-500 font-medium">Halaman ${window.currentPage} dari ${totalPages}</div>
  <div class="flex gap-2">
   <button onclick="window.changePage(${window.currentPage - 1})" ${window.currentPage === 1 ? 'disabled' : ''} class="px-3 py-1 border rounded text-xs hover:bg-gray-50 disabled:opacity-50">Prev</button>
   <button onclick="window.changePage(${window.currentPage + 1})" ${window.currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1 border rounded text-xs hover:bg-gray-50 disabled:opacity-50">Next</button>
  </div>`
}

// Global Utilities
window.logout = () => {
 localStorage.clear()
 window.location.href = '/login'
}
window.toggleSidebar = () => {
 document.getElementById('sidebar').classList.toggle('-translate-x-full')
 document.getElementById('overlay').classList.toggle('hidden')
}
window.changePage = (p) => {
 window.currentPage = p
 window.fetchTableData()
}
let searchTimer
window.doSearch = (val) => {
 clearTimeout(searchTimer)
 searchTimer = setTimeout(() => {
  window.searchQuery = val
  window.currentPage = 1
  window.fetchTableData()
 }, 500)
}

function handleInitialRouting() {
 const hash = window.location.hash.replace(/^#\/?/, '')
 if (hash) window.navigate(hash)
 else if (window.menuData.length > 0) {
  const first = window.menuData[0]
  window.navigate(first.daftar_sub_sidemenu ? first.daftar_sub_sidemenu[0].path : first.path)
 }
}

// START
initApp()
