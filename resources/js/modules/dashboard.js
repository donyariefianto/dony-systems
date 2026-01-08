import { apiFetch } from '../core/api.js'
import { AppState } from '../core/state.js'
import { navigate } from '../core/router.js'

export async function renderDashboardView(config, container) {
 const dashboardId = config.config?.dashboard_id || 'MAIN'

 container.innerHTML = `<div class="p-10 animate-pulse bg-gray-50 rounded-2xl h-96 w-full"></div>`

 try {
  const response = await apiFetch(`api/dashboard-snapshot?id=${dashboardId}`)
  if (!response) return

  const result = await response.json()
  const { widgets, last_updated } = result.data

  container.innerHTML = createDashboardHTML(config, widgets, last_updated)

  setTimeout(() => {
   widgets.forEach((w, i) => {
    if (w.type === 'chart') initChartComponent(`chart-${dashboardId}-${i}`, w)
   })
  }, 50)
 } catch (err) {
  container.innerHTML = `<div class="p-20 text-center font-bold text-red-400">Gagal memuat dashboard</div>`
 }
}

function createDashboardHTML(config, widgets, lastUpdated) {
 return `
        <div class="space-y-6 pb-10">
            <div class="flex justify-between items-center border-b pb-4">
                <h1 class="text-3xl font-black text-gray-900">${config.name}</h1>
                <p class="text-[10px] font-bold text-gray-400 uppercase">Updated: ${lastUpdated}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${widgets.map((w, i) => createWidgetHTML(w, config.config?.dashboard_id, i)).join('')}
            </div>
        </div>`
}

function createWidgetHTML(widget, dashboardId, index) {
 const colSpan =
  widget.width === 'full'
   ? 'md:col-span-4'
   : widget.width === 'half'
     ? 'md:col-span-2'
     : 'md:col-span-1'

 if (widget.type === 'stat') {
  return `
            <div class="${colSpan} bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition">
                <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 text-lg"><i class="fas ${widget.icon}"></i></div>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">${widget.label}</p>
                <h2 class="text-3xl font-black text-gray-900">${widget.value}</h2>
            </div>`
 }
 if (widget.type === 'chart') {
  return `
            <div class="${colSpan} bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 class="text-xs font-black text-gray-800 uppercase mb-4">${widget.label}</h3>
                <div class="h-64"><canvas id="chart-${dashboardId}-${index}"></canvas></div>
            </div>`
 }
 return ''
}

export function initChartComponent(id, widget) {
 const ctx = document.getElementById(id)
 if (!ctx) return
 if (AppState.chartInstances[id]) AppState.chartInstances[id].destroy()

 AppState.chartInstances[id] = new Chart(ctx.getContext('2d'), {
  type: widget.chartType || 'line',
  data: widget.chartData,
  options: { responsive: true, maintainAspectRatio: false },
 })
}
