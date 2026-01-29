import '@fortawesome/fontawesome-free/css/all.min.css'
import 'sweetalert2/dist/sweetalert2.min.css'
import { initApp, renderSidebar } from './modules/auth.js'
import { navigate } from './core/router.js'
import { AppState } from './core/state.js'
import {
 fetchTableData,
 deleteData,
 handleFormSubmit,
 editData,
 openCrudModal,
} from './modules/crud.js'

import { setActiveTab, getCurrentActiveTab } from './modules/settings.js'

import {
 openWidgetEditor,
 addWidgetToBuilder,
 removeBuilderWidget,
 saveDashboardBuilder,
 fetchDashboardsFromDB,
 resizeWidget,
 moveWidget,
 editWidgetConfig,
 applyWidgetChanges,
 closeWidgetConfigModal,
 previewConfig,
 openAddDashboardModal,
 deleteDashboardConfig,
 switchMobileTab,
 updateDashboardSearch,
 changeDashboardPage,
 filterWidgetLibraryOnly,
 switchConfigTab,
 initDashboardGenerator,
 triggerIconPickerSettingsDashboard,
 toggleDynamicVariantUI,
} from './modules/settings_dashboard.js'

import {
 toggleSidebar,
 showToast,
 logout,
 closeModal,
 refreshSidebarMenu,
 toggleTheme,
 initTheme,
} from './utils/helpers.js'

import { saveSettings, settingsData } from './modules/settings_general.js'

document.addEventListener('DOMContentLoaded', () => {
 const cachedName = localStorage.getItem('app_name') || 'Systems'
 const cachedShortName = localStorage.getItem('app_short_name') || 'D'
 const cachedIcon = localStorage.getItem('app_icon') || 'fa-cube'
 document.getElementById('app-short-name').innerText = cachedShortName
 document.getElementById('app-name').innerText = cachedName
 document.getElementById('splash-name').innerText = cachedName
 document.getElementById('splash-icon').className = `fas ${cachedIcon} text-white text-4xl`

 setTimeout(() => {
  const content = document.getElementById('splash-content')
  content.classList.remove('opacity-0', 'scale-95')
  content.classList.add('opacity-100', 'scale-100')
 }, 50)
 initApp()
 initTheme()
})

document.addEventListener('submit', async function (e) {
 if (e.target && e.target.id === 'dynamic-form') {
  e.preventDefault()
  await handleFormSubmit(e)
 }
})

let currentProgress = 0
let progressInterval = null

window.updateProgress = function (targetValue) {
 return new Promise((resolve) => {
  const progressBar = document.getElementById('splash-progress')
  const progressPercentage = document.getElementById('progress-percentage')

  if (!progressBar) {
   console.error('ERROR: Elemen #splash-progress tidak ditemukan!')
   return resolve()
  }

  if (progressInterval) clearInterval(progressInterval)
  progressInterval = setInterval(() => {
   if (currentProgress >= targetValue) {
    clearInterval(progressInterval)
    currentProgress = targetValue
    progressPercentage.textContent = currentProgress + '%'
    progressBar.style.width = currentProgress + '%'
    resolve()
   } else {
    currentProgress += 0.5
    progressPercentage.textContent = currentProgress + '%'
    progressBar.style.width = currentProgress + '%'
   }
  }, 10)
 })
}

window.hideSplashScreen = function () {
 const splash = document.getElementById('splash-screen')
 const content = document.getElementById('splash-content')
 if (!splash) return

 setTimeout(() => {
  if (content) {
   content.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
   content.style.opacity = '0'
   content.style.transform = 'scale(0.9) translateY(-10px)'
  }
  splash.style.opacity = '0'
  setTimeout(() => splash.remove(), 1000)
 }, 400)
}

window.changePage = (p) => {
 AppState.currentPage = p
 fetchTableData()
}

let searchTimer
window.doSearch = (val) => {
 clearTimeout(searchTimer)
 searchTimer = setTimeout(() => {
  AppState.searchQuery = val
  AppState.currentPage = 1
  fetchTableData()
 }, 500)
}
window.toggleTheme = toggleTheme
window.refreshSidebarMenu = refreshSidebarMenu
window.navigate = navigate
window.toggleSidebar = toggleSidebar
window.logout = logout
window.showToast = showToast
window.closeModal = closeModal
window.fetchTableData = fetchTableData
window.deleteData = deleteData
window.editData = editData
window.openCrudModal = openCrudModal
window.saveSettings = saveSettings
window.openWidgetEditor = openWidgetEditor
window.triggerIconPickerSettingsDashboard = triggerIconPickerSettingsDashboard
window.saveDashboardBuilder = saveDashboardBuilder
window.fetchDashboardsFromDB = fetchDashboardsFromDB
window.openAddDashboardModal = openAddDashboardModal
window.previewConfig = previewConfig
window.addWidgetToBuilder = addWidgetToBuilder
window.removeBuilderWidget = removeBuilderWidget
window.resizeWidget = resizeWidget
window.moveWidget = moveWidget
window.editWidgetConfig = editWidgetConfig
window.applyWidgetChanges = applyWidgetChanges
window.closeWidgetConfigModal = closeWidgetConfigModal
window.deleteDashboardConfig = deleteDashboardConfig
window.updateDashboardSearch = updateDashboardSearch
window.changeDashboardPage = changeDashboardPage
window.switchMobileTab = switchMobileTab
window.filterWidgetLibraryOnly = filterWidgetLibraryOnly
window.switchConfigTab = switchConfigTab
window.toggleDynamicVariantUI = toggleDynamicVariantUI
window.initDashboardGenerator = initDashboardGenerator
window.switchMobileTab = switchMobileTab
window.setActiveTab = setActiveTab
window.getCurrentActiveTab = getCurrentActiveTab
window.AppState = window.AppState || {}
window.AppState.settingsActiveTab = getCurrentActiveTab
window.settingsData = settingsData
window.syncSettingsTab = (tab) => {
 if (typeof setActiveTab === 'function') {
  setActiveTab(tab)
 }
}
