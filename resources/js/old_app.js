/**
 * TB SAHABAT - DYNAMIC ENGINE v4.0 (Production Ready)
 * Fitur: Auth Guard, Secure API Fetch, Nested Menu, Pagination, Search, & Dashboard Generator
 */

// =================================================================
// 1. STATE MANAGEMENT - TERPUSAT & TERORGANISIR
// =================================================================
const AppState = {
 // Core Application
 API_BASE_URL: '/',
 menuData: [],
 currentModule: null,

 // Table View
 currentPage: 1,
 pageSize: 5,
 searchQuery: '',

 // Dashboard & Charts
 chartInstances: {},

 // Dashboard Generator
 tempBuilderWidgets: [],
 currentEditingDashboardId: null,
 genSearchQuery: '',
 genCurrentPage: 1,
 genPageSize: 6,
 dbDashboards: { data: [] },

 // UI State
 isSubmitHandlerAttached: false,
}

// =================================================================
// 2. AUTH GUARD & INITIALIZATION
// =================================================================
async function initApp() {
 const token = localStorage.getItem('auth_token')
 const isLoginPage = window.location.pathname.includes('login')

 if (!token && !isLoginPage) {
  window.location.href = '/login'
  return
 }

 if (token && isLoginPage) {
  window.location.href = '/'
  return
 }

 if (token) {
  try {
   const response = await fetch(AppState.API_BASE_URL + 'api/menu', {
    headers: { Authorization: `Bearer ${token}` },
   })

   if (response.status === 401) {
    logout()
    return
   }

   const data = await response.json()
   AppState.menuData = data.daftar_sidemenu

   // Sinkronisasi Nama User di Header
   const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}')
   const nameEl = document.querySelector('.text-xs.font-bold.text-gray-800')
   if (nameEl && userInfo.name) nameEl.innerText = userInfo.name

   renderSidebar(AppState.menuData)
   handleInitialRouting()
  } catch (error) {
   console.error('Critical Error: Gagal memuat menu.', error)
  }
 }
}

function handleInitialRouting() {
 const hash = window.location.hash.replace(/^#\/?/, '')
 if (hash) {
  navigate(hash)
 } else if (AppState.menuData.length > 0) {
  const first = AppState.menuData[0]
  navigate(first.daftar_sub_sidemenu ? first.daftar_sub_sidemenu[0].path : first.path)
 }
}

// =================================================================
// 3. CORE ENGINE: NAVIGATION & ROUTING
// =================================================================
function navigate(path) {
 const cleanPath = path.replace(/^#\/?/, '')
 const config = findMenuByPath(cleanPath, AppState.menuData)

 if (!config) return

 AppState.currentModule = config
 AppState.currentPage = 1
 window.location.hash = '/' + cleanPath

 // Update UI Judul & Active State
 const titleEl = document.getElementById('page-title')
 if (titleEl) titleEl.innerText = config.name

 document.querySelectorAll('.menu-item').forEach((el) => {
  el.classList.toggle('menu-active', el.getAttribute('data-path') === cleanPath)
 })

 renderView(config)
 if (config.type === 'tableview') fetchTableData()

 // Reset Visual State
 if (window.innerWidth < 1024) toggleSidebar()
 Object.values(AppState.chartInstances).forEach((inst) => inst && inst.destroy())
 AppState.chartInstances = {}
 toggleDashboardList(false)
}

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

// =================================================================
// 4. CRUD ENGINE: DATA OPERATIONS
// =================================================================
async function fetchTableData() {
 const tbody = document.getElementById('table-data-body')
 if (!tbody || !AppState.currentModule) return

 tbody.innerHTML =
  '<tr><td colspan="100%" class="p-10 text-center text-gray-400 italic text-xs uppercase tracking-widest">Memuat data...</td></tr>'

 try {
  const token = localStorage.getItem('auth_token')
  const colName = AppState.currentModule.config.collectionName
  const url = `${AppState.API_BASE_URL}api/collections/${colName}?page=${AppState.currentPage}&limit=${AppState.pageSize}&search=${AppState.searchQuery}`

  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (response.status === 401) return logout()

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
                ${AppState.currentModule.config.fields.map((f) => `<td class="p-4 text-sm text-gray-600">${item[f.name] || '-'}</td>`).join('')}
                <td class="p-4 text-right">
                    <button onclick="editData('${item._id}')" class="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteData('${item._id}')" class="text-red-400 hover:bg-red-50 p-2 rounded-lg transition ml-1">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
   )
   .join('')

  renderPaginationControls(result.totalPages)
 } catch (err) {
  tbody.innerHTML =
   '<tr><td colspan="100%" class="p-10 text-center text-red-400 font-bold">Gagal Koneksi Database</td></tr>'
 }
}

function setupFormHandler() {
 if (!AppState.isSubmitHandlerAttached) {
  document.addEventListener('submit', async function (e) {
   if (e.target && e.target.id === 'dynamic-form') {
    e.preventDefault()
    await handleFormSubmit(e)
   }
  })
  AppState.isSubmitHandlerAttached = true
 }
}

async function handleFormSubmit(e) {
 const submitBtn = e.target.querySelector('button[type="submit"]')
 if (submitBtn) {
  submitBtn.disabled = true
  submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Memproses...`
 }

 const id = e.target.dataset.editingId
 const token = localStorage.getItem('auth_token')
 const colName = AppState.currentModule.config.collectionName
 const url = `${AppState.API_BASE_URL}api/collections/${colName}${id ? '/' + id : ''}`

 try {
  const response = await fetch(url, {
   method: id ? 'PUT' : 'POST',
   headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
   },
   body: JSON.stringify(Object.fromEntries(new FormData(e.target).entries())),
  })

  if (response.status === 401) return logout()

  if (response.ok) {
   closeModal()
   fetchTableData()
   showToast('Data berhasil di simpan')
  }
 } catch (err) {
  console.error('Submit Error:', err)
 } finally {
  if (submitBtn) {
   submitBtn.disabled = false
   submitBtn.innerHTML = `Simpan`
  }
 }
}

async function editData(id) {
 try {
  const response = await fetch(
   `${AppState.API_BASE_URL}api/collections/${AppState.currentModule.config.collectionName}/${id}`,
   {
    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
   }
  )

  if (response.status === 401) return logout()

  const data = await response.json()
  openCrudModal(data)
 } catch (err) {
  showToast('Gagal mengambil data untuk diedit', 'error')
 }
}

async function deleteData(id) {
 const result = await Swal.fire({
  title: 'HAPUS DATA?',
  text: 'Data yang dihapus tidak dapat dikembalikan!',
  icon: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#2563eb',
  cancelButtonColor: '#f3f4f6',
  confirmButtonText: 'YA, HAPUS!',
  cancelButtonText: 'BATAL',
  reverseButtons: true,
 })

 if (result.isConfirmed) {
  try {
   const colName = AppState.currentModule.config.collectionName
   const response = await fetch(`${AppState.API_BASE_URL}api/collections/${colName}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
   })

   if (response.status === 401) return logout()

   if (response.ok) {
    fetchTableData()
    showToast('Data berhasil dihapus')
   } else {
    throw new Error('Gagal menghapus')
   }
  } catch (err) {
   Swal.fire('ERROR!', 'Gagal menghubungi server.', 'error')
  }
 }
}

// =================================================================
// 5. UI RENDERERS (VIEWS)
// =================================================================
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
                  <button onclick="navigate('${sub.path}')" 
                          data-path="${sub.path}" 
                          class="menu-item w-full flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-800 text-left text-white">
                      <i class="${sub.icon} w-5 text-center text-xs text-gray-400"></i>
                      <span class="truncate">${sub.name}</span>
                  </button>
              `
                )
                .join('')}
          </div>
      </div>`
   }
   return `
            <button onclick="navigate('${menu.path}')" 
                    data-path="${menu.path}" 
                    class="menu-item w-full flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-800 mb-1 text-left text-white">
                <i class="${menu.icon} w-5 text-center text-xs text-gray-400"></i>
                <span class="truncate">${menu.name}</span>
            </button>`
  })
  .join('')
}

function renderSubMenu(menu) {
 return `
  <div class="mb-4">
      <p class="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">${menu.name}</p>
      <div class="space-y-1">
          ${menu.daftar_sub_sidemenu
            .map(
            (sub) => `
              <button onclick="navigate('${sub.path}')" 
                      data-path="${sub.path}" 
                      class="menu-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-800 text-left text-white">
                  <i class="${sub.icon} w-5 text-center text-xs text-gray-400"></i>
                  <span>${sub.name}</span>
              </button>
          `
            )
            .join('')}
      </div>
  </div>`
}

function renderSingleMenuItem(menu) {
 return `
  <button onclick="navigate('${menu.path}')" 
      data-path="${menu.path}" 
      class="menu-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-800 mb-1 text-left text-white">
      <i class="${menu.icon} w-5 text-center text-xs text-gray-400"></i>
      <span>${menu.name}</span>
  </button>`
}

function renderView(config) {
 const main = document.getElementById('main-view')
 if (!main) return

 switch (config.type) {
  case 'tableview':
   renderTableView(config, main)
   break
  case 'settings':
   renderSettingsView(config, main)
   break
  case 'dashboard':
  case 'chartview':
   renderDashboardView(config, main)
   break
  default:
   renderDefaultView(config, main)
 }
}

function renderTableView(config, container) {
 container.innerHTML = `
  <div class="space-y-6 animate-in fade-in duration-500">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <h1 class="text-2xl font-bold text-gray-800">${config.name}</h1>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Inventory System / ${config.name}</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
              <div class="relative">
                  <input type="text" 
                          placeholder="Cari..." 
                          oninput="doSearch(this.value)" 
                          class="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-xs w-full md:w-64 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all">
              </div>
              <button onclick="openCrudModal()" 
                      class="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
                  <i class="fas fa-plus mr-2"></i> Tambah Data
              </button>
          </div>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                  <thead class="bg-gray-50/50 border-b border-gray-100">
                      <tr>
                          ${config.config.fields
                            .map(
                            (f) =>
                              `<th class="p-4 text-[10px] text-gray-400 uppercase tracking-widest font-black">${f.label}</th>`
                            )
                            .join('')}
                          <th class="p-4 text-[10px] text-gray-400 uppercase tracking-widest font-black text-right">Aksi</th>
                      </tr>
                  </thead>
                  <tbody id="table-data-body"></tbody>
              </table>
          </div>
          <div id="pagination-container" class="p-4 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between"></div>
      </div>
  </div>`
}

function renderDefaultView(config, container) {
 container.innerHTML = `
  <div class="p-20 flex flex-col items-center justify-center text-center">
      <div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <i class="fas fa-layer-group text-blue-500 text-2xl"></i>
      </div>
      <h2 class="text-lg font-bold text-gray-800">Modul ${config.name}</h2>
      <p class="text-sm text-gray-500">Modul tipe "${config.type}" dalam tahap pengembangan.</p>
  </div>`
}

// =================================================================
// 6. DASHBOARD & CHART COMPONENTS
// =================================================================
async function renderDashboardView(config, container) {
 const dashboardId = config.config?.dashboard_id || 'MAIN'

 // Show loading skeleton
 container.innerHTML = `
  <div class="space-y-6 animate-pulse p-4">
      <div class="flex justify-between items-center">
          <div class="h-10 bg-gray-200 w-64 rounded-xl"></div>
          <div class="h-10 bg-gray-200 w-48 rounded-xl"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          ${'<div class="h-32 bg-gray-100 rounded-2xl"></div>'.repeat(4)}
      </div>
      <div class="h-80 bg-gray-50 rounded-2xl w-full"></div>
  </div>`

 try {
  const response = await fetch(`${AppState.API_BASE_URL}api/dashboard-snapshot?id=${dashboardId}`, {
   headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
  })

  const result = await response.json()
  const { widgets, last_updated } = result.data
  const allDashboards = getAllDashboards(AppState.menuData)

  container.innerHTML = createDashboardHTML(config, widgets, last_updated, allDashboards)

  // Initialize charts after a brief delay
  setTimeout(() => {
   widgets.forEach((w, i) => {
    if (w.type === 'chart') {
     const chartId = `chart-${dashboardId}-${i}`
     initChartComponent(chartId, w)
    }
   })
  }, 50)
 } catch (err) {
  container.innerHTML = `
            <div class="p-20 text-center">
                <i class="fas fa-exclamation-circle text-red-400 text-3xl mb-4"></i>
                <h3 class="font-bold text-gray-800 uppercase">Snapshot Load Failed</h3>
            </div>`
 }
}

function createDashboardHTML(config, widgets, lastUpdated, allDashboards) {
 return `
  <div class="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-6 sm:pb-10 px-3 sm:px-0">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4 sm:pb-6">
          <div class="mb-3 sm:mb-0">
              <h1 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">${config.name}</h1>
              <div class="flex items-center gap-2 mt-2">
                  <div class="flex h-2 w-2 mb-0.5">
                      <span class="animate-ping absolute h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                      <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                      Last Sync: ${lastUpdated}
                  </p>
              </div>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div class="relative w-full sm:w-64 group" id="dashboard-search-container">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i class="fas fa-search text-gray-400 text-[10px]"></i>
                  </div>
                  <input type="text" 
                          id="dashboard-search-input" 
                          placeholder="Cari dashboard..." 
                          class="w-full pl-9 sm:pl-10 pr-3 sm:pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                          onclick="toggleDashboardList(true)" 
                          oninput="filterDashboardList(this.value)">
                  <div id="dashboard-list-overlay" class="hidden absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                      ${allDashboards
                        .map(
                        (d) => `
                          <div class="dashboard-opt px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50" 
                                onclick="navigate('${d.path}')" 
                                data-name="${d.name.toLowerCase()}">
                              <p class="text-[10px] font-black text-gray-800 uppercase tracking-tighter">${d.name}</p>
                              <p class="text-[9px] text-gray-400 font-medium">Path: /${d.path}</p>
                          </div>
                      `
                        )
                        .join('')}
                  </div>
              </div>
              <button onclick="navigate('${config.path}')" 
                      class="flex items-center justify-center w-full sm:w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-sm mt-1 sm:mt-0">
                  <i class="fas fa-sync-alt text-xs text-gray-500"></i>
                  <span class="ml-2 sm:hidden text-xs font-bold">Refresh</span>
              </button>
          </div>
      </div>
      <div id="dashboard-grid" class="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          ${widgets.map((w, i) => createWidgetHTML(w, dashboardId, i)).join('')}
      </div>
  </div>`
}

function createWidgetHTML(widget, dashboardId, index) {
 const colSpan = getColumnSpan(widget.width)

 if (widget.type === 'stat') {
  return `
    <div class="${colSpan} bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 text-lg">
            <i class="fas ${widget.icon || 'fa-chart-simple'}"></i>
        </div>
        <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">
            ${widget.label}
        </p>
        <h2 class="text-3xl font-black text-gray-900 tracking-tight">${widget.value}</h2>
        ${
          widget.percentage
          ? `
            <div class="mt-3 text-[10px] font-bold ${widget.trend === 'up' ? 'text-emerald-500' : 'text-red-500'} flex items-center gap-1">
                <i class="fas ${widget.trend === 'up' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
                ${widget.percentage}
                <span class="text-gray-400 lowercase">vs last month</span>
            </div>
        `
          : ''
        }
    </div>`
 } else if (widget.type === 'chart') {
  const chartId = `chart-${dashboardId}-${index}`
  return `
    <div class="${colSpan} bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div class="flex justify-between items-center mb-8">
            <h3 class="text-xs font-black text-gray-800 uppercase tracking-widest">${widget.label}</h3>
            <div class="h-2 w-2 rounded-full bg-blue-500"></div>
        </div>
        <div class="h-64"><canvas id="${chartId}"></canvas></div>
    </div>`
 }
 return ''
}

function getColumnSpan(width) {
 switch (width) {
  case 'full':
   return 'md:col-span-4'
  case 'half':
   return 'md:col-span-2'
  default:
   return 'md:col-span-1'
 }
}

function initChartComponent(id, widget) {
 const ctx = document.getElementById(id)
 if (!ctx) return

 if (AppState.chartInstances[id]) {
  AppState.chartInstances[id].destroy()
 }

 AppState.chartInstances[id] = new Chart(ctx.getContext('2d'), {
  type: widget.chartType || 'line',
  data: widget.chartData,
  options: getChartOptions(widget),
  plugins: getChartPlugins(widget),
 })
}

function getChartOptions(widget) {
 const isDonutOrPie = widget.chartType === 'doughnut' || widget.chartType === 'pie'

 return {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
   legend: {
    display: isDonutOrPie,
    position: 'bottom',
   },
   tooltip: {
    backgroundColor: '#1e293b',
    cornerRadius: 12,
    padding: 12,
   },
  },
  scales: isDonutOrPie
   ? {}
   : {
      y: {
       beginAtZero: true,
       grid: { color: '#f1f5f9' },
       ticks: {
        font: { size: 10 },
        callback: (v) => v.toLocaleString('id-ID'),
       },
      },
      x: {
       grid: { display: false },
       ticks: { font: { size: 10 } },
      },
     },
 }
}

function getChartPlugins(widget) {
 if (widget.chartType !== 'line') return []

 return [
  {
   beforeInit: (chart) => {
    if (chart.data.datasets.length > 0) {
     const ds = chart.data.datasets[0]
     ds.tension = 0.4
     ds.pointRadius = 0
     ds.pointHoverRadius = 6
    }
   },
  },
 ]
}

// =================================================================
// 7. DASHBOARD GENERATOR ENGINE
// =================================================================
async function renderSettingsView(config, container) {
 container.innerHTML = `<div class="w-full p-20 text-center text-gray-400 italic text-xs uppercase tracking-widest animate-pulse">Memuat Konfigurasi...</div>`

 try {
  const token = localStorage.getItem('auth_token')
  const response = await fetch(`${AppState.API_BASE_URL}api/settings`, {
   headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 401) return logout()

  const settings = response.ok ? await response.json() : {}
  renderSettingsContent(container, settings)

  await fetchDashboardsFromDB()
  loadGeneratorList()
 } catch (err) {
  container.innerHTML = `
  <div class="p-10 text-center text-red-500 font-bold uppercase text-[10px]">
      Gagal memuat pengaturan. Periksa koneksi atau token.
  </div>`
 }
}

function renderSettingsContent(container, settings) {
 container.innerHTML = `
        <div class="w-full space-y-8 animate-in fade-in duration-500 pb-10 px-4 md:px-8">
            ${renderSettingsHeader()}
            ${renderSettingsTabs()}
            ${renderGeneralTab(settings)}
            ${renderGeneratorTab()}
        </div>`
}

function renderSettingsHeader() {
 return `
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
      <div>
          <h1 class="text-3xl font-black text-gray-900 tracking-tight">Pengaturan Sistem</h1>
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Konfigurasi & Builder</p>
      </div>
  </div>`
}

function renderSettingsTabs() {
 return `
  <div class="flex gap-1 sm:gap-2 p-1 sm:p-1.5 bg-gray-100 w-full sm:w-fit rounded-xl sm:rounded-2xl overflow-x-auto">
      <button onclick="switchSettingsTab('general')" 
              id="tab-btn-general" 
              class="px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white shadow-sm text-blue-600 flex-shrink-0">
          <i class="fas fa-sliders-h mr-1 sm:mr-2"></i> General
      </button>
      <button onclick="switchSettingsTab('generator')" 
              id="tab-btn-generator" 
              class="px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-gray-400 flex-shrink-0">
          <i class="fas fa-th-large mr-1 sm:mr-2"></i> Dashboard Generator
      </button>
  </div>`
}

function renderGeneralTab(settings) {
 return `
  <div id="tab-content-general" class="settings-tab-content space-y-6">
      <form id="settings-form" class="grid grid-cols-1 xl:grid-cols-3 gap-6">
          ${renderShopSettings(settings)}
          ${renderSecuritySettings(settings)}
      </form>
      <div class="flex justify-end pt-4">
          <button onclick="saveSettings()" 
                  class="bg-blue-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-black transition-all shadow-xl shadow-blue-200 flex items-center gap-3 tracking-widest">
              <i class="fas fa-save"></i> Simpan Konfigurasi
          </button>
      </div>
  </div>`
}

function renderShopSettings(settings) {
 return `
  <div class="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm xl:col-span-2 relative overflow-hidden group">
      <h3 class="font-black text-gray-800 mb-6 text-xs uppercase tracking-widest flex items-center gap-3">
          <span class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
              <i class="fas fa-store"></i>
          </span> 
          Identitas Utama
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div class="space-y-1.5">
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Toko</label>
              <input type="text" 
                      name="shop_name" 
                      value="${settings.shop_name || ''}" 
                      class="w-full p-4 bg-gray-50 border-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-sm outline-none transition-all">
          </div>
          <div class="space-y-1.5">
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp</label>
              <input type="text" 
                      name="shop_phone" 
                      value="${settings.shop_phone || ''}" 
                      class="w-full p-4 bg-gray-50 border-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-sm outline-none transition-all">
          </div>
          <div class="space-y-1.5 md:col-span-2">
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
              <textarea name="shop_address" 
                        rows="3" 
                        class="w-full p-4 bg-gray-50 border-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-sm outline-none transition-all">${settings.shop_address || ''}</textarea>
          </div>
      </div>
  </div>`
}

function renderSecuritySettings(settings) {
 return `
  <div class="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-fit">
      <h3 class="font-black text-gray-800 mb-6 text-xs uppercase tracking-widest flex items-center gap-3">
          <span class="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-sm">
              <i class="fas fa-shield-alt"></i>
          </span> 
          Keamanan
      </h3>
      <div class="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
          <div>
              <p class="text-[10px] font-black text-gray-800 uppercase tracking-tighter">Maintenance Mode</p>
              <p class="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Offline-kan Sistem</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" 
                      name="maintenance_mode" 
                      class="sr-only peer" 
                      ${settings.maintenance_mode ? 'checked' : ''}>
              <div class="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
      </div>
  </div>`
}

function renderGeneratorTab() {
 return `
  <div id="tab-content-generator" class="settings-tab-content hidden animate-in slide-in-from-bottom-4 duration-500">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div class="lg:col-span-3 space-y-4">
              ${renderGeneratorSidebar()}
          </div>
          <div class="lg:col-span-9">
              ${renderGeneratorEmptyState()}
              ${renderGeneratorEditor()}
          </div>
      </div>
  </div>`
}

function renderGeneratorSidebar() {
 return `
  <div class="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[600px] flex flex-col overflow-hidden">
      <div class="p-6 pb-4 flex items-center justify-between border-b border-gray-50">
          <h3 class="text-[11px] font-black text-gray-900 uppercase tracking-widest">Dashboards</h3>
          <button onclick="openAddDashboardModal()" 
                  class="w-9 h-9 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 flex items-center justify-center hover:bg-black transition-all">
              <i class="fas fa-plus text-xs"></i>
          </button>
      </div>
      
      <div class="p-4">
          <div class="relative group">
              <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 group-focus-within:text-blue-500 transition-colors"></i>
              <input type="text" 
                      placeholder="CARI DASHBOARD..." 
                      oninput="doGenSearch(this.value)"
                      class="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500/10 transition-all">
          </div>
      </div>

      <div id="generator-dashboard-list" class="px-4 flex-1 overflow-y-auto custom-scrollbar space-y-2"></div>
      
      <div id="generator-pagination" class="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center"></div>
  </div>`
}

function renderGeneratorEmptyState() {
 return `
  <div id="generator-empty-state" class="bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[3rem] p-20 text-center h-[600px] flex flex-col items-center justify-center">
      <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm">
          <i class="fas fa-magic text-blue-500 text-3xl"></i>
      </div>
      <h3 class="text-lg font-black text-gray-800 uppercase tracking-tighter mb-2">Editor Siap Digunakan</h3>
      <p class="text-xs text-gray-400 font-medium text-center max-w-sm leading-relaxed">
          Silahkan pilih salah satu dashboard di panel kiri untuk mulai menyusun widget dan mengelola tata letak secara real-time.
      </p>
  </div>`
}

function renderGeneratorEditor() {
 return `
  <div id="generator-editor-panel" class="hidden bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[600px] flex flex-col">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-gray-50">
          <div class="mb-3 sm:mb-0">
              <h3 class="font-black text-gray-800 text-sm uppercase tracking-widest mb-1">Widget Editor</h3>
              <p id="editing-dashboard-name" class="text-[10px] text-blue-600 font-black uppercase tracking-widest opacity-70 truncate"></p>
          </div>
          <div class="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3">
              <button onclick="deleteCurrentDashboard()" 
                      class="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 text-[10px] font-black uppercase hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center justify-center gap-1 sm:gap-2 transition-all tracking-widest text-red-400">
                  <i class="fas fa-trash-alt text-xs"></i>
                  <span class="text-xs">Hapus</span>
              </button>
              <button onclick="addWidgetToBuilder()" 
                      class="px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-gray-200 text-[10px] font-black uppercase hover:bg-gray-50 flex items-center justify-center gap-1 sm:gap-2 transition-all tracking-widest">
                  <i class="fas fa-plus text-gray-400 text-xs"></i>
                  <span class="text-xs">Tambah Widget</span>
              </button>
              <button onclick="saveDashboardBuilder()" 
                      class="px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase hover:bg-black transition-all flex items-center justify-center gap-1 sm:gap-2 shadow-xl shadow-blue-100 tracking-widest">
                  <i class="fas fa-save text-xs"></i>
                  <span class="text-xs">Simpan</span>
              </button>
          </div>
      </div>
      <div id="builder-widgets-container" class="space-y-4 flex-1 overflow-y-auto pr-1 sm:pr-2 pb-4 custom-scrollbar"></div>
  </div>`
}

function deleteCurrentDashboard() {
 const dashboardName = document
  .getElementById('editing-dashboard-name')
  .innerText.replace('Editing: ', '')
 const dashboardId = AppState.currentEditingDashboardId

 if (!dashboardId) {
  return showToast('Tidak ada dashboard yang dipilih', 'error')
 }

 deleteDashboard(dashboardId, dashboardName)
}
// Generator Functions
let genSearchTimer

function doGenSearch(val) {
 clearTimeout(genSearchTimer)
 genSearchTimer = setTimeout(() => {
  AppState.genSearchQuery = val.toLowerCase()
  AppState.genCurrentPage = 1
  loadGeneratorList()
 }, 300)
}

async function fetchDashboardsFromDB() {
 const token = localStorage.getItem('auth_token')
 try {
  const response = await fetch(`${AppState.API_BASE_URL}api/collections/dashboard_settings`, {
   headers: { Authorization: `Bearer ${token}` },
  })

  if (response.ok) {
   AppState.dbDashboards = await response.json()
   loadGeneratorList()
  }
 } catch (err) {
  console.error('Gagal mengambil data database:', err)
 }
}

function loadGeneratorList() {
 const container = document.getElementById('generator-dashboard-list')
 const paginationContainer = document.getElementById('generator-pagination')

 if (!container || !AppState.dbDashboards.data) return

 // Filter berdasarkan pencarian
 const filtered = AppState.dbDashboards.data.filter(
  (d) =>
   d.name.toLowerCase().includes(AppState.genSearchQuery.toLowerCase()) ||
   (d.path && d.path.toLowerCase().includes(AppState.genSearchQuery.toLowerCase()))
 )

 // Paginasi
 const totalItems = filtered.length
 const totalPages = Math.ceil(totalItems / AppState.genPageSize)
 const startIndex = (AppState.genCurrentPage - 1) * AppState.genPageSize
 const paginatedItems = filtered.slice(startIndex, startIndex + AppState.genPageSize)

 // Render List
 if (paginatedItems.length === 0) {
  container.innerHTML = `
  <div class="p-10 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
      Data tidak ditemukan
  </div>`
 } else {
  container.innerHTML = paginatedItems
   .map(
    (d) => `
      <div class="group p-4 rounded-2xl border border-gray-100 hover:bg-blue-50 hover:border-blue-100 cursor-pointer transition-all mb-2 shadow-sm">
          <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 flex-1" onclick="openWidgetEditor('${d._id}', '${d.name}')">
                  <div class="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-white flex items-center justify-center text-gray-400 group-hover:text-blue-600 shadow-sm transition-all">
                      <i class="fas ${d.icon || 'fa-chart-line'} text-[10px]"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                      <span class="block text-[10px] font-black text-gray-700 uppercase group-hover:text-blue-700 truncate">${d.name}</span>
                      <span class="block text-[8px] text-gray-400 font-bold truncate">${d.path}</span>
                      <span class="block text-[8px] text-gray-300 font-bold mt-0.5">Widgets: ${d.config?.widgets?.length || 0}</span>
                  </div>
              </div>
              <div class="flex items-center gap-1">
                  <button onclick="event.stopPropagation(); deleteDashboard('${d._id}', '${d.name}');" 
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                      <i class="fas fa-trash-alt text-[10px]"></i>
                  </button>
                  <i class="fas fa-chevron-right text-[8px] text-gray-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all ml-2"></i>
              </div>
          </div>
      </div>
    `
   )
   .join('')
 }

 // Render Pagination Controls
 renderGenPagination(totalPages)
}

function renderGenPagination(totalPages) {
 const container = document.getElementById('generator-pagination')
 if (!container || totalPages <= 1) {
  container.innerHTML = ''
  return
 }

 container.innerHTML = `
    <button onclick="changeGenPage(${AppState.genCurrentPage - 1})" 
            ${AppState.genCurrentPage === 1 ? 'disabled' : ''} 
            class="px-3 py-1 text-[9px] font-black uppercase text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-all">
        Prev
    </button>
    <span class="text-[9px] font-black text-blue-600">
        ${AppState.genCurrentPage} / ${totalPages}
    </span>
    <button onclick="changeGenPage(${AppState.genCurrentPage + 1})" 
            ${AppState.genCurrentPage === totalPages ? 'disabled' : ''} 
            class="px-3 py-1 text-[9px] font-black uppercase text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-all">
        Next
    </button>`
}

function changeGenPage(page) {
 AppState.genCurrentPage = page
 loadGeneratorList()
}

function switchSettingsTab(tabName) {
 document.querySelectorAll('.settings-tab-content').forEach((el) => el.classList.add('hidden'))
 const btnGen = document.getElementById('tab-btn-general')
 const btnBdr = document.getElementById('tab-btn-generator')

 const inactive = 'text-gray-400 hover:text-gray-600 bg-transparent shadow-none'
 const active = 'bg-white shadow-sm text-blue-600'

 btnGen.className = `px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tabName === 'general' ? active : inactive}`
 btnBdr.className = `px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tabName === 'generator' ? active : inactive}`

 document.getElementById(`tab-content-${tabName}`).classList.remove('hidden')
}

async function openWidgetEditor(dashboardId, name) {
 const token = localStorage.getItem('auth_token')

 try {
  const response = await fetch(
   `${AppState.API_BASE_URL}api/collections/dashboard_settings/${dashboardId}`,
   {
    headers: { Authorization: `Bearer ${token}` },
   }
  )

  if (!response.ok) throw new Error('Gagal mengambil data dashboard')

  const dashboard = await response.json()

  // Set editing state
  AppState.currentEditingDashboardId = dashboardId
  AppState.tempBuilderWidgets = dashboard.config?.widgets || []

  // Update UI
  document.getElementById('generator-empty-state').classList.add('hidden')
  document.getElementById('generator-editor-panel').classList.remove('hidden')
  const editingNameEl = document.getElementById('editing-dashboard-name')
  editingNameEl.innerText = `Editing: ${name}`
  editingNameEl.dataset.dashboardId = dashboardId

  // Render builder widgets dengan data dari server
  renderBuilderWidgets()
 } catch (err) {
  console.error('Error loading dashboard:', err)
  showToast('Gagal memuat data dashboard', 'error')
 }
}

function renderBuilderWidgets() {
 const container = document.getElementById('builder-widgets-container')
 if (!container) return

 if (AppState.tempBuilderWidgets.length === 0) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12 sm:py-20 opacity-30 border-2 border-dashed border-gray-100 rounded-xl sm:rounded-[2rem]">
      <i class="fas fa-layer-group text-2xl sm:text-4xl mb-3 sm:mb-4"></i>
      <p class="text-[10px] font-black uppercase tracking-widest text-center">Belum ada widget disusun</p>
    </div>`
  return
 }

 container.innerHTML = AppState.tempBuilderWidgets
  .map(
   (w, idx) => `
        <div class="group bg-white p-4 sm:p-5 rounded-xl sm:rounded-[2rem] border border-gray-100 shadow-sm hover:border-blue-200 transition-all duration-300 mb-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        ${idx + 1}
                    </div>
                    <div class="flex-1 space-y-1 min-w-0">
                        <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Widget</label>
                        <input type="text" 
                               value="${w.label || ''}" 
                               oninput="updateWidgetData(${idx}, 'label', this.value)"
                               class="w-full bg-gray-50 border-none rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all truncate" 
                               placeholder="Contoh: Total Penjualan">
                    </div>
                </div>
                <button onclick="removeBuilderWidget(${idx})" 
                        class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all ml-auto sm:ml-2 mt-2 sm:mt-0">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div class="space-y-1">
                    <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipe Widget</label>
                    <select onchange="updateWidgetData(${idx}, 'type', this.value)" 
                            class="w-full bg-gray-50 border-none rounded-lg sm:rounded-xl px-3 py-2 sm:py-2.5 text-[10px] font-bold outline-none cursor-pointer">
                        <option value="stat" ${w.type === 'stat' ? 'selected' : ''}>Statistik</option>
                        <option value="chart" ${w.type === 'chart' ? 'selected' : ''}>Grafik</option>
                        <option value="table" ${w.type === 'table' ? 'selected' : ''}>Tabel</option>
                    </select>
                </div>

                <div class="space-y-1">
                    <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Lebar</label>
                    <select onchange="updateWidgetData(${idx}, 'width', this.value)" 
                            class="w-full bg-gray-50 border-none rounded-lg sm:rounded-xl px-3 py-2 sm:py-2.5 text-[10px] font-bold outline-none cursor-pointer">
                        <option value="quarter" ${w.width === 'quarter' ? 'selected' : ''}>25% (Quarter)</option>
                        <option value="half" ${w.width === 'half' ? 'selected' : ''}>50% (Half)</option>
                        <option value="full" ${w.width === 'full' ? 'selected' : ''}>100% (Full)</option>
                    </select>
                </div>

                ${
                 w.type === 'chart'
                  ? `
                    <div class="space-y-1">
                        <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Jenis Grafik</label>
                        <select onchange="updateWidgetData(${idx}, 'chart_type', this.value)" 
                                class="w-full bg-gray-50 border-none rounded-lg sm:rounded-xl px-3 py-2 sm:py-2.5 text-[10px] font-bold outline-none cursor-pointer">
                            <option value="line" ${w.chart_type === 'line' ? 'selected' : ''}>Line Chart</option>
                            <option value="bar" ${w.chart_type === 'bar' ? 'selected' : ''}>Bar Chart</option>
                            <option value="pie" ${w.chart_type === 'pie' ? 'selected' : ''}>Pie Chart</option>
                            <option value="doughnut" ${w.chart_type === 'doughnut' ? 'selected' : ''}>Doughnut Chart</option>
                        </select>
                    </div>
                `
                  : ''
                }

                ${
                 w.type === 'stat'
                  ? `
                    <div class="space-y-1 sm:col-span-2 lg:col-span-1">
                        <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Icon</label>
                        <div class="flex items-center gap-2">
                            <i class="fas ${w.icon || 'fa-chart-bar'} text-gray-400 text-sm"></i>
                            <input type="text" 
                                   value="${w.icon || 'fa-chart-bar'}" 
                                   oninput="updateWidgetData(${idx}, 'icon', this.value)"
                                   class="flex-1 bg-gray-50 border-none rounded-lg sm:rounded-xl px-3 py-2 sm:py-2.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" 
                                   placeholder="fa-chart-bar">
                        </div>
                    </div>
                `
                  : ''
                }
            </div>

            <!-- Data Source Configuration -->
            <div class="widget-data-source mt-4 p-3 sm:p-4 bg-gray-50/50 rounded-lg sm:rounded-xl border border-gray-100">
                <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                    <i class="fas fa-database mr-1"></i> Konfigurasi Data Source
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="space-y-1">
                        <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">API Endpoint</label>
                        <input type="text" 
                               value="${w.data_source?.endpoint || ''}"
                               oninput="updateWidgetData(${idx}, 'data_source.endpoint', this.value)"
                               class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[11px] outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" 
                               placeholder="/api/statistics/sales">
                    </div>
                    <div class="space-y-1">
                        <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">HTTP Method</label>
                        <select onchange="updateWidgetData(${idx}, 'data_source.method', this.value)"
                                class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[11px] outline-none cursor-pointer">
                            <option value="GET" ${w.data_source?.method === 'GET' ? 'selected' : ''}>GET</option>
                            <option value="POST" ${w.data_source?.method === 'POST' ? 'selected' : ''}>POST</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Field</label>
                        <input type="text" 
                               value="${w.data_source?.data_field || ''}"
                               oninput="updateWidgetData(${idx}, 'data_source.data_field', this.value)"
                               class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[11px] outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" 
                               placeholder="data.results atau total">
                    </div>
                    <div class="space-y-1">
                        <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Refresh (menit)</label>
                        <input type="number" 
                               value="${w.data_source?.refresh_interval ? w.data_source.refresh_interval / 60000 : ''}"
                               oninput="updateWidgetData(${idx}, 'data_source.refresh_interval', this.value * 60000)"
                               class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[11px] outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" 
                               placeholder="5 (untuk 5 menit)" min="0">
                    </div>
                    <div class="sm:col-span-2 space-y-1">
                        <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Parameter (JSON)</label>
                        <textarea 
                            oninput="updateWidgetData(${idx}, 'data_source.params', this.value)"
                            class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[11px] outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
                            rows="2"
                            placeholder='{"year": 2024, "type": "monthly"}'>${w.data_source?.params ? JSON.stringify(w.data_source.params, null, 2) : ''}</textarea>
                    </div>
                </div>
            </div>
        </div>
    `
  )
  .join('')
}

function addWidgetToBuilder() {
 const newWidget = {
  id: Date.now(),
  label: 'Widget Baru',
  type: 'stat',
  width: 'half',
  icon: 'fas fa-chart-bar',
  data_source: {
   endpoint: '',
   method: 'GET',
   params: {},
   data_field: '',
   refresh_interval: 0,
  },
 }

 if (newWidget.type === 'chart') {
  newWidget.chart_type = 'line'
 }

 AppState.tempBuilderWidgets.push(newWidget)
 renderBuilderWidgets()
}

function updateWidgetData(index, fieldPath, value) {
 if (!AppState.tempBuilderWidgets[index]) return

 try {
  const fields = fieldPath.split('.')
  let obj = AppState.tempBuilderWidgets[index]

  for (let i = 0; i < fields.length - 1; i++) {
   if (!obj[fields[i]]) {
    obj[fields[i]] = {}
   }
   obj = obj[fields[i]]
  }

  if (fieldPath === 'data_source.params' && value.trim() !== '') {
   try {
    obj[fields[fields.length - 1]] = JSON.parse(value)
   } catch (e) {
    obj[fields[fields.length - 1]] = value
   }
  } else {
   obj[fields[fields.length - 1]] = value
  }
 } catch (err) {
  console.error('Error updating widget data:', err)
 }
}

function removeBuilderWidget(index) {
 if (confirm('Hapus widget ini?')) {
  AppState.tempBuilderWidgets.splice(index, 1)
  renderBuilderWidgets()
 }
}

async function saveDashboardBuilder() {
 if (AppState.tempBuilderWidgets.length === 0) {
  return Swal.fire('Gagal', 'Minimal harus ada 1 widget.', 'warning')
 }

 const invalidWidgets = AppState.tempBuilderWidgets.filter(
  (w) => !w.data_source?.endpoint || w.data_source.endpoint.trim() === ''
 )

 if (invalidWidgets.length > 0) {
  return Swal.fire({
   icon: 'warning',
   title: 'Konfigurasi Belum Lengkap',
   html: `${invalidWidgets.length} widget belum memiliki API endpoint.<br>Silakan lengkapi konfigurasi data source.`,
  })
 }

 const dashboardName = document
  .getElementById('editing-dashboard-name')
  .innerText.replace('Editing: ', '')
 const token = localStorage.getItem('auth_token')
 const saveBtn = event.currentTarget
 const originalText = saveBtn.innerHTML

 saveBtn.disabled = true
 saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Menyimpan...`

 try {
  const path = dashboardName
   .toLowerCase()
   .replace(/ /g, '-')
   .replace(/[^\w-]/g, '')

  const dashboardData = {
   name: dashboardName,
   path: path,
   type: 'dashboard',
   icon: 'fas fa-chart-line',
   config: {
    dashboard_id: path.toUpperCase().replace(/-/g, '_'),
    widgets: AppState.tempBuilderWidgets,
   },
  }

  let response

  if (AppState.currentEditingDashboardId) {
   response = await fetch(
    `${AppState.API_BASE_URL}api/collections/dashboard_settings/${AppState.currentEditingDashboardId}`,
    {
     method: 'PUT',
     headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
     },
     body: JSON.stringify(dashboardData),
    }
   )
  } else {
   response = await fetch(`${AppState.API_BASE_URL}api/collections/dashboard_settings`, {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(dashboardData),
   })
  }

  if (response.ok) {
   const result = await response.json()
   showToast(`Dashboard "${dashboardName}" berhasil disimpan!`, 'success')

   await fetchDashboardsFromDB()

   if (!AppState.currentEditingDashboardId && result._id) {
    AppState.currentEditingDashboardId = result._id
    document.getElementById('editing-dashboard-name').setAttribute('data-dashboard-id', result._id)
   }
  } else {
   const error = await response.json().catch(() => ({ message: 'Unknown error' }))
   throw new Error(error.message || 'Server Error')
  }
 } catch (err) {
  console.error('Save Error:', err)
  showToast('Gagal menyimpan: ' + (err.message || 'Koneksi terputus'), 'error')
 } finally {
  saveBtn.disabled = false
  saveBtn.innerHTML = originalText
 }
}

function openAddDashboardModal() {
 Swal.fire({
  title: 'Buat Dashboard Baru',
  input: 'text',
  inputLabel: 'Nama Dashboard',
  inputPlaceholder: 'Masukkan nama dashboard',
  showCancelButton: true,
  confirmButtonText: 'Buat',
  cancelButtonText: 'Batal',
  inputValidator: (value) => {
   if (!value) {
    return 'Nama dashboard harus diisi!'
   }
  },
 }).then((result) => {
  if (result.isConfirmed) {
   const name = result.value
   const path = name
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]/g, '')

   createNewDashboard(name, path)
  }
 })
}

async function createNewDashboard(name, path) {
 const token = localStorage.getItem('auth_token')

 try {
  const response = await fetch(`${AppState.API_BASE_URL}api/collections/dashboard_settings`, {
   method: 'POST',
   headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
   },
   body: JSON.stringify({
    name: name,
    path: path,
    type: 'dashboard',
    icon: 'fas fa-chart-line',
    config: {
     dashboard_id: path.toUpperCase().replace(/-/g, '_'),
     widgets: [],
    },
   }),
  })

  if (response.ok) {
   const newDashboard = await response.json()
   showToast(`Dashboard "${name}" berhasil dibuat!`, 'success')

   await fetchDashboardsFromDB()

   setTimeout(() => {
    openWidgetEditor(newDashboard._id, newDashboard.name)
   }, 500)
  } else {
   const error = await response.json()
   showToast('Gagal membuat dashboard: ' + (error.message || 'Unknown error'), 'error')
  }
 } catch (err) {
  console.error(err)
  showToast('Koneksi Error', 'error')
 }
}

async function deleteDashboard(dashboardId, dashboardName) {
 const result = await Swal.fire({
  title: 'HAPUS DASHBOARD?',
  text: `Dashboard "${dashboardName}" akan dihapus permanen.`,
  icon: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#dc2626',
  cancelButtonColor: '#f3f4f6',
  confirmButtonText: 'YA, HAPUS!',
  cancelButtonText: 'BATAL',
  reverseButtons: true,
  showLoaderOnConfirm: true,
  preConfirm: async () => {
   try {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(
     `${AppState.API_BASE_URL}api/collections/dashboard_settings/${dashboardId}`,
     {
      method: 'DELETE',
      headers: {
       Authorization: `Bearer ${token}`,
      },
     }
    )

    if (!response.ok) {
     throw new Error('Gagal menghapus dashboard')
    }

    return response
   } catch (error) {
    Swal.showValidationMessage(`Gagal: ${error.message}`)
   }
  },
 })

 if (result.isConfirmed) {
  showToast(`Dashboard "${dashboardName}" berhasil dihapus!`, 'success')

  // Refresh dashboard list
  await fetchDashboardsFromDB()

  // Jika dashboard yang dihapus sedang diedit, tutup editor
  if (AppState.currentEditingDashboardId === dashboardId) {
   document.getElementById('generator-empty-state').classList.remove('hidden')
   document.getElementById('generator-editor-panel').classList.add('hidden')
   AppState.currentEditingDashboardId = null
   AppState.tempBuilderWidgets = []
  }
 }
}

function saveSettings() {
 showToast('Pengaturan Toko Berhasil Disimpan', 'success')
}

// =================================================================
// 8. MODAL & PAGINATION UTILITIES
// =================================================================
function openCrudModal(existingData = null) {
 const modal = document.getElementById('crud-modal')
 const container = document.getElementById('modal-container')
 const form = document.getElementById('dynamic-form')

 delete form.dataset.editingId
 form.reset()

 if (existingData) {
  form.dataset.editingId = existingData._id
 }

 const fields = AppState.currentModule.config.fields || []
 document.getElementById('modal-title').innerText = existingData
  ? `Edit ${AppState.currentModule.name}`
  : `Tambah ${AppState.currentModule.name}`

 form.innerHTML = fields
  .map((field) => {
   const val = existingData ? existingData[field.name] : field.default || ''
   return `
            <div class="space-y-1.5">
                <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                    ${field.label}
                </label>
                <input type="${field.type}" 
                       name="${field.name}" 
                       value="${val}" 
                       placeholder="Masukkan ${field.label}..." 
                       class="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 transition-all" 
                       ${field.required ? 'required' : ''}>
            </div>`
  })
  .join('')

 modal.classList.remove('hidden')

 setTimeout(() => {
  modal.classList.replace('opacity-0', 'opacity-100')
  container.classList.replace('scale-95', 'scale-100')
 }, 10)
}

function closeModal() {
 const modal = document.getElementById('crud-modal')
 const container = document.getElementById('modal-container')

 modal.classList.replace('opacity-100', 'opacity-0')
 container.classList.replace('scale-100', 'scale-95')

 setTimeout(() => modal.classList.add('hidden'), 300)
}

function showToast(message, type = 'success') {
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
        <div class="text-xs text-gray-500 font-medium mb-2 sm:mb-0">
            Halaman ${AppState.currentPage} dari ${totalPages}
        </div>
        <div class="flex gap-2">
            <button onclick="changePage(${AppState.currentPage - 1})" 
                    ${AppState.currentPage === 1 ? 'disabled' : ''} 
                    class="px-3 py-1.5 border rounded text-xs hover:bg-gray-50 disabled:opacity-50 flex items-center">
                <i class="fas fa-chevron-left mr-1 text-xs"></i> Prev
            </button>
            <button onclick="changePage(${AppState.currentPage + 1})" 
                    ${AppState.currentPage === totalPages ? 'disabled' : ''} 
                    class="px-3 py-1.5 border rounded text-xs hover:bg-gray-50 disabled:opacity-50 flex items-center">
                Next <i class="fas fa-chevron-right ml-1 text-xs"></i>
            </button>
        </div>`
}

// =================================================================
// 9. GLOBAL UTILITIES & HELPERS
// =================================================================
function logout() {
 localStorage.clear()
 window.location.href = '/login'
}

function toggleSidebar() {
 const sidebar = document.getElementById('sidebar')
 const overlay = document.getElementById('overlay')

 if (window.innerWidth < 1024) {
  sidebar.classList.toggle('-translate-x-full')
  overlay.classList.toggle('hidden')
  // Lock body scroll when sidebar is open on mobile
  document.body.style.overflow = sidebar.classList.contains('-translate-x-full') ? '' : 'hidden'
 }
}

function changePage(p) {
 AppState.currentPage = p
 fetchTableData()
}

let searchTimer

function doSearch(val) {
 clearTimeout(searchTimer)
 searchTimer = setTimeout(() => {
  AppState.searchQuery = val
  AppState.currentPage = 1
  fetchTableData()
 }, 500)
}

function toggleDashboardList(show) {
 const overlay = document.getElementById('dashboard-list-overlay')
 if (overlay) {
  if (show) {
   overlay.classList.remove('hidden')
  } else {
   setTimeout(() => overlay.classList.add('hidden'), 200)
  }
 }
}

function filterDashboardList(query) {
 const lowerQuery = query.toLowerCase()
 const items = document.querySelectorAll('.dashboard-opt')
 let hasResult = false

 items.forEach((item) => {
  const name = item.getAttribute('data-name')
  if (name.includes(lowerQuery)) {
   item.style.display = 'block'
   hasResult = true
  } else {
   item.style.display = 'none'
  }
 })

 const overlay = document.getElementById('dashboard-list-overlay')
 if (!hasResult) {
  if (!document.getElementById('no-result-msg')) {
   overlay.insertAdjacentHTML(
    'beforeend',
    '<div id="no-result-msg" class="p-4 text-center text-[10px] font-bold text-gray-400 uppercase">Dashboard tidak ditemukan</div>'
   )
  }
 } else {
  const msg = document.getElementById('no-result-msg')
  if (msg) msg.remove()
 }
}

function getAllDashboards(menus) {
 let list = []

 menus.forEach((m) => {
  if (m.type === 'dashboard') {
   list.push({ name: m.name, path: m.path })
  }

  if (m.daftar_sub_sidemenu) {
   m.daftar_sub_sidemenu.forEach((sub) => {
    if (sub.type === 'dashboard') {
     list.push({ name: sub.name, path: sub.path })
    }
   })
  }
 })

 return list
}

// =================================================================
// START APPLICATION
// =================================================================
// Setup form handler
setupFormHandler()

// Initialize app
initApp()

// Make functions available globally (seperti kode asli Anda)
window.navigate = navigate
window.fetchTableData = fetchTableData
window.editData = editData
window.deleteData = deleteData
window.openCrudModal = openCrudModal
window.closeModal = closeModal
window.showToast = showToast
window.logout = logout
window.toggleSidebar = toggleSidebar
window.changePage = changePage
window.doSearch = doSearch
window.toggleDashboardList = toggleDashboardList
window.filterDashboardList = filterDashboardList
window.switchSettingsTab = switchSettingsTab
window.openWidgetEditor = openWidgetEditor
window.renderBuilderWidgets = renderBuilderWidgets
window.addWidgetToBuilder = addWidgetToBuilder
window.updateWidgetData = updateWidgetData
window.removeBuilderWidget = removeBuilderWidget
window.saveDashboardBuilder = saveDashboardBuilder
window.saveSettings = saveSettings
window.openAddDashboardModal = openAddDashboardModal
window.createNewDashboard = createNewDashboard
window.doGenSearch = doGenSearch
window.changeGenPage = changeGenPage
window.fetchDashboardsFromDB = fetchDashboardsFromDB
window.loadGeneratorList = loadGeneratorList
window.deleteDashboard = deleteDashboard
window.deleteCurrentDashboard = deleteCurrentDashboard
