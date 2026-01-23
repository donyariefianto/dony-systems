import { apiFetch } from '../core/api.js'
import { AppState } from '../core/state.js'
import { showToast, showConfirmDialog, decryptData } from '../utils/helpers.js'
import { WidgetRegistry } from '../config/WidgetRegistry.js'
import { WidgetConfigBuilder } from '../utils/WidgetConfigBuilder.js'
import { iconPicker } from '../utils/icon_picker.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'

let activeMobileTab = 'editor'
let dashboardListState = {
 page: 1,
 limit: 10,
 search: '',
 totalPages: 1,
}
const MAX_WIDGET_LIMIT = 10
let currentEditingIndex = null

function escapeHtml(text) {
 const div = document.createElement('div')
 div.textContent = text
 return div.innerHTML
}

function initMobileNavDrag() {
 const nav = document.getElementById('dashboard-mobile-nav')
 const handle = document.getElementById('mob-nav-handle')

 if (!nav || !handle) {
  console.warn('Mobile Nav elements not found, retrying...')

  setTimeout(initMobileNavDrag, 1000)
  return
 }

 let isDragging = false
 let startY = 0
 let startTop = 0
 let screenHeight = window.innerHeight

 function preventDefault(e) {
  if (e.cancelable) e.preventDefault()
 }

 handle.addEventListener(
  'touchstart',
  (e) => {
   isDragging = true

   const touch = e.touches[0]
   startY = touch.clientY

   const rect = nav.getBoundingClientRect()
   startTop = rect.top

   nav.style.transform = 'none'
   nav.style.top = startTop + 'px'

   nav.style.transition = 'none'

   document.body.style.overflow = 'hidden'
  },
  { passive: false }
 )

 document.addEventListener(
  'touchmove',
  (e) => {
   if (!isDragging) return
   preventDefault(e)

   const touch = e.touches[0]
   const deltaY = touch.clientY - startY
   let newTop = startTop + deltaY

   const maxTop = screenHeight - nav.offsetHeight - 20
   const minTop = 60

   if (newTop < minTop) newTop = minTop
   if (newTop > maxTop) newTop = maxTop

   nav.style.top = `${newTop}px`
  },
  { passive: false }
 )

 document.addEventListener('touchend', () => {
  if (!isDragging) return
  isDragging = false

  document.body.style.overflow = ''

  nav.style.transition = 'opacity 0.2s ease'
 })

 window.addEventListener('resize', () => {
  screenHeight = window.innerHeight
 })
}

function renderFilesPanel() {
 return `
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

            <div id="saved-dashboards-list" class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 min-h-0 bg-white"></div>

            <div id="dashboard-pagination" class="shrink-0 h-12 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm flex items-center justify-between px-3 lg:mb-0 mb-20"></div>
        </div>
    `
}

function dragElement(elmnt) {
 let pos1 = 0,
  pos2 = 0,
  pos3 = 0,
  pos4 = 0

 const header = document.getElementById('widget-config-header')

 if (header) {
  header.onmousedown = dragStart

  header.ontouchstart = dragStart
 } else {
  elmnt.onmousedown = dragStart
  elmnt.ontouchstart = dragStart
 }

 function dragStart(e) {
  const evt = e.type === 'touchstart' ? e.touches[0] : e

  const targetTag = e.target.tagName

  if (['INPUT', 'TEXTAREA', 'BUTTON', 'I'].includes(targetTag)) {
   return
  }

  pos3 = evt.clientX
  pos4 = evt.clientY

  if (e.type === 'touchstart') {
   document.ontouchend = closeDragElement
   document.ontouchmove = elementDrag
  } else {
   e.preventDefault()
   document.onmouseup = closeDragElement
   document.onmousemove = elementDrag
  }
 }

 function elementDrag(e) {
  if (e.cancelable) e.preventDefault()

  const evt = e.type === 'touchmove' ? e.touches[0] : e

  pos1 = pos3 - evt.clientX
  pos2 = pos4 - evt.clientY
  pos3 = evt.clientX
  pos4 = evt.clientY

  elmnt.style.top = elmnt.offsetTop - pos2 + 'px'
  elmnt.style.left = elmnt.offsetLeft - pos1 + 'px'

  elmnt.style.position = 'fixed'
  elmnt.style.margin = '0'
  elmnt.style.transform = 'none'
 }

 function closeDragElement() {
  document.onmouseup = null
  document.onmousemove = null
  document.ontouchend = null
  document.ontouchmove = null
 }
}

function renderEditorPanel() {
 return `
        <div id="panel-editor" class="w-full flex-1 flex-col bg-gray-100/50 h-full hidden lg:flex relative z-10 min-w-0">
            <div class="h-12 bg-white border-b border-gray-200 flex justify-between items-center px-4 shadow-[0_2px_4px_rgba(0,0,0,0.02)] z-30 shrink-0">
                <div class="flex items-center gap-3 min-w-0">
                    <h2 id="editing-dashboard-name" class="text-xs font-black text-gray-800 uppercase tracking-wide truncate max-w-[200px]">Select Dashboard</h2>
                    <div class="h-4 w-px bg-gray-300"></div>
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
    `
}

function renderToolsPanel() {
 return `
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
    `
}

function renderMobileNavigation() {
 return `
        <div id="dashboard-mobile-nav" class="lg:hidden fixed right-3 top-1/2 z-50 flex flex-col gap-2 items-center touch-none transition-opacity duration-200">
            
            <div id="mob-nav-handle" class="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-move active:bg-black/40 shadow-sm mb-1">
                <i class="fas fa-grip-lines text-white text-[10px] opacity-70"></i>
            </div>
            
            <div class="flex flex-col gap-3 pointer-events-auto">
                <button onclick="window.switchMobileTab('files')" id="mob-btn-files" 
                        class="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-gray-100 transition-all duration-300 backdrop-blur-md bg-white/90">
                    <i class="fas fa-folder text-xs"></i>
                </button>
                
                <button onclick="window.switchMobileTab('editor')" id="mob-btn-editor" 
                        class="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-gray-100 transition-all duration-300 backdrop-blur-md bg-white/90">
                    <i class="fas fa-pen-nib text-xs"></i>
                </button>
                
                <button onclick="window.switchMobileTab('tools')" id="mob-btn-tools" 
                        class="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-gray-100 transition-all duration-300 backdrop-blur-md bg-white/90">
                    <i class="fas fa-th-large text-xs"></i>
                </button>
            </div>
            
            <div id="mob-nav-indicator" class="absolute right-14 top-10 w-24 flex items-center justify-end pointer-events-none opacity-0 transition-opacity">
               <span class="bg-gray-800 text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider">Editor</span>
            </div>
        </div>
    `
}

function renderWidgetConfigModal() {
 return `
        <div id="widget-config-modal" class="fixed top-24 right-4 md:right-8 lg:right-10 z-[100] w-[90vw] md:w-[380px] lg:w-[420px] bg-white shadow-2xl rounded-2xl border border-gray-200 flex flex-col hidden max-h-[80vh] transition-all duration-200 animate-in fade-in zoom-in-95">
            
            <div id="widget-config-header" class="h-12 border-b border-gray-100 flex justify-between items-center px-5 bg-gray-50 rounded-t-2xl shrink-0 cursor-move select-none group">
                <div class="flex items-center gap-2 pointer-events-none">
                    <div class="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                        <i class="fas fa-sliders-h text-[10px]"></i>
                    </div>
                    <h3 class="font-bold text-gray-700 text-xs uppercase tracking-widest group-hover:text-blue-600 transition-colors">Properties</h3>
                </div>
                <button onclick="closeWidgetConfigModal()" class="w-7 h-7 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
            
            <div id="widget-config-form" class="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-white"></div>
            
            <div class="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:pb-5">
                <button onclick="applyWidgetChanges()" class="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg font-bold uppercase text-[10px] tracking-widest shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                    <i class="fas fa-check-circle"></i> Apply Changes
                </button>
            </div>
        </div>
    `
}

function renderSavedDashboardsList() {
 const container = document.getElementById('saved-dashboards-list')
 const paginationContainer = document.getElementById('dashboard-pagination')

 if (!container || !AppState.dbDashboards?.data) {
  if (container)
   container.innerHTML =
    '<div class="p-8 text-center text-[10px] text-gray-400 font-bold uppercase">Loading...</div>'
  return
 }

 const filtered = AppState.dbDashboards.data.filter((d) =>
  d.name.toLowerCase().includes(dashboardListState.search)
 )

 dashboardListState.totalPages = Math.max(1, Math.ceil(filtered.length / dashboardListState.limit))
 const startIndex = (dashboardListState.page - 1) * dashboardListState.limit
 const paginatedItems = filtered.slice(startIndex, startIndex + dashboardListState.limit)

 if (paginatedItems.length === 0) {
  container.innerHTML =
   '<div class="p-8 text-center text-[10px] text-gray-400 font-bold uppercase">Data Kosong</div>'
 } else {
  container.innerHTML = paginatedItems
   .map(
    (d) => `
        <div onclick="openWidgetEditor('${d._id}', '${d.name}'); switchMobileTab('editor');" 
                class="group flex items-center justify-between pl-3 pr-2 lg:px-3 py-3 lg:py-2 rounded-lg cursor-pointer transition-all border border-transparent hover:bg-gray-50 ${AppState.currentEditingDashboardId === d._id ? 'bg-blue-50 border-blue-200' : 'border-b border-gray-50 lg:border-none'}">
            
            <div class="flex items-center gap-3 overflow-hidden flex-1">
                <i class="fas fa-chart-pie text-[10px] ${AppState.currentEditingDashboardId === d._id ? 'text-blue-500' : 'text-gray-300'}"></i>
                <span class="text-[11px] font-bold text-gray-700 truncate uppercase w-full">${d.name}</span>
            </div>

            <button onclick="event.stopPropagation(); deleteDashboardConfig('${d._id}', '${d.name}')" 
                    class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors z-10 shrink-0" 
                    title="Hapus Dashboard">
                <i class="fas fa-trash-alt text-xs"></i>
            </button>
        </div>
    `
   )
   .join('')
 }

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

function updateMobileViewVisibility() {
 const isDesktop = window.innerWidth >= 1024
 const files = document.getElementById('panel-files')
 const editor = document.getElementById('panel-editor')
 const tools = document.getElementById('panel-tools')

 if (!files || !editor || !tools) return

 if (isDesktop) {
  files.className =
   'w-full lg:w-72 flex-col border-r border-gray-200 bg-white h-full hidden lg:flex z-20 shrink-0'
  editor.className =
   'w-full flex-1 flex-col bg-gray-100/50 h-full hidden lg:flex relative z-10 min-w-0'
  tools.className =
   'w-full lg:w-72 flex-col border-l border-gray-200 bg-white h-full hidden lg:flex z-20 shrink-0'
 } else {
  const editorBase = 'w-full flex-col h-full absolute inset-0 bg-gray-50 z-10 flex'
  const overlayBase =
   'w-full flex-col h-full absolute inset-0 bg-white z-20 animate-in slide-in-from-bottom-5 fade-in duration-300'

  files.className = 'hidden'
  tools.className = 'hidden'

  editor.className = editorBase

  if (activeMobileTab === 'files') {
   files.className = overlayBase + ' flex'
  } else if (activeMobileTab === 'tools') {
   tools.className = overlayBase + ' flex'
  } else {
  }
 }

 const btnFiles = document.getElementById('mob-btn-files')
 const btnTools = document.getElementById('mob-btn-tools')
 const btnEditor = document.getElementById('mob-btn-editor')

 if (btnFiles && btnTools && btnEditor) {
  const activeClass = 'bg-gray-900 text-white shadow-xl scale-110 ring-2 ring-white ring-offset-2'

  const inactiveClass = 'bg-white/90 text-gray-400 hover:text-gray-600 hover:bg-white'

  btnFiles.className = `w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-gray-100 transition-all duration-300 backdrop-blur-md ${activeMobileTab === 'files' ? activeClass : inactiveClass}`
  btnEditor.className = `w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-gray-100 transition-all duration-300 backdrop-blur-md ${activeMobileTab === 'editor' ? activeClass : inactiveClass}`
  btnTools.className = `w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-gray-100 transition-all duration-300 backdrop-blur-md ${activeMobileTab === 'tools' ? activeClass : inactiveClass}`
 }
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

export function renderDashboardGenerator() {
 return `
    <div class="flex flex-col lg:flex-row h-full w-full bg-white relative overflow-hidden group/dashboard">
        ${renderFilesPanel()}
        ${renderEditorPanel()}
        ${renderToolsPanel()}
        ${renderMobileNavigation()}
        ${renderWidgetConfigModal()}
    </div>
    `
}

export function updateDashboardSearch(val) {
 dashboardListState.search = val.toLowerCase()
 dashboardListState.page = 1
 renderSavedDashboardsList()
}

export function changeDashboardPage(newPage) {
 if (newPage < 1 || newPage > dashboardListState.totalPages) return
 dashboardListState.page = newPage
 renderSavedDashboardsList()
}

export async function deleteDashboardConfig(id, name) {
 const isConfirmed = await showConfirmDialog({
  title: 'Hapus Dashboard?',
  text: `Anda akan menghapus dashboard "${name}". Data konfigurasi widget di dalamnya akan hilang permanen.`,
  icon: 'warning',
  confirmText: 'Ya, Hapus Permanen',
  cancelText: 'Batal',
  dangerMode: true,
 })

 if (!isConfirmed) return

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
   if (AppState.currentEditingDashboardId === id) {
    AppState.currentEditingDashboardId = null
    AppState.tempBuilderWidgets = []

    document.getElementById('editing-dashboard-name').innerText = 'Select Dashboard'
    const emptyState = document.getElementById('generator-empty-state')
    if (emptyState) emptyState.style.opacity = '1'

    renderBuilderWidgets()
   }

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

export function switchMobileTab(tab) {
 activeMobileTab = tab
 updateMobileViewVisibility()
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
                            <i class="${w.icon}"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h5 class="text-[10px] font-bold text-gray-700 group-hover:text-blue-700 truncate">${w.name}</h5>
                            <p class="text-[8px] text-gray-400 truncate leading-tight">${w.desc}</p>
                        </div>
                        <div class="w-5 h-5 rounded hover:bg-blue-50 text-gray-300 group-hover:text-blue-500 flex items-center justify-center transition-colors">
                            <i class="fas fa-plus text-[9px]"></i>
                        </div>
                    </div>`
                 )
                 .join('')}
            </div>
        </div>`
  })
  .join('')
}

export function filterWidgetLibraryOnly(val) {
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

export async function addWidgetToBuilder(key) {
 if (!AppState.currentEditingDashboardId) {
  const confirmed = await showConfirmDialog({
   title: 'Dashboard Belum Dipilih',
   text: 'Anda harus memilih atau membuat dashboard terlebih dahulu sebelum menambahkan widget.',
   confirmText: 'Buat Dashboard Baru',
   icon: 'info',
  })

  if (confirmed) {
   openAddDashboardModal()
  }
  return
 }

 if (AppState.tempBuilderWidgets.length >= MAX_WIDGET_LIMIT) {
  Swal.fire({
   icon: 'error',
   title: 'Batas Tercapai',
   text: `Maksimal ${MAX_WIDGET_LIMIT} widget diperbolehkan!`,
   confirmButtonColor: '#2563eb',
  })
  return
 }

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

export function renderBuilderWidgets() {
 const container = document.getElementById('builder-widgets-container')
 const emptyState = document.getElementById('generator-empty-state')

 if (!container) return

 if (!AppState.tempBuilderWidgets || AppState.tempBuilderWidgets.length === 0) {
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
   if (w.type === 'label' || w.type === 'table') {
    accent = 'border-l-4 border-l-orange-300 border-y border-r border-gray-200'
    iconColor = 'text-orange-500'
   } else if (w.type === 'chart') {
    let borderClass = 'border-l-emerald-300'
    let textClass = 'text-emerald-500'
    if (w.subtype.includes('line')) {
     borderClass = 'border-l-blue-300'
     textClass = 'text-blue-500'
    } else if (w.subtype.includes('bar')) {
     borderClass = 'border-l-emerald-300'
     textClass = 'text-emerald-500'
    } else if (w.subtype.includes('pie')) {
     borderClass = 'border-l-yellow-300'
     textClass = 'text-yellow-500'
    } else if (w.subtype.includes('scatter')) {
     borderClass = 'border-l-lime-300'
     textClass = 'text-lime-500'
    } else if (w.subtype.includes('radar')) {
     borderClass = 'border-l-indigo-300'
     textClass = 'text-indigo-500'
    }
    if (w.subtype.includes('tree') || w.subtype.includes('sankey')) {
     borderClass = 'border-l-purple-300'
     textClass = 'text-purple-500'
    }
    if (
     w.subtype == 'bar3d_dataset' ||
     w.subtype == 'bar3d_simplex' ||
     w.subtype == 'scatter3d_basic' ||
     w.subtype == 'line3d_ortho'
    ) {
     borderClass = 'border-l-rose-300'
     textClass = 'text-rose-500'
    }
    accent = `border-y border-r border-l-4 border-y-gray-200 border-r-gray-200 ${borderClass}`
    iconColor = textClass
   } else {
    accent = 'border-l-4 border-l-emerald-400 border-y border-r border-gray-300'
    iconColor = 'text-emerald-500'
   }

   return `
    <div class="${colSpan} bg-white rounded-lg ${accent} shadow-sm transition-all duration-300 group relative flex flex-col overflow-hidden hover:shadow-md animate-in fade-in zoom-in-95">
        <div class="p-3 flex-1">
            <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2 overflow-hidden">
                    <i class="${w.icon || 'fas fa-cube'} ${iconColor} text-[10px]"></i>
                    <div class="min-w-0">
                        <h3 class="text-[10px] font-bold text-gray-700 uppercase tracking-tight truncate w-full" title="${w.title}">${w.title || 'Untitled'}</h3>
                        <p class="text-[8px] text-gray-400 font-mono flex gap-1 mt-0.5">
                            <span class="bg-gray-50 px-1 rounded">${w.type}</span>
                            <span class="bg-gray-50 px-1 rounded">${w.subtype}</span>
                        </p>
                    </div>
                </div>
            </div>
            <div class="text-[9px] text-gray-400 font-mono truncate border-t border-dashed border-gray-100 pt-1.5 mt-1.5">
                <i class="fas fa-database mr-1"></i> ${w.collection || 'No Collection'}
            </div>
        </div>
        <div class="h-7 bg-gray-50 border-t border-gray-100 flex items-center divide-x divide-gray-200 opacity-80 hover:opacity-100 transition-opacity">
            <button onclick="resizeWidget(${idx})" class="flex-1 hover:bg-white text-gray-500 hover:text-blue-600 text-[8px] font-bold transition-colors h-full flex items-center justify-center gap-1">
                <i class="fas fa-expand-alt"></i> Size
            </button>
            <button onclick="editWidgetConfig(${idx})" class="flex-1 hover:bg-white text-gray-500 hover:text-orange-500 text-[8px] font-bold transition-colors h-full flex items-center justify-center gap-1">
                <i class="fas fa-cog"></i> Edit
            </button>
            <div class="flex w-14">
                <button onclick="moveWidget(${idx}, -1)" class="flex-1 hover:bg-white hover:text-gray-800 text-gray-400 text-[8px] h-full ${idx === 0 ? 'opacity-30' : ''}" ${idx === 0 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button onclick="moveWidget(${idx}, 1)" class="flex-1 hover:bg-white hover:text-gray-800 text-gray-400 text-[8px] h-full ${idx === totalWidgets - 1 ? 'opacity-30' : ''}" ${idx === totalWidgets - 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <button onclick="removeBuilderWidget(${idx})" class="w-7 hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors h-full">
                <i class="fas fa-times text-[9px]"></i>
            </button>
        </div>
    </div>`
  })
  .join('')
}

export function removeBuilderWidget(index) {
 if (AppState.tempBuilderWidgets && AppState.tempBuilderWidgets[index]) {
  AppState.tempBuilderWidgets.splice(index, 1)
  renderBuilderWidgets()
 }
}

export function resizeWidget(index) {
 if (!AppState.tempBuilderWidgets || !AppState.tempBuilderWidgets[index]) return

 const sizes = ['quarter', 'half', 'full']
 const current = AppState.tempBuilderWidgets[index].width
 const nextIndex = (sizes.indexOf(current) + 1) % sizes.length
 AppState.tempBuilderWidgets[index].width = sizes[nextIndex]
 renderBuilderWidgets()
}

export function moveWidget(index, direction) {
 if (!AppState.tempBuilderWidgets) return

 const newIndex = index + direction
 if (newIndex < 0 || newIndex >= AppState.tempBuilderWidgets.length) return

 const temp = AppState.tempBuilderWidgets[index]
 AppState.tempBuilderWidgets[index] = AppState.tempBuilderWidgets[newIndex]
 AppState.tempBuilderWidgets[newIndex] = temp
 renderBuilderWidgets()
}

export function editWidgetConfig(index) {
 if (!AppState.tempBuilderWidgets || !AppState.tempBuilderWidgets[index]) return

 currentEditingIndex = index
 const widget = AppState.tempBuilderWidgets[index]

 const formContainer = document.getElementById('widget-config-form')
 const modal = document.getElementById('widget-config-modal')

 if (!formContainer || !modal) return

 const currentConfig = widget.data_config || {}
 const source = currentConfig.source || 'static'

 const valCollection =
  source === 'database'
   ? currentConfig.collection || widget.collection || ''
   : widget.collection || ''
 const valPipeline =
  source === 'database'
   ? JSON.stringify(currentConfig.pipeline || [{ $match: {} }], null, 2)
   : '[\n  { "$match": {} }\n]'
 const valStatic =
  source === 'static'
   ? JSON.stringify(currentConfig.static_data || [{ label: 'Data', value: 0 }], null, 2)
   : '[\n  { "label": "Contoh", "value": 100 }\n]'

 let echartsOptionsValue = '{}'
 if (widget.echarts_options) {
  try {
   echartsOptionsValue = JSON.stringify(widget.echarts_options, null, 2)
  } catch (e) {
   echartsOptionsValue = '{}'
  }
 }

 formContainer.innerHTML = `
        <div class="space-y-5">
            <div class="space-y-3">
                <div>
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Title</label>
                    <input type="text" id="conf-title" 
                        value="${escapeHtml(widget.title || '')}" 
                        class="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 outline-none focus:border-blue-500 transition-all placeholder:font-normal">
                </div>

                <div>
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                    <input type="text" id="conf-desc" 
                        value="${escapeHtml(widget.description || '')}" 
                        class="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 outline-none focus:border-blue-500 transition-all placeholder:font-normal">
                </div>

                <div>
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Icon</label>
                    <div class="flex gap-2">
                        
                        <div id="preview-conf-icon" 
                            class="shrink-0 w-[38px] h-[38px] rounded-lg bg-slate-50 border border-gray-200 flex items-center justify-center text-slate-500 shadow-sm transition-all duration-300">
                            <i class="${widget.icon || 'fas fa-icons'} text-sm"></i>
                        </div>
                        
                        <div class="relative flex-1 group">
                            <input type="text" 
                                id="conf-icon" 
                                value="${escapeHtml(widget.icon || 'fas fa-icons')}"
                                readonly
                                onclick="triggerIconPickerSettingsDashboard('conf-icon')"
                                class="w-full p-2.5 pr-8 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-50 transition-all placeholder:font-normal"
                                placeholder="Select icon...">
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div class="space-y-1.5">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Width</label>
                    <select id="conf-width" class="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-blue-500">
                        <option value="quarter" ${widget.width === 'quarter' ? 'selected' : ''}>Quarter (1/4)</option>
                        <option value="half" ${widget.width === 'half' ? 'selected' : ''}>Half (1/2)</option>
                        <option value="full" ${widget.width === 'full' ? 'selected' : ''}>Full (1/1)</option>
                    </select>
                </div>
                <div class="space-y-1.5">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Refresh (Detik)</label>
                    <input type="number" id="conf-refresh" value="${widget.refresh_interval || 0}" min="0" class="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-700 outline-none focus:border-blue-500">
                </div>
            </div>

            <hr class="border-gray-100">

            <div class="space-y-3">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Source</label>
                
                <div class="flex p-1 bg-gray-100 rounded-xl">
                    <button type="button" onclick="switchConfigTab('static')" id="btn-source-static" class="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${source === 'static' ? 'bg-white shadow text-blue-600 border border-gray-100' : 'text-gray-500 hover:text-gray-700'}">
                        <i class="fas fa-code mr-1"></i> Static
                    </button>
                    <button type="button" onclick="switchConfigTab('database')" id="btn-source-db" class="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${source === 'database' ? 'bg-white shadow text-blue-600 border border-gray-100' : 'text-gray-500 hover:text-gray-700'}">
                        <i class="fas fa-database mr-1"></i> Database
                    </button>
                </div>
                <input type="hidden" id="conf-source" value="${source}">

                <div id="panel-config-static" class="${source === 'static' ? '' : 'hidden'} space-y-2 animate-in fade-in">
                    <div class="flex justify-between items-center">
                         <label class="text-[10px] font-bold text-gray-400 uppercase">JSON Data</label>
                         <span class="text-[9px] text-blue-500 cursor-pointer hover:underline">Lihat format</span>
                    </div>
                    <textarea id="conf-static-json" rows="8" class="w-full bg-[#1e293b] text-green-400 p-3 text-[10px] font-mono border-none rounded-lg outline-none resize-none custom-scrollbar leading-relaxed shadow-inner">${escapeHtml(valStatic)}</textarea>
                </div>

                <div id="panel-config-db" class="${source === 'database' ? '' : 'hidden'} space-y-4 animate-in fade-in">
                    <div class="space-y-1.5">
                        <label class="text-[10px] font-bold text-gray-400 uppercase">Collection Name</label>
                        <div class="relative">
                            <i class="fas fa-table absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                            <input type="text" id="conf-collection" value="${escapeHtml(valCollection)}" placeholder="e.g. transactions" class="w-full pl-8 p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-700 outline-none focus:border-blue-500">
                        </div>
                    </div>
                    
                    <div class="space-y-1.5">
                        <div class="flex justify-between items-center">
                             <label class="text-[10px] font-bold text-gray-400 uppercase">Aggregation Pipeline</label>
                        </div>
                        <textarea id="conf-pipeline" rows="6" class="w-full bg-[#1e293b] text-orange-300 p-3 text-[10px] font-mono border-none rounded-lg outline-none resize-none custom-scrollbar leading-relaxed shadow-inner">${escapeHtml(valPipeline)}</textarea>
                    </div>
                </div>
            </div>

            <hr class="border-gray-100">

            <div class="space-y-3">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">ECharts Configuration</label>
                <div class="space-y-1.5">
                    <div class="flex justify-between items-center">
                         <label class="text-[10px] font-bold text-gray-400 uppercase">ECharts Options</label>
                    </div>
                    <textarea id="conf-echarts-options" rows="10" class="w-full bg-[#1e293b] text-blue-300 p-3 text-[10px] font-mono border-none rounded-lg outline-none resize-none custom-scrollbar leading-relaxed shadow-inner">${escapeHtml(echartsOptionsValue)}</textarea>
                </div>
            </div>
        </div>`

 modal.classList.remove('hidden')

 dragElement(modal)
}

export function closeWidgetConfigModal() {
 const modal = document.getElementById('widget-config-modal')
 if (modal) {
  modal.classList.add('hidden')
 }
 currentEditingIndex = null
}

export function applyWidgetChanges() {
 if (
  currentEditingIndex === null ||
  !AppState.tempBuilderWidgets ||
  !AppState.tempBuilderWidgets[currentEditingIndex]
 ) {
  showToast('No widget selected for editing', 'error')
  return
 }

 const title = document.getElementById('conf-title')?.value || ''
 const desc = document.getElementById('conf-desc')?.value || ''
 const icon = document.getElementById('conf-icon')?.value || ''
 const width = document.getElementById('conf-width')?.value || 'half'
 const refresh = parseInt(document.getElementById('conf-refresh')?.value) || 0
 const source = document.getElementById('conf-source')?.value || 'static'

 let newDataConfig = {}
 let collectionName = ''

 try {
  if (source === 'static') {
   const jsonStr = document.getElementById('conf-static-json')?.value || '[]'
   const parsedData = JSON.parse(jsonStr)
   newDataConfig = WidgetConfigBuilder.staticData(parsedData)
  } else {
   collectionName = document.getElementById('conf-collection')?.value || ''
   const pipeStr = document.getElementById('conf-pipeline')?.value || '[]'

   if (!collectionName.trim()) throw new Error('Collection name wajib diisi')

   const parsedPipe = JSON.parse(pipeStr)
   if (!Array.isArray(parsedPipe)) throw new Error('Pipeline harus berupa Array []')

   newDataConfig = WidgetConfigBuilder.database(collectionName, parsedPipe)
  }
 } catch (e) {
  showToast(`Format Error: ${e.message}`, 'error')
  return
 }

 const target = AppState.tempBuilderWidgets[currentEditingIndex]
 target.title = title
 target.description = desc
 target.icon = icon
 target.width = width
 target.refresh_interval = refresh
 target.collection = collectionName
 target.data_config = newDataConfig

 try {
  const echartsStr = document.getElementById('conf-echarts-options')?.value || '{}'
  target.echarts_options = JSON.parse(echartsStr)
 } catch (e) {
  console.warn('Invalid ECharts JSON, using default')
  target.echarts_options = {}
 }

 renderBuilderWidgets()
 closeWidgetConfigModal()
 showToast('Widget Updated', 'success')
}

export function switchConfigTab(mode) {
 const btnStatic = document.getElementById('btn-source-static')
 const btnDb = document.getElementById('btn-source-db')
 const panelStatic = document.getElementById('panel-config-static')
 const panelDb = document.getElementById('panel-config-db')
 const inputSource = document.getElementById('conf-source')

 if (!btnStatic || !btnDb || !panelStatic || !panelDb || !inputSource) return

 inputSource.value = mode

 if (mode === 'static') {
  btnStatic.className =
   'flex-1 py-2 rounded-lg text-[10px] font-bold transition-all bg-white shadow text-blue-600 border border-gray-100'
  btnDb.className =
   'flex-1 py-2 rounded-lg text-[10px] font-bold transition-all text-gray-500 hover:text-gray-700'
  panelStatic.classList.remove('hidden')
  panelDb.classList.add('hidden')
 } else {
  btnDb.className =
   'flex-1 py-2 rounded-lg text-[10px] font-bold transition-all bg-white shadow text-blue-600 border border-gray-100'
  btnStatic.className =
   'flex-1 py-2 rounded-lg text-[10px] font-bold transition-all text-gray-500 hover:text-gray-700'
  panelDb.classList.remove('hidden')
  panelStatic.classList.add('hidden')
 }
}

export async function saveDashboardBuilder() {
 if (!AppState.currentEditingDashboardId) {
  openAddDashboardModal()
  return
 }

 const id = AppState.currentEditingDashboardId
 const nameElement = document.getElementById('editing-dashboard-name')
 const name = nameElement ? nameElement.innerText : 'Unnamed Dashboard'

 const payload = {
  widgets: (AppState.tempBuilderWidgets || []).map((w, index) => ({
   id: w.id || `widget_${index}`,
   type: w.type || 'stat',
   subtype: w.subtype || 'basic',
   title: w.title || 'Untitled Widget',
   description: w.description || '',
   icon: w.icon || 'fa-cube',
   width: w.width || 'half',
   position: index + 1,
   collection: w.collection || '',
   refresh_interval: w.refresh_interval || 0,
   echarts_options: w.echarts_options || {},
   data_config: w.data_config || WidgetConfigBuilder.staticData([{ label: 'Data', value: 0 }]),
   updated_at: w.updated_at || new Date().toISOString(),
  })),
 }

 try {
  const response = await apiFetch(`api/collections/dashboard_settings/${id}`, {
   method: 'PUT',
   headers: {
    'Content-Type': 'application/json',
   },
   body: JSON.stringify(payload),
  })

  if (response && response.ok) {
   showToast('Dashboard Saved!', 'success')
   await fetchDashboardsFromDB()
  } else {
   throw new Error('Failed to save dashboard')
  }
 } catch (e) {
  console.error('Save failed:', e)
  showToast('Save failed: ' + e.message, 'error')
 }
}

export async function fetchDashboardsFromDB() {
 try {
  const response = await apiFetch('api/collections/dashboard_settings')
  if (response) {
   let data = await response.json()
   data = decryptData(data.nonce, data.ciphertext)
   AppState.dbDashboards = JSON.parse(data)
   renderSavedDashboardsList()
  }
 } catch (e) {
  console.error('Failed to fetch dashboards:', e)
  showToast('Failed to load dashboards', 'error')
 }
}

export async function openWidgetEditor(id, name) {
 try {
  const response = await apiFetch(`api/collections/dashboard_settings/${id}`)
  if (!response) {
   showToast('Failed to load dashboard', 'error')
   return
  }

  let data = await response.json()
  data = decryptData(data.nonce, data.ciphertext)
  data = JSON.parse(data)

  AppState.currentEditingDashboardId = id
  const rawWidgets = data.widgets || []

  AppState.tempBuilderWidgets = rawWidgets.map((w) => ({
   ...w,
   width: w.width || 'half',
   icon: w.icon || 'fa-cube',
  }))

  const nameElement = document.getElementById('editing-dashboard-name')
  if (nameElement) nameElement.innerText = name

  const emptyState = document.getElementById('generator-empty-state')
  if (emptyState) emptyState.style.opacity = '0'

  renderBuilderWidgets()
  renderSavedDashboardsList()
  showToast(`Loaded: ${name}`)
 } catch (e) {
  console.error('Error loading dashboard:', e)
  showToast('Error loading dashboard', 'error')
 }
}

export async function triggerIconPickerSettingsDashboard(fieldName) {
 await iconPicker.open((selectedIcon) => {
  const inputEl = document.getElementById(`${fieldName}`)
  if (inputEl) inputEl.value = selectedIcon

  const previewEl = document.getElementById(`preview-${fieldName}`)
  if (previewEl) {
   previewEl.innerHTML = `<i class="${selectedIcon}"></i>`
   previewEl.classList.add('bg-blue-50', 'border-blue-200')
  }
 })
}

export async function openAddDashboardModal() {
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
    </div>`,
  showCancelButton: true,
  confirmButtonColor: '#2563eb',
  cancelButtonColor: '#9ca3af',
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
  preConfirm: () => {
   const nameInput = document.getElementById('swal-dash-name')
   const descInput = document.getElementById('swal-dash-desc')

   const name = nameInput ? nameInput.value.trim() : ''
   const desc = descInput ? descInput.value.trim() : ''

   if (!name) {
    Swal.showValidationMessage('Nama dashboard wajib diisi!')
    return false
   }
   return { name, desc }
  },
 })

 if (!formValues) return

 const { name, desc } = formValues
 const payload = {
  name: name,
  description: desc,
  widgets: [],
 }

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
   headers: {
    'Content-Type': 'application/json',
   },
   body: JSON.stringify(payload),
  })

  if (response && response.ok) {
   const result = await response.json()
   Swal.close()
   showToast('Dashboard berhasil dibuat!', 'success')
   await fetchDashboardsFromDB()
   await openWidgetEditor(result.insertedId, name)
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
 if (!AppState.currentEditingDashboardId || !AppState.tempBuilderWidgets) {
  showToast('No dashboard selected', 'error')
  return
 }

 const id = AppState.currentEditingDashboardId
 const nameElement = document.getElementById('editing-dashboard-name')
 const name = nameElement ? nameElement.innerText : 'Unnamed Dashboard'
 const timestamp = new Date().toISOString()

 const payload = {
  id: id,
  name: name,
  description: 'Preview',
  updated_at: timestamp,
  created_at: timestamp,
  widgets: AppState.tempBuilderWidgets.map((w) => ({
   id: w.id || 'widget_' + Math.random().toString(36).substr(2, 9),
   type: w.type || 'stat',
   subtype: w.subtype || 'basic',
   title: w.title || 'Untitled Widget',
   collection: w.collection || '',
   data_config: w.data_config || WidgetConfigBuilder.staticData([{ label: 'Data', value: 0 }]),
  })),
 }

 const newWindow = window.open('', '_blank')
 if (newWindow) {
  newWindow.document.write(
   `<html><body style="font-family:monospace;background:#111827;color:#34d399;padding:20px;"><pre>${JSON.stringify(payload, null, 2)}</pre></body></html>`
  )
 }
}

export function initDashboardGenerator() {
 window.removeEventListener('resize', updateMobileViewVisibility)
 window.addEventListener('resize', updateMobileViewVisibility)

 updateMobileViewVisibility()
 fetchDashboardsFromDB()
 renderWidgetLibrary()

 setTimeout(initMobileNavDrag, 500)
}
