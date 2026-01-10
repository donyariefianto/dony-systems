import { apiFetch } from '../core/api.js'
import { AppState } from '../core/state.js'
import { showToast } from '../utils/helpers.js'
let echartsPromise = null
let glPromise = null

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
   console.log(`${name} loaded successfully`)
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

export async function renderDashboardView(config, container) {
 clearActiveIntervals()

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

 const targetId = AppState.dashboard.activeId || AppState.user?.defaultDashboard || 'default'
 await loadDashboardConfig(targetId)
}

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

  gridContainer.innerHTML = widgetList
   .map((widget) => {
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

  widgetList.forEach((widget) => initWidgetDataFetcher(widget))
 } catch (err) {
  gridContainer.innerHTML = `<div class="col-span-full p-10 text-center bg-red-50 rounded-2xl border border-red-100"><i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i><p class="text-red-600 font-bold text-sm">Dashboard tidak ditemukan.</p><div class="mt-4 flex gap-2 justify-center"><button onclick="openDashboardSelector()" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition">Pilih Lain</button></div></div>`
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
  const filterJson = JSON.stringify({ _id: widget.id })
  const queryParams = new URLSearchParams({ page: 1, limit: 1, filter: filterJson })
  const response = await apiFetch(`api/collections/widgets?${queryParams.toString()}`)
  if (!response || !response.ok) throw new Error('Network Error')
  const result = await response.json()
  const widgetDoc = result.data ? result.data[0] : null
  const liveData = widgetDoc ? widgetDoc.data || [] : []

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

window.refreshSingleWidget = async function (widgetId) {
 const loader = document.getElementById(`loader-${widgetId}`)
 if (loader) loader.classList.remove('opacity-0')

 try {
  const response = await apiFetch(`api/collections/widgets/${widgetId}/refresh`, { method: 'POST' })
  if (response && response.ok) {
   const result = await response.json()
   const newData = result.data
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

  const widgetConfig = dashboardState.configs[widgetId]
  if (widgetConfig) initWidgetDataFetcher(widgetConfig)
 } finally {
  if (loader) loader.classList.add('opacity-0')
 }
}

window.refreshAllWidgets = function () {
 Object.keys(dashboardState.configs).forEach((id) => {
  setTimeout(() => {
   refreshSingleWidget(id)
  }, Math.random() * 1000)
 })
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
window.loadDashboardConfig = () => loadDashboardConfig(AppState.dashboard.activeId)
