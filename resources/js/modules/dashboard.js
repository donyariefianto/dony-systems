import { apiFetch } from '../core/api.js'
import { AppState } from '../core/state.js'
import { showToast } from '../utils/helpers.js'

// ============================================
// HELPER: LAZY LOAD ECHARTS + GL
// ============================================
async function loadECharts(requireGL = false) {
 // 1. Load Core ECharts
 if (!window.echarts) {
  await new Promise((resolve, reject) => {
   const script = document.createElement('script')
   script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js'
   script.onload = () => resolve()
   script.onerror = () => reject(new Error('Gagal load ECharts Core'))
   document.head.appendChild(script)
  })
 }

 // 2. Load GL (Jika diminta & belum ada)
 if (requireGL && !window.echarts.graphic.GL) {
  await new Promise((resolve, reject) => {
   const script = document.createElement('script')
   script.src = 'https://cdn.jsdelivr.net/npm/echarts-gl@2.0.9/dist/echarts-gl.min.js'
   script.onload = () => resolve()
   script.onerror = () => reject(new Error('Gagal load ECharts GL'))
   document.head.appendChild(script)
  })
 }

 return window.echarts
}

// ============================================
// LOCAL STATE MANAGEMENT
// ============================================
const dashboardState = {
 configs: {}, // Map ID Widget -> Config Object
 data: {}, // Map ID Widget -> Last Data Array
 activeFsChart: null, // Instance chart fullscreen (untuk dispose saat close)
}

const selectorState = {
 page: 1,
 limit: 6,
 totalPages: 1,
 search: '',
 timer: null,
}

// ============================================
// 1. RENDERER UTAMA (UPDATED LAYOUT)
// ============================================
export async function renderDashboardView(config, container) {
 clearActiveIntervals()

 // Container utama kita berikan background halus dan overflow handling
 container.className = 'w-full h-full bg-gray-50/50 overflow-y-auto custom-scrollbar'

 container.innerHTML = `
    <div class="min-h-full w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-32">
        
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200/60 pb-6">
            
            <div class="flex items-start gap-4">
                <div class="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-blue-600 shrink-0">
                    <i class="fas fa-chart-pie text-2xl"></i>
                </div>
                <div>
                    <h1 id="dashboard-title" class="text-3xl font-black text-gray-800 tracking-tight leading-none mb-2">
                        Loading...
                    </h1>
                    
                    <div class="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <span id="current-time" class="bg-gray-100 px-2 py-1 rounded-md">...</span>
                        
                        <span class="text-gray-300">/</span>
                        
                        <button onclick="openDashboardSelector()" class="group flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors">
                            <span>Ganti Dashboard</span> 
                            <i class="fas fa-chevron-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                 <button onclick="openAddDashboardModal()" class="h-11 px-5 bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 active:scale-95">
                    <i class="fas fa-plus"></i> <span class="hidden sm:inline">New</span>
                </button>
                <button onclick="refreshAllWidgets()" class="h-11 px-5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-200 transition-all flex items-center gap-2 active:scale-95 group">
                    <i class="fas fa-sync-alt group-hover:rotate-180 transition-transform duration-500"></i> 
                    <span class="hidden sm:inline">Sync Data</span>
                </button>
            </div>
        </div>

        <div id="dashboard-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
            ${renderSkeletonPage()}
        </div>
    </div>

    <div id="dashboard-selector-modal" class="fixed inset-0 z-[100] hidden">
        <div id="selector-backdrop" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity opacity-0 duration-300" onclick="closeDashboardSelector()"></div>
        <div id="selector-panel" class="absolute inset-x-0 bottom-0 top-10 md:inset-y-0 md:left-auto md:right-0 md:w-[500px] bg-white shadow-2xl rounded-t-2xl md:rounded-none transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full flex flex-col border-l border-gray-100">
            <div class="h-16 border-b border-gray-100 flex justify-between items-center px-6 bg-white shrink-0 rounded-t-2xl md:rounded-none z-10">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><i class="fas fa-th-large"></i></div>
                    <h3 class="font-black text-gray-800 text-sm uppercase tracking-widest">Pilih Dashboard</h3>
                </div>
                <button onclick="closeDashboardSelector()" class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><i class="fas fa-times"></i></button>
            </div>
            <div class="p-4 border-b border-gray-50 bg-gray-50/50">
                <div class="relative">
                    <i class="fas fa-search absolute left-3 top-3.5 text-gray-400 text-xs"></i>
                    <input type="text" id="dash-search-input" oninput="handleSelectorSearch(this.value)" class="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-gray-400" placeholder="Cari dashboard...">
                </div>
            </div>
            <div id="dash-list-container" class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-white relative"></div>
            <div class="p-4 border-t border-gray-100 bg-white shrink-0 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10 flex justify-between items-center">
                 <span class="text-[10px] font-bold text-gray-400" id="dash-pagination-info">...</span>
                 <div class="flex gap-2">
                    <button id="btn-prev" onclick="changeSelectorPage(-1)" class="h-8 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:hover:bg-transparent text-xs font-bold transition-all"><i class="fas fa-chevron-left"></i></button>
                    <button id="btn-next" onclick="changeSelectorPage(1)" class="h-8 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:hover:bg-transparent text-xs font-bold transition-all"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
        </div>
    </div>

    <div id="widget-fullscreen-modal" class="fixed inset-0 z-[200] hidden transition-all duration-300">
        <div class="absolute inset-0 bg-white/95 backdrop-blur-md"></div>
        <div class="absolute inset-0 flex flex-col h-full w-full animate-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shadow-sm shrink-0">
                <div class="flex items-center gap-4">
                    <div id="fs-icon-box" class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                        <i class="fas fa-cube"></i>
                    </div>
                    <div>
                        <h2 id="fs-title" class="text-xl font-black text-gray-800 tracking-tight">Widget Title</h2>
                        <p id="fs-desc" class="text-xs text-gray-400 font-medium mt-0.5">Widget Description</p>
                    </div>
                </div>
                <button onclick="closeWidgetFullscreen()" class="h-10 px-6 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs uppercase hover:bg-red-50 hover:text-red-500 transition-colors flex items-center gap-2">
                    <span class="hidden md:inline">Tutup</span> <i class="fas fa-times text-lg"></i>
                </button>
            </div>
            <div id="fs-content-body" class="flex-1 p-6 md:p-10 overflow-hidden relative bg-gray-50/30"></div>
        </div>
    </div>
    `

 startClock()

 // Load Default Dashboard
 const targetId = AppState.dashboard.activeId || AppState.user?.defaultDashboard || 'default'
 await loadDashboardConfig(targetId)
}

// ============================================
// 2. LOAD CONFIGURATION
// ============================================
async function loadDashboardConfig(dashboardId) {
 AppState.dashboard.activeId = dashboardId
 const gridContainer = document.getElementById('dashboard-grid')
 const titleEl = document.getElementById('dashboard-title')

 if (!gridContainer) return

 try {
  const response = await apiFetch(`api/collections/dashboard_settings/${dashboardId}`)
  if (!response || !response.ok) throw new Error('Gagal memuat konfigurasi')

  const result = await response.json()
  if (titleEl) titleEl.innerText = result.name || 'Dashboard Overview'

  const widgetList = result.widgets || []
  if (widgetList.length === 0) {
   gridContainer.innerHTML = renderEmptyState()
   return
  }

  // Render Widget Skeleton Grid
  gridContainer.innerHTML = widgetList
   .map((widget) => {
    // Cache Config
    dashboardState.configs[widget.id] = widget
    const colSpanClass = getColSpanClass(widget.width)

    return `
                <div id="widget-container-${widget.id}" class="${colSpanClass} bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col hover-card group transition-all duration-300">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs shadow-sm">
                                <i class="fas ${widget.icon || 'fa-cube'}"></i>
                            </div>
                            <h3 class="text-sm font-bold text-gray-700 uppercase tracking-tight truncate max-w-[150px] md:max-w-xs">${widget.title}</h3>
                        </div>
                        <div class="flex items-center gap-2">
                            <div id="loader-${widget.id}" class="opacity-0 transition-opacity duration-300 text-blue-400 text-[10px]"><i class="fas fa-circle-notch fa-spin"></i></div>
                            
                            <button onclick="refreshSingleWidget('${widget.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-green-600 hover:bg-green-50 transition-colors" title="Refresh Data">
                                <i class="fas fa-sync-alt text-xs"></i>
                            </button>
                            
                            <button onclick="openWidgetFullscreen('${widget.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Fullscreen">
                                <i class="fas fa-expand text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <div id="widget-content-${widget.id}" class="flex-1 flex flex-col justify-center min-h-[150px]">
                        ${renderWidgetSkeleton()} 
                    </div>
                </div>`
   })
   .join('')

  // Fetch Data Paralel
  widgetList.forEach((widget) => initWidgetDataFetcher(widget))
 } catch (err) {
  gridContainer.innerHTML = `<div class="col-span-full p-10 text-center bg-red-50 rounded-2xl border border-red-100"><i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i><p class="text-red-600 font-bold text-sm">Dashboard tidak ditemukan.</p><div class="mt-4 flex gap-2 justify-center"><button onclick="openDashboardSelector()" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition">Pilih Lain</button></div></div>`
 }
}

// ============================================
// 3. FETCH DATA (INIT & REFRESH)
// ============================================

// A. Init Fetcher (Read Cached Data / First Load)
async function initWidgetDataFetcher(widget) {
 const contentContainer = document.getElementById(`widget-content-${widget.id}`)
 const loader = document.getElementById(`loader-${widget.id}`)
 if (!contentContainer) return

 // 1. CEK CONFIG SOURCE
 const config = widget.data_config || {}
 const source = config.source || 'static' // Default ke static jika tidak ada config

 // ---------------------------------------------------------
 // KASUS A: STATIC DATA (Tidak perlu call API)
 // ---------------------------------------------------------
 if (source === 'static') {
  const staticData = config.static_data || []

  // Simpan ke State Lokal (untuk Fullscreen)
  dashboardState.data[widget.id] = staticData

  // Render Langsung
  renderWidgetContent(contentContainer, widget, staticData)

  // Sembunyikan loader (jika ada)
  if (loader) loader.classList.add('opacity-0')
  return // STOP di sini
 }

 // ---------------------------------------------------------
 // KASUS B: DATABASE (Fetch Snapshot dari API)
 // ---------------------------------------------------------
 if (loader) loader.classList.remove('opacity-0')

 try {
  // Ambil data dari collection widgets (Snapshot terakhir)
  const filterJson = JSON.stringify({ _id: widget.id }) // Gunakan _id yang spesifik
  const queryParams = new URLSearchParams({ page: 1, limit: 1, filter: filterJson })

  const response = await apiFetch(`api/collections/widgets?${queryParams.toString()}`)

  if (!response || !response.ok) throw new Error('Network Error')

  const result = await response.json()
  // Ambil field 'data' dari dokumen widget di DB
  // Asumsi: Backend process menyimpan hasil hitungan di field `data`
  const widgetDoc = result.data ? result.data[0] : null
  const liveData = widgetDoc ? widgetDoc.data || [] : []

  // Cache Data
  dashboardState.data[widget.id] = liveData

  // Render
  renderWidgetContent(contentContainer, widget, liveData)

  // Setup Auto Refresh (Client-Side Polling)
  // Hanya jalankan interval jika source adalah database
  if (widget.refresh_interval && widget.refresh_interval > 0) {
   // Clear interval lama jika ada (safety)
   // Note: Idealnya ID interval disimpan per widget agar bisa di-clear spesifik
   const timer = setTimeout(() => refreshSingleWidget(widget.id), widget.refresh_interval * 1000)
   AppState.dashboard.intervals.push(timer)
  }
 } catch (err) {
  console.error(`Widget ${widget.id} Error:`, err)
  contentContainer.innerHTML = `<div class="flex flex-col items-center justify-center text-gray-300 py-4"><i class="fas fa-wifi text-xl mb-1"></i><span class="text-[10px] font-bold uppercase">No Data</span></div>`
 } finally {
  if (loader) loader.classList.add('opacity-0')
 }
}

// B. Force Refresh (Trigger Backend Calculation)
window.refreshSingleWidget = async function (widgetId) {
 const loader = document.getElementById(`loader-${widgetId}`)
 if (loader) loader.classList.remove('opacity-0')

 try {
  // Panggil Endpoint Refresh Khusus
  const response = await apiFetch(`api/collections/widgets/${widgetId}/refresh`, { method: 'POST' })

  if (response && response.ok) {
   const result = await response.json()
   const newData = result.data

   // Update Cache & Render
   dashboardState.data[widgetId] = newData

   const widgetConfig = dashboardState.configs[widgetId]
   const container = document.getElementById(`widget-content-${widgetId}`)
   if (container && widgetConfig) {
    renderWidgetContent(container, widgetConfig, newData)
   }
   showToast('Data refreshed', 'success')
  } else {
   throw new Error('Refresh failed')
  }
 } catch (e) {
  showToast('Gagal memproses data baru', 'error')
  // Fallback: Coba fetch biasa jika endpoint refresh belum siap
  const widgetConfig = dashboardState.configs[widgetId]
  if (widgetConfig) initWidgetDataFetcher(widgetConfig)
 } finally {
  if (loader) loader.classList.add('opacity-0')
 }
}

// C. Refresh All
window.refreshAllWidgets = function () {
 Object.keys(dashboardState.configs).forEach((id) => {
  // Beri delay sedikit agar tidak membebani network sekaligus
  setTimeout(() => {
   refreshSingleWidget(id)
  }, Math.random() * 1000)
 })
}

// ============================================
// 4. RENDER CONTENT (CLEAN & STRICT)
// ============================================
function renderWidgetContent(container, widget, data, isFullscreen = false) {
 // Validasi Ketat: Jika tidak ada data, langsung tolak.
 if (!data || data.length === 0) {
  container.innerHTML = `<div class="flex items-center justify-center h-full text-gray-400"><span class="text-[10px] font-bold uppercase tracking-widest opacity-60">No Data Available</span></div>`
  return
 }

 if (widget.type === 'chart') {
  const chartId = isFullscreen ? `echart-fs-${widget.id}` : `echart-${widget.id}`

  // Container Chart
  container.innerHTML = `
            <div class="w-full h-full min-h-[180px] relative overflow-hidden group">
                <div id="${chartId}" class="w-full h-full absolute inset-0"></div>
            </div>`

  // Delay 100ms agar animasi CSS (zoom/fade) selesai sebagian sebelum render chart
  setTimeout(() => initChartDispatcher(chartId, widget, data, isFullscreen), 100)
 } else if (widget.type === 'stat') {
  const item = data[0] || {}
  const mainValue = item.value || item.total || item.count || '0'
  const subLabel = item.label || widget.description || ''
  const trend = item.trend || null
  const sizeClass = isFullscreen ? 'text-6xl md:text-8xl' : 'text-3xl md:text-4xl'

  container.innerHTML = `
            <div class="flex flex-col h-full justify-center items-center animate-in fade-in duration-500">
                <div class="text-center">
                    <h2 class="${sizeClass} font-black text-gray-800 tracking-tight text-gradient">${mainValue}</h2>
                    <p class="text-sm md:text-xl font-medium text-gray-400 mt-2">${subLabel}</p>
                </div>
                ${trend ? `<div class="flex items-center gap-3 mt-6 pt-6 border-t border-dashed border-gray-200"><span class="${trend.includes('+') ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'} px-3 py-1.5 rounded-lg text-sm font-black uppercase tracking-wide">${trend}</span><span class="text-xs text-gray-400 font-bold uppercase">vs last month</span></div>` : ''}
            </div>`
 } else if (widget.type === 'table') {
  container.innerHTML = `
            <div class="overflow-hidden -mx-5 animate-in fade-in duration-500 h-full overflow-y-auto custom-scrollbar px-5">
                <table class="w-full text-left">
                    <tbody class="divide-y divide-gray-100">
                        ${data.map((row) => `<tr class="hover:bg-blue-50/30 transition-colors group"><td class="px-5 py-4 text-sm font-bold text-gray-600 truncate group-hover:text-blue-600 transition-colors">${row.name || row.title || row._id || '-'}</td><td class="px-5 py-4 text-sm font-mono text-gray-400 text-right">${row.status || row.date || row.value || '-'}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>`
 } else {
  container.innerHTML = `<div class="text-xs text-gray-400 p-2">Unsupported Type</div>`
 }
}

// ============================================
// 5. CHART DISPATCHER (NO SURFACE SUPPORT)
// ============================================
async function initChartDispatcher(containerId, widget, data, isFullscreen = false, attempt = 0) {
 const chartDom = document.getElementById(containerId)
 if (!chartDom) return

 // A. DOM POLLING (Tunggu Container Siap)
 let width = chartDom.clientWidth
 let height = chartDom.clientHeight

 if (height === 0) {
  if (attempt < 15) {
   // Retry mechanism (1.5 detik)
   setTimeout(() => initChartDispatcher(containerId, widget, data, isFullscreen, attempt + 1), 100)
   return
  }
  // Fallback terakhir
  height = 300
  chartDom.style.height = '300px'
 }

 try {
  // B. SETUP LIBRARY
  const subtype = widget.subtype || 'bar'
  // Cek 3D standar (Bar3D/Scatter3D) tapi abaikan surface
  const is3D = widget.is3D || subtype.includes('3D') || widget.category === '3d'

  const echarts = await loadECharts(is3D)

  // Dispose Chart Lama
  const oldChart = isFullscreen
   ? dashboardState.activeFsChart
   : AppState.dashboard.charts[containerId]
  if (oldChart) oldChart.dispose()

  // Init Baru
  const myChart = echarts.init(chartDom, null, { width: width || 'auto', height: height || 'auto' })

  if (!isFullscreen) AppState.dashboard.charts[containerId] = myChart
  else dashboardState.activeFsChart = myChart

  // C. BASE OPTION
  let option = {
   backgroundColor: 'transparent',
   tooltip: { trigger: 'item' },
   ...widget.echartsOptions,
  }

  if (!option.series || option.series.length === 0) {
   option.series = [{ type: subtype }]
  }

  // D. DISPATCH TO HANDLERS (Tanpa Surface)
  if (is3D) {
   handleGeneric3DChart(option, data, subtype)
  } else if (subtype === 'radar') {
   handleRadarChart(option, data)
  } else if (['sankey', 'tree', 'graph'].includes(subtype)) {
   handleFlowChart(option, data, subtype)
  } else {
   // Default: Bar, Line, Mixed, Pie, Gauge
   handleStandardChart(option, data, subtype)
  }

  // E. RENDER
  myChart.setOption(option)

  // Safety Resize
  setTimeout(() => {
   if (chartDom.style.height === '300px') chartDom.style.height = ''
   myChart.resize()
  }, 100)

  if (!chartDom._ro) {
   const ro = new ResizeObserver(() => myChart.resize())
   ro.observe(chartDom)
   chartDom._ro = ro
  }
 } catch (err) {
  console.error(`Error rendering ${subtype}:`, err)
  chartDom.innerHTML = `<div class="flex items-center justify-center h-full text-xs text-red-400">Error</div>`
 }
}

function handleGeneric3DChart(option, data, subtype) {
 if (!option.grid3D) option.grid3D = { viewControl: { autoRotate: true } }
 if (!option.xAxis3D) option.xAxis3D = { type: 'category' }
 if (!option.yAxis3D) option.yAxis3D = { type: 'category' }
 if (!option.zAxis3D) option.zAxis3D = { type: 'value' }

 option.series[0].data = data

 if (subtype === 'bar3D') {
  option.series[0].shading = 'lambert'
  if (!option.series[0].itemStyle) option.series[0].itemStyle = { opacity: 0.8 }
 }
}

function handleRadarChart(option, data) {
 option.series[0].data = data.data
 option.legend = data.legend || { data: [] }
 option.radar = {
  indicator: data.indicator,
 } || { indicator: [] }
}

function handleFlowChart(option, data, subtype) {
 delete option.xAxis
 delete option.yAxis
 delete option.grid

 let complexData = data
 // Unwrap jika data dibungkus array
 if (Array.isArray(data) && data.length === 1 && (data[0].nodes || data[0].children)) {
  complexData = data[0]
 }

 if (subtype === 'sankey') {
  option.series[0].data = complexData.nodes || []
  option.series[0].links = complexData.links || []
  option.series[0].layout = 'none'
 } else {
  option.series[0].data = [complexData]
 }
}

function handleStandardChart(option, data, subtype) {
 // Pie / Gauge / Funnel
 if (['pie', 'gauge', 'funnel'].includes(subtype)) {
  delete option.xAxis
  delete option.yAxis
  delete option.grid
  option.series[0].data = data.map((d) => ({
   name: d.label || d.name || 'Item',
   value: d.value || 0,
  }))
  return
 }

 // Cartesian (Bar, Line, Scatter 2D)
 const labels = data.map((d) => d.label || d._id || '-')
 const vals = data.map((d) => d.value || 0)

 if (subtype.includes('scatter')) {
  if (!option.xAxis) option.xAxis = { type: 'value', scale: true }
  if (!option.yAxis) option.yAxis = { type: 'value', scale: true }
  option.series[0].data = data
  return
 }
 // Mixed & Standard
 if (subtype === 'mixed') {
  const trends = data.map((d) => d.trend || 0)
  if (option.series.length < 2)
   option.series = [
    { type: 'bar', name: 'Main' },
    { type: 'line', yAxisIndex: 1, name: 'Trend' },
   ]

  option.series[0].data = vals
  option.series[1].data = trends

  if (!option.yAxis || !Array.isArray(option.yAxis))
   option.yAxis = [{ type: 'value' }, { type: 'value', splitLine: { show: false } }]
 } else {
  option.series[0].data = vals
 }

 // Default Axis
 if (!option.xAxis) option.xAxis = { type: 'category', data: labels }
 else if (!option.xAxis.data) option.xAxis.data = labels

 if (!option.yAxis) option.yAxis = { type: 'value' }
 option.tooltip.trigger = 'axis'
}

window.openDashboardSelector = async function () {
 const modal = document.getElementById('dashboard-selector-modal')
 const panel = document.getElementById('selector-panel')
 const backdrop = document.getElementById('selector-backdrop')
 selectorState.page = 1
 selectorState.search = ''
 document.getElementById('dash-search-input').value = ''
 modal.classList.remove('hidden')
 fetchAndRenderDashboards()
 setTimeout(() => {
  backdrop.classList.remove('opacity-0')
  panel.classList.remove('translate-y-full', 'md:translate-x-full')
 }, 10)
 setTimeout(() => document.getElementById('dash-search-input').focus(), 100)
}
window.closeDashboardSelector = function () {
 const modal = document.getElementById('dashboard-selector-modal')
 const panel = document.getElementById('selector-panel')
 const backdrop = document.getElementById('selector-backdrop')
 backdrop.classList.add('opacity-0')
 panel.classList.add('translate-y-full', 'md:translate-x-full')
 setTimeout(() => {
  modal.classList.add('hidden')
 }, 300)
}
async function fetchAndRenderDashboards() {
 const container = document.getElementById('dash-list-container')
 const infoLabel = document.getElementById('dash-pagination-info')
 const btnPrev = document.getElementById('btn-prev')
 const btnNext = document.getElementById('btn-next')
 if (!container) return
 container.innerHTML = Array(5)
  .fill(0)
  .map(
   () =>
    `<div class="p-4 rounded-xl border border-gray-100 bg-gray-50 animate-pulse flex justify-between items-center"><div class="space-y-2 w-full"><div class="h-4 bg-gray-200 rounded w-1/3"></div><div class="h-3 bg-gray-200 rounded w-1/2"></div></div></div>`
  )
  .join('')
 try {
  const queryParams = new URLSearchParams({
   page: selectorState.page,
   limit: selectorState.limit,
   search: selectorState.search,
  })
  const response = await apiFetch(`api/collections/dashboard_settings?${queryParams.toString()}`)
  if (!response || !response.ok) throw new Error('Gagal')
  const result = await response.json()
  const dashboards = result.data || []
  selectorState.totalPages = result.total || 1
  if (dashboards.length === 0) {
   container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-gray-400 py-10"><i class="far fa-folder-open text-3xl mb-2 opacity-30"></i><span class="text-xs font-medium">Tidak ditemukan dashboard.</span></div>`
  } else {
   container.innerHTML = dashboards
    .map((dash) => {
     const isActive = dash._id === AppState.dashboard.activeId
     const wrapperClass = isActive
      ? 'bg-blue-50 border-blue-200 shadow-sm'
      : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-md hover:bg-gray-50'
     return `<div onclick="switchDashboard('${dash._id}')" class="cursor-pointer p-4 rounded-xl border transition-all duration-200 group relative select-none ${wrapperClass}"><div class="flex justify-between items-start"><div class="flex items-start gap-3 overflow-hidden"><div class="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-sm ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-blue-500 transition-colors'}"><i class="fas fa-chart-pie"></i></div><div class="flex flex-col"><h4 class="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors flex items-center gap-2">${dash.name} ${isActive ? '<i class="fas fa-check-circle text-blue-500 text-xs"></i>' : ''}</h4><p class="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">${dash.description || 'Dashboard pemantauan sistem.'}</p></div></div><div class="flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><i class="fas fa-cube text-gray-300"></i> ${dash.widgets ? dash.widgets.length : 0}</div></div></div>`
    })
    .join('')
  }
  const totalItems = result.totalItems || 0
  const start = (selectorState.page - 1) * selectorState.limit + 1
  const end = Math.min(selectorState.page * selectorState.limit, totalItems)
  infoLabel.innerText = `${start}-${end} dari ${totalItems}`
  btnPrev.disabled = selectorState.page <= 1
  btnNext.disabled = selectorState.page >= selectorState.totalPages
 } catch (err) {
  container.innerHTML = `<div class="text-center text-red-500 text-xs py-10">Gagal memuat data.</div>`
 }
}
window.handleSelectorSearch = (val) => {
 clearTimeout(selectorState.timer)
 selectorState.timer = setTimeout(() => {
  selectorState.search = val
  selectorState.page = 1
  fetchAndRenderDashboards()
 }, 500)
}
window.changeSelectorPage = (direction) => {
 const newPage = selectorState.page + direction
 if (newPage > 0 && newPage <= selectorState.totalPages) {
  selectorState.page = newPage
  fetchAndRenderDashboards()
 }
}
window.switchDashboard = (id) => {
 closeDashboardSelector()
 if (id === AppState.dashboard.activeId) return
 setTimeout(() => loadDashboardConfig(id), 300)
}
window.openWidgetFullscreen = function (widgetId) {
 const modal = document.getElementById('widget-fullscreen-modal')
 const titleEl = document.getElementById('fs-title')
 const descEl = document.getElementById('fs-desc')
 const iconBox = document.getElementById('fs-icon-box')
 const body = document.getElementById('fs-content-body')
 const widget = dashboardState.configs[widgetId]
 const data = dashboardState.data[widgetId]
 if (!widget || !data) {
  showToast('Data widget belum siap', 'error')
  return
 }
 titleEl.innerText = widget.title
 descEl.innerText = widget.description || 'Detail Widget'
 iconBox.innerHTML = `<i class="fas ${widget.icon || 'fa-cube'} text-xl"></i>`
 body.innerHTML = ''
 renderWidgetContent(body, widget, data, true)
 modal.classList.remove('hidden')
}
window.closeWidgetFullscreen = function () {
 const modal = document.getElementById('widget-fullscreen-modal')
 modal.classList.add('hidden')
 if (dashboardState.activeFsChart) {
  dashboardState.activeFsChart.dispose()
  dashboardState.activeFsChart = null
 }
}
function clearActiveIntervals() {
 AppState.dashboard.intervals.forEach((id) => clearTimeout(id))
 AppState.dashboard.intervals = []
 Object.keys(AppState.dashboard.charts).forEach((key) => {
  if (AppState.dashboard.charts[key]) AppState.dashboard.charts[key].dispose()
 })
 AppState.dashboard.charts = {}
}
function getColSpanClass(width) {
 switch (width) {
  case 'full':
   return 'col-span-1 md:col-span-2 xl:col-span-4'
  case 'half':
   return 'col-span-1 md:col-span-2 xl:col-span-2'
  case 'quarter':
   return 'col-span-1 xl:col-span-1'
  default:
   return 'col-span-1 md:col-span-2 xl:col-span-2'
 }
}
function renderWidgetSkeleton() {
 return `<div class="w-full animate-pulse space-y-3"><div class="h-8 bg-gray-100 rounded-lg w-1/2"></div><div class="h-4 bg-gray-100 rounded w-3/4"></div><div class="h-20 bg-gray-50 rounded-xl mt-4"></div></div>`
}
function renderSkeletonPage() {
 return Array(4)
  .fill(0)
  .map(
   () =>
    `<div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-48 animate-pulse"><div class="flex gap-3 mb-4"><div class="w-8 h-8 bg-gray-200 rounded-lg"></div><div class="h-4 bg-gray-200 rounded w-1/3 mt-2"></div></div><div class="h-24 bg-gray-100 rounded-xl"></div></div>`
  )
  .join('')
}
function renderEmptyState() {
 return `<div class="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-60"><div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"><i class="fas fa-layer-group text-4xl text-gray-300"></i></div><h3 class="text-lg font-black text-gray-700 uppercase tracking-widest">Dashboard Kosong</h3><p class="text-xs text-gray-400 mt-2 max-w-sm">Belum ada widget yang ditambahkan.</p></div>`
}
function startClock() {
 const updateTime = () => {
  const el = document.getElementById('current-time')
  if (el)
   el.innerText = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
   })
 }
 updateTime()
 AppState.dashboard.intervals.push(setInterval(updateTime, 60000))
}
window.loadDashboardConfig = () => loadDashboardConfig(AppState.dashboard.activeId)
