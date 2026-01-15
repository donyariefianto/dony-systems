import { apiFetch } from '../core/api.js'
import { AppState } from '../core/state.js'
import { showToast, closeModal, logout, showConfirmDialog } from '../utils/helpers.js'

// =================================================================
// 1. RENDER TABLE VIEW
// =================================================================
export function renderTableView(config, container) {
 // Pastikan fields ada, jika tidak ambil dari config default
 const fields = config.config.fields || []

 container.innerHTML = `
    <div class="flex flex-col h-[calc(100vh-64px)] bg-gray-50/50 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        <div class="shrink-0 px-4 md:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-b border-gray-200 z-20 shadow-sm">
            <div>
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-lg shadow-gray-200">
                        <i class="fas fa-database text-lg"></i>
                    </div>
                    <div>
                        <h1 class="text-lg md:text-xl font-black text-gray-800 tracking-tight leading-none">${config.name}</h1>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Management Data</p>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div class="relative group w-full md:w-64">
                    <i class="fas fa-search absolute left-3 top-3 text-gray-400 pointer-events-none"></i>
                    <input type="text" placeholder="Cari data..." oninput="doSearch(this.value)" 
                            class="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl text-xs font-bold text-gray-700 outline-none transition-all">
                </div>
                <button onclick="openCrudModal()" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95">
                    <i class="fas fa-plus"></i> <span>Tambah</span>
                </button>
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
                              (f) => `
                                <th class="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap border-b border-gray-200">
                                    ${f.label}
                                </th>
                            `
                             )
                             .join('')}
                            <th class="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right whitespace-nowrap border-b border-gray-200 sticky right-0 bg-gray-100/95 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody id="table-data-body-desktop" class="bg-white divide-y divide-gray-100"></tbody>
                </table>
            </div>

            <div id="table-data-body-mobile" class="md:hidden flex-1 overflow-y-auto p-4 space-y-4 pb-24"></div>

            <div id="loading-state" class="hidden absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex-col items-center justify-center">
                <div class="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Memuat Data...</span>
            </div>
        </div>

        <div id="pagination-container" class="shrink-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]"></div>
    </div>

    <div id="crud-modal" class="fixed inset-0 z-[100] hidden">
        <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity opacity-0 duration-300" id="modal-backdrop" onclick="window.closeModal()"></div>
        <div id="modal-panel" class="absolute inset-x-0 bottom-0 top-10 md:inset-y-0 md:left-auto md:right-0 md:w-[600px] lg:w-[700px] bg-white shadow-2xl rounded-t-2xl md:rounded-none transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full flex flex-col border-l border-gray-100">
            <div class="h-16 border-b border-gray-100 flex justify-between items-center px-6 bg-white shrink-0 rounded-t-2xl md:rounded-none">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <i class="fas fa-pen-nib"></i>
                    </div>
                    <h3 id="modal-title" class="font-black text-gray-800 text-sm uppercase tracking-widest">Form Data</h3>
                </div>
                <button onclick="window.closeModal()" class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="dynamic-form" class="flex-1 flex flex-col overflow-hidden" onsubmit="handleFormSubmit(event)"></form>
        </div>
    </div>`
}

// =================================================================
// 2. FETCH DATA & PAGINATION
// =================================================================
export async function fetchTableData() {
 const desktopBody = document.getElementById('table-data-body-desktop')
 const mobileBody = document.getElementById('table-data-body-mobile')
 const loadingOverlay = document.getElementById('loading-state')

 if (!desktopBody || !AppState.currentModule) return

 if (loadingOverlay) loadingOverlay.classList.remove('hidden')
 if (loadingOverlay) loadingOverlay.classList.add('flex')

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
   const emptyHtml = `
            <div class="flex flex-col items-center justify-center py-20 text-center opacity-60 w-full col-span-full">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <i class="fas fa-box-open text-2xl text-gray-400"></i>
                </div>
                <p class="text-xs font-bold text-gray-500 uppercase">Tidak ada data</p>
            </div>`
   mobileBody.innerHTML = emptyHtml
   desktopBody.innerHTML = `<tr><td colspan="100%">${emptyHtml}</td></tr>`
   renderPaginationControls(0, 0, 0)
  } else {
   // RENDER DESKTOP
   desktopBody.innerHTML = data
    .map(
     (item) => `
        <tr class="hover:bg-blue-50/40 transition-colors group">
            ${displayFields
             .map((f) => {
              let cellData = item[f.name]
              // Handle Relation Display
              if (f.type === 'relation' && typeof cellData === 'object' && cellData !== null) {
               cellData = cellData[f.relation.display] || cellData[f.relation.key] || '-'
              }
              // Handle Currency
              if (f.type === 'currency') {
               cellData = `Rp ${(Number(cellData) || 0).toLocaleString('id-ID')}`
              }
              return `
                <td class="p-4 text-xs font-semibold text-gray-700 whitespace-nowrap border-b border-gray-50">
                    ${cellData || '<span class="text-gray-300">-</span>'}
                </td>`
             })
             .join('')}
            <td class="p-3 text-right whitespace-nowrap border-b border-gray-50 sticky right-0 bg-white group-hover:bg-blue-50/40 transition-colors shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editData('${item._id}')" class="w-8 h-8 rounded-lg bg-white border border-gray-200 text-blue-600 hover:border-blue-300 hover:shadow-sm flex items-center justify-center transition-all" title="Edit"><i class="fas fa-pen text-[10px]"></i></button>
                    <button onclick="deleteData('${item._id}')" class="w-8 h-8 rounded-lg bg-white border border-gray-200 text-red-500 hover:border-red-300 hover:shadow-sm flex items-center justify-center transition-all" title="Hapus"><i class="fas fa-trash text-[10px]"></i></button>
                </div>
            </td>
        </tr>`
    )
    .join('')

   // RENDER MOBILE
   mobileBody.innerHTML = data
    .map(
     (item, idx) => `
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-100">
                        ${(AppState.currentPage - 1) * AppState.pageSize + (idx + 1)}
                    </span>
                    <div>
                        <h4 class="font-bold text-gray-800 text-sm line-clamp-1">${item[displayFields[0].name]}</h4>
                        <p class="text-[10px] text-gray-400 font-mono mt-0.5">ID: ${item._id.substr(-4)}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="editData('${item._id}')" class="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><i class="fas fa-pen text-xs"></i></button>
                    <button onclick="deleteData('${item._id}')" class="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"><i class="fas fa-trash text-xs"></i></button>
                </div>
            </div>
            <div class="space-y-2 border-t border-gray-50 pt-3">
                ${displayFields
                 .slice(1)
                 .map(
                  (f) => `
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-400 font-medium uppercase tracking-wider text-[9px]">${f.label}</span>
                        <span class="text-gray-700 font-bold text-right max-w-[60%] truncate">${item[f.name] || '-'}</span>
                    </div>`
                 )
                 .join('')}
            </div>
        </div>`
    )
    .join('')

   renderPaginationControls(result.totalPages, result.total, result.page)
  }
 } catch (err) {
  console.error(err)
  if (mobileBody)
   mobileBody.innerHTML = `<div class="p-10 text-center text-red-500 font-bold text-xs">Gagal memuat data</div>`
 } finally {
  if (loadingOverlay) loadingOverlay.classList.remove('flex')
  if (loadingOverlay) loadingOverlay.classList.add('hidden')
 }
}

function renderPaginationControls(totalPages, totalItems, currentPage) {
 const container = document.getElementById('pagination-container')
 if (!container) return
 if (totalItems === 0) {
  container.innerHTML = ''
  return
 }

 const startItem = (currentPage - 1) * AppState.pageSize + 1
 const endItem = Math.min(currentPage * AppState.pageSize, totalItems)

 container.innerHTML = `
    <div class="hidden md:flex flex-col">
        <span class="text-xs font-bold text-gray-700">Halaman ${currentPage} / ${totalPages}</span>
        <span class="text-[10px] text-gray-400 font-medium">Data ${startItem}-${endItem} dari ${totalItems}</span>
    </div>
    <div class="md:hidden text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
        ${startItem}-${endItem} / ${totalItems}
    </div>
    <div class="flex items-center gap-2">
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} 
            class="h-8 px-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:hover:bg-transparent transition-all text-xs font-bold flex items-center gap-2 shadow-sm">
            <i class="fas fa-chevron-left"></i> <span class="hidden sm:inline">Prev</span>
        </button>
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} 
            class="h-8 px-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:hover:bg-transparent transition-all text-xs font-bold flex items-center gap-2 shadow-sm">
            <span class="hidden sm:inline">Next</span> <i class="fas fa-chevron-right"></i>
        </button>
    </div>`
}

// =================================================================
// 3. CRUD OPERATIONS
// =================================================================
export async function deleteData(id) {
 const isConfirmed = await showConfirmDialog({
  title: 'Hapus Data?',
  text: 'Data yang dihapus tidak dapat dikembalikan lagi.',
  icon: 'warning',
  confirmText: 'Ya, Hapus',
  cancelText: 'Batal',
  dangerMode: true,
 })

 if (!isConfirmed) return
 Swal.fire({ title: 'Menghapus...', timerProgressBar: true, didOpen: () => Swal.showLoading() })

 try {
  const colName = AppState.currentModule.config.collectionName
  const response = await apiFetch(`api/collections/${colName}/${id}`, { method: 'DELETE' })
  if (response && response.ok) {
   Swal.close()
   showToast('Data berhasil dihapus', 'success')
   fetchTableData()
  } else throw new Error('Gagal')
 } catch (err) {
  Swal.fire({ icon: 'error', title: 'Gagal' })
 }
}

export async function handleFormSubmit(e) {
 e.preventDefault()
 const submitBtn = e.target.querySelector('button[type="submit"]')
 const originalText = submitBtn.innerHTML
 submitBtn.disabled = true
 submitBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i>`

 const id = e.target.dataset.editingId
 const colName = AppState.currentModule.config.collectionName
 const url = `api/collections/${colName}${id ? '/' + id : ''}`

 try {
  const formData = new FormData(e.target)
  const payload = Object.fromEntries(formData.entries())

  // INJECT REPEATER DATA
  Object.keys(window.formDynamicState).forEach((key) => {
   payload[key] = window.formDynamicState[key]
  })

  const response = await apiFetch(url, {
   method: id ? 'PUT' : 'POST',
   body: JSON.stringify(payload),
  })

  if (response && response.ok) {
   window.closeModal()
   fetchTableData()
   showToast('Data berhasil disimpan', 'success')
  }
 } catch (err) {
  showToast('Gagal menyimpan data', 'error')
 } finally {
  submitBtn.disabled = false
  submitBtn.innerHTML = originalText
 }
}

export async function editData(id) {
 try {
  const response = await apiFetch(
   `api/collections/${AppState.currentModule.config.collectionName}/${id}`
  )
  if (response) {
   const json = await response.json()
   openCrudModal(json.data || json) // Handle structure variations
  }
 } catch (err) {
  showToast('Gagal memuat detail', 'error')
 }
}

// =================================================================
// 4. DYNAMIC FORM ENGINE (FIXED FOR MENU.JSON STRUCTURE)
// =================================================================
export async function openCrudModal(existingData = null) {
 const modal = document.getElementById('crud-modal')
 const panel = document.getElementById('modal-panel')
 const backdrop = document.getElementById('modal-backdrop')
 const form = document.getElementById('dynamic-form')
 const titleEl = document.getElementById('modal-title')

 delete form.dataset.editingId
 form.reset()
 window.formDynamicState = {}
 window.relationCache = {} // Reset cache per open

 if (existingData) {
  form.dataset.editingId = existingData._id
  if (titleEl) titleEl.innerText = `EDIT ${AppState.currentModule.name}`
 } else {
  if (titleEl) titleEl.innerText = `TAMBAH ${AppState.currentModule.name}`
 }

 modal.classList.remove('hidden')
 form.innerHTML = `
    <div class="flex-1 flex flex-col items-center justify-center h-full space-y-4">
        <div class="w-8 h-8 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
    </div>`

 setTimeout(() => {
  backdrop.classList.remove('opacity-0')
  panel.classList.remove('translate-y-full', 'md:translate-x-full')
 }, 10)

 try {
  const fields = AppState.currentModule.config.fields || []

  // --- STEP 1: PRELOAD RELATION DATA (Including inside Repeaters) ---
  const relationsToLoad = new Set()

  // Find relations in main fields
  fields.forEach((f) => {
   if (f.type === 'relation') relationsToLoad.add(f.relation.collection)
   // Find relations in repeaters
   if (f.type === 'repeater' && f.sub_fields) {
    f.sub_fields.forEach((sf) => {
     if (sf.type === 'relation') relationsToLoad.add(sf.relation.collection)
    })
   }
  })

  // Fetch all needed collections
  for (const col of relationsToLoad) {
   if (!window.relationCache[col]) {
    try {
     const res = await apiFetch(`api/collections/${col}`)
     const json = await res.json()
     window.relationCache[col] = json.data || []
    } catch (e) {
     console.error(`Error loading ${col}`, e)
    }
   }
  }

  // --- STEP 2: RENDER FIELDS ---
  const renderedFields = fields.map((field) => {
   let val = existingData ? existingData[field.name] : field.defaultValue || ''
   const isReadOnly = field.ui?.readonly ? 'readonly' : ''
   const isRequired = field.required ? 'required' : ''

   const baseClass = `w-full px-4 py-3 bg-white border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm font-medium text-gray-800 outline-none transition-all placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`
   const labelHtml = `<label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5">${field.label} ${field.required ? '<span class="text-red-500">*</span>' : ''}</label>`

   // 1. REPEATER (Nested Table)
   if (field.type === 'repeater') {
    const subFields = field.sub_fields || []
    // Initialize State
    let initialData = []
    if (val) {
     initialData = typeof val === 'string' ? JSON.parse(val) : val
    }
    window.formDynamicState[field.name] = initialData

    // Trigger render after DOM update
    setTimeout(() => window.renderRepeater(field.name, subFields), 0)

    return `
        <div class="col-span-full space-y-2 mt-2">
            ${labelHtml}
            <div class="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-3 md:p-4">
                <div class="overflow-x-auto custom-scrollbar rounded-lg border border-gray-200 bg-white">
                    <table class="w-full text-left border-collapse min-w-[600px]">
                        <thead class="bg-gray-100 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                            <tr>
                                ${subFields.map((sf) => `<th class="p-3 whitespace-nowrap">${sf.label}</th>`).join('')}
                                <th class="w-10 text-center bg-gray-50">#</th>
                            </tr>
                        </thead>
                        <tbody id="repeater_${field.name}_body"></tbody>
                    </table>
                </div>
                <button type="button" id="btn-add-${field.name}" 
                        data-schema='${JSON.stringify(subFields)}' 
                        onclick="window.addRepeaterItem('${field.name}')" 
                        class="mt-3 w-full py-2 bg-white border border-dashed border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-400 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                    <i class="fas fa-plus-circle"></i> Tambah Baris
                </button>
            </div>
            <input type="hidden" name="${field.name}">
        </div>`
   }

   // 2. RELATION (Dropdown)
   if (field.type === 'relation') {
    const opts = (window.relationCache[field.relation.collection] || [])
     .map((item) => {
      const k = field.relation.key
      const d = field.relation.display
      // Handle if value is object (populated) or ID
      const currentId = val && typeof val === 'object' ? val[k] : val
      return `<option value="${item[k]}" ${String(currentId) === String(item[k]) ? 'selected' : ''}>${item[d]}</option>`
     })
     .join('')

    return `
        <div class="w-full ${field.width === '100' ? 'col-span-full' : ''}">
            ${labelHtml}
            <div class="relative">
                <select name="${field.name}" class="${baseClass} appearance-none cursor-pointer" ${isRequired} ${isReadOnly}>
                    <option value="">-- Pilih --</option>
                    ${opts}
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500"><i class="fas fa-chevron-down text-xs"></i></div>
            </div>
        </div>`
   }

   // 3. SELECT / ENUM
   if (field.type === 'select') {
    const opts = (field.options || [])
     .map((opt) => `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`)
     .join('')
    return `
        <div class="w-full ${field.width === '100' ? 'col-span-full' : ''}">
            ${labelHtml}
            <div class="relative">
                <select name="${field.name}" class="${baseClass} appearance-none" ${isRequired}>
                    <option value="">-- Pilih --</option>
                    ${opts}
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500"><i class="fas fa-chevron-down text-xs"></i></div>
            </div>
        </div>`
   }

   // 4. CURRENCY
   if (field.type === 'currency') {
    return `
        <div class="w-full ${field.width === '100' ? 'col-span-full' : ''}">
            ${labelHtml}
            <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-bold text-xs">Rp</div>
                <input type="number" name="${field.name}" value="${val}" class="${baseClass} pl-10" placeholder="0" ${isRequired} ${isReadOnly}>
            </div>
        </div>`
   }

   // 5. TEXTAREA
   if (field.type === 'textarea') {
    return `
        <div class="col-span-full">
            ${labelHtml}
            <textarea name="${field.name}" rows="3" class="${baseClass} resize-none" ${isRequired} ${isReadOnly}>${val}</textarea>
        </div>`
   }

   // DEFAULT INPUT
   return `
    <div class="w-full ${field.width === '100' ? 'col-span-full' : ''}">
        ${labelHtml}
        <input type="${field.type === 'date' ? 'date' : 'text'}" name="${field.name}" value="${val}" class="${baseClass}" ${isRequired} ${isReadOnly}>
    </div>`
  })

  // STEP 3: FINAL RENDER
  form.innerHTML = `
    <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            ${renderedFields.join('')}
        </div>
    </div>
    <div class="p-5 border-t border-gray-100 bg-white shrink-0 flex gap-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-5 z-10">
        <button type="button" onclick="window.closeModal()" class="flex-1 py-3.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-50 transition-colors">Batal</button>
        <button type="submit" class="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
            <i class="fas fa-save"></i> Simpan
        </button>
    </div>`
 } catch (err) {
  console.error(err)
  form.innerHTML = `<div class="flex-1 flex items-center justify-center text-red-500 font-bold text-xs">Error loading form</div>`
 }
}

// =================================================================
// 5. GLOBAL LOGIC: REPEATER, CALCULATION & AUTO POPULATE
// =================================================================
window.formDynamicState = {}
window.relationCache = {}

// Add Item ke Repeater
window.addRepeaterItem = function (fieldName) {
 const btn = document.getElementById(`btn-add-${fieldName}`)
 const schema = JSON.parse(btn.dataset.schema || '[]')

 // Default Empty Object based on schema
 const newItem = {}
 schema.forEach((col) => {
  newItem[col.name] = col.defaultValue !== undefined ? col.defaultValue : ''
 })

 if (!window.formDynamicState[fieldName]) window.formDynamicState[fieldName] = []
 window.formDynamicState[fieldName].push(newItem)
 window.renderRepeater(fieldName, schema)
}

// Remove Item
window.removeRepeaterItem = function (fieldName, index) {
 const btn = document.getElementById(`btn-add-${fieldName}`)
 const schema = JSON.parse(btn.dataset.schema || '[]')

 window.formDynamicState[fieldName].splice(index, 1)
 window.renderRepeater(fieldName, schema)
}

// Handle Change pada Relation (Auto Populate)
window.handleRepeaterRelationChange = function (selectEl, fieldName, index, colName) {
 const btn = document.getElementById(`btn-add-${fieldName}`)
 const schema = JSON.parse(btn.dataset.schema || '[]')
 const colConfig = schema.find((c) => c.name === colName)
 const val = selectEl.value

 // Update Value
 window.formDynamicState[fieldName][index][colName] = val

 // Logic Auto Populate
 if (colConfig && colConfig.relation && colConfig.relation.auto_populate && val) {
  const sourceItem = window.relationCache[colConfig.relation.collection].find(
   (d) => String(d[colConfig.relation.key]) === String(val)
  )

  if (sourceItem) {
   const map = colConfig.relation.auto_populate // e.g., { "price": "unit_price", "sku": "code" }
   Object.keys(map).forEach((sourceKey) => {
    const targetKey = map[sourceKey]
    // Isi target field di baris yang sama dengan data dari sumber
    window.formDynamicState[fieldName][index][targetKey] = sourceItem[sourceKey]
   })
  }
 }

 // Trigger Recalculate Row
 window.recalculateRow(window.formDynamicState[fieldName][index], schema)
 window.renderRepeater(fieldName, schema)
}

// Handle Change pada Input Biasa (Text/Number/Currency)
window.handleRepeaterInputChange = function (inputEl, fieldName, index, colName) {
 const btn = document.getElementById(`btn-add-${fieldName}`)
 const schema = JSON.parse(btn.dataset.schema || '[]')
 let val = inputEl.value

 // Konversi tipe jika perlu
 if (inputEl.type === 'number') val = parseFloat(val) || 0

 window.formDynamicState[fieldName][index][colName] = val

 // Trigger Recalculate Row
 window.recalculateRow(window.formDynamicState[fieldName][index], schema)
 window.renderRepeater(fieldName, schema)
}

// Logic Hitung Baris (Qty * Harga = Subtotal)
window.recalculateRow = function (rowItem, schema) {
 schema.forEach((col) => {
  if (col.calculation && col.calculation.operation && col.calculation.fields) {
   const fields = col.calculation.fields
   const values = fields.map((f) => parseFloat(rowItem[f]) || 0)
   let result = 0

   if (col.calculation.operation === 'multiply') {
    result = values.reduce((acc, curr) => acc * curr, 1)
   } else if (col.calculation.operation === 'add') {
    result = values.reduce((acc, curr) => acc + curr, 0)
   } else if (col.calculation.operation === 'subtract') {
    result = values.reduce((acc, curr, idx) => (idx === 0 ? curr : acc - curr))
   }

   rowItem[col.name] = result
  }
 })
}

// Render Ulang Tabel Repeater
window.renderRepeater = function (fieldName, schema) {
 const tbody = document.getElementById(`repeater_${fieldName}_body`)
 const hiddenInput = document.querySelector(`input[name="${fieldName}"]`)
 const data = window.formDynamicState[fieldName] || []

 if (hiddenInput) hiddenInput.value = JSON.stringify(data)

 // Calculate Grand Total (Jika ada field grand_total di main form)
 // Mencari kolom subtotal di repeater
 const subtotalCol = schema.find((c) => c.name === 'subtotal')
 if (subtotalCol) {
  const grandTotal = data.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0)
  const grandTotalInput = document.querySelector('input[name="grand_total"]')
  if (grandTotalInput) grandTotalInput.value = grandTotal
 }

 if (!tbody) return
 if (data.length === 0) {
  tbody.innerHTML = `<tr><td colspan="${schema.length + 1}" class="p-4 text-center text-gray-400 italic text-[10px]">Belum ada data</td></tr>`
  return
 }

 tbody.innerHTML = data
  .map(
   (item, idx) => `
        <tr class="border-b border-gray-50 text-xs hover:bg-blue-50/20 transition-colors">
            ${schema
             .map((col) => {
              const isReadOnly = col.ui?.readonly ? 'disabled bg-gray-50 text-gray-500' : 'bg-white'

              // CELL: RELATION
              if (col.type === 'relation') {
               const opts = (window.relationCache[col.relation.collection] || [])
                .map(
                 (opt) =>
                  `<option value="${opt[col.relation.key]}" ${String(opt[col.relation.key]) === String(item[col.name]) ? 'selected' : ''}>${opt[col.relation.display]}</option>`
                )
                .join('')
               return `<td class="p-2"><select onchange="window.handleRepeaterRelationChange(this, '${fieldName}', ${idx}, '${col.name}')" class="w-full border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none ${isReadOnly}" ${isReadOnly ? 'disabled' : ''}><option value="">-</option>${opts}</select></td>`
              }

              // CELL: CURRENCY / NUMBER READONLY
              if (col.type === 'currency' && col.ui?.readonly) {
               return `<td class="p-2 text-right font-mono text-gray-600 bg-gray-50 rounded border border-transparent">Rp ${(item[col.name] || 0).toLocaleString('id-ID')}</td>`
              }

              // CELL: CURRENCY INPUT
              if (col.type === 'currency') {
               return `<td class="p-2"><input type="number" value="${item[col.name] || 0}" onchange="window.handleRepeaterInputChange(this, '${fieldName}', ${idx}, '${col.name}')" class="w-full border border-gray-200 rounded px-2 py-1.5 text-right font-mono" ${isReadOnly}></td>`
              }

              // CELL: SELECT
              if (col.type === 'select') {
               const opts = (col.options || [])
                .map(
                 (o) =>
                  `<option value="${o}" ${item[col.name] === o ? 'selected' : ''}>${o}</option>`
                )
                .join('')
               return `<td class="p-2"><select onchange="window.handleRepeaterInputChange(this, '${fieldName}', ${idx}, '${col.name}')" class="w-full border border-gray-200 rounded px-2 py-1.5"><option>-</option>${opts}</select></td>`
              }

              // CELL: DEFAULT
              return `<td class="p-2"><input type="${col.type === 'number' ? 'number' : 'text'}" value="${item[col.name] || ''}" onchange="window.handleRepeaterInputChange(this, '${fieldName}', ${idx}, '${col.name}')" class="w-full border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none ${isReadOnly}" ${isReadOnly}></td>`
             })
             .join('')}
            
            <td class="p-2 text-center align-middle">
                <button type="button" onclick="window.removeRepeaterItem('${fieldName}', ${idx})" class="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><i class="fas fa-trash-alt text-[10px]"></i></button>
            </td>
        </tr>
    `
  )
  .join('')
}

window.closeModal = function () {
 const modal = document.getElementById('crud-modal')
 const panel = document.getElementById('modal-panel')
 const backdrop = document.getElementById('modal-backdrop')

 if (backdrop) backdrop.classList.add('opacity-0')
 if (panel) panel.classList.add('translate-y-full', 'md:translate-x-full')

 setTimeout(() => {
  if (modal) modal.classList.add('hidden')
 }, 300)
}
