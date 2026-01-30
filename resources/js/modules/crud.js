import { apiFetch } from '../core/api.js'
import { AppState } from '../core/state.js'
import { showToast, showConfirmDialog, decryptData } from '../utils/helpers.js'
import { iconPicker } from '../utils/icon_picker.js'

window.formDynamicState = {}
window.repeaterSchemas = {}
window.labelCache = {}

const DropdownManager = {
 instances: {},

 init(containerId, config) {
  const uniqueId = 'dd_' + Math.random().toString(36).substr(2, 9)
  this.instances[uniqueId] = {
   ...config,
   page: 1,
   loading: false,
   hasMore: true,
   search: '',
   data: [],
  }

  const wrapper = document.getElementById(containerId)
  if (!wrapper) return

  wrapper.innerHTML = `
    <div class="relative group w-full" id="wrap_${uniqueId}">
        <button type="button" onclick="DropdownManager.toggle('${uniqueId}')" 
            class="w-full text-left bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:border-zinc-500 transition-all text-xs font-medium flex justify-between items-center h-[38px]">
            <span id="label_${uniqueId}" class="truncate block w-full text-gray-400 select-none">-- Pilih --</span>
            <i class="fas fa-chevron-down text-gray-400 text-[10px]"></i>
        </button>
        <div id="list_${uniqueId}" class="hidden absolute z-[60] w-full min-w-[200px] mt-1 bg-white border border-gray-100 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
            <div class="p-2 border-b border-gray-50 bg-gray-50/50">
                <div class="relative">
                    <i class="fas fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                    <input type="text" oninput="DropdownManager.handleSearch('${uniqueId}', this.value)" 
                        class="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-zinc-500" placeholder="Search...">
                </div>
            </div>
            <ul id="ul_${uniqueId}" onscroll="DropdownManager.handleScroll('${uniqueId}')" class="max-h-48 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                <li class="p-3 text-center text-gray-400 text-[10px] italic">Type to search...</li>
            </ul>
        </div>
    </div>`

  if (config.initialValue) this.setInitialLabel(uniqueId, config.initialValue)

  document.addEventListener('click', (e) => {
   if (!wrapper.contains(e.target))
    document.getElementById(`list_${uniqueId}`)?.classList.add('hidden')
  })
 },

 toggle(uid) {
  const list = document.getElementById(`list_${uid}`)
  if (!list) return
  const isHidden = list.classList.contains('hidden')
  document.querySelectorAll('[id^="list_dd_"]').forEach((el) => el.classList.add('hidden'))
  if (isHidden) {
   list.classList.remove('hidden')
   list.querySelector('input')?.focus()
   if (this.instances[uid].data.length === 0) this.loadData(uid, true)
  }
 },

 async loadData(uid, reset = false) {
  const state = this.instances[uid]
  if (state.loading || (!state.hasMore && !reset)) return
  if (reset) {
   state.page = 1
   state.data = []
   state.hasMore = true
   const ul = document.getElementById(`ul_${uid}`)
   if (ul)
    ul.innerHTML = `<li class="p-2 text-center text-gray-400 text-[10px]"><i class="fas fa-circle-notch fa-spin"></i> Loading...</li>`
  }
  state.loading = true
  try {
   const url = `api/collections/${state.collection}?page=${state.page}&limit=10&search=${state.search}`
   const res = await apiFetch(url)

   let data = await res.json()
   data = decryptData(data.nonce, data.ciphertext)
   data = JSON.parse(data)

   const json = data
   const newData = json.data || []
   state.data = reset ? newData : [...state.data, ...newData]
   state.hasMore = state.page < json.totalPages
   state.page++
   this.renderOptions(uid)
  } catch (e) {
   console.error(e)
  } finally {
   state.loading = false
  }
 },

 renderOptions(uid) {
  const state = this.instances[uid]
  const ul = document.getElementById(`ul_${uid}`)
  if (!ul) return
  if (state.data.length === 0) {
   ul.innerHTML = `<li class="p-3 text-center text-gray-400 text-[10px]">Data tidak ditemukan</li>`
   return
  }
  ul.innerHTML =
   state.data
    .map((item) => {
     const val = item[state.keyField]
     const label = item[state.displayField] || '-'
     window.labelCache[`${state.collection}_${val}`] = label
     return `<li onclick="DropdownManager.select('${uid}', '${val}', '${label.replace(/'/g, "\\'")}')" class="px-3 py-2 hover:bg-zinc-50 text-gray-700 text-xs rounded cursor-pointer transition-colors flex justify-between items-center"><span class="truncate">${label}</span>${String(state.initialValue) === String(val) ? '<i class="fas fa-check text-zinc-600"></i>' : ''}</li>`
    })
    .join('') +
   (state.hasMore
    ? `<li class="p-2 text-center text-gray-400 text-[9px] italic">Scroll for more...</li>`
    : '')
 },

 select(uid, value, label) {
  const state = this.instances[uid]
  const labelEl = document.getElementById(`label_${uid}`)
  const listEl = document.getElementById(`list_${uid}`)
  if (labelEl) {
   labelEl.innerText = label
   labelEl.classList.remove('text-gray-400')
   labelEl.classList.add('text-gray-800')
  }
  if (listEl) listEl.classList.add('hidden')
  state.initialValue = value
  const fullItem = state.data.find((d) => String(d[state.keyField]) === String(value))
  if (state.onSelect) state.onSelect(value, fullItem)
 },

 handleSearch: debounce(function (uid, query) {
  this.instances[uid].search = query
  this.loadData(uid, true)
 }, 400),
 handleScroll(uid) {
  const ul = document.getElementById(`ul_${uid}`)
  if (ul.scrollTop + ul.clientHeight >= ul.scrollHeight - 20) this.loadData(uid, false)
 },
 async setInitialLabel(uid, value) {
  const state = this.instances[uid]
  const cacheKey = `${state.collection}_${value}`
  const labelEl = document.getElementById(`label_${uid}`)
  if (window.labelCache[cacheKey] && labelEl) {
   labelEl.innerText = window.labelCache[cacheKey]
   labelEl.classList.remove('text-gray-400')
   labelEl.classList.add('text-gray-800')
  } else if (labelEl) {
   labelEl.innerText = value
  }
 },
}

window.DropdownManager = DropdownManager

export function renderTableView(config, container) {
 if (!AppState.searchFields) {
  AppState.searchFields = []
 }

 const fields = config.config.fields || []
 const displayFields = fields.filter((f) => !['repeater', 'image', 'textarea'].includes(f.type))
 const searchableFields = fields.filter((f) =>
  ['text', 'textarea', 'number', 'currency', 'relation', 'select'].includes(f.type)
 )
 const collectionName = config.config.collectionName || null

 container.innerHTML = `
    <div class="flex flex-col h-[calc(100vh-64px)] bg-slate-50 relative overflow-hidden animate-in fade-in duration-300 font-sans">
        
        <div class="shrink-0 px-6 py-5 bg-white border-b border-slate-200 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                    <i class="${config.icon || 'fas fa-database'} text-xl"></i>
                </div>
                <div>
                    <h1 class="text-xl font-bold text-slate-800 tracking-tight leading-tight">${config.name}</h1>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider border border-slate-200">
                            ${config.config.collectionName}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div class="relative group w-full md:w-[340px] transition-all duration-300 z-50">
                    
                    <div class="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm hover:border-zinc-300 focus-within:border-zinc-500 focus-within:ring-4 focus-within:ring-zinc-500/10 transition-all">
                        <button id="search-filter-btn" onclick="window.toggleSearchFilter()" class="pl-3 pr-2 py-2.5 flex items-center gap-1.5 text-slate-500 hover:text-zinc-600 transition-colors cursor-pointer outline-none border-r border-transparent hover:bg-slate-50 rounded-l-xl group/btn">
                            <i class="fas fa-sliders-h text-xs"></i>
                            <div id="filter-active-dot" class="${AppState.searchFields && AppState.searchFields.length > 0 ? '' : 'hidden'} w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse shadow-sm shadow-zinc-500/50"></div>
                        </button>
                        <div class="w-px h-5 bg-slate-200 mx-1"></div>
                        <div class="flex-1 flex items-center relative pr-3">
                            <input type="text" placeholder="Search data..." oninput="doSearch(this.value)" value="${AppState.searchQuery || ''}" class="w-full py-2.5 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none">
                            <i class="fas fa-search text-slate-300 text-xs pointer-events-none absolute right-3"></i>
                        </div>
                    </div>

                    <div id="search-filter-dropdown" class="hidden absolute top-[calc(100%+8px)] left-0 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-2 overflow-hidden ring-1 ring-slate-900/5">
                        <div class="px-4 py-3 bg-slate-50/80 backdrop-blur border-b border-slate-100 flex justify-between items-center">
                            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filters</span>
                            <span class="text-[9px] font-bold bg-white border border-slate-200 text-slate-400 px-2 py-0.5 rounded-full">Max 3</span>
                        </div>
                        
                        <div class="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                            ${searchableFields
                             .map((f) => {
                              const isSelected = AppState.searchFields.includes(f.name)

                              return `
                                <div class="search-option-item cursor-pointer px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-xs font-medium text-slate-600 transition-all group/item select-none 
                                     ${isSelected ? 'bg-zinc-50/50 text-zinc-700' : ''}" 
                                     data-field="${f.name}" 
                                     onclick="window.toggleSearchField('${f.name}')">
                                    
                                    <div class="flex items-center gap-2.5">
                                        <div class="checkbox-box w-4 h-4 rounded border 
                                            ${isSelected ? 'bg-zinc-500 border-zinc-500' : 'border-slate-300 bg-white group-hover/item:border-zinc-400'} 
                                            flex items-center justify-center transition-colors">
                                            <i class="fas fa-check text-white text-[8px] ${isSelected ? '' : 'hidden'}"></i>
                                        </div>
                                        <span class="truncate">${f.label}</span>
                                    </div>
                                    <span class="text-[9px] text-slate-300 uppercase tracking-wider opacity-0 group-hover/item:opacity-100 transition-opacity">${f.type}</span>
                                </div>`
                             })
                             .join('')}
                        </div>
                        
                        <div class="p-2 bg-slate-50 border-t border-slate-100">
                            <button onclick="window.resetSearchFilter()" 
                                class="w-full py-2 text-[10px] text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg font-bold uppercase tracking-wide transition-colors">
                                Reset Filter
                            </button>
                        </div>
                    </div>
                </div>

                <button onclick="window.refreshTable()" class="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-zinc-600 hover:border-zinc-300 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 group active:scale-95">
                    <i id="refresh-icon" class="fas fa-sync-alt text-slate-400 group-hover:text-zinc-500 transition-colors"></i>
                </button>
                <button onclick="window.dropCollections('${collectionName}')" class="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-pink-600 hover:border-pink-300 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 group active:scale-95">
                    <i id="drop-collections" class="fas fa-trash text-slate-400 group-hover:text-pink-500 transition-colors"></i>
                </button>
                <button onclick="window.openCrudModal()" class="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-lime-600 hover:border-lime-300 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 group active:scale-95">
                    <i id="open-crud-modal" class="fas fa-square-plus text-slate-400 group-hover:text-lime-500 transition-colors"></i>
                </button>
            </div>
        </div>

        <div class="flex-1 overflow-hidden relative flex flex-col">
            <div class="hidden md:block flex-1 overflow-auto custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm ring-1 ring-slate-200/50">
                        <tr>
                            <th class="p-4 w-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 bg-slate-50/50">#</th>
                            ${displayFields
                             .map((f) => {
                              const align = ['number', 'currency'].includes(f.type)
                               ? 'text-right'
                               : 'text-left'
                              return `<th class="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap border-b border-slate-200 ${align} bg-slate-50/50">${f.label}</th>`
                             })
                             .join('')}
                            <th class="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap border-b border-slate-200 sticky right-0 bg-white/95 backdrop-blur z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.03)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="table-data-body-desktop" class="bg-white divide-y divide-slate-100 text-sm"></tbody>
                </table>
            </div>
            <div id="table-data-body-mobile" class="md:hidden flex-1 overflow-y-auto p-4 space-y-4 pb-24 bg-slate-50"></div>
            <div id="loading-state" class="hidden absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex-col items-center justify-center">
                <div class="w-10 h-10 border-4 border-slate-200 border-t-zinc-600 rounded-full animate-spin mb-3 shadow-lg"></div>
                <span class="text-xs font-bold text-slate-500 uppercase animate-pulse">Loading ...</span>
            </div>
        </div>
        <div id="pagination-container" class="shrink-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"></div>
    </div>
    
    <div id="crud-modal" class="fixed inset-0 z-[100] hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        
        <div id="modal-backdrop" 
             class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 ease-out opacity-0" 
             onclick="window.closeModal()"></div>

        <div id="modal-panel" 
             class="absolute inset-x-0 bottom-0 top-10 md:inset-y-0 md:left-auto md:right-0 md:w-[600px] lg:w-[800px] bg-white shadow-2xl border-l border-white/50 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) translate-y-full md:translate-y-0 md:translate-x-full flex flex-col">
            
            <div class="h-16 border-b border-slate-100 flex justify-between items-center px-6 bg-white/80 backdrop-blur shrink-0 z-20">
                <div>
                    <h3 id="modal-title" class="font-bold text-lg text-slate-800 tracking-tight">Form Data</h3>
                    <p class="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Input detail data sistem</p>
                </div>
                <button onclick="window.closeModal()" class="w-8 h-8 rounded-full bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all active:scale-90 flex items-center justify-center">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="dynamic-form" class="flex-1 flex flex-col overflow-hidden bg-slate-50/50 relative"></form>
        </div>
    </div>`

 setTimeout(() => {
  if (typeof renderSearchUI === 'function') renderSearchUI()
 }, 100)
}

export async function fetchTableData() {
 const desktopBody = document.getElementById('table-data-body-desktop')
 const mobileBody = document.getElementById('table-data-body-mobile')
 const loadingOverlay = document.getElementById('loading-state')

 if (!desktopBody || !AppState.currentModule) return

 if (loadingOverlay) {
  loadingOverlay.classList.remove('hidden')
  loadingOverlay.classList.add('flex')
 }

 try {
  const colName = AppState.currentModule.config.collectionName
  const fields = AppState.currentModule.config.fields

  const displayFields = fields.filter((f) => !['repeater', 'image', 'textarea'].includes(f.type))

  let query_search
  if (AppState.searchFields.length > 0) {
   for (const element of AppState.searchFields) {
    query_search = {}
    const find_obj_field = fields.find((x) => x.name === element)
    if (find_obj_field.type === 'number') {
     query_search[element] = Number(AppState.searchQuery)
    } else {
     query_search[element] = String(AppState.searchQuery)
    }
   }
   query_search = JSON.stringify(query_search)
  } else {
   query_search = ''
  }
  const params = new URLSearchParams({
   page: AppState.currentPage,
   limit: AppState.pageSize,
   search: query_search,
  })

  if (AppState.searchFields && AppState.searchFields.length > 0) {
   params.append('search_fields', AppState.searchFields.join(','))
  }

  const url = `api/collections/${colName}?${params.toString()}`
  const response = await apiFetch(url)
  if (!response) return

  let data = await response.json()

  data = decryptData(data.nonce, data.ciphertext)
  let result = JSON.parse(data)

  data = result.data || []

  desktopBody.innerHTML = ''
  mobileBody.innerHTML = ''

  if (data.length === 0) {
   const emptyHtml = `<div class="p-12 text-center text-slate-400 text-sm italic flex flex-col items-center"><i class="fas fa-inbox text-3xl mb-3 opacity-30"></i>Data tidak ditemukan</div>`
   desktopBody.innerHTML = `<tr><td colspan="100%">${emptyHtml}</td></tr>`
   mobileBody.innerHTML = emptyHtml
  } else {
   desktopBody.innerHTML = data
    .map(
     (item, idx) => `
        <tr class="group hover:bg-zinc-50/30 transition-colors border-b border-slate-100 last:border-0">
            <td class="p-4 text-center text-xs font-mono text-slate-400 group-hover:text-zinc-500">
                ${(AppState.currentPage - 1) * AppState.pageSize + (idx + 1)}
            </td>
            
            ${displayFields
             .map((f) => {
              let rawData = item[f.name]
              let cellContent = rawData
              const alignClass = ['number', 'currency'].includes(f.type)
               ? 'text-right'
               : 'text-left'

              if (f.type === 'relation' && typeof rawData === 'object' && rawData !== null) {
               const displayKey = f.relation?.display || 'name'
               cellContent = rawData[displayKey] || '<span class="text-slate-300 italic">-</span>'
              } else if (f.type === 'currency') {
               cellContent = `<span class="font-mono text-slate-700 tracking-tight">Rp ${(Number(rawData) || 0).toLocaleString('id-ID')}</span>`
              } else if (f.type === 'date' || f.type === 'datetime') {
               if (rawData) {
                const d = new Date(rawData)
                const dateStr = !isNaN(d)
                 ? d.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                   })
                 : '-'
                const timeStr = !isNaN(d)
                 ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                 : ''
                cellContent = `<div class="flex flex-col"><span class="font-bold text-slate-700 text-xs">${dateStr}</span><span class="text-[10px] text-slate-400 font-mono">${timeStr}</span></div>`
               } else {
                cellContent = '<span class="text-slate-300">-</span>'
               }
              } else if (f.type === 'boolean') {
               cellContent = rawData
                ? '<span class="text-emerald-600 font-bold text-[10px] uppercase"><i class="fas fa-check-circle mr-1"></i> Yes</span>'
                : '<span class="text-slate-400 font-bold text-[10px] uppercase"><i class="fas fa-times-circle mr-1"></i> No</span>'
              } else if (f.type === 'select') {
               if (rawData) {
                const badgeColor = getDynamicBadgeColor(String(rawData))
                cellContent = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${badgeColor}">${rawData}</span>`
               } else {
                cellContent = '<span class="text-slate-300">-</span>'
               }
              } else {
               if (typeof rawData === 'string' && rawData.length > 40) {
                cellContent = `<div class="truncate max-w-[200px]" title="${rawData}">${rawData}</div>`
               } else {
                cellContent = rawData || '<span class="text-slate-300">-</span>'
               }
              }

              return `<td class="p-4 whitespace-nowrap text-slate-600 text-sm ${alignClass}">${cellContent}</td>`
             })
             .join('')}

            <td class="p-3 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-zinc-50/30 transition-colors shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.03)] border-b border-slate-100 z-10">
                <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editData('${item._id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-zinc-600 hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all"><i class="fas fa-pen text-xs"></i></button>
                    <button onclick="deleteData('${item._id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"><i class="fas fa-trash-alt text-xs"></i></button>
                </div>
            </td>
        </tr>`
    )
    .join('')

   mobileBody.innerHTML = data
    .map(
     (item, idx) => `
                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group mb-3">
                    <div class="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
                        <div class="flex items-center gap-3">
                            <span class="w-7 h-7 rounded bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center border border-slate-200">
                                ${(AppState.currentPage - 1) * AppState.pageSize + (idx + 1)}
                            </span>
                            <h4 class="font-bold text-slate-800 text-sm line-clamp-1">${item[displayFields[0].name] || 'Item Data'}</h4>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="editData('${item._id}')" class="p-1.5 text-zinc-600 bg-zinc-50 rounded"><i class="fas fa-pen text-[10px]"></i></button>
                            <button onclick="deleteData('${item._id}')" class="p-1.5 text-red-500 bg-red-50 rounded"><i class="fas fa-trash text-[10px]"></i></button>
                        </div>
                    </div>
                    <div class="space-y-2">
                        ${displayFields
                         .slice(1, 6)
                         .map((f) => {
                          let val = item[f.name]
                          if (f.type === 'currency')
                           val = `Rp ${(Number(val) || 0).toLocaleString('id-ID')}`
                          if ((f.type === 'date' || f.type === 'datetime') && val)
                           val = new Date(val).toLocaleDateString('id-ID')
                          if (f.type === 'relation' && typeof val === 'object' && val !== null)
                           val = val[f.relation.display] || val[f.relation.key]
                          if (f.type === 'select' && val)
                           val = `<span class="font-bold text-slate-700">${val}</span>`
                          return `
                            <div class="flex justify-between items-center text-xs border-b border-slate-50 last:border-0 pb-1 last:pb-0">
                                <span class="text-slate-400 font-medium truncate w-1/3">${f.label}</span>
                                <span class="text-slate-700 font-medium text-right truncate w-2/3">${val || '-'}</span>
                            </div>`
                         })
                         .join('')}
                    </div>
                </div>`
    )
    .join('')

   renderPaginationControls(result.totalPages, result.total, result.page)
  }
 } catch (err) {
  console.error(err)
  desktopBody.innerHTML = `<tr><td colspan="100%" class="p-8 text-center text-red-500 text-sm">Load data failed.</td></tr>`
 } finally {
  if (loadingOverlay) {
   setTimeout(() => {
    loadingOverlay.classList.remove('flex')
    loadingOverlay.classList.add('hidden')
   }, 350)
  }
 }
}

export async function openCrudModal(existingData = null) {
 const modal = document.getElementById('crud-modal')
 const panel = document.getElementById('modal-panel')
 const backdrop = document.getElementById('modal-backdrop')
 const form = document.getElementById('dynamic-form')
 const titleEl = document.getElementById('modal-title')

 delete form.dataset.editingId
 form.reset()
 window.formDynamicState = {}
 window.repeaterSchemas = {}
 DropdownManager.instances = {}

 if (existingData) {
  form.dataset.editingId = existingData._id
  titleEl.innerText = `EDIT DATA`
 } else {
  titleEl.innerText = `ADD DATA`
 }

 modal.classList.remove('hidden')
 form.innerHTML = `<div class="flex-1 flex items-center justify-center"><div class="w-8 h-8 border-4 border-gray-200 border-t-zinc-600 rounded-full animate-spin"></div></div>`
 setTimeout(() => {
  backdrop.classList.remove('opacity-0')
  panel.classList.remove('translate-y-full', 'md:translate-x-full')
 }, 10)

 try {
  const fields = AppState.currentModule.config.fields || []
  fields.forEach((f) => {
   if (f.type === 'repeater' && f.sub_fields) window.repeaterSchemas[f.name] = f.sub_fields
  })

  const renderedFields = fields.map((field) => {
   let val = existingData ? existingData[field.name] : field.defaultValue || ''
   const isReadOnly = field.ui?.readonly ? 'readonly' : ''
   const baseClass = `w-full px-4 py-3 bg-white border border-gray-200 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-500/10 rounded-xl text-sm font-medium outline-none ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`
   const labelHtml = `<label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5">${field.label} ${field.required ? '<span class="text-red-500">*</span>' : ''}</label>`

   if (field.type === 'icon') {
    const value = val || ''
    return `
        <div class="w-full ${field.width === '100' ? 'col-span-full' : ''}">
            ${labelHtml}
            <div class="flex gap-2">
                <div id="preview-${field.name}" class="shrink-0 w-[42px] h-[42px] rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm transition-all duration-300">
                    <i class="${value || 'fas fa-icons'}"></i>
                </div>
                
                <div class="relative flex-1 group">
                    <input type="text" 
                           id="input-${field.name}" 
                           name="${field.name}" 
                           value="${value}"
                           readonly
                           onclick="triggerIconPicker('${field.name}')"
                           class="${baseClass} pl-4 pr-9 cursor-pointer hover:bg-white hover:border-zinc-400 hover:ring-4 hover:ring-zinc-500/10 transition-all placeholder:font-normal"
                           placeholder="Pilih ikon widget...">
                    
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-zinc-500 transition-colors">
                        <i class="fas fa-search text-xs"></i>
                    </div>
                </div>
            </div>
        </div>`
   }

   if (field.type === 'date') {
    let dateVal = val
    if (val && typeof val === 'string') {
     if (val.includes('T')) dateVal = val.slice(0, 19)
    }

    return `
    <div class="w-full ${field.width === '100' ? 'col-span-full' : ''}">
        ${labelHtml}
        <input type="datetime-local" step="1" name="${field.name}" value="${dateVal}" class="${baseClass}" ${isReadOnly}>
    </div>`
   }

   if (field.type === 'relation') {
    const containerId = `dd_main_${field.name}`
    setTimeout(() => {
     DropdownManager.init(containerId, {
      collection: field.relation.collection,
      keyField: field.relation.key || '_id',
      displayField: field.relation.display || 'name',
      initialValue: val,
      onSelect: (selectedValue, fullItem) => {
       const input = document.querySelector(`input[name="${field.name}"]`)
       if (input) input.value = selectedValue
       if (field.relation.enable_auto_populate && field.relation.auto_populate && fullItem) {
        Object.keys(field.relation.auto_populate).forEach((sourceKey) => {
         const targetKey = field.relation.auto_populate[sourceKey]
         const targetInput = document.querySelector(`[name="${targetKey}"]`)
         if (targetInput) targetInput.value = fullItem[sourceKey] || ''
        })
       }
      },
     })
    }, 0)
    return `<div class="w-full ${field.width === '100' ? 'col-span-full' : ''}">${labelHtml}<div id="${containerId}"></div><input type="hidden" name="${field.name}" value="${val || ''}"></div>`
   }

   if (field.type === 'repeater') {
    const subFields = field.sub_fields || []
    let initialData = []
    if (val) {
     try {
      initialData = typeof val === 'string' ? JSON.parse(val) : val
     } catch (e) {
      initialData = []
     }
    }
    window.formDynamicState[field.name] = initialData
    setTimeout(() => window.renderRepeater(field.name), 0)

    return `<div class="col-span-full space-y-2 mt-2">${labelHtml}<div class="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-3 md:p-4"><div class="overflow-x-auto custom-scrollbar rounded-lg border border-gray-200 bg-white"><table class="w-full text-left border-collapse min-w-[600px]"><thead class="bg-gray-100 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200"><tr><th class="w-10 text-center bg-gray-50 p-2">#</th>${subFields.map((sf) => `<th class="p-3 whitespace-nowrap min-w-[150px]">${sf.label}</th>`).join('')}<th class="w-10 text-center bg-gray-50"></th></tr></thead><tbody id="repeater_${field.name}_body"></tbody></table></div><button type="button" onclick="window.addRepeaterItem('${field.name}')" class="mt-3 w-full py-2 bg-white border border-dashed border-gray-300 text-gray-500 hover:text-zinc-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2"><i class="fas fa-plus-circle"></i> Add Row</button></div><input type="hidden" name="${field.name}"></div>`
   }

   if (field.type === 'select') {
    const opts = (field.options || [])
     .map((opt) => `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`)
     .join('')
    return `<div class="w-full ${field.width === '100' ? 'col-span-full' : ''}">${labelHtml}<div class="relative"><select name="${field.name}" class="${baseClass}"><option value="">-- Pilih --</option>${opts}</select></div></div>`
   }
   if (field.type === 'textarea')
    return `<div class="col-span-full">${labelHtml}<textarea name="${field.name}" rows="3" class="${baseClass}" ${isReadOnly}>${val}</textarea></div>`
   if (field.type === 'currency' || field.type === 'number') {
    return `<div class="w-full ${field.width === '100' ? 'col-span-full' : ''}">${labelHtml}
        <input type="number" 
            name="${field.name}" 
            value="${val}" 
            oninput="window.recalculateMainFields()" 
            class="${baseClass}" ${isReadOnly}>
    </div>`
   }
   return `<div class="w-full ${field.width === '100' ? 'col-span-full' : ''}">${labelHtml}<input type="text" name="${field.name}" value="${val}" class="${baseClass}" ${isReadOnly}></div>`
  })

  form.innerHTML = `
    <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30"><div class="grid grid-cols-1 md:grid-cols-2 gap-5">${renderedFields.join('')}</div></div>
    <div class="p-5 border-t border-gray-100 bg-white shrink-0 flex gap-3"><button type="button" onclick="window.closeModal()" class="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold uppercase text-xs hover:bg-gray-50">Cancel</button><button type="submit" class="flex-[2] py-3 bg-zinc-600 hover:bg-zinc-700 text-white rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-2"><i class="fas fa-save"></i> Save</button></div>`
 } catch (err) {
  console.error(err)
  form.innerHTML = `<div class="flex-1 flex items-center justify-center text-red-500 font-bold text-xs">Error loading form</div>`
 }
}

export async function handleFormSubmit(e) {
 e.preventDefault()

 const form = e.target
 const btn = form.querySelector('button[type="submit"]')
 const originalBtnContent = btn.innerHTML
 const fields = AppState.currentModule.config.fields || []
 const formData = new FormData(form)

 form
  .querySelectorAll('.border-red-500')
  .forEach((el) => el.classList.remove('border-red-500', 'ring-1', 'ring-red-500'))
 form.querySelectorAll('.validation-msg').forEach((el) => el.remove())

 let isValid = true
 let firstErrorElement = null

 for (const field of fields) {
  if (field.ui?.readonly) continue

  if (field.required) {
   let isFieldEmpty = false
   let targetUiElement = null

   if (field.type === 'repeater') {
    const items = window.formDynamicState[field.name] || []

    if (!items || items.length === 0) {
     isFieldEmpty = true

     targetUiElement = form
      .querySelector(`button[onclick="window.addRepeaterItem('${field.name}')"]`)
      ?.closest('.bg-gray-50')
    }
   } else if (field.type === 'relation') {
    const val = formData.get(field.name)

    if (!val || val.trim() === '') {
     isFieldEmpty = true

     const container = document.getElementById(`dd_main_${field.name}`)
     targetUiElement = container ? container.querySelector('button') : null
    }
   } else {
    const val = formData.get(field.name)
    if (val === null || (typeof val === 'string' && val.trim() === '')) {
     isFieldEmpty = true
     targetUiElement = form.querySelector(`[name="${field.name}"]`)
    }
   }

   if (isFieldEmpty) {
    isValid = false
    if (targetUiElement) {
     targetUiElement.classList.add('border-red-500', 'ring-1', 'ring-red-500')

     const msg = document.createElement('p')
     msg.className = 'validation-msg text-red-500 text-[10px] italic mt-1 font-bold animate-pulse'
     msg.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${field.label} wajib diisi`
     targetUiElement.parentElement.appendChild(msg)

     if (!firstErrorElement) firstErrorElement = targetUiElement
    }
   }
  }
 }

 if (!isValid) {
  if (firstErrorElement) {
   firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
   firstErrorElement.focus()
  }
  showToast('Mohon lengkapi data yang wajib diisi', 'error')
  return
 }

 btn.disabled = true
 btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Menyimpan...'

 try {
  const id = form.dataset.editingId
  const colName = AppState.currentModule.config.collectionName
  const payload = {}

  fields.forEach((field) => {
   if (field.type === 'repeater') {
    payload[field.name] = window.formDynamicState[field.name] || []
   } else if (['number', 'currency'].includes(field.type)) {
    const rawVal = formData.get(field.name)

    payload[field.name] = rawVal === '' || rawVal === null ? 0 : parseFloat(rawVal)
   } else if (field.type === 'boolean') {
    payload[field.name] = formData.get(field.name) === 'on' || formData.get(field.name) === 'true'
   } else {
    payload[field.name] = formData.get(field.name)
   }
  })

  const url = `api/collections/${colName}${id ? '/' + id : ''}`
  const method = id ? 'PUT' : 'POST'

  const response = await apiFetch(url, {
   method: method,
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify(payload),
  })

  if (response.ok) {
   window.closeModal()
   fetchTableData()
   showToast('Data berhasil diSave', 'success')
  } else {
   let errMsg = 'Gagal menyimpan data'
   try {
    const resJson = await response.json()
    if (resJson.message) errMsg = resJson.message
   } catch (e) {}
   throw new Error(errMsg)
  }
 } catch (error) {
  console.error('Submit Error:', error)
  showToast(error.message || 'Terjadi kesalahan sistem', 'error')
 } finally {
  btn.disabled = false
  btn.innerHTML = originalBtnContent
 }
}

export async function deleteData(id) {
 const isConfirmed = await showConfirmDialog({
  title: 'Delete?',
  text: 'Data will be permanently deleted.',
  icon: 'warning',
  confirmText: 'Delete',
  dangerMode: true,
 })
 if (isConfirmed) {
  await apiFetch(`api/collections/${AppState.currentModule.config.collectionName}/${id}`, {
   method: 'DELETE',
  })
  fetchTableData()
 }
}

export async function editData(id) {
 const res = await apiFetch(`api/collections/${AppState.currentModule.config.collectionName}/${id}`)
 let data = await res.json()
 data = decryptData(data.nonce, data.ciphertext)
 data = JSON.parse(data)

 openCrudModal(data.data || data)
}

export async function changePage(newPage) {
 if (newPage > 0) {
  AppState.currentPage = newPage
  fetchTableData()
 }
}

export async function doSearch(query) {
 AppState.searchQuery = query
 AppState.currentPage = 1
 fetchTableData()
}

async function dropCollectionsData(collectionsNames) {
 try {
  const url = `api/collections/${collectionsNames.toString()}`
  const response = await apiFetch(url, { method: 'DELETE' })
  if (response.ok) {
   return {
    success: true,
    message: 'Collections data dropped successfully',
   }
  } else {
   return {
    success: false,
    message: err.message || 'Failed to drop collections data',
   }
  }
 } catch (err) {
  return {
   success: false,
   message: err.message || 'Failed to drop collections data',
  }
 }
}

function renderPaginationControls(totalPages, totalItems, currentPage) {
 const container = document.getElementById('pagination-container')
 if (!container) return
 container.innerHTML =
  totalItems === 0
   ? ''
   : `
    <div class="text-xs font-bold text-gray-700">Pages ${currentPage} / ${totalPages}</div>
    <div class="flex gap-2">
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="px-3 py-1 bg-gray-100 rounded text-xs font-bold">Prev</button>
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1 bg-gray-100 rounded text-xs font-bold">Next</button>
    </div>`
}

function debounce(func, wait) {
 let timeout
 return function (...args) {
  clearTimeout(timeout)
  timeout = setTimeout(() => func.apply(this, args), wait)
 }
}

function getDynamicBadgeColor(text) {
 if (!text) return 'bg-slate-100 text-slate-500 border-slate-200'

 let hash = 0
 for (let i = 0; i < text.length; i++) {
  hash = text.charCodeAt(i) + ((hash << 5) - hash)
 }

 const palettes = [
  'bg-zinc-50 text-zinc-700 border-zinc-100',
  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'bg-purple-50 text-purple-700 border-purple-100',
  'bg-amber-50 text-amber-700 border-amber-100',
  'bg-rose-50 text-rose-700 border-rose-100',
  'bg-indigo-50 text-indigo-700 border-indigo-100',
  'bg-cyan-50 text-cyan-700 border-cyan-100',
 ]

 const index = Math.abs(hash) % palettes.length
 return palettes[index]
}

function calculateMath(operation, values) {
 if (!values || values.length === 0) return 0

 const nums = values.map((v) => parseFloat(v) || 0)

 switch (operation) {
  case 'multiply':
   return nums.reduce((a, b) => a * b, 1)

  case 'add':
  case 'sum':
   return nums.reduce((a, b) => a + b, 0)

  case 'subtract':
   return nums.reduce((a, b, i) => (i === 0 ? a : a - b))

  case 'divide':
   return nums.reduce((a, b, i) => (i === 0 ? a : b !== 0 ? a / b : 0))

  case 'avg':
   const total = nums.reduce((a, b) => a + b, 0)
   return nums.length > 0 ? total / nums.length : 0

  case 'max':
   return Math.max(...nums)

  case 'min':
   return Math.min(...nums)

  case 'count':
   return nums.length

  default:
   return 0
 }
}

window.resetSearchFilter = function () {
 AppState.searchFields = []

 const dropdown = document.getElementById('search-filter-dropdown')
 if (dropdown) {
  const options = dropdown.querySelectorAll('.search-option-item')
  options.forEach((el) => {
   el.classList.remove('bg-zinc-50/50', 'text-zinc-700')
   el.classList.add('text-slate-600')

   const box = el.querySelector('.checkbox-box')
   if (box) {
    box.classList.remove('bg-zinc-500', 'border-zinc-500')
    box.classList.add('border-slate-300', 'bg-white', 'group-hover/item:border-zinc-400')

    const icon = box.querySelector('i')
    if (icon) icon.classList.add('hidden')
   }
  })
 }

 const dot = document.getElementById('filter-active-dot')
 if (dot) dot.classList.add('hidden')

 fetchTableData()
}

window.renderSearchUI = function () {
 const dot = document.getElementById('filter-active-dot')
 if (dot) {
  const isActive = AppState.searchFields && AppState.searchFields.length > 0
  dot.classList.toggle('hidden', !isActive)
 }

 const dropdown = document.getElementById('search-filter-dropdown')
 if (dropdown) {
  const options = dropdown.querySelectorAll('.search-option-item')
  options.forEach((el) => {
   const fName = el.dataset.field
   const isSelected = AppState.searchFields.includes(fName)
   const box = el.querySelector('.checkbox-box')
   const icon = box.querySelector('i')

   if (isSelected) {
    el.classList.add('bg-zinc-50/50', 'text-zinc-700')
    box.classList.remove('border-slate-300', 'bg-white', 'group-hover/item:border-zinc-400')
    box.classList.add('bg-zinc-500', 'border-zinc-500')
    icon.classList.remove('hidden')
   } else {
    el.classList.remove('bg-zinc-50/50', 'text-zinc-700')
    box.classList.remove('bg-zinc-500', 'border-zinc-500')
    box.classList.add('border-slate-300', 'bg-white', 'group-hover/item:border-zinc-400')
    icon.classList.add('hidden')
   }
  })
 }
}

window.toggleSearchFilter = function () {
 const dropdown = document.getElementById('search-filter-dropdown')
 if (dropdown) dropdown.classList.toggle('hidden')
}

window.toggleSearchField = function (fieldName) {
 if (!AppState.searchFields) AppState.searchFields = []

 const current = AppState.searchFields
 const idx = current.indexOf(fieldName)

 if (idx > -1) {
  current.splice(idx, 1)
 } else {
  if (current.length >= 3) {
   showToast('3 Fields Max', 'warning')
   return
  }
  current.push(fieldName)
 }

 renderSearchUI()

 if (AppState.searchQuery) {
  fetchTableData()
 }
}

window.renderSearchUI = function () {
 const dot = document.getElementById('filter-active-dot')
 if (dot) {
  const count = (AppState.searchFields || []).length
  if (count > 0) dot.classList.remove('hidden')
  else dot.classList.add('hidden')
 }

 const dropdown = document.getElementById('search-filter-dropdown')
 if (dropdown) {
  const options = dropdown.querySelectorAll('.search-option-item')
  options.forEach((el) => {
   const fName = el.dataset.field

   const isSelected = (AppState.searchFields || []).includes(fName)

   const box = el.querySelector('.checkbox-box')
   const icon = box.querySelector('i')

   if (isSelected) {
    el.classList.add('bg-zinc-50/50', 'text-zinc-700')
    el.classList.remove('text-slate-600')

    box.classList.remove('border-slate-300', 'bg-white', 'group-hover/item:border-zinc-400')
    box.classList.add('bg-zinc-500', 'border-zinc-500')

    icon.classList.remove('hidden')
   } else {
    el.classList.remove('bg-zinc-50/50', 'text-zinc-700')
    el.classList.add('text-slate-600')

    box.classList.remove('bg-zinc-500', 'border-zinc-500')
    box.classList.add('border-slate-300', 'bg-white', 'group-hover/item:border-zinc-400')

    icon.classList.add('hidden')
   }
  })
 }
}

window.document.addEventListener('click', (e) => {
 const dropdown = document.getElementById('search-filter-dropdown')
 const btn = document.getElementById('search-filter-btn')
 if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
  dropdown.classList.add('hidden')
 }
})

window.renderRepeater = function (fieldName) {
 const tbody = document.getElementById(`repeater_${fieldName}_body`)
 const hiddenInput = document.querySelector(`input[name="${fieldName}"]`)
 const data = window.formDynamicState[fieldName] || []
 const schema = window.repeaterSchemas[fieldName] || []

 if (hiddenInput) hiddenInput.value = JSON.stringify(data)

 const subtotalCol = schema.find((c) => c.name === 'subtotal' || c.name === 'row_total')
 if (subtotalCol) {
  const grandTotal = data.reduce((sum, item) => sum + (parseFloat(item[subtotalCol.name]) || 0), 0)
  const grandTotalInput = document.querySelector('input[name="grand_total"]')
  if (grandTotalInput) grandTotalInput.value = grandTotal
 }

 if (!tbody) return
 if (data.length === 0) {
  tbody.innerHTML = `<tr><td colspan="${schema.length + 2}" class="p-6 text-center text-gray-400 italic text-xs">Belum ada data.</td></tr>`
  return
 }

 tbody.innerHTML = data
  .map(
   (item, idx) => `
        <tr class="border-b border-gray-50 text-xs hover:bg-zinc-50/20 transition-colors group">
            <td class="p-2 text-center text-gray-400 font-mono">${idx + 1}</td>
            ${schema
             .map((col) => {
              const isReadOnly = col.ui?.readonly
               ? 'disabled bg-gray-50 text-gray-500 cursor-not-allowed'
               : 'bg-white'
              const cellVal = item[col.name] !== undefined ? item[col.name] : ''

              if (col.type === 'relation')
               return `<td class="p-2 min-w-[200px]"><div id="dd_sub_${fieldName}_${idx}_${col.name}"></div></td>`

              if (col.type === 'date') {
               let dateVal = cellVal
               if (dateVal && typeof dateVal === 'string') {
                if (dateVal.includes('T')) dateVal = dateVal.slice(0, 19)
               }

               return `
    <td class="p-2">
        <input type="datetime-local" step="1" value="${dateVal}" 
            onchange="window.handleRepeaterInputChange(this, '${fieldName}', ${idx}, '${col.name}')" 
            class="w-full border border-gray-200 rounded px-2 py-1.5 focus:border-zinc-500 outline-none text-xs" 
            ${isReadOnly}>
    </td>`
              }

              if (col.type === 'select') {
               const opts = (col.options || [])
                .map((o) => `<option value="${o}" ${cellVal === o ? 'selected' : ''}>${o}</option>`)
                .join('')
               return `<td class="p-2"><select onchange="window.handleRepeaterInputChange(this, '${fieldName}', ${idx}, '${col.name}')" class="w-full border border-gray-200 rounded px-2 py-1.5"><option>-</option>${opts}</select></td>`
              }

              const type = col.type === 'currency' || col.type === 'number' ? 'number' : 'text'
              if (col.type === 'currency' && col.ui?.readonly)
               return `<td class="p-2"><div class="px-2 py-1.5 bg-gray-50 border border-transparent rounded text-right font-mono text-gray-600">Rp ${(Number(cellVal) || 0).toLocaleString('id-ID')}</div></td>`
              return `<td class="p-2"><input type="${type}" value="${cellVal}" onchange="window.handleRepeaterInputChange(this, '${fieldName}', ${idx}, '${col.name}')" class="w-full border border-gray-200 rounded px-2 py-1.5 focus:border-zinc-500 outline-none ${col.type === 'currency' ? 'text-right font-mono' : ''}" ${isReadOnly}></td>`
             })
             .join('')}
            <td class="p-2 text-center align-middle">
                <button type="button" onclick="window.removeRepeaterItem('${fieldName}', ${idx})" class="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><i class="fas fa-trash-alt text-[10px]"></i></button>
            </td>
        </tr>`
  )
  .join('')

 data.forEach((item, idx) => {
  schema.forEach((col) => {
   if (col.type === 'relation') {
    const containerId = `dd_sub_${fieldName}_${idx}_${col.name}`
    DropdownManager.init(containerId, {
     collection: col.relation.collection,
     keyField: col.relation.key || '_id',
     displayField: col.relation.display || 'name',
     initialValue: item[col.name],
     onSelect: (val, fullItem) => {
      window.formDynamicState[fieldName][idx][col.name] = val
      if (col.relation.enable_auto_populate && col.relation.auto_populate && fullItem) {
       Object.keys(col.relation.auto_populate).forEach((sourceKey) => {
        const targetKey = col.relation.auto_populate[sourceKey]
        window.formDynamicState[fieldName][idx][targetKey] = fullItem[sourceKey]
       })
       window.recalculateRow(window.formDynamicState[fieldName][idx], schema)
       window.renderRepeater(fieldName)
      }
     },
    })
   }
  })
 })
}

window.recalculateRow = function (rowItem, schema) {
 schema.forEach((col) => {
  if (col.calculation?.is_enabled && col.calculation.operation && col.calculation.fields) {
   const sourceFieldNames = col.calculation.fields

   const values = sourceFieldNames.map((fieldName) => rowItem[fieldName])

   const result = calculateMath(col.calculation.operation, values)

   rowItem[col.name] = result
  }
 })
}

window.recalculateMainFields = function () {
 const fields = AppState.currentModule.config.fields || []

 fields.forEach((field) => {
  if (!field.calculation?.is_enabled || !field.calculation.operation) return

  const op = field.calculation.operation
  const sourceConfigs = field.calculation.fields || []
  let collectedValues = []

  if (['sum', 'avg', 'count', 'min', 'max'].includes(op)) {
   const targetConfig = sourceConfigs[0] || ''

   if (targetConfig.includes('.')) {
    const [repeaterName, subFieldName] = targetConfig.split('.')

    const rows = window.formDynamicState[repeaterName] || []

    collectedValues = rows.map((r) => r[subFieldName])
   }
  } else {
   collectedValues = sourceConfigs.map((fieldName) => {
    const el = document.querySelector(`[name="${fieldName}"]`)
    return el ? el.value : 0
   })
  }

  const finalResult = calculateMath(op, collectedValues)

  const targetInput = document.querySelector(`input[name="${field.name}"]`)
  if (targetInput) {
   targetInput.value = finalResult
  }
 })
}

window.addRepeaterItem = function (fieldName) {
 const schema = window.repeaterSchemas[fieldName] || []
 const newItem = {}
 schema.forEach(
  (col) => (newItem[col.name] = col.defaultValue !== undefined ? col.defaultValue : '')
 )
 if (!window.formDynamicState[fieldName]) window.formDynamicState[fieldName] = []
 window.formDynamicState[fieldName].push(newItem)
 window.renderRepeater(fieldName)
 window.recalculateMainFields()
}

window.removeRepeaterItem = function (fieldName, index) {
 if (window.formDynamicState[fieldName]) {
  window.formDynamicState[fieldName].splice(index, 1)
  window.renderRepeater(fieldName)
  window.recalculateMainFields()
 }
}

window.handleRepeaterInputChange = function (el, fieldName, index, colName) {
 const schema = window.repeaterSchemas[fieldName] || []
 let val = el.value
 if (el.type === 'number') val = parseFloat(val) || 0

 if (window.formDynamicState[fieldName] && window.formDynamicState[fieldName][index]) {
  window.formDynamicState[fieldName][index][colName] = val
  window.recalculateRow(window.formDynamicState[fieldName][index], schema)
  window.renderRepeater(fieldName)
  window.recalculateMainFields()
 }
}

window.closeModal = function () {
 const modal = document.getElementById('crud-modal')
 const backdrop = document.getElementById('modal-backdrop')
 const panel = document.getElementById('modal-panel')

 if (!modal) return

 if (backdrop) backdrop.classList.add('opacity-0')
 if (panel) panel.classList.add('translate-y-full', 'md:translate-x-full')

 setTimeout(() => {
  modal.classList.add('hidden')

  const form = document.getElementById('dynamic-form')
  if (form) form.innerHTML = ''
 }, 500)
}

window.refreshTable = async function () {
 const icon = document.getElementById('refresh-icon')

 if (icon) icon.classList.add('fa-spin')

 await fetchTableData()

 setTimeout(() => {
  if (icon) icon.classList.remove('fa-spin')
  showToast('Data updated successfully', 'success')
 }, 500)
}

window.dropCollections = async function (collections) {
 const icon = document.getElementById('drop-collections')
 if (icon) icon.classList.add('fa-spin')
 const isConfirmed = await showConfirmDialog({
  title: 'Delete All?',
  text: 'Data will be permanently deleted from the selected collections.',
  icon: 'warning',
  confirmText: 'Delete',
  dangerMode: true,
 })
 if (isConfirmed) {
  const result = await dropCollectionsData(collections)
  if (result.success) {
   showToast(result.message, 'success')
   await fetchTableData()
  } else {
   showToast(result.message, 'error')
  }
 }
 setTimeout(async () => {
  if (icon) icon.classList.remove('fa-spin')
 }, 500)
}

window.triggerIconPicker = async (fieldName) => {
 await iconPicker.open((selectedIcon) => {
  const inputEl = document.getElementById(`input-${fieldName}`)
  if (inputEl) inputEl.value = selectedIcon

  const previewEl = document.getElementById(`preview-${fieldName}`)
  if (previewEl) {
   previewEl.innerHTML = `<i class="${selectedIcon}"></i>`
   previewEl.classList.add('bg-zinc-50', 'border-zinc-200')
  }
 })
}
