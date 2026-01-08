import { apiFetch } from '../core/api.js'
import { AppState } from '../core/state.js'
import { showToast, showConfirmDialog } from '../utils/helpers.js'

// ============================================
// 1. WIDGET REGISTRY
// ============================================
const WidgetRegistry = {
 categories: {
  metrics: {
   name: 'Key Metrics',
   icon: 'fa-bullseye',
   color: 'text-emerald-600',
   bg: 'bg-emerald-50',
  },
  charts: {
   name: 'Analytics Charts',
   icon: 'fa-chart-pie',
   color: 'text-blue-600',
   bg: 'bg-blue-50',
  },
  tables: { name: 'Data Tables', icon: 'fa-table', color: 'text-purple-600', bg: 'bg-purple-50' },
  monitoring: {
   name: 'System Monitor',
   icon: 'fa-server',
   color: 'text-orange-600',
   bg: 'bg-orange-50',
  },
 },
 widgets: {
  kpi_card: {
   name: 'KPI Card',
   icon: 'fa-calculator',
   category: 'metrics',
   desc: 'Single numeric metric',
   defaultConfig: {
    type: 'stat',
    subtype: 'card',
    width: 'quarter',
    title: 'Revenue',
    collection: 'transactions',
    icon: 'fa-dollar-sign',
    data_config: [{ $group: { _id: null, total: { $sum: '$amount' } } }],
   },
  },
  line_chart: {
   name: 'Line Chart',
   icon: 'fa-chart-line',
   category: 'charts',
   desc: 'Time-series trend',
   defaultConfig: {
    type: 'chart',
    subtype: 'line',
    width: 'half',
    title: 'Trend',
    collection: 'logs',
    icon: 'fa-chart-line',
    data_config: [],
   },
  },
  bar_chart: {
   name: 'Bar Chart',
   icon: 'fa-chart-bar',
   category: 'charts',
   desc: 'Categorical comparison',
   defaultConfig: {
    type: 'chart',
    subtype: 'bar',
    width: 'half',
    title: 'Status',
    collection: 'items',
    icon: 'fa-chart-bar',
    data_config: [],
   },
  },
  data_table: {
   name: 'Data Table',
   icon: 'fa-list-alt',
   category: 'tables',
   desc: 'Detailed data list',
   defaultConfig: {
    type: 'table',
    subtype: 'grid',
    width: 'full',
    title: 'List',
    collection: 'users',
    icon: 'fa-table',
    data_config: [],
   },
  },
  server_status: {
   name: 'Server Status',
   icon: 'fa-heartbeat',
   category: 'monitoring',
   desc: 'Realtime uptime',
   defaultConfig: {
    type: 'status',
    subtype: 'health',
    width: 'quarter',
    title: 'Health',
    collection: 'system',
    icon: 'fa-server',
    data_config: { check: 'ping' },
   },
  },
 },
}

// ============================================
// STATE MANAGEMENT LOKAL
// ============================================
let activeMobileTab = 'editor'
let dashboardListState = {
 page: 1,
 limit: 7, // Jumlah item per halaman
 search: '',
 totalPages: 1,
}

// ============================================
// 2. RENDERER UTAMA
// ============================================
export async function renderSettingsView(config, container) {
 container.className =
  'w-full h-[calc(100vh-64px)] bg-gray-50 flex flex-col overflow-hidden relative'
 container.innerHTML = `<div class="p-20 text-center text-gray-400 italic text-xs uppercase animate-pulse">Loading Workspace...</div>`

 try {
  const response = await apiFetch('api/settings')
  const settings = response ? await response.json() : {}

  container.innerHTML = `
    <div id="settings-header" class="shrink-0 bg-white border-b border-gray-200 z-30 h-14 flex items-center justify-between px-4 lg:px-6 shadow-sm">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white shadow-md">
                <i class="fas fa-cogs"></i>
            </div>
            <h1 class="text-sm lg:text-base font-black text-gray-800 tracking-tight uppercase">System Config</h1>
        </div>
        
        <div class="flex p-1 bg-gray-100 rounded-lg border border-gray-200">
            <button onclick="switchSettingsTab('general')" id="tab-btn-general" 
                    class="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all rounded-md text-gray-500 hover:text-gray-800">
                General
            </button>
            <button onclick="switchSettingsTab('generator')" id="tab-btn-generator" 
                    class="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all rounded-md bg-white shadow-sm text-blue-600 border border-gray-200">
                Dashboard
            </button>
        </div>
    </div>

    <div class="flex-1 min-h-0 relative w-full bg-gray-50/50">
        <div id="tab-content-general" class="hidden h-full w-full overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32">
            ${renderGeneralForm(settings)}
        </div>

        <div id="tab-content-generator" class="h-full w-full flex flex-col">
            ${renderGeneratorLayout()}
        </div>
    </div>`

  await fetchDashboardsFromDB()
  renderWidgetLibrary()

  // Mobile View Init
  updateMobileViewVisibility()
  window.removeEventListener('resize', updateMobileViewVisibility)
  window.addEventListener('resize', updateMobileViewVisibility)
 } catch (err) {
  console.error(err)
  container.innerHTML = `<div class="flex items-center justify-center h-full text-red-500 font-bold text-sm">Gagal memuat modul.</div>`
 }
}

// ============================================
// 3. GENERATOR LAYOUT (FIXED PAGINATION LAYOUT)
// ============================================
function renderGeneratorLayout() {
 return `
    <div class="flex flex-col lg:flex-row h-full w-full bg-white relative overflow-hidden">
        
        <div id="panel-files" class="w-full lg:w-72 flex-col border-r border-gray-200 bg-white h-full hidden lg:flex z-30 shrink-0 relative">
            <div class="h-12 px-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/30">
                <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Saved Dashboards</span>
                <button onclick="openAddDashboardModal()" class="w-6 h-6 flex items-center justify-center rounded hover:bg-blue-50 text-blue-600 transition-colors text-xs" title="Buat Baru">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            
            <div class="p-2 border-b border-gray-100 bg-white">
                <div class="relative">
                    <input type="text" placeholder="Cari..." oninput="updateDashboardSearch(this.value)"
                           class="w-full pl-7 pr-2 py-1.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-300 rounded text-[11px] font-medium outline-none transition-all placeholder-gray-400">
                    <i class="fas fa-search absolute left-2.5 top-2 text-gray-400 text-[10px]"></i>
                </div>
            </div>

            <div id="saved-dashboards-list" class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 min-h-0 bg-white">
                </div>

            <div id="dashboard-pagination" class="shrink-0 h-12 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm flex items-center justify-between px-3 lg:mb-0 mb-20">
                </div>
        </div>

        <div id="panel-editor" class="w-full flex-1 flex-col bg-gray-100/50 h-full hidden lg:flex relative z-10 min-w-0">
            <div class="h-12 bg-white border-b border-gray-200 flex justify-between items-center px-4 shadow-[0_2px_4px_rgba(0,0,0,0.02)] z-30 shrink-0">
                <div class="flex items-center gap-3 min-w-0">
                    <h2 id="editing-dashboard-name" class="text-xs font-black text-gray-800 uppercase tracking-wide truncate max-w-[200px]">Select Dashboard</h2>
                    <div class="h-4 w-px bg-gray-300"></div>
                    <span class="text-[9px] text-gray-400 font-medium flex items-center gap-1">
                        <i class="fas fa-circle text-[6px] text-green-500"></i> Auto-save
                    </span>
                </div>
                <div class="flex gap-2">
                    <button onclick="previewConfig()" class="h-7 px-3 bg-white border border-gray-200 text-gray-600 rounded text-[10px] font-bold uppercase hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <i class="fas fa-code mr-1"></i> JSON
                    </button>
                    <button onclick="saveDashboardBuilder()" class="h-7 px-4 bg-gray-900 text-white rounded text-[10px] font-bold uppercase hover:bg-black shadow-md flex items-center gap-2 transition-transform active:scale-95">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 relative" 
                 style="background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 20px 20px; background-color: #f8fafc;">
                
                <div id="generator-empty-state" class="absolute inset-0 flex flex-col items-center justify-center opacity-100 transition-opacity pointer-events-none p-6 text-center">
                    <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm border border-gray-200">
                        <i class="fas fa-layer-group text-2xl text-gray-300"></i>
                    </div>
                    <h3 class="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Workspace Ready</h3>
                    <p class="text-[10px] text-gray-400">Pilih dashboard dari kiri, tarik widget dari kanan.</p>
                </div>

                <div id="builder-widgets-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start auto-rows-min relative z-10 pb-32 lg:pb-10"></div>
            </div>
        </div>

        <div id="panel-tools" class="w-full lg:w-72 flex-col border-l border-gray-200 bg-white h-full hidden lg:flex z-20 shrink-0">
            <div class="h-10 px-3 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/30">
                <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Component Library</span>
            </div>
            <div class="p-3 border-b border-gray-100">
                <div class="relative">
                    <input type="text" placeholder="Find components..." oninput="filterWidgetLibraryOnly(this.value)"
                           class="w-full pl-7 pr-2 py-1.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-300 rounded text-[11px] font-medium outline-none transition-all placeholder-gray-400">
                    <i class="fas fa-shapes absolute left-2.5 top-2 text-gray-400 text-[10px]"></i>
                </div>
            </div>
            <div id="widget-library-list" class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4 pb-24 lg:pb-3"></div>
        </div>

        <div class="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200/50" 
             style="padding-bottom: calc(0.375rem + env(safe-area-inset-bottom)); bottom: calc(1.5rem + env(safe-area-inset-bottom));">
            
            <button onclick="switchMobileTab('files')" id="mob-btn-files" class="w-12 h-10 rounded-full flex flex-col items-center justify-center transition-all">
                <i class="fas fa-folder text-xs mb-0.5"></i>
                <span class="text-[8px] font-bold uppercase">Files</span>
            </button>
            
            <button onclick="switchMobileTab('editor')" id="mob-btn-editor" class="w-14 h-12 bg-gray-900 rounded-full text-white shadow-lg flex flex-col items-center justify-center transition-all -mt-4 border-4 border-white relative z-10">
                <i class="fas fa-pen-nib text-sm"></i>
            </button>
            
            <button onclick="switchMobileTab('tools')" id="mob-btn-tools" class="w-12 h-10 rounded-full flex flex-col items-center justify-center transition-all">
                <i class="fas fa-th-large text-xs mb-0.5"></i>
                <span class="text-[8px] font-bold uppercase">Tools</span>
            </button>
        </div>

    </div>

    <div id="widget-config-modal" class="fixed inset-0 z-[100] hidden">
        <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onclick="closeWidgetConfigModal()"></div>
        <div id="config-panel" class="absolute inset-x-0 bottom-0 top-12 lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[420px] bg-white shadow-2xl lg:shadow-[-10px_0_40px_rgba(0,0,0,0.1)] rounded-t-2xl lg:rounded-none transform transition-transform duration-300 ease-out translate-y-full lg:translate-y-0 lg:translate-x-full flex flex-col border-l border-gray-100">
            
            <div class="h-12 border-b border-gray-100 flex justify-between items-center px-5 bg-white shrink-0 rounded-t-2xl lg:rounded-none">
                <div class="flex items-center gap-2">
                    <i class="fas fa-sliders-h text-blue-500 text-xs"></i>
                    <h3 class="font-bold text-gray-800 text-xs uppercase tracking-widest">Properties</h3>
                </div>
                <button onclick="closeWidgetConfigModal()" class="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><i class="fas fa-times text-xs"></i></button>
            </div>
            
            <div id="widget-config-form" class="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-gray-50/30"></div>
            
            <div class="p-5 border-t border-gray-100 bg-white pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:pb-5">
                <button onclick="applyWidgetChanges()" class="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-lg font-bold uppercase text-[10px] tracking-widest shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                    <i class="fas fa-check-circle"></i> Apply Changes
                </button>
            </div>
        </div>
    </div>
 `
}

// ============================================
// LOGIC: SEARCH & PAGINATION (DASHBOARDS)
// ============================================

// Fungsi Pencarian (Triggered by Input)
window.updateDashboardSearch = (val) => {
 dashboardListState.search = val.toLowerCase()
 dashboardListState.page = 1 // Reset ke halaman 1 saat mencari
 renderSavedDashboardsList()
}

// Fungsi Ganti Halaman
window.changeDashboardPage = (newPage) => {
 if (newPage < 1 || newPage > dashboardListState.totalPages) return
 dashboardListState.page = newPage
 renderSavedDashboardsList()
}

export async function deleteDashboardConfig(id, name) {
 // 1. Konfirmasi Profesional (Danger Mode)
 const isConfirmed = await showConfirmDialog({
  title: 'Hapus Dashboard?',
  text: `Anda akan menghapus dashboard "${name}". Data konfigurasi widget di dalamnya akan hilang permanen.`,
  icon: 'warning',
  confirmText: 'Ya, Hapus Permanen',
  cancelText: 'Batal',
  dangerMode: true, // Tombol jadi merah
 })

 if (!isConfirmed) return

 // 2. Tampilkan Loading State
 Swal.fire({
  title: 'Menghapus...',
  html: 'Sedang membersihkan data.',
  allowOutsideClick: false,
  didOpen: () => {
   Swal.showLoading()
  },
 })

 try {
  const response = await apiFetch(`api/collections/dashboard_settings/${id}`, {
   method: 'DELETE',
  })

  if (response && response.ok) {
   // 3. Reset Editor (Jika dashboard yang sedang dibuka = yang dihapus)
   if (AppState.currentEditingDashboardId === id) {
    AppState.currentEditingDashboardId = null
    AppState.tempBuilderWidgets = []

    // Kembalikan UI ke Empty State
    document.getElementById('editing-dashboard-name').innerText = 'Select Dashboard'
    const emptyState = document.getElementById('generator-empty-state')
    if (emptyState) emptyState.style.opacity = '1'

    renderBuilderWidgets()
   }

   // 4. Refresh List & Beri Feedback
   await fetchDashboardsFromDB()

   Swal.fire({
    icon: 'success',
    title: 'Terhapus!',
    text: 'Dashboard berhasil dihapus.',
    timer: 1500,
    showConfirmButton: false,
    backdrop: `rgba(0,0,0,0.4)`,
   })
  } else {
   throw new Error('Gagal menghapus')
  }
 } catch (e) {
  Swal.fire({
   icon: 'error',
   title: 'Gagal',
   text: 'Terjadi kesalahan saat menghapus dashboard.',
   confirmButtonColor: '#2563eb',
  })
 }
}

function renderSavedDashboardsList() {
 const container = document.getElementById('saved-dashboards-list')
 const paginationContainer = document.getElementById('dashboard-pagination')

 if (!container || !AppState.dbDashboards.data) return

 // ... (Logika filtering & pagination tetap sama, langsung ke bagian render HTML) ...
 // Note: Pastikan logika pagination calculation tetap ada di sini (lihat kode sebelumnya)

 // Render Items
 const filtered = AppState.dbDashboards.data.filter((d) =>
  d.name.toLowerCase().includes(dashboardListState.search)
 )
 const startIndex = (dashboardListState.page - 1) * dashboardListState.limit
 const paginatedItems = filtered.slice(startIndex, startIndex + dashboardListState.limit)

 if (paginatedItems.length === 0) {
  container.innerHTML = `<div class="p-8 text-center text-[10px] text-gray-400 font-bold uppercase">Data Kosong</div>`
 } else {
  container.innerHTML = paginatedItems
   .map(
    (d) => `
            <div onclick="openWidgetEditor('${d._id}', '${d.name}'); switchMobileTab('editor');" 
                 class="group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all border border-transparent hover:bg-gray-50 ${AppState.currentEditingDashboardId === d._id ? 'bg-blue-50 border-blue-200' : ''}">
                
                <div class="flex items-center gap-3 overflow-hidden flex-1">
                    <i class="fas fa-chart-pie text-[10px] ${AppState.currentEditingDashboardId === d._id ? 'text-blue-500' : 'text-gray-300'}"></i>
                    <span class="text-[11px] font-bold text-gray-700 truncate uppercase w-full">${d.name}</span>
                </div>

                <button onclick="event.stopPropagation(); deleteDashboardConfig('${d._id}', '${d.name}')" 
                        class="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100" title="Hapus">
                    <i class="fas fa-trash-alt text-[10px]"></i>
                </button>
            </div>
        `
   )
   .join('')
 }

 // Render Pagination Controls
 if (paginationContainer) {
  paginationContainer.innerHTML = `
            <button onclick="changeDashboardPage(${dashboardListState.page - 1})" 
                    class="w-6 h-6 rounded hover:bg-white hover:shadow-sm text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    ${dashboardListState.page === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left text-[10px]"></i>
            </button>
            <span class="text-[9px] font-bold text-gray-500 uppercase">Page ${dashboardListState.page} / ${dashboardListState.totalPages}</span>
            <button onclick="changeDashboardPage(${dashboardListState.page + 1})" 
                    class="w-6 h-6 rounded hover:bg-white hover:shadow-sm text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    ${dashboardListState.page >= dashboardListState.totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right text-[10px]"></i>
            </button>
        `
 }
}

// ============================================
// RENDERERS LAINNYA & UTILS
// ============================================

window.switchMobileTab = (tab) => {
 activeMobileTab = tab
 updateMobileViewVisibility()
}

function updateMobileViewVisibility() {
 const isDesktop = window.innerWidth >= 1024
 const files = document.getElementById('panel-files')
 const editor = document.getElementById('panel-editor')
 const tools = document.getElementById('panel-tools')

 if (!files || !editor || !tools) return

 if (isDesktop) {
  // Desktop: Tampilkan semua
  files.className =
   'w-full lg:w-72 flex-col border-r border-gray-200 bg-white h-full hidden lg:flex z-20 shrink-0'
  editor.className =
   'w-full flex-1 flex-col bg-gray-100/50 h-full hidden lg:flex relative z-10 min-w-0'
  tools.className =
   'w-full lg:w-72 flex-col border-l border-gray-200 bg-white h-full hidden lg:flex z-20 shrink-0'
 } else {
  // Mobile: Tampilkan satu per satu full screen absolute
  const baseClass = 'w-full flex-col h-full absolute inset-0 bg-white z-20'

  files.className = 'hidden'
  editor.className = 'hidden'
  tools.className = 'hidden'

  if (activeMobileTab === 'files') files.className = baseClass + ' flex'
  if (activeMobileTab === 'editor')
   editor.className = 'w-full flex-col h-full absolute inset-0 bg-gray-50 z-10 flex'
  if (activeMobileTab === 'tools') tools.className = baseClass + ' flex'
 }

 const btnFiles = document.getElementById('mob-btn-files')
 const btnTools = document.getElementById('mob-btn-tools')
 const btnEditor = document.getElementById('mob-btn-editor')

 if (btnFiles) {
  const activeClass = 'text-blue-600 scale-110'
  const inactiveClass = 'text-gray-400 hover:text-gray-600'

  btnFiles.className = `w-12 h-10 rounded-full flex flex-col items-center justify-center transition-all duration-200 ${activeMobileTab === 'files' ? activeClass : inactiveClass}`
  btnTools.className = `w-12 h-10 rounded-full flex flex-col items-center justify-center transition-all duration-200 ${activeMobileTab === 'tools' ? activeClass : inactiveClass}`

  if (activeMobileTab === 'editor') btnEditor.classList.add('ring-4', 'ring-blue-100')
  else btnEditor.classList.remove('ring-4', 'ring-blue-100')
 }
}

export function renderWidgetLibrary() {
 const list = document.getElementById('widget-library-list')
 if (!list) return
 const grouped = {}
 Object.entries(WidgetRegistry.widgets).forEach(([key, w]) => {
  if (!grouped[w.category]) grouped[w.category] = []
  grouped[w.category].push({ key, ...w })
 })
 list.innerHTML = Object.entries(WidgetRegistry.categories)
  .map(([catKey, cat]) => {
   const widgets = grouped[catKey] || []
   if (widgets.length === 0) return ''
   return `
            <div class="mb-4 widget-group">
                <div class="flex items-center gap-2 mb-2 px-1">
                    <span class="w-1.5 h-1.5 rounded-full ${cat.bg.replace('bg-', 'bg-').replace('50', '500')}"></span>
                    <h4 class="text-[9px] font-black text-gray-400 uppercase tracking-widest">${cat.name}</h4>
                </div>
                <div class="space-y-2">
                    ${widgets
                     .map(
                      (w) => `
                        <div onclick="addWidgetToBuilder('${w.key}'); switchMobileTab('editor');" 
                             class="widget-item flex items-center gap-3 p-2 bg-white border border-gray-100 hover:border-blue-400 hover:shadow-sm rounded-lg cursor-pointer transition-all group active:scale-95">
                            <div class="w-8 h-8 shrink-0 rounded-md ${cat.bg} ${cat.color} flex items-center justify-center text-xs shadow-sm">
                                <i class="fas ${w.icon}"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h5 class="text-[10px] font-bold text-gray-700 group-hover:text-blue-700 truncate">${w.name}</h5>
                                <p class="text-[8px] text-gray-400 truncate leading-tight">${w.desc}</p>
                            </div>
                            <div class="w-5 h-5 rounded hover:bg-blue-50 text-gray-300 group-hover:text-blue-500 flex items-center justify-center transition-colors"><i class="fas fa-plus text-[9px]"></i></div>
                        </div>
                    `
                     )
                     .join('')}
                </div>
            </div>`
  })
  .join('')
}

export function renderBuilderWidgets() {
 const container = document.getElementById('builder-widgets-container')
 const emptyState = document.getElementById('generator-empty-state')
 if (!container) return
 if (AppState.tempBuilderWidgets.length === 0) {
  if (emptyState) emptyState.style.opacity = '1'
  container.innerHTML = ''
  return
 }
 if (emptyState) emptyState.style.opacity = '0'
 container.innerHTML = AppState.tempBuilderWidgets
  .map((w, idx) => {
   const colSpan = getColSpanClass(w.width)
   const totalWidgets = AppState.tempBuilderWidgets.length
   let accent = 'border-gray-200'
   let iconColor = 'text-gray-400'
   if (w.type === 'stat') {
    accent = 'border-l-4 border-l-emerald-400 border-y border-r border-gray-200'
    iconColor = 'text-emerald-500'
   } else if (w.type === 'chart') {
    accent = 'border-l-4 border-l-blue-400 border-y border-r border-gray-200'
    iconColor = 'text-blue-500'
   } else {
    accent = 'border-l-4 border-l-purple-400 border-y border-r border-gray-200'
    iconColor = 'text-purple-500'
   }
   return `
            <div class="${colSpan} bg-white rounded-lg ${accent} shadow-sm transition-all duration-300 group relative flex flex-col overflow-hidden hover:shadow-md animate-in fade-in zoom-in-95">
                <div class="p-3 flex-1">
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-2 overflow-hidden">
                            <i class="fas ${w.icon || 'fa-cube'} ${iconColor} text-[10px]"></i>
                            <div class="min-w-0">
                                <h3 class="text-[10px] font-bold text-gray-700 uppercase tracking-tight truncate w-full" title="${w.title}">${w.title || 'Untitled'}</h3>
                                <p class="text-[8px] text-gray-400 font-mono flex gap-1 mt-0.5">
                                    <span class="bg-gray-50 px-1 rounded">${w.type}</span>
                                    <span class="bg-gray-50 px-1 rounded">${w.subtype}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="text-[9px] text-gray-400 font-mono truncate border-t border-dashed border-gray-100 pt-1.5 mt-1.5"><i class="fas fa-database mr-1"></i> ${w.collection || 'No Collection'}</div>
                </div>
                <div class="h-7 bg-gray-50 border-t border-gray-100 flex items-center divide-x divide-gray-200 opacity-80 hover:opacity-100 transition-opacity">
                    <button onclick="resizeWidget(${idx})" class="flex-1 hover:bg-white text-gray-500 hover:text-blue-600 text-[8px] font-bold transition-colors h-full flex items-center justify-center gap-1"><i class="fas fa-expand-alt"></i> Size</button>
                    <button onclick="editWidgetConfig(${idx})" class="flex-1 hover:bg-white text-gray-500 hover:text-orange-500 text-[8px] font-bold transition-colors h-full flex items-center justify-center gap-1"><i class="fas fa-cog"></i> Edit</button>
                    <div class="flex w-14">
                        <button onclick="moveWidget(${idx}, -1)" class="flex-1 hover:bg-white hover:text-gray-800 text-gray-400 text-[8px] h-full ${idx === 0 ? 'opacity-30' : ''}" ${idx === 0 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
                        <button onclick="moveWidget(${idx}, 1)" class="flex-1 hover:bg-white hover:text-gray-800 text-gray-400 text-[8px] h-full ${idx === totalWidgets - 1 ? 'opacity-30' : ''}" ${idx === totalWidgets - 1 ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
                    </div>
                    <button onclick="removeBuilderWidget(${idx})" class="w-7 hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors h-full"><i class="fas fa-times text-[9px]"></i></button>
                </div>
            </div>`
  })
  .join('')
}

function getColSpanClass(width) {
 switch (width) {
  case 'full':
   return 'col-span-1 sm:col-span-2 lg:col-span-4'
  case 'half':
   return 'col-span-1 sm:col-span-2 lg:col-span-2'
  case 'quarter':
   return 'col-span-1 lg:col-span-1'
  default:
   return 'col-span-1 sm:col-span-2 lg:col-span-2'
 }
}

// Konstanta limit
const MAX_WIDGET_LIMIT = 12

export async function addWidgetToBuilder(key) {
 // 1. CEK DASHBOARD (PAKAI HELPER BARU)
 if (!AppState.currentEditingDashboardId) {
  // Panggil Dialog Konfirmasi Custom
  const confirmed = await showConfirmDialog({
   title: 'Dashboard Belum Dipilih',
   text: 'Anda harus memilih atau membuat dashboard terlebih dahulu sebelum menambahkan widget.',
   confirmText: 'Buat Dashboard Baru', // Custom text
   icon: 'info',
  })

  // Jika user klik tombol "Buat Dashboard Baru"
  if (confirmed) {
   openAddDashboardModal()
  }

  return // Stop proses
 }

 // 2. CEK LIMITASI
 if (AppState.tempBuilderWidgets.length >= MAX_WIDGET_LIMIT) {
  // Bisa pakai Swal.fire langsung untuk alert sederhana,
  // atau buat helper 'showAlert' jika mau.
  Swal.fire({
   icon: 'error',
   title: 'Batas Tercapai',
   text: `Maksimal ${MAX_WIDGET_LIMIT} widget diperbolehkan!`,
   confirmButtonColor: '#2563eb',
  })
  return
 }

 // 3. PROSES PEMBUATAN WIDGET (SAMA SEPERTI SEBELUMNYA)
 const template = WidgetRegistry.widgets[key]
 if (!template) return

 const newWidget = JSON.parse(JSON.stringify(template.defaultConfig))
 newWidget.id = 'w_' + Math.random().toString(36).substr(2, 9)
 if (!newWidget.width) newWidget.width = 'half'
 if (!newWidget.icon) newWidget.icon = template.icon

 AppState.tempBuilderWidgets.push(newWidget)
 renderBuilderWidgets()

 setTimeout(() => {
  const container = document.getElementById('builder-widgets-container')
  if (container) container.lastElementChild?.scrollIntoView({ behavior: 'smooth' })
 }, 100)
}

export function removeBuilderWidget(index) {
 AppState.tempBuilderWidgets.splice(index, 1)
 renderBuilderWidgets()
}

export function resizeWidget(index) {
 const sizes = ['quarter', 'half', 'full']
 const current = AppState.tempBuilderWidgets[index].width
 const nextIndex = (sizes.indexOf(current) + 1) % sizes.length
 AppState.tempBuilderWidgets[index].width = sizes[nextIndex]
 renderBuilderWidgets()
}

export function moveWidget(index, direction) {
 const newIndex = index + direction
 if (newIndex < 0 || newIndex >= AppState.tempBuilderWidgets.length) return
 const temp = AppState.tempBuilderWidgets[index]
 AppState.tempBuilderWidgets[index] = AppState.tempBuilderWidgets[newIndex]
 AppState.tempBuilderWidgets[newIndex] = temp
 renderBuilderWidgets()
}

let currentEditingIndex = null
export function editWidgetConfig(index) {
 currentEditingIndex = index
 const widget = AppState.tempBuilderWidgets[index]
 const formContainer = document.getElementById('widget-config-form')
 const modal = document.getElementById('widget-config-modal')
 const panel = document.getElementById('config-panel')

 formContainer.innerHTML = `
        <div class="space-y-5">
            <div class="space-y-3">
                <div>
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Title</label>
                    <input type="text" id="conf-title" value="${widget.title || ''}" class="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 outline-none focus:border-blue-500 transition-all">
                </div>
                <div>
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                    <input type="text" id="conf-desc" value="${widget.description || ''}" class="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 outline-none focus:border-blue-500 transition-all" placeholder="Keterangan widget...">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div class="space-y-1.5">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Width (Grid)</label>
                    <select id="conf-width" class="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-blue-500 cursor-pointer">
                        <option value="quarter" ${widget.width === 'quarter' ? 'selected' : ''}>Quarter (1/4)</option>
                        <option value="half" ${widget.width === 'half' ? 'selected' : ''}>Half (1/2)</option>
                        <option value="full" ${widget.width === 'full' ? 'selected' : ''}>Full (1/1)</option>
                    </select>
                </div>
                <div class="space-y-1.5">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Refresh Data(Menit)</label>
                    <input type="number" id="conf-refresh" value="${widget.refresh_interval || 0}" min="0" class="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-700 outline-none focus:border-blue-500">
                </div>
            </div>

            <div class="space-y-1.5">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Collection</label>
                <div class="relative">
                    <i class="fas fa-database absolute left-3 top-3 text-gray-400 text-xs"></i>
                    <input type="text" id="conf-collection" value="${widget.collection || ''}" class="w-full pl-8 p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-600 outline-none focus:border-blue-500 transition-all">
                </div>
            </div>

            <div class="space-y-1.5 pt-2">
                <div class="flex justify-between items-center">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Config (JSON)</label>
                    <span class="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">Mongo Aggregate</span>
                </div>
                <textarea id="conf-data-config" rows="8" class="w-full bg-[#1e293b] text-emerald-400 p-3 text-[10px] font-mono border-none rounded-lg outline-none resize-none custom-scrollbar leading-relaxed shadow-inner">${JSON.stringify(widget.data_config || [], null, 2)}</textarea>
            </div>
        </div>
    `

 modal.classList.remove('hidden')
 setTimeout(() => {
  panel.classList.remove('translate-y-full') // Mobile Reset
  panel.classList.remove('lg:translate-x-full') // Desktop Reset
 }, 10)
}

export function closeWidgetConfigModal() {
 const modal = document.getElementById('widget-config-modal')
 const panel = document.getElementById('config-panel')
 panel.classList.add('translate-y-full')
 panel.classList.add('lg:translate-x-full')
 setTimeout(() => modal.classList.add('hidden'), 300)
}

export function applyWidgetChanges() {
 if (currentEditingIndex === null) return

 // Ambil value dari form baru
 const title = document.getElementById('conf-title').value
 const desc = document.getElementById('conf-desc').value
 const width = document.getElementById('conf-width').value
 const refresh = parseInt(document.getElementById('conf-refresh').value) || 0
 const collection = document.getElementById('conf-collection').value

 let dataConfig = []
 try {
  dataConfig = JSON.parse(document.getElementById('conf-data-config').value)
 } catch (e) {
  showToast('Invalid JSON Format', 'error')
  return
 }

 // Update State
 const target = AppState.tempBuilderWidgets[currentEditingIndex]
 target.title = title
 target.description = desc
 target.width = width
 target.refresh_interval = refresh
 target.collection = collection
 target.data_config = dataConfig

 renderBuilderWidgets()
 closeWidgetConfigModal()
 showToast('Widget Updated', 'success')
}

export async function saveDashboardBuilder() {
 if (!AppState.currentEditingDashboardId) return openAddDashboardModal()

 const id = AppState.currentEditingDashboardId
 const name = document.getElementById('editing-dashboard-name').innerText

 const payload = {
  widgets: AppState.tempBuilderWidgets.map((w, index) => ({
   id: w.id,
   type: w.type,
   subtype: w.subtype,
   title: w.title,
   description: w.description || '',
   width: w.width,
   position: index + 1,
   collection: w.collection,
   refresh_interval: w.refresh_interval || 0,
   data_config: w.data_config,
  })),
 }

 try {
  const response = await apiFetch(`api/collections/dashboard_settings/${id}`, {
   method: 'PUT',
   body: JSON.stringify(payload),
  })
  if (response && response.ok) {
   showToast('Dashboard Saved!', 'success')
   fetchDashboardsFromDB()
  }
 } catch (e) {
  showToast('Save failed', 'error')
 }
}

export async function fetchDashboardsFromDB() {
 try {
  const response = await apiFetch('api/collections/dashboard_settings')
  if (response) {
   AppState.dbDashboards = await response.json()
   renderSavedDashboardsList()
  }
 } catch (e) {
  console.error(e)
 }
}

export async function openWidgetEditor(id, name) {
 try {
  const response = await apiFetch(`api/collections/dashboard_settings/${id}`)
  if (!response) return
  const data = await response.json()
  AppState.currentEditingDashboardId = id
  const rawWidgets = data.widgets || []
  AppState.tempBuilderWidgets = rawWidgets.map((w) => ({
   ...w,
   width: w.width || 'half',
   icon: w.icon || 'fa-cube',
  }))
  document.getElementById('editing-dashboard-name').innerText = name
  document.getElementById('generator-empty-state').style.opacity = '0'
  renderBuilderWidgets()
  renderSavedDashboardsList()
  showToast(`Loaded: ${name}`)
 } catch (e) {
  showToast('Error loading dashboard', 'error')
 }
}

export async function openAddDashboardModal() {
 // Tampilkan Modal dengan Input Custom
 const { value: formValues } = await Swal.fire({
  title:
   '<div class="text-lg font-black text-gray-800 uppercase tracking-widest">Dashboard Baru</div>',
  html: `
            <div class="flex flex-col gap-4 text-left mt-2">
                <div class="space-y-1.5">
                    <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                        Nama Dashboard <span class="text-red-500">*</span>
                    </label>
                    <input id="swal-dash-name" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm font-bold text-gray-800 outline-none transition-all placeholder-gray-400" placeholder="Contoh: Production Monitoring">
                </div>

                <div class="space-y-1.5">
                    <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                        Deskripsi Singkat
                    </label>
                    <textarea id="swal-dash-desc" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm font-medium text-gray-800 outline-none transition-all placeholder-gray-400 resize-none" rows="2" placeholder="Jelaskan fungsi dashboard ini..."></textarea>
                </div>
            </div>
        `,
  showCancelButton: true,
  confirmButtonColor: '#2563eb', // Blue-600
  cancelButtonColor: '#9ca3af', // Gray-400
  confirmButtonText: 'Buat Dashboard',
  cancelButtonText: 'Batal',
  reverseButtons: true,
  focusConfirm: false,
  customClass: {
   popup: 'rounded-2xl p-6',
   confirmButton: 'rounded-xl px-6 py-3 font-bold shadow-lg shadow-blue-200',
   cancelButton: 'rounded-xl px-6 py-3 font-bold',
   actions: 'gap-3',
  },
  // Validasi Input sebelum submit
  preConfirm: () => {
   const name = document.getElementById('swal-dash-name').value
   const desc = document.getElementById('swal-dash-desc').value

   if (!name) {
    Swal.showValidationMessage('Nama dashboard wajib diisi!')
    return false
   }
   return { name, desc }
  },
 })

 // Jika user membatalkan (klik batal atau klik luar modal)
 if (!formValues) return

 // Proses Data
 const { name, desc } = formValues
 const timestamp = new Date().toISOString()

 // Generate ID Path (Slug)
 // Contoh: "Production Monitoring" -> "production_monitoring"
 const pathId = name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')

 const payload = {
  name: name,
  description: desc,
  widgets: [], // Mulai dengan kosong
 }

 // Tampilkan Loading
 Swal.fire({
  title: 'Membuat Dashboard...',
  html: 'Mohon tunggu sebentar.',
  allowOutsideClick: false,
  didOpen: () => {
   Swal.showLoading()
  },
 })

 try {
  const response = await apiFetch(`api/collections/dashboard_settings`, {
   method: 'POST',
   body: JSON.stringify(payload),
  })

  if (response && response.ok) {
   const result = await response.json()

   Swal.close()
   showToast('Dashboard berhasil dibuat!', 'success')

   await fetchDashboardsFromDB()

   openWidgetEditor(result.insertedId, name)
   switchMobileTab('editor')
  } else {
   throw new Error('Gagal membuat data')
  }
 } catch (e) {
  Swal.fire({
   icon: 'error',
   title: 'Gagal',
   text: 'Terjadi kesalahan saat menyimpan dashboard.',
   confirmButtonColor: '#2563eb',
  })
 }
}

export function previewConfig() {
 const id = AppState.currentEditingDashboardId
 const name = document.getElementById('editing-dashboard-name').innerText
 const timestamp = new Date().toISOString()
 const payload = {
  id: id,
  name: name,
  description: 'Preview',
  updated_at: timestamp,
  created_at: timestamp,
  widgets: AppState.tempBuilderWidgets.map((w) => ({
   id: w.title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
   type: w.type,
   subtype: w.subtype,
   title: w.title,
   collection: w.collection,
   data_config: w.data_config,
  })),
 }
 const newWindow = window.open('', '_blank')
 newWindow.document.write(
  `<html><body style="font-family:monospace;background:#111827;color:#34d399;padding:20px;"><pre>${JSON.stringify(payload, null, 2)}</pre></body></html>`
 )
}

window.filterWidgetLibraryOnly = (val) => {
 const term = val.toLowerCase()
 document.querySelectorAll('.widget-group').forEach((group) => {
  let hasVisible = false
  group.querySelectorAll('.widget-item').forEach((item) => {
   const match = item.innerText.toLowerCase().includes(term)
   item.style.display = match ? 'flex' : 'none'
   if (match) hasVisible = true
  })
  group.style.display = hasVisible ? 'block' : 'none'
 })
}

function renderGeneralForm(settings) {
 return `<div class="p-8 bg-white rounded-xl shadow-sm border border-gray-200 text-center text-gray-400">General Settings Placeholder</div>`
}

export function switchSettingsTab(tab) {
 document.getElementById('tab-content-general').classList.add('hidden')
 document.getElementById('tab-content-generator').classList.add('hidden')
 document.getElementById('tab-btn-general').className =
  'px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-md text-gray-400 hover:text-gray-600'
 document.getElementById('tab-btn-generator').className =
  'px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all text-gray-400 hover:text-gray-600'
 document.getElementById(`tab-content-${tab}`).classList.remove('hidden')
 const activeBtn = document.getElementById(`tab-btn-${tab}`)
 activeBtn.className =
  'px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-md bg-white shadow-sm text-blue-600 border border-gray-200'
}

function generateTempId() {
 return 'w_' + Math.random().toString(36).substr(2, 9)
}
