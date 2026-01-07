import { initApp } from './modules/auth.js'
import { navigate } from './core/router.js'
import { AppState } from './core/state.js'

// --- MODULE CRUD ---
import {
 fetchTableData,
 deleteData,
 handleFormSubmit,
 editData,
 openCrudModal,
} from './modules/crud.js'

// --- MODULE SETTINGS & BUILDER ---
import {
 switchSettingsTab,
 // Fungsi Dashboard & Widget
 openWidgetEditor,
 addWidgetToBuilder,
 removeBuilderWidget,
 saveDashboardBuilder,
 fetchDashboardsFromDB,
 // Fungsi Manipulasi Canvas
 resizeWidget,
 moveWidget,
 // Fungsi Modal Konfigurasi
 editWidgetConfig,
 applyWidgetChanges,
 closeWidgetConfigModal,
 previewConfig,
 openAddDashboardModal,
 deleteDashboardConfig,
} from './modules/settings.js'

// --- UTILS ---
import { toggleSidebar, showToast, logout, closeModal } from './utils/helpers.js'

// =================================================================
// 1. INITIALIZATION
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
 initApp()
})

// =================================================================
// 2. GLOBAL EVENT LISTENERS
// =================================================================
// Handle Dynamic Forms (CRUD)
document.addEventListener('submit', async function (e) {
 if (e.target && e.target.id === 'dynamic-form') {
  e.preventDefault()
  await handleFormSubmit(e)
 }
})

// =================================================================
// 3. EXPOSE GLOBAL FUNCTIONS (Required for HTML onclick="")
// =================================================================

// Core & Nav
window.navigate = navigate
window.toggleSidebar = toggleSidebar
window.logout = logout
window.showToast = showToast
window.closeModal = closeModal

// CRUD Operations
window.fetchTableData = fetchTableData
window.deleteData = deleteData
window.editData = editData
window.openCrudModal = openCrudModal

window.changePage = (p) => {
 AppState.currentPage = p
 fetchTableData()
}

// Search Logic untuk Table (Debounce)
let searchTimer
window.doSearch = (val) => {
 clearTimeout(searchTimer)
 searchTimer = setTimeout(() => {
  AppState.searchQuery = val
  AppState.currentPage = 1
  fetchTableData()
 }, 500)
}

// --- SETTINGS & DASHBOARD BUILDER EXPORTS ---

// 1. Navigation & General
window.switchSettingsTab = switchSettingsTab
window.saveSettings = () => showToast('Konfigurasi Toko Disimpan!', 'success')

// 2. Dashboard Actions
window.openWidgetEditor = openWidgetEditor
window.saveDashboardBuilder = saveDashboardBuilder
window.fetchDashboardsFromDB = fetchDashboardsFromDB
window.openAddDashboardModal = openAddDashboardModal
window.previewConfig = previewConfig

// 3. Canvas Manipulation (Widget Actions)
window.addWidgetToBuilder = addWidgetToBuilder
window.removeBuilderWidget = removeBuilderWidget
window.resizeWidget = resizeWidget
window.moveWidget = moveWidget

// 4. Widget Configuration Modal
window.editWidgetConfig = editWidgetConfig
window.applyWidgetChanges = applyWidgetChanges
window.closeWidgetConfigModal = closeWidgetConfigModal

window.deleteDashboardConfig = deleteDashboardConfig
