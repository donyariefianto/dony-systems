import { apiFetch } from '../core/api.js'
import { AppState } from '../core/state.js'
import { showToast, showConfirmDialog } from '../utils/helpers.js'

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
            class="w-full text-left bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:border-blue-500 transition-all text-xs font-medium flex justify-between items-center h-[38px]">
            <span id="label_${uniqueId}" class="truncate block w-full text-gray-400 select-none">-- Pilih --</span>
            <i class="fas fa-chevron-down text-gray-400 text-[10px]"></i>
        </button>
        <div id="list_${uniqueId}" class="hidden absolute z-[60] w-full min-w-[200px] mt-1 bg-white border border-gray-100 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
            <div class="p-2 border-b border-gray-50 bg-gray-50/50">
                <div class="relative">
                    <i class="fas fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                    <input type="text" oninput="DropdownManager.handleSearch('${uniqueId}', this.value)" 
                        class="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-500" placeholder="Cari...">
                </div>
            </div>
            <ul id="ul_${uniqueId}" onscroll="DropdownManager.handleScroll('${uniqueId}')" class="max-h-48 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                <li class="p-3 text-center text-gray-400 text-[10px] italic">Ketik untuk mencari...</li>
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
   const json = await res.json()
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
     return `<li onclick="DropdownManager.select('${uid}', '${val}', '${label.replace(/'/g, "\\'")}')" class="px-3 py-2 hover:bg-blue-50 text-gray-700 text-xs rounded cursor-pointer transition-colors flex justify-between items-center"><span class="truncate">${label}</span>${String(state.initialValue) === String(val) ? '<i class="fas fa-check text-blue-600"></i>' : ''}</li>`
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

function debounce(func, wait) {
 let timeout
 return function (...args) {
  clearTimeout(timeout)
  timeout = setTimeout(() => func.apply(this, args), wait)
 }
}

window.DropdownManager = DropdownManager

export function renderTableView(config, container) {
 const fields = config.config.fields || []
 container.innerHTML = `
    <div class="flex flex-col h-[calc(100vh-64px)] bg-gray-50/50 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div class="shrink-0 px-4 md:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-b border-gray-200 z-20 shadow-sm">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-lg shadow-gray-200"><i class="fas fa-database text-lg"></i></div>
                <div><h1 class="text-lg md:text-xl font-black text-gray-800 tracking-tight leading-none">${config.name}</h1><p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Management Data</p></div>
            </div>
            <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button onclick="openCrudModal()" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95"><i class="fas fa-plus"></i> <span>Tambah Data</span></button>
            </div>
        </div>
        <div class="flex-1 overflow-hidden relative bg-gray-50 flex flex-col">
            <div class="hidden md:block flex-1 overflow-auto custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-100/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                        <tr>
                            ${fields
                             .filter((f) => f.type !== 'repeater')
                             .map(
                              (f) =>
                               `<th class="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap border-b border-gray-200">${f.label}</th>`
                             )
                             .join('')}
                            <th class="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right whitespace-nowrap border-b border-gray-200 sticky right-0 bg-gray-100/95">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="table-data-body-desktop" class="bg-white divide-y divide-gray-100"></tbody>
                </table>
            </div>
            <div id="table-data-body-mobile" class="md:hidden flex-1 overflow-y-auto p-4 space-y-4 pb-24"></div>
            <div id="loading-state" class="hidden absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex-col items-center justify-center"><div class="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3"></div><span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Memuat Data...</span></div>
        </div>
        <div id="pagination-container" class="shrink-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]"></div>
    </div>
    
    <div id="crud-modal" class="fixed inset-0 z-[100] hidden">
        <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity opacity-0 duration-300" id="modal-backdrop" onclick="window.closeModal()"></div>
        <div id="modal-panel" class="absolute inset-x-0 bottom-0 top-10 md:inset-y-0 md:left-auto md:right-0 md:w-[600px] lg:w-[800px] bg-white shadow-2xl rounded-t-2xl md:rounded-none transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full flex flex-col border-l border-gray-100">
            <div class="h-16 border-b border-gray-100 flex justify-between items-center px-6 bg-white shrink-0 rounded-t-2xl md:rounded-none">
                <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><i class="fas fa-pen-nib"></i></div><h3 id="modal-title" class="font-black text-gray-800 text-sm uppercase tracking-widest">Form Data</h3></div>
                <button onclick="window.closeModal()" class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><i class="fas fa-times"></i></button>
            </div>
            <form id="dynamic-form" class="flex-1 flex flex-col overflow-hidden"></form>
        </div>
    </div>`
}

export async function fetchTableData() {
 const desktopBody = document.getElementById('table-data-body-desktop')
 const mobileBody = document.getElementById('table-data-body-mobile')
 const loadingOverlay = document.getElementById('loading-state')
 if (!desktopBody || !AppState.currentModule) return
 if (loadingOverlay) loadingOverlay.classList.remove('hidden')
 loadingOverlay.classList.add('flex')

 try {
  const colName = AppState.currentModule.config.collectionName
  const fields = AppState.currentModule.config.fields
  const displayFields = fields.filter((f) => f.type !== 'repeater')

  const url = `api/collections/${colName}?page=${AppState.currentPage}&limit=${AppState.pageSize}&search=${AppState.searchQuery}`
  const response = await apiFetch(url)
  if (!response) return
  const result = await response.json()
  const data = result.data || []

  desktopBody.innerHTML = ''
  mobileBody.innerHTML = ''

  if (data.length === 0) {
   desktopBody.innerHTML = `<tr><td colspan="100%" class="p-10 text-center text-gray-400 font-bold text-xs uppercase">Tidak ada data</td></tr>`
  } else {
   desktopBody.innerHTML = data
    .map(
     (item) => `
                <tr class="hover:bg-blue-50/40 transition-colors group">
                    ${displayFields
                     .map((f) => {
                      let cellData = item[f.name]

                      if (
                       f.type === 'relation' &&
                       typeof cellData === 'object' &&
                       cellData !== null
                      ) {
                       cellData = cellData[f.relation.display] || cellData[f.relation.key] || '-'
                      }

                      if (f.type === 'currency')
                       cellData = `Rp ${(Number(cellData) || 0).toLocaleString('id-ID')}`

                      if (f.type === 'date' && cellData) {
                        const d = new Date(cellData);
                        // Format: 25 Oktober 2023 14:30:45
                        cellData = !isNaN(d) ? d.toLocaleString('id-ID', {
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        }) : cellData;
                    }
                      return `<td class="p-4 text-xs font-semibold text-gray-700 whitespace-nowrap border-b border-gray-50">${cellData || '-'}</td>`
                     })
                     .join('')}
                    <td class="p-3 text-right whitespace-nowrap border-b border-gray-50 sticky right-0 bg-white shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                        <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="editData('${item._id}')" class="w-8 h-8 rounded-lg bg-white border border-gray-200 text-blue-600 hover:border-blue-300 flex items-center justify-center"><i class="fas fa-pen text-[10px]"></i></button>
                            <button onclick="deleteData('${item._id}')" class="w-8 h-8 rounded-lg bg-white border border-gray-200 text-red-500 hover:border-red-300 flex items-center justify-center"><i class="fas fa-trash text-[10px]"></i></button>
                        </div>
                    </td>
                </tr>`
    )
    .join('')

   mobileBody.innerHTML = data
    .map(
     (item) =>
      `<div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-2"><h4 class="font-bold text-gray-800 text-sm mb-2">${item[displayFields[0].name]}</h4><div class="flex justify-end gap-2"><button onclick="editData('${item._id}')" class="text-blue-600"><i class="fas fa-pen"></i></button><button onclick="deleteData('${item._id}')" class="text-red-500"><i class="fas fa-trash"></i></button></div></div>`
    )
    .join('')
   renderPaginationControls(result.totalPages, result.total, result.page)
  }
 } catch (err) {
  console.error(err)
 } finally {
  if (loadingOverlay) loadingOverlay.classList.add('hidden')
  loadingOverlay.classList.remove('flex')
 }
}

function renderPaginationControls(totalPages, totalItems, currentPage) {
 const container = document.getElementById('pagination-container')
 if (!container) return
 container.innerHTML =
  totalItems === 0
   ? ''
   : `
        <div class="text-xs font-bold text-gray-700">Halaman ${currentPage} / ${totalPages}</div>
        <div class="flex gap-2">
            <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="px-3 py-1 bg-gray-100 rounded text-xs font-bold">Prev</button>
            <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1 bg-gray-100 rounded text-xs font-bold">Next</button>
        </div>`
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
  titleEl.innerText = `TAMBAH DATA`
 }

 modal.classList.remove('hidden')
 form.innerHTML = `<div class="flex-1 flex items-center justify-center"><div class="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div></div>`
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
   const baseClass = `w-full px-4 py-3 bg-white border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm font-medium outline-none ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`
   const labelHtml = `<label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5">${field.label} ${field.required ? '<span class="text-red-500">*</span>' : ''}</label>`

   if (field.type === 'date') {
    // Parsing Value: 
    // Format Database (ISO): 2023-12-31T14:30:00.000Z
    // Format Input HTML5:    2023-12-31T14:30:00 (Tanpa Z dan milidetik)
    let dateVal = val;
    if (val && typeof val === 'string') {
        // Ambil 19 karakter pertama (YYYY-MM-DDTHH:mm:ss)
        if (val.includes('T')) dateVal = val.slice(0, 19); 
    }
    
    // step="1" agar bisa input detik. Hapus step="1" jika tidak butuh detik.
    return `
    <div class="w-full ${field.width === '100' ? 'col-span-full' : ''}">
        ${labelHtml}
        <input type="datetime-local" step="1" name="${field.name}" value="${dateVal}" class="${baseClass}" ${isReadOnly}>
    </div>`;
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

    return `<div class="col-span-full space-y-2 mt-2">${labelHtml}<div class="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-3 md:p-4"><div class="overflow-x-auto custom-scrollbar rounded-lg border border-gray-200 bg-white"><table class="w-full text-left border-collapse min-w-[600px]"><thead class="bg-gray-100 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200"><tr><th class="w-10 text-center bg-gray-50 p-2">#</th>${subFields.map((sf) => `<th class="p-3 whitespace-nowrap min-w-[150px]">${sf.label}</th>`).join('')}<th class="w-10 text-center bg-gray-50"></th></tr></thead><tbody id="repeater_${field.name}_body"></tbody></table></div><button type="button" onclick="window.addRepeaterItem('${field.name}')" class="mt-3 w-full py-2 bg-white border border-dashed border-gray-300 text-gray-500 hover:text-blue-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2"><i class="fas fa-plus-circle"></i> Tambah Baris</button></div><input type="hidden" name="${field.name}"></div>`
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
    <div class="p-5 border-t border-gray-100 bg-white shrink-0 flex gap-3"><button type="button" onclick="window.closeModal()" class="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold uppercase text-xs hover:bg-gray-50">Batal</button><button type="submit" class="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-2"><i class="fas fa-save"></i> Simpan</button></div>`
 } catch (err) {
  console.error(err)
  form.innerHTML = `<div class="flex-1 flex items-center justify-center text-red-500 font-bold text-xs">Error loading form</div>`
 }
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
        <tr class="border-b border-gray-50 text-xs hover:bg-blue-50/20 transition-colors group">
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
    let dateVal = cellVal;
    if (dateVal && typeof dateVal === 'string') {
         // Ambil format YYYY-MM-DDTHH:mm:ss
        if (dateVal.includes('T')) dateVal = dateVal.slice(0, 19);
    }
    
    return `
    <td class="p-2">
        <input type="datetime-local" step="1" value="${dateVal}" 
            onchange="window.handleRepeaterInputChange(this, '${fieldName}', ${idx}, '${col.name}')" 
            class="w-full border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none text-xs" 
            ${isReadOnly}>
    </td>`;
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
              return `<td class="p-2"><input type="${type}" value="${cellVal}" onchange="window.handleRepeaterInputChange(this, '${fieldName}', ${idx}, '${col.name}')" class="w-full border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none ${col.type === 'currency' ? 'text-right font-mono' : ''}" ${isReadOnly}></td>`
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
   showToast('Data berhasil disimpan', 'success')
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
  title: 'Hapus?',
  text: 'Data hilang permanen.',
  icon: 'warning',
  confirmText: 'Hapus',
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
 const json = await res.json()
 openCrudModal(json.data || json)
}

window.closeModal = function () {
 const m = document.getElementById('crud-modal')
 const p = document.getElementById('modal-panel')
 const b = document.getElementById('modal-backdrop')
 if (b) b.classList.add('opacity-0')
 if (p) p.classList.add('translate-y-full', 'md:translate-x-full')
 setTimeout(() => {
  if (m) m.classList.add('hidden')
 }, 300)
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
