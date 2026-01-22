import '@fortawesome/fontawesome-free/css/all.min.css'
import 'sweetalert2/dist/sweetalert2.min.css'
import { initApp } from './modules/auth.js'
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
} from './modules/settings_dashboard.js'

import { toggleSidebar, showToast, logout, closeModal } from './utils/helpers.js'

document.addEventListener('DOMContentLoaded', () => {
 initApp()
})

document.addEventListener('submit', async function (e) {
 if (e.target && e.target.id === 'dynamic-form') {
  e.preventDefault()
  await handleFormSubmit(e)
 }
})

window.navigate = navigate
window.toggleSidebar = toggleSidebar
window.logout = logout
window.showToast = showToast
window.closeModal = closeModal
window.fetchTableData = fetchTableData
window.deleteData = deleteData
window.editData = editData
window.openCrudModal = openCrudModal

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

window.saveSettings = () => showToast('Configuration save Succesfully', 'success')
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
window.initDashboardGenerator = initDashboardGenerator
window.switchMobileTab = switchMobileTab
window.setActiveTab = setActiveTab
window.getCurrentActiveTab = getCurrentActiveTab
window.AppState = window.AppState || {}
window.AppState.settingsActiveTab = getCurrentActiveTab

window.syncSettingsTab = (tab) => {
 if (typeof setActiveTab === 'function') {
  setActiveTab(tab)
 }
}
