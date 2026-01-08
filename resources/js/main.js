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

import {
 switchSettingsTab,
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
} from './modules/settings.js'

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

window.switchSettingsTab = switchSettingsTab
window.saveSettings = () => showToast('Konfigurasi Toko Disimpan!', 'success')

window.openWidgetEditor = openWidgetEditor
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
