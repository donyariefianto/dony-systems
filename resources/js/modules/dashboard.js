import { apiFetch } from '../core/api.js'
import { AppState } from '../core/state.js'
import { showToast, decryptData } from '../utils/helpers.js'
let echartsPromise = null
let glPromise = null

export async function renderDashboardView(config, container) {
 const oldModal = document.getElementById('widget-fullscreen-modal')
 if (oldModal) oldModal.remove()

 clearActiveIntervals()

 container.className = 'w-full h-full bg-gray-50/50 overflow-y-auto custom-scrollbar relative'

 const dashboardContent = `
    <div class="min-h-full w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-32">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200/60 pb-6">
            <div class="flex items-start gap-4">
                <div class="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-zinc-600 shrink-0">
                    <i class="fas fa-chart-pie text-2xl"></i>
                </div>
                <div>
                    <h1 id="dashboard-title" class="text-3xl font-black text-gray-800 tracking-tight leading-none mb-2">Loading...</h1>
                    <div class="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <span id="current-time" class="bg-gray-100 px-2 py-1 rounded-md">...</span>
                        <span class="text-gray-300">/</span>
                        <button onclick="openDashboardSelector()" class="group flex items-center gap-1.5 text-zinc-600 hover:text-zinc-700 transition-colors">
                            <span>Select Dashboard</span> 
                            <i class="fas fa-chevron-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <button onclick="refreshAllWidgets()" class="h-11 px-5 bg-zinc-600 text-white hover:bg-zinc-700 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-zinc-200 transition-all flex items-center gap-2 active:scale-95 group">
                    <i class="fas fa-sync-alt group-hover:rotate-180 transition-transform duration-500"></i> 
                    <span class="hidden sm:inline">Sync Data</span>
                </button>
            </div>
        </div>

        <div id="dashboard-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
            ${renderSkeletonPage()}
        </div>
    </div>`

 const modalFullscreenHTML = `<div id="widget-fullscreen-modal" 
     class="hidden" 
     style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100vw; height: 100dvh; background-color: #ffffff; z-index: 2147483647;">
    
    <div class="flex flex-col w-full h-full relative bg-white">
        <div style="height: env(safe-area-inset-top); width: 100%; background-color: #ffffff; flex-shrink: 0;"></div>

        <div class="flex items-center justify-between px-4 border-b border-gray-200 shadow-sm" 
             style="height: 64px; background-color: #ffffff; flex-shrink: 0; position: relative; z-index: 9999;">
            
            <div class="flex items-center gap-3 overflow-hidden mr-2">
                <div id="fs-icon-box" class="w-10 h-10 rounded-xl bg-zinc-50 text-zinc-600 flex items-center justify-center shadow-sm shrink-0 border border-zinc-100">
                    <i class="fas fa-cube"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <h2 id="fs-title" class="text-base font-black text-gray-800 tracking-tight truncate leading-tight">Widget</h2>
                    <p id="fs-desc" class="text-[10px] text-gray-500 font-medium truncate hidden sm:block">Description</p>
                </div>
            </div>

            <div class="flex items-center gap-2">
                
                <div id="fs-actions" class="flex items-center gap-2"></div>
                
                <div class="w-px h-6 bg-gray-200 mx-1"></div>

                <button onclick="closeWidgetFullscreen()" class="h-10 px-4 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 font-bold text-xs uppercase hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2 shrink-0 active:scale-95">
                    <span>Close</span> <i class="fas fa-times text-sm"></i>
                </button>
            </div>
        </div>

        <div class="flex-1 relative w-full overflow-hidden" style="background-color: #ffffff; z-index: 1;">
            <div id="fs-content-body" class="w-full h-full p-4 md:p-6 overflow-y-auto" style="-webkit-overflow-scrolling: touch;"></div>
        </div>

        <div style="height: env(safe-area-inset-bottom); width: 100%; background-color: #ffffff; flex-shrink: 0;"></div>
    </div>
</div>`

 const modalSelectorHTML = `
    <div id="dashboard-selector-modal" class="fixed inset-0 z-[100] hidden">
        <div id="selector-backdrop" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity opacity-0 duration-300" onclick="closeDashboardSelector()"></div>
        <div id="selector-panel" class="absolute inset-x-0 bottom-0 top-10 md:inset-y-0 md:left-auto md:right-0 md:w-[500px] bg-white shadow-2xl rounded-t-2xl md:rounded-none transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full flex flex-col border-l border-gray-100">
            <div class="h-16 border-b border-gray-100 flex justify-between items-center px-6 bg-white shrink-0 rounded-t-2xl md:rounded-none z-10">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-zinc-50 text-zinc-600 flex items-center justify-center"><i class="fas fa-th-large"></i></div>
                    <h3 class="font-black text-gray-800 text-sm uppercase tracking-widest">Select Dashboard</h3>
                </div>
                <button onclick="closeDashboardSelector()" class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><i class="fas fa-times"></i></button>
            </div>
            <div class="p-4 border-b border-gray-50 bg-gray-50/50">
                <div class="relative">
                    <i class="fas fa-search absolute left-3 top-3.5 text-gray-400 text-xs"></i>
                    <input type="text" id="dash-search-input" oninput="handleSelectorSearch(this.value)" class="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-500/10 transition-all placeholder-gray-400" placeholder="Cari dashboard...">
                </div>
            </div>
            <div id="dash-list-container" class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-white relative"></div>
            <div class="p-4 border-t border-gray-100 bg-white shrink-0 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10 flex justify-between items-center">
                 <span class="text-[10px] font-bold text-gray-400" id="dash-pagination-info">...</span>
                 <div class="flex gap-2">
                    <button id="btn-prev" onclick="changeSelectorPage(-1)" class="h-8 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-zinc-600 disabled:opacity-40 disabled:hover:bg-transparent text-xs font-bold transition-all"><i class="fas fa-chevron-left"></i></button>
                    <button id="btn-next" onclick="changeSelectorPage(1)" class="h-8 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-zinc-600 disabled:opacity-40 disabled:hover:bg-transparent text-xs font-bold transition-all"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
        </div>
    </div>`

 container.innerHTML = dashboardContent + modalSelectorHTML

 document.body.insertAdjacentHTML('beforeend', modalFullscreenHTML)

 startClock()
 const targetId = AppState.dashboard.activeId || AppState.user?.defaultDashboard || 'default'
 await loadDashboardConfig(targetId)
}
async function loadECharts(requireGL = false) {
 if (!window.echarts) {
  if (!echartsPromise) {
   echartsPromise = loadScript({
    url: 'https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js',
    name: 'ECharts Core',
   })
  }
  await echartsPromise
 }

 if (requireGL && typeof window.echarts.graphic.GL === 'undefined') {
  if (!glPromise) {
   glPromise = loadScript({
    url: 'https://cdn.jsdelivr.net/npm/echarts-gl/dist/echarts-gl.min.js',
    name: 'ECharts GL',
   })
  }
  await glPromise
 }

 return window.echarts
}
function loadScript({ url, name }) {
 return new Promise((resolve, reject) => {
  const script = document.createElement('script')
  script.src = url
  script.onload = () => {
   resolve()
  }
  script.onerror = () => {
   reject(new Error(`Gagal load ${name}`))
  }
  document.head.appendChild(script)
 })
}
const dashboardState = {
 configs: {},
 data: {},
 activeFsChart: null,
}
const selectorState = {
 page: 1,
 limit: 6,
 totalPages: 1,
 search: '',
 timer: null,
}
async function loadDashboardConfig(dashboardId) {
 AppState.dashboard.activeId = dashboardId
 const gridContainer = document.getElementById('dashboard-grid')
 const titleEl = document.getElementById('dashboard-title')

 if (!gridContainer) return

 try {
  const response = await apiFetch(`api/collections/dashboard_settings/${dashboardId}`)
  if (!response || !response.ok) throw new Error('Gagal memuat konfigurasi')

  let result = await response.json()
  result = decryptData(result.nonce, result.ciphertext)
  result = JSON.parse(result)
  if (titleEl) titleEl.innerText = result.name || 'Dashboard Overview'

  const widgetList = result.widgets || []
  if (widgetList.length === 0) {
   gridContainer.innerHTML = renderEmptyState()
   return
  }

  gridContainer.innerHTML = widgetList
   .map((widget) => {
    dashboardState.configs[widget.id] = widget
    const colSpanClass = getColSpanClass(widget.width)
    const allow_variant = widget.allow_variant || false
    return `
    <div id="widget-container-${widget.id}" class="${colSpanClass} bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-visible flex flex-col hover:shadow-md transition-all duration-300 hover:z-50">
        
        <div class="flex justify-between items-start mb-4 p-5 pb-0 relative">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-zinc-50 text-zinc-600 flex items-center justify-center text-xs shadow-sm">
                    <i class="${widget.icon || 'fa-cube'}"></i>
                </div>
                <h3 class="text-sm font-bold text-gray-700 uppercase tracking-tight truncate max-w-[150px] md:max-w-xs">${widget.title}</h3>
            </div>

            <div class="flex items-center gap-2 relative">
                <div id="loader-${widget.id}" class="opacity-0 transition-opacity duration-300 text-zinc-400 text-[10px] mr-1">
                    <i class="fas fa-circle-notch fa-spin"></i>
                </div>
                
                <div class="relative">
                    <button onclick="window.toolsVariant('${widget.id}')" 
                        class="${allow_variant ? '' : 'hidden'} w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" 
                        title="Filters">
                        <i class="fas fa-sliders-h text-xs"></i>
                    </button>

                    <div id="variant-popover-${widget.id}" 
                        class="hidden absolute top-full right-0 mt-2 w-72 max-w-[85vw] bg-white border border-gray-200 shadow-xl rounded-xl z-[9999] transform transition-all animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                        
                        <div class="absolute -top-1.5 right-3 w-3 h-3 bg-white border-t border-l border-gray-200 transform rotate-45"></div>

                        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                            <div class="flex items-center gap-2 text-gray-500">
                                <i class="fas fa-filter text-xs"></i>
                                <span class="text-[10px] font-black uppercase tracking-widest">Filters</span>
                            </div>
                            <button onclick="document.getElementById('variant-popover-${widget.id}').classList.add('hidden')" 
                                class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 transition-colors">
                                <i class="fas fa-times text-[10px]"></i>
                            </button>
                        </div>

                        <div id="variant-form-${widget.id}" class="pl-4 pr-4 p-2 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar"></div>

                        <div class="p-3 bg-white border-t border-gray-100 rounded-b-xl flex gap-3">
                            <button onclick="document.getElementById('variant-popover-${widget.id}').classList.add('hidden')" 
                                class="flex-1 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button onclick="window.applyVariant('${widget.id}')" 
                                class="flex-[2] py-2 bg-zinc-600 hover:bg-zinc-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-zinc-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                                <span>Apply</span> <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <button onclick="refreshSingleWidget('${widget.id}')" class="${widget.data_config.source === 'database' ? '' : 'hidden'} w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Refresh Data">
                    <i class="fas fa-sync-alt text-xs"></i>
                </button>
                
                <button onclick="openWidgetFullscreen('${widget.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors" title="Fullscreen">
                    <i class="fas fa-expand text-xs"></i>
                </button>
            </div>
        </div>
        
        <div id="widget-content-${widget.id}" class="flex-1 flex flex-col justify-center min-h-[150px] px-5 pb-5 overflow-hidden rounded-b-2xl">
            ${renderWidgetSkeleton()} 
        </div>
    </div>`
   })
   .join('')

  widgetList.forEach((widget) => initWidgetDataFetcher(widget))
 } catch (err) {
  gridContainer.innerHTML = `<div class="col-span-full p-10 text-center bg-red-50 rounded-2xl border border-red-100"><i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i><p class="text-red-600 font-bold text-sm">Dashboard not found.</p><div class="mt-4 flex gap-2 justify-center"><button onclick="openDashboardSelector()" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition">Choose another options</button></div></div>`
 }
}
async function initWidgetDataFetcher(widget) {
 const contentContainer = document.getElementById(`widget-content-${widget.id}`)
 const loader = document.getElementById(`loader-${widget.id}`)
 if (!contentContainer) return

 const config = widget.data_config || {}
 const source = config.source || 'static'

 if (source === 'static') {
  const staticData = config.static_data || []
  dashboardState.data[widget.id] = staticData
  renderWidgetContent(contentContainer, widget, staticData)
  if (loader) loader.classList.add('opacity-0')
  return
 }

 if (loader) loader.classList.remove('opacity-0')
 try {
  const apiPipeline = getWidgetPipelineWithVariants(widget)
  const response = await apiFetch(
   `api/collections-aggregation/${widget.data_config.collection}?pipeline=${apiPipeline}`
  )
  if (!response || !response.ok) throw new Error('Network Error')
  let result = await response.json()
  result = decryptData(result.nonce, result.ciphertext)
  result = JSON.parse(result)
  const widgetDoc = result.data ? result.data[0] : null
  const liveData = widgetDoc ? widgetDoc || [] : []
  dashboardState.data[widget.id] = liveData
  renderWidgetContent(contentContainer, widget, liveData)
  if (widget.refresh_interval && widget.refresh_interval > 0) {
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
function renderWidgetContent(container, widget, data, isFullscreen = false) {
 if (!data || data.length === 0) {
  container.innerHTML = `<div class="flex items-center justify-center h-full text-gray-400"><span class="text-[10px] font-bold uppercase tracking-widest opacity-60">No Data Available</span></div>`
  return
 }

 if (widget.type === 'chart') {
  const chartId = isFullscreen ? `echart-fs-${widget.id}` : `echart-${widget.id}`
  container.innerHTML = `
    <div class="w-full h-full min-h-[180px] relative overflow-hidden group">
        <div id="${chartId}" class="w-full h-full absolute inset-0 z-0"></div>
        
        <div class="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
            <div class="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
                <div class="flex items-center gap-1.5">
                    <svg class="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-xs font-medium text-gray-200">${formatRelativeTime(widget.updated_at) || '-'}</span>
                </div>
            </div>
        </div>
    </div>`
  setTimeout(() => initChartDispatcher(chartId, widget, data, isFullscreen), 100)
 } else if (widget.type === 'label') {
  const item =
   Array.isArray(data) && data.length > 0 ? data[0] : widget.data_config?.static_data?.[0] || {}

  const mainValue = item.value || widget.config?.value || '0'
  const description = item.description || widget.config?.description || ''

  const colorTheme = item.color || widget.config?.color || 'zinc'
  const labelName = item.name || widget.config?.name || widget.title || 'Metric'

  container.innerHTML = `
    <div class="h-full flex flex-col p-2 animate-in fade-in slide-in-from-left-4 duration-700 relative group">
        <div class="flex flex-col justify-between h-full">
            <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                    ${labelName}
                </p>
                <div class="flex items-baseline gap-1.5">
                    ${widget.config?.prefix ? `<span class="text-xl font-bold text-slate-300">${widget.config.prefix}</span>` : ''}
                    <h2 class="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter leading-none">
                        ${mainValue}
                    </h2>
                    ${widget.config?.suffix ? `<span class="text-sm font-bold text-slate-400 uppercase ml-1">${widget.config.suffix}</span>` : ''}
                </div>
            </div>

            <div class="mt-4 flex items-center gap-3">
                <div class="w-1 h-4 bg-${colorTheme}-500/20 rounded-full"></div>
                <p class="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2">
                    ${description}
                </p>
            </div>
        </div>
        <div class="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
            <div class="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
            <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                </svg>
                <span class="text-xs font-medium text-gray-200">${formatRelativeTime(widget.updated_at) || '-'}</span>
            </div>
            </div>
        </div>
    </div>`
 } else if (widget.type === 'table') {
  const isStatic = widget.data_config?.source === 'static'

  let columns = widget.table_options?.columns || []
  if (columns.length === 0 && data.length > 0) {
   columns = Object.keys(data[0]).map((key) => ({ header: key.toUpperCase(), field: key }))
  }

  let toolbarHtml = ''
  let footerHtml = ''

  if (!isStatic) {
   toolbarHtml = `
    <div class="flex justify-between items-center px-5 py-3 border-b border-slate-100 bg-white sticky top-0 z-20">
        <div class="relative w-full max-w-xs">
            <input type="text" 
                onkeyup="drawerUI.handleTableSearch('${widget.id}', this.value)" 
                placeholder="Cari data..." 
                class="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-zinc-500 focus:bg-white outline-none transition-all">
            <i class="fas fa-search absolute left-3 top-2 text-slate-400 text-xs"></i>
        </div>
        <div class="flex gap-2">
            <button class="p-1.5 text-slate-400 hover:text-zinc-600 transition-colors" title="Reload"><i class="fas fa-sync-alt text-xs"></i></button>
            <button class="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors" title="Export Excel"><i class="fas fa-file-excel text-xs"></i></button>
        </div>
    </div>`

   footerHtml = `
    <div class="flex justify-between items-center px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
        <span>Showing <b class="text-slate-700">1-10</b> of <b class="text-slate-700">142</b></span>
        <div class="flex gap-1">
            <button class="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50" disabled><i class="fas fa-chevron-left"></i></button>
            <button class="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100"><i class="fas fa-chevron-right"></i></button>
        </div>
    </div>`
  }

  const rowsHtml =
   data.length > 0
    ? data
       .map((row, index) => {
        return `
            <tr class="hover:bg-zinc-50/40 transition-colors group border-b border-slate-50 last:border-none">
                ${columns
                 .map((col) => {
                  let cellVal = row[col.field] || '-'

                  if (col.type === 'badge') {
                   const badgeColor =
                    cellVal === 'MASUK' ? 'emerald' : cellVal === 'KELUAR' ? 'rose' : 'slate'
                   cellVal = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-${badgeColor}-100 text-${badgeColor}-600 uppercase">${cellVal}</span>`
                  }

                  return `<td class="px-5 py-3.5 text-xs text-slate-600 ${col.type === 'number' ? 'text-right font-mono' : ''}">${cellVal}</td>`
                 })
                 .join('')}
            </tr>`
       })
       .join('')
    : `<tr><td colspan="${columns.length}" class="px-5 py-8 text-center text-slate-400 text-xs italic">Tidak ada data ditemukan</td></tr>`

  container.innerHTML = `
        <div class="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
            ${toolbarHtml}

            <div class="flex-1 overflow-auto custom-scrollbar relative">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            ${columns
                             .map(
                              (col) =>
                               `<th class="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider ${col.type === 'number' ? 'text-right' : ''}">
                                    ${col.header}
                                </th>`
                             )
                             .join('')}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 bg-white">
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>

            ${footerHtml}
            <div class="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                <div class="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
                <div class="flex items-center gap-1.5">
                    <svg class="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-xs font-medium text-gray-200">${formatRelativeTime(widget.updated_at) || '-'}</span>
                </div>
                </div>
            </div>
        </div>`
 } else {
  container.innerHTML = `<div class="text-xs text-gray-400 p-2">Unsupported Type</div>`
 }
}
async function initChartDispatcher(containerId, widget, data, isFullscreen = false, attempt = 0) {
 const chartDom = document.getElementById(containerId)
 if (!chartDom) return

 let width = chartDom.clientWidth
 let height = chartDom.clientHeight

 try {
  const subtype = widget.subtype || 'bar'
  const is3D = widget.is3D || subtype.includes('3d') || widget.category === '3d'
  const echarts = await loadECharts(is3D)
  const oldChart = isFullscreen
   ? dashboardState.activeFsChart
   : AppState.dashboard.charts[containerId]
  if (oldChart) oldChart.dispose()
  const myChart = echarts.init(chartDom, null, { width: width || 'auto', height: height || 'auto' })
  if (!isFullscreen) AppState.dashboard.charts[containerId] = myChart
  else dashboardState.activeFsChart = myChart

  let option = {
   backgroundColor: 'transparent',
   tooltip: { trigger: 'item' },
   ...widget.echarts_options,
  }
  if (!option.series || option.series.length === 0) {
   option.series = [{ type: subtype }]
  }
  if (is3D) {
   handleGeneric3DChart(option, data, subtype, myChart)
  } else if (subtype === 'radar') {
   handleRadarChart(option, data, myChart)
  } else {
   handleStandardChart(option, data, subtype, myChart)
  }

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
function handleGeneric3DChart(option, data, subtype, myChart) {
 if (subtype.includes('bar3d') || subtype.includes('scatter3d') || subtype.includes('line3d')) {
  option = data
  return myChart.setOption(option)
 }
}
function handleRadarChart(option, data, myChart) {
 option.series[0].data = data.data
 option.legend = data.legend || []
 option.radar = {
  indicator: data.indicator,
 } || { indicator: [] }
 return myChart.setOption(option)
}
function handleStandardChart(option, data, subtype, myChart) {
 if (subtype.includes('line')) {
  if (subtype === 'line_smooth') {
   const labels = data.map((d) => d.label || d._id || '-')
   const vals = data.map((d) => d.value || 0)
   option.xAxis = { data: labels }
   option.series[0].type = 'line'
   option.series[0].data = vals
   return myChart.setOption(option)
  } else if (subtype === 'line_stacked') {
   option.xAxis[0].data = data.xAxis
   option.legend.data = data.legend
   option.series = data.data
   return myChart.setOption(option)
  } else if (subtype === 'line_area_large') {
   option.xAxis.data = data.xAxis
   option.series[0].data = data.data
   return myChart.setOption(option)
  } else if (subtype === 'line_multi_x') {
   for (const element of option.xAxis) {
    element.data = data.axisPointer
   }
   option.series = data.data
   return myChart.setOption(option)
  } else if (subtype === 'line_race') {
   option.dataset.source = data
   return myChart.setOption(option)
  }
 }

 if (subtype.includes('bar')) {
  if (subtype === 'bar_large') {
   option.xAxis.data = data.category_data
   option.series[0].data = data.data
   return myChart.setOption(option)
  } else if (subtype === 'bar_race') {
   option.xAxis = data.xAxis
   option.yAxis.data = data.yAxis
   option.series[0].data = data.data
   return myChart.setOption(option)
  } else if (subtype === 'bar_multi_y' || subtype === 'mixed_line_bar') {
   option.legend.data = data.legend
   option.xAxis = data.xAxis
   option.yAxis = data.yAxis
   option.series = data.data
   return myChart.setOption(option)
  }
 }

 if (subtype.includes('pie')) {
  if (subtype === 'pie_doughnut_rounded') {
   option.series[0].data = data.data
   return myChart.setOption(option)
  } else if (subtype === 'pie_scroll') {
   option.legend = data.legend
   option.series = data.data
   return myChart.setOption(option)
  }
 }

 if (subtype.includes('scatter')) {
  if (subtype === 'scatter_cluster') {
   var originalData = data
   var DIM_CLUSTER_INDEX = 2
   var DATA_DIM_IDX = [0, 1]
   var CENTER_DIM_IDX = [3, 4]
   var step = ecStat.clustering.hierarchicalKMeans(originalData, {
    clusterCount: 6,
    outputType: 'single',
    outputClusterIndexDimension: DIM_CLUSTER_INDEX,
    outputCentroidDimensions: CENTER_DIM_IDX,
    stepByStep: true,
   })
   var colorAll = [
    '#bbb',
    '#37A2DA',
    '#e06343',
    '#37a354',
    '#b55dba',
    '#b5bd48',
    '#8378EA',
    '#96BFFF',
   ]
   function renderItemPoint(params, api) {
    var coord = api.coord([api.value(0), api.value(1)])
    var clusterIdx = api.value(2)
    if (clusterIdx == null || isNaN(clusterIdx)) {
     clusterIdx = 0
    }
    var isNewCluster = clusterIdx === api.value(3)
    var extra = {
     transition: [],
    }
    var contentColor = colorAll[clusterIdx]
    return {
     type: 'circle',
     x: coord[0],
     y: coord[1],
     shape: {
      cx: 0,
      cy: 0,
      r: 10,
     },
     extra: extra,
     style: {
      fill: contentColor,
      stroke: '#333',
      lineWidth: 1,
      shadowColor: contentColor,
      shadowBlur: isNewCluster ? 12 : 0,
      transition: ['shadowBlur', 'fill'],
     },
    }
   }
   function renderBoundary(params, api) {
    var xVal = api.value(0)
    var yVal = api.value(1)
    var maxDist = api.value(2)
    var center = api.coord([xVal, yVal])
    var size = api.size([maxDist, maxDist])
    return {
     type: 'ellipse',
     shape: {
      cx: isNaN(center[0]) ? 0 : center[0],
      cy: isNaN(center[1]) ? 0 : center[1],
      rx: isNaN(size[0]) ? 0 : size[0] + 15,
      ry: isNaN(size[1]) ? 0 : size[1] + 15,
     },
     extra: {
      renderProgress: ++targetRenderProgress,
      enterFrom: {
       renderProgress: 0,
      },
      transition: 'renderProgress',
     },
     style: {
      fill: null,
      stroke: 'rgba(0,0,0,0.2)',
      lineDash: [4, 4],
      lineWidth: 4,
     },
    }
   }
   function makeStepOption(option, data, centroids) {
    var newCluIdx = centroids ? centroids.length - 1 : -1
    var maxDist = 0
    for (var i = 0; i < data.length; i++) {
     var line = data[i]
     if (line[DIM_CLUSTER_INDEX] === newCluIdx) {
      var dist0 = Math.pow(line[DATA_DIM_IDX[0]] - line[CENTER_DIM_IDX[0]], 2)
      var dist1 = Math.pow(line[DATA_DIM_IDX[1]] - line[CENTER_DIM_IDX[1]], 2)
      maxDist = Math.max(maxDist, dist0 + dist1)
     }
    }
    var boundaryData = centroids
     ? [[centroids[newCluIdx][0], centroids[newCluIdx][1], Math.sqrt(maxDist)]]
     : []
    option.options.push({
     series: [
      {
       type: 'custom',
       encode: {
        tooltip: [0, 1],
       },
       renderItem: renderItemPoint,
       data: data,
      },
      {
       type: 'custom',
       renderItem: renderBoundary,
       animationDuration: 3000,
       silent: true,
       data: boundaryData,
      },
     ],
    })
   }
   var targetRenderProgress = 0
   makeStepOption(option, originalData)
   option.timeline.data.push('0')
   for (var i = 1, stepResult; !(stepResult = step.next()).isEnd; i++) {
    makeStepOption(
     option,
     echarts.util.clone(stepResult.data),
     echarts.util.clone(stepResult.centroids)
    )
    option.timeline.data.push(i + '')
   }
   return myChart.setOption(option)
  } else if (subtype === 'scatter_basic') {
   option.series[0].data = data.data
   return myChart.setOption(option)
  } else if (subtype === 'scatter_aggregate') {
   function calculateAverage(data, dim) {
    let total = 0
    for (var i = 0; i < data.length; i++) {
     total += data[i][dim]
    }
    return (total /= data.length)
   }
   const scatterOption = (option = {
    xAxis: {
     scale: true,
    },
    yAxis: {
     scale: true,
    },
    series: data.data.map((x) => {
     return {
      type: 'scatter',
      universalTransition: {
       enabled: true,
       delay: 1500,
      },
      data: x.data,
      id: x.name,
      dataGroupId: x.name,
     }
    }),
   })

   const barOption = {
    xAxis: {
     type: 'category',
     data: data.data.map((d) => d.name || '-'),
    },
    yAxis: {},
    series: [
     {
      type: 'bar',
      id: 'total',
      dataa: data.data.map((x) => {
       return {
        value: calculateAverage(x.data, 0),
        groupId: x.name,
       }
      }),
      universalTransition: {
       enabled: true,
       seriesKey: data.data.map((d) => d.name || '-'),
       delay: 1500,
      },
     },
    ],
   }
   let currentOption = scatterOption

   return myChart.setOption(currentOption)
  }
 }

 if (subtype.includes('gauge')) {
  if (subtype === 'gauge_multi') {
   option.series[0].data = data
   return myChart.setOption(option)
  } else if (subtype === 'gauge_grade') {
   option.series = data.series
   return myChart.setOption(option)
  }
 }

 if (subtype.includes('tree') || subtype.includes('sankey')) {
  if (subtype === 'tree_lr' || subtype === 'tree_rl') {
   option.series[0].data = data
   return myChart.setOption(option)
  } else if (
   subtype === 'tree_multi' ||
   subtype === 'sankey_basic' ||
   subtype === 'sankey_levels'
  ) {
   option = data
   return myChart.setOption(option)
  }
 }
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
  let result = await response.json()
  result = decryptData(result.nonce, result.ciphertext)
  result = JSON.parse(result)

  const dashboards = result.data || []
  selectorState.totalPages = result.total || 1
  if (dashboards.length === 0) {
   container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-gray-400 py-10"><i class="far fa-folder-open text-3xl mb-2 opacity-30"></i><span class="text-xs font-medium">Tidak ditemukan dashboard.</span></div>`
  } else {
   container.innerHTML = dashboards
    .map((dash) => {
     const isActive = dash._id === AppState.dashboard.activeId
     const wrapperClass = isActive
      ? 'bg-zinc-50 border-zinc-200 shadow-sm'
      : 'bg-white border-gray-100 hover:border-zinc-300 hover:shadow-md hover:bg-gray-50'
     return `<div onclick="switchDashboard('${dash._id}')" class="cursor-pointer p-4 rounded-xl border transition-all duration-200 group relative select-none ${wrapperClass}"><div class="flex justify-between items-start"><div class="flex items-start gap-3 overflow-hidden"><div class="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-sm ${isActive ? 'bg-zinc-100 text-zinc-600' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-zinc-500 transition-colors'}"><i class="fas fa-chart-pie"></i></div><div class="flex flex-col"><h4 class="font-bold text-gray-800 text-sm group-hover:text-zinc-600 transition-colors flex items-center gap-2">${dash.name} ${isActive ? '<i class="fas fa-check-circle text-zinc-500 text-xs"></i>' : ''}</h4><p class="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">${dash.description || 'Dashboard pemantauan sistem.'}</p></div></div><div class="flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><i class="fas fa-cube text-gray-300"></i> ${dash.widgets ? dash.widgets.length : 0}</div></div></div>`
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
function getWidgetPipelineWithVariants(widget) {
 let pipelineStr = JSON.stringify(widget.data_config.pipeline || [])
 const activeValues = dashboardState.activeVariants?.[widget.id] || {}

 if (widget.variant_config) {
  widget.variant_config.forEach((group) => {
   const val = activeValues[group.id] || group.default
   const regex = new RegExp(`{{${group.id}}}`, 'g')
   pipelineStr = pipelineStr.replace(regex, val)
  })
 }
 return pipelineStr
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
function formatRelativeTime(dateInput) {
 if (!dateInput) return '-'

 const now = new Date()
 const date = new Date(dateInput)
 const secondsAgo = Math.floor((now - date) / 1000)

 if (secondsAgo < 0) return 'Baru saja'
 if (secondsAgo < 60) return 'Baru saja'

 const minutesAgo = Math.floor(secondsAgo / 60)
 if (minutesAgo < 60) return `${minutesAgo} menit yang lalu`

 const hoursAgo = Math.floor(minutesAgo / 60)
 if (hoursAgo < 24) return `${hoursAgo} jam yang lalu`

 const daysAgo = Math.floor(hoursAgo / 24)
 if (daysAgo < 7) return `${daysAgo} hari yang lalu`

 return date.toLocaleDateString('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
 })
}
window.refreshSingleWidget = async function (widgetId) {
 const loader = document.getElementById(`loader-${widgetId}`)
 if (loader) loader.classList.remove('opacity-0')
 try {
  const widgetConfig = dashboardState.configs[widgetId]
  const apiPipeline = getWidgetPipelineWithVariants(widgetConfig)

  const response = await apiFetch(
   `api/collections-aggregation/${widgetConfig.data_config.collection}?pipeline=${apiPipeline}`
  )
  if (!response || !response.ok) throw new Error('Network Error')
  let result = await response.json()
  if (response && response.ok) {
   result = decryptData(result.nonce, result.ciphertext)
   result = JSON.parse(result)
   const newData = result.data[0] || []
   dashboardState.data[widgetId] = newData
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
  const widgetConfig = dashboardState.configs[widgetId]
  if (widgetConfig) initWidgetDataFetcher(widgetConfig)
 } finally {
  if (loader) loader.classList.add('opacity-0')
 }
}
window.refreshAllWidgets = function () {
 Object.keys(dashboardState.configs).forEach((id) => {
  const config = dashboardState.configs[id]
  if (config.data_config.source !== 'static') {
    refreshSingleWidget(id)
  }
 })
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
 const actionsContainer = document.getElementById('fs-actions')

 const widget = dashboardState.configs[widgetId]
 const data = dashboardState.data[widgetId]

 if (!widget || !data) {
  if (typeof showToast === 'function') showToast('Data widget belum siap', 'error')
  return
 }

 if (titleEl) titleEl.innerText = widget.title
 if (descEl) descEl.innerText = widget.description || ''
 if (iconBox) iconBox.innerHTML = `<i class="${widget.icon || 'fas fa-cube'}"></i>`

 if (actionsContainer) {
  const allowVariant = widget.allow_variant || false

  const filterBtnHTML = allowVariant
   ? `
    <div class="relative">
        <button onclick="window.toggleFullscreenVariant('${widget.id}')" 
            class="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all active:scale-95 shadow-sm" 
            title="Filter Data">
            <i class="fas fa-sliders-h"></i>
        </button>

        <div id="variant-popover-${widget.id}-fs" 
                class="hidden absolute top-full right-0 mt-3 w-72 max-w-[80vw] bg-white border border-gray-200 shadow-2xl rounded-2xl z-[99999] transform transition-all animate-in fade-in slide-in-from-top-2 origin-top-right">
            
            <div class="absolute -top-1.5 right-4 w-3 h-3 bg-white border-t border-l border-gray-200 transform rotate-45"></div>

            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
                <span class="text-[10px] font-black uppercase tracking-widest text-gray-500">Filter View</span>
                <button onclick="document.getElementById('variant-popover-${widget.id}-fs').classList.add('hidden')" class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 transition-colors">
                    <i class="fas fa-times text-[10px]"></i>
                </button>
            </div>

            <div id="variant-form-${widget.id}-fs" class="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar"></div>

            <div class="p-3 border-t border-gray-100 flex gap-2">
                <button onclick="window.applyFullscreenVariant('${widget.id}')" 
                    class="w-full py-2.5 bg-zinc-600 hover:bg-zinc-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-zinc-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <span>Apply</span> <i class="fas fa-check"></i>
                </button>
            </div>
        </div>
    </div>`
   : ''

  const refreshBtnHTML = `
    <button onclick="refreshFullscreenWidget('${widget.id}')" 
        class="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all active:scale-95 shadow-sm" 
        title="Refresh Data">
        <i class="fas fa-sync-alt"></i>
    </button>
    `

  actionsContainer.innerHTML = filterBtnHTML + refreshBtnHTML
 }

 if (body) {
  body.innerHTML = ''
  renderWidgetContent(body, widget, data, true)
 }

 if (modal) {
  modal.classList.remove('hidden')
  modal.style.display = 'block'
 }
}
window.toggleFullscreenVariant = function (widgetId) {
 const popover = document.getElementById(`variant-popover-${widgetId}-fs`)
 const formContainer = document.getElementById(`variant-form-${widgetId}-fs`)
 const widget = dashboardState.configs[widgetId]

 if (!popover || !widget) return

 if (popover.classList.contains('hidden')) {
  const config = widget.variant_config || []
  const activeValues = dashboardState.activeVariants?.[widgetId] || {}

  formContainer.innerHTML = config
   .map((group) => {
    const currentValue = activeValues[group.id] || group.default
    return `
            <div class="space-y-1.5">
                <label class="text-[9px] font-black text-gray-400 uppercase tracking-widest">${group.label}</label>
                <div class="relative">
                    <select id="sel-fs-${widgetId}-${group.id}" 
                        class="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none">
                        ${group.options.map((opt) => `<option value="${opt.value}" ${currentValue == opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                    <i class="fas fa-chevron-down absolute right-3 top-3 text-[10px] text-gray-400 pointer-events-none"></i>
                </div>
            </div>`
   })
   .join('')

  popover.classList.remove('hidden')
 } else {
  popover.classList.add('hidden')
 }
}
window.applyFullscreenVariant = function (widgetId) {
 const widget = dashboardState.configs[widgetId]
 const newValues = {}

 widget.variant_config.forEach((group) => {
  const select = document.getElementById(`sel-fs-${widgetId}-${group.id}`)
  if (select) newValues[group.id] = select.value
 })

 if (!dashboardState.activeVariants) dashboardState.activeVariants = {}
 dashboardState.activeVariants[widgetId] = newValues

 document.getElementById(`variant-popover-${widgetId}-fs`).classList.add('hidden')

 refreshFullscreenWidget(widgetId)
}
window.closeWidgetFullscreen = function () {
 const modal = document.getElementById('widget-fullscreen-modal')
 if (modal) {
  modal.classList.add('hidden')
  modal.style.display = 'none'

  document.getElementById('fs-content-body').innerHTML = ''
  document.getElementById('fs-actions').innerHTML = ''
 }
}
window.refreshFullscreenWidget = async function (widgetId) {
 const widgetConfig = dashboardState.configs[widgetId]
 if (!widgetConfig) return

 const refreshBtnIcon = document.querySelector('#fs-actions button i.fa-sync-alt')
 if (refreshBtnIcon) refreshBtnIcon.classList.add('fa-spin')

 try {
  const apiPipeline = getWidgetPipelineWithVariants(widgetConfig)

  const response = await apiFetch(
   `api/collections-aggregation/${widgetConfig.data_config.collection}?pipeline=${apiPipeline}`
  )

  if (!response || !response.ok) throw new Error('Network Error')

  let result = await response.json()

  if (result.nonce && result.ciphertext) {
   result = decryptData(result.nonce, result.ciphertext)
   result = JSON.parse(result)
  }

  const newData = result.data[0] || []

  dashboardState.data[widgetId] = newData

  const fsContainer = document.getElementById('fs-content-body')
  if (fsContainer) {
   renderWidgetContent(fsContainer, widgetConfig, newData, true)
  }

  const dashboardContainer = document.getElementById(`widget-content-${widgetId}`)
  if (dashboardContainer) {
   renderWidgetContent(dashboardContainer, widgetConfig, newData, false)
  }

  showToast('Data refreshed successfully', 'success')
 } catch (e) {
  console.error(e)
  showToast('Gagal memuat data terbaru', 'error')
 } finally {
  if (refreshBtnIcon) refreshBtnIcon.classList.remove('fa-spin')
 }
}
window.closeWidgetFullscreen = function () {
 const modal = document.getElementById('widget-fullscreen-modal')
 const body = document.getElementById('fs-content-body')

 if (modal) {
  modal.classList.add('hidden')
  modal.style.display = 'none'
 }

 if (dashboardState.activeFsChart) {
  dashboardState.activeFsChart.dispose()
  dashboardState.activeFsChart = null
 }

 if (body) {
  setTimeout(() => {
   body.innerHTML = ''
  }, 300)
 }
}
window.toolsVariant = function (widgetId) {
 document.querySelectorAll('[id^="variant-popover-"]').forEach((el) => {
  if (el.id !== `variant-popover-${widgetId}`) el.classList.add('hidden')
 })
 const widget = dashboardState.configs[widgetId]
 const popover = document.getElementById(`variant-popover-${widgetId}`)
 const formContainer = document.getElementById(`variant-form-${widgetId}`)

 if (!widget || !widget.variant_config) {
  showToast('Variant Configuration Not Found', 'error')
  return
 }
 const config = widget.variant_config
 const isHidden = popover.classList.contains('hidden')

 if (isHidden) {
  const activeValues = dashboardState.activeVariants?.[widgetId] || {}

  formContainer.innerHTML = config
   .map((group) => {
    const currentValue = activeValues[group.id] || group.default
    return `
        <div >
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">${group.label}</label>
            <div class="relative">
                <select id="sel-${widgetId}-${group.id}" 
                    class="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer hover:bg-slate-100">
                    ${group.options.map((opt) => `<option value="${opt.value}" ${currentValue == opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
                <i class="fas fa-chevron-down absolute right-3 top-2.5 text-[10px] text-slate-400 pointer-events-none"></i>
            </div>
        </div>`
   })
   .join('')

  popover.classList.remove('hidden')
 } else {
  popover.classList.add('hidden')
 }
}
window.applyVariant = function (widgetId) {
 const widget = dashboardState.configs[widgetId]
 const newValues = {}

 widget.variant_config.forEach((group) => {
  const select = document.getElementById(`sel-${widgetId}-${group.id}`)
  if (select) newValues[group.id] = select.value
 })

 if (!dashboardState.activeVariants) dashboardState.activeVariants = {}
 dashboardState.activeVariants[widgetId] = newValues

 document.getElementById(`variant-popover-${widgetId}`).classList.add('hidden')
 refreshSingleWidget(widgetId)
 showToast('Filter applied successfully', 'success')
}
window.loadDashboardConfig = () => loadDashboardConfig(AppState.dashboard.activeId)
