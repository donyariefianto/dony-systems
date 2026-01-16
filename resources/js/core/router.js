import { AppState } from './state.js'
import { renderTableView, fetchTableData } from '../modules/crud.js'
import { renderDashboardView } from '../modules/dashboard.js'
import { renderSettingsView } from '../modules/settings.js'
import { toggleSidebar } from '../utils/helpers.js'

export function navigate(path) {
 const cleanPath = path.replace(/^#\/?/, '')
 const config = findMenuByPath(cleanPath, AppState.menuData)

 if (!config) return

 AppState.currentModule = config
 AppState.currentPage = 1
 window.location.hash = '/' + cleanPath

 const titleEl = document.getElementById('page-title')
 if (titleEl) titleEl.innerText = config.name

 document.querySelectorAll('.menu-item').forEach((el) => {
  el.classList.toggle('menu-active', el.getAttribute('data-path') === cleanPath)
 })

 const main = document.getElementById('main-view')

 if (config.type === 'tableview') {
  renderTableView(config, main)
  fetchTableData()
 } else if (config.type === 'dashboard' || config.type === 'chartview') {
  renderDashboardView(config, main)
 } else if (config.type === 'settings') {
  renderSettingsView(config, main)
 } else {
  main.innerHTML = `<div class="p-20 text-center text-gray-400">Modul ${config.name} belum tersedia.</div>`
 }

 if (window.innerWidth < 1024) toggleSidebar()
 Object.values(AppState.chartInstances).forEach((inst) => inst && inst.destroy())
 AppState.chartInstances = {}
}

function findMenuByPath(path, menus) {
 if (!menus) return null
 for (const m of menus) {
  if (m.path === path) return m
  if (m.sub_sidemenu) {
   const found = findMenuByPath(path, m.sub_sidemenu)
   if (found) return found
  }
 }
 return null
}
