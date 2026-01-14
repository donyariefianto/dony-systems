import { apiFetch } from '../core/api.js'
import { AppState } from '../core/state.js'
import { showToast, closeModal, logout, showConfirmDialog } from '../utils/helpers.js'

export function renderTableView(config, container) {
 console.log(config)

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
                            ${config.config.fields
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
        <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity opacity-0 duration-300" id="modal-backdrop" onclick="closeModal()"></div>
        
        <div id="modal-panel" class="absolute inset-x-0 bottom-0 top-10 md:inset-y-0 md:left-auto md:right-0 md:w-[500px] bg-white shadow-2xl rounded-t-2xl md:rounded-none transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full flex flex-col border-l border-gray-100">
            
            <div class="h-16 border-b border-gray-100 flex justify-between items-center px-6 bg-white shrink-0 rounded-t-2xl md:rounded-none">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <i class="fas fa-pen-nib"></i>
                    </div>
                    <h3 id="modal-title" class="font-black text-gray-800 text-sm uppercase tracking-widest">Form Data</h3>
                </div>
                <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="dynamic-form" onsubmit="window.handleFormSubmit(event)" class="flex-1 flex flex-col overflow-hidden">
                </form>
        </div>
    </div>
 `
}

export async function fetchTableData() {
 const desktopBody = document.getElementById('table-data-body-desktop')
 const mobileBody = document.getElementById('table-data-body-mobile')
 const loadingOverlay = document.getElementById('loading-state')

 if (!desktopBody || !AppState.currentModule) return

 if (loadingOverlay) loadingOverlay.classList.remove('hidden')
 if (loadingOverlay) loadingOverlay.classList.add('flex')

 try {
  const colName = AppState.currentModule.config.collectionName
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
   desktopBody.innerHTML = data
    .map(
     (item) => `
        <tr class="hover:bg-blue-50/40 transition-colors group">
            ${AppState.currentModule.config.fields
             .map(
              (f) => `
                <td class="p-4 text-xs font-semibold text-gray-700 whitespace-nowrap border-b border-gray-50">
                    ${item[f.name] || '<span class="text-gray-300">-</span>'}
                </td>
            `
             )
             .join('')}
            <td class="p-3 text-right whitespace-nowrap border-b border-gray-50 sticky right-0 bg-white group-hover:bg-blue-50/40 transition-colors shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editData('${item._id}')" class="w-8 h-8 rounded-lg bg-white border border-gray-200 text-blue-600 hover:border-blue-300 hover:shadow-sm flex items-center justify-center transition-all" title="Edit"><i class="fas fa-pen text-[10px]"></i></button>
                    <button onclick="deleteData('${item._id}')" class="w-8 h-8 rounded-lg bg-white border border-gray-200 text-red-500 hover:border-red-300 hover:shadow-sm flex items-center justify-center transition-all" title="Hapus"><i class="fas fa-trash text-[10px]"></i></button>
                </div>
            </td>
        </tr>
   `
    )
    .join('')

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
                        <h4 class="font-bold text-gray-800 text-sm line-clamp-1">${item[AppState.currentModule.config.fields[0].name]}</h4>
                        <p class="text-[10px] text-gray-400 font-mono mt-0.5">ID: ${item._id.substr(-4)}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="editData('${item._id}')" class="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><i class="fas fa-pen text-xs"></i></button>
                    <button onclick="deleteData('${item._id}')" class="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"><i class="fas fa-trash text-xs"></i></button>
                </div>
            </div>
            <div class="space-y-2 border-t border-gray-50 pt-3">
                ${AppState.currentModule.config.fields
                 .slice(1)
                 .map(
                  (f) => `
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-400 font-medium uppercase tracking-wider text-[9px]">${f.label}</span>
                        <span class="text-gray-700 font-bold text-right max-w-[60%] truncate">${item[f.name] || '-'}</span>
                    </div>
                `
                 )
                 .join('')}
            </div>
        </div>
   `
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

export async function deleteData(id) {
 const isConfirmed = await showConfirmDialog({
  title: 'Hapus Data?',
  text: 'Data yang dihapus tidak dapat dikembalikan lagi. Lanjutkan?',
  icon: 'warning',
  confirmText: 'Ya, Hapus Permanen',
  cancelText: 'Batal',
  dangerMode: true,
 })

 if (!isConfirmed) return

 Swal.fire({
  title: 'Menghapus...',
  html: 'Sedang memproses permintaan Anda.',
  timerProgressBar: true,
  allowOutsideClick: false,
  didOpen: () => {
   Swal.showLoading()
  },
 })

 try {
  const colName = AppState.currentModule.config.collectionName
  const response = await apiFetch(`api/collections/${colName}/${id}`, {
   method: 'DELETE',
  })

  if (response && response.ok) {
   Swal.close()
   showToast('Data berhasil dihapus', 'success')
   fetchTableData()
  } else {
   throw new Error('Gagal menghapus data')
  }
 } catch (err) {
  Swal.fire({
   icon: 'error',
   title: 'Gagal',
   text: 'Terjadi kesalahan saat menghubungi server.',
   confirmButtonColor: '#2563eb',
  })
 }
}

export async function handleFormSubmit(e) {
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

  const response = await apiFetch(url, {
   method: id ? 'PUT' : 'POST',
   body: JSON.stringify(payload),
  })

  if (response && response.ok) {
   closeModal()
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
   const data = await response.json()
   openCrudModal(data)
  }
 } catch (err) {
  showToast('Gagal memuat detail', 'error')
 }
}

window.tempTransactionItems = []
window.productListCache = []

window.addItemToGrid = function (inputName) {
 const productSelect = document.getElementById(`temp_${inputName}_product`)
 const qtyInput = document.getElementById(`temp_${inputName}_qty`)

 const productId = productSelect.value
 const qty = parseInt(qtyInput.value)

 if (!productId || qty <= 0) {
  alert('Pilih produk dan masukkan jumlah yang valid.')
  return
 }

 const product = window.productListCache.find((p) => p._id === productId)

 const existingIndex = window.tempTransactionItems.findIndex(
  (item) => item.product_id === productId
 )

 if (existingIndex > -1) {
  window.tempTransactionItems[existingIndex].qty += qty
  window.tempTransactionItems[existingIndex].subtotal =
   window.tempTransactionItems[existingIndex].qty * product.price
 } else {
  window.tempTransactionItems.push({
   product_id: productId,
   product_name: product.name,
   price: product.price,
   qty: qty,
   subtotal: qty * product.price,
  })
 }

 productSelect.value = ''
 qtyInput.value = '1'

 window.renderItemGrid(inputName)
}

window.removeItemFromGrid = function (index, inputName) {
 window.tempTransactionItems.splice(index, 1)
 window.renderItemGrid(inputName)
}

window.renderItemGrid = function (inputName) {
 const tableBody = document.getElementById(`grid_${inputName}_body`)
 const hiddenInput = document.querySelector(`input[name="${inputName}"]`)
 const totalDisplay = document.getElementById(`grid_${inputName}_total`)

 hiddenInput.value = JSON.stringify(window.tempTransactionItems)

 let html = ''
 let grandTotal = 0

 window.tempTransactionItems.forEach((item, idx) => {
  grandTotal += item.subtotal
  html += `
            <tr class="border-b border-gray-100 text-xs">
                <td class="py-2">${item.product_name}</td>
                <td class="py-2 text-right">Rp ${item.price.toLocaleString()}</td>
                <td class="py-2 text-center">${item.qty}</td>
                <td class="py-2 text-right font-bold">Rp ${item.subtotal.toLocaleString()}</td>
                <td class="py-2 text-right">
                    <button type="button" onclick="window.removeItemFromGrid(${idx}, '${inputName}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `
 })

 tableBody.innerHTML =
  html ||
  '<tr><td colspan="5" class="py-4 text-center text-gray-400 italic text-xs">Belum ada item ditambahkan</td></tr>'

 if (totalDisplay) totalDisplay.innerText = 'Rp ' + grandTotal.toLocaleString()

 const mainTotalInput = document.querySelector('input[name="total_price"]')
 if (mainTotalInput) mainTotalInput.value = grandTotal
}

window.formDynamicState = {}

window.formDynamicState = {}

window.addRepeaterItem = function (fieldName) {
 const btn = document.getElementById(`btn-add-${fieldName}`)
 if (!btn) return

 const schema = JSON.parse(btn.dataset.schema || '[]')

 let newItem = {}
 let isValid = true

 schema.forEach((col) => {
  const inputId = `temp_${fieldName}_${col.name}`
  const input = document.getElementById(inputId)

  if (input) {
   if (col.required && !input.value) {
    isValid = false
    input.classList.add('border-red-500')
   } else {
    input.classList.remove('border-red-500')
   }
   newItem[col.name] = input.value
  }
 })

 if (!isValid) {
  return
 }

 if (!window.formDynamicState[fieldName]) window.formDynamicState[fieldName] = []
 window.formDynamicState[fieldName].push(newItem)

 schema.forEach((col) => {
  const input = document.getElementById(`temp_${fieldName}_${col.name}`)
  if (input) input.value = ''
 })

 window.renderRepeater(fieldName, schema)
}

window.removeRepeaterItem = function (fieldName, index) {
 const btn = document.getElementById(`btn-add-${fieldName}`)
 const schema = JSON.parse(btn.dataset.schema || '[]')

 if (window.formDynamicState[fieldName]) {
  window.formDynamicState[fieldName].splice(index, 1)
  window.renderRepeater(fieldName, schema)
 }
}

window.renderRepeater = function (fieldName, schema) {
 const tbody = document.getElementById(`repeater_${fieldName}_body`)
 const hiddenInput = document.querySelector(`input[name="${fieldName}"]`)
 const data = window.formDynamicState[fieldName] || []

 if (hiddenInput) {
  hiddenInput.value = JSON.stringify(data)
 }

 if (!tbody) return

 if (data.length === 0) {
  tbody.innerHTML = `<tr><td colspan="${schema.length + 1}" class="p-4 text-center text-gray-400 italic text-xs">Belum ada data ditambahkan</td></tr>`
  return
 }

 tbody.innerHTML = data
  .map(
   (item, idx) => `
        <tr class="border-b border-gray-50 text-xs hover:bg-blue-50/30 transition-colors group">
            ${schema
             .map(
              (col) => `
                <td class="p-3 text-gray-700 font-medium">
                    ${item[col.name] || '-'}
                </td>
            `
             )
             .join('')}
            <td class="p-2 text-right">
                <button type="button" onclick="window.removeRepeaterItem('${fieldName}', ${idx})" 
                        class="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all shadow-sm">
                    <i class="fas fa-trash-alt text-[10px]"></i>
                </button>
            </td>
        </tr>
    `
  )
  .join('')
}

window.previewImage = function (input, previewId) {
 const file = input.files[0]
 const previewBox = document.getElementById(previewId)

 if (file) {
  const reader = new FileReader()
  reader.onload = function (e) {
   previewBox.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover rounded-lg shadow-sm">`
  }
  reader.readAsDataURL(file)
 } else {
  previewBox.innerHTML = `
            <div class="flex flex-col items-center justify-center text-gray-300">
                <i class="fas fa-image text-2xl mb-1"></i>
                <span class="text-[9px]">Preview</span>
            </div>`
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

 if (existingData) {
  form.dataset.editingId = existingData._id
  if (titleEl) titleEl.innerText = `EDIT ${AppState.currentModule.name || 'DATA'}`
 } else {
  if (titleEl) titleEl.innerText = `TAMBAH ${AppState.currentModule.name || 'DATA'}`
 }

 modal.classList.remove('hidden')
 form.innerHTML = `
        <div class="flex-1 flex flex-col items-center justify-center h-full space-y-4 min-h-[300px]">
            <div class="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p class="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Memuat Formulir...</p>
        </div>
    `

 setTimeout(() => {
  backdrop.classList.remove('opacity-0')
  panel.classList.remove('translate-y-full', 'md:translate-x-full')
 }, 10)

 try {
  const fields = AppState.currentModule.config.fields || []

  const renderedFields = await Promise.all(
   fields.map(async (field) => {
    let val = existingData
     ? existingData[field.name]
     : field.defaultValue !== undefined
       ? field.defaultValue
       : ''

    const baseInputClass =
     'w-full px-4 py-3 bg-white border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm font-medium text-gray-800 outline-none transition-all placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-500'
    const labelHtml = `
                <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5">
                    ${field.label} ${field.required ? '<span class="text-red-500">*</span>' : ''}
                </label>`

    if (field.type === 'relation') {
     let optionsHtml = '<option value="">-- Pilih Data --</option>'
     let errorMsg = ''
     try {
      const res = await apiFetch(`api/collections/${field.relation.collection}`)
      if (res && res.ok) {
       const json = await res.json()
       const listData = json.data || []
       optionsHtml += listData
        .map((item) => {
         const k = field.relation.key || '_id'
         const d = field.relation.display || 'name'
         const currentId = val && typeof val === 'object' ? val[k] : val
         const isSelected = String(currentId) === String(item[k]) ? 'selected' : ''
         return `<option value="${item[k]}" ${isSelected}>${item[d]}</option>`
        })
        .join('')
      } else throw new Error('Fetch failed')
     } catch (err) {
      errorMsg = `<p class="text-[10px] text-red-500 mt-1">Gagal memuat data relasi.</p>`
     }
     return `<div class="space-y-1">${labelHtml}<div class="relative"><select name="${field.name}" class="${baseInputClass} appearance-none cursor-pointer" ${field.required ? 'required' : ''}>${optionsHtml}</select><div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500"><i class="fas fa-chevron-down text-xs"></i></div></div>${errorMsg}</div>`
    }

    if (field.type === 'repeater') {
     const subFields = field.sub_fields || [{ name: 'value', label: 'Value' }]

     let initialData = []
     if (typeof val === 'string') {
      try {
       initialData = JSON.parse(val)
      } catch (e) {}
     } else if (Array.isArray(val)) {
      initialData = val
     }
     window.formDynamicState[field.name] = initialData

     const footerInputs = subFields
      .map(
       (sf) => `
                    <td class="p-1 align-top">
                        <input type="${sf.type === 'number' || sf.type === 'currency' ? 'number' : 'text'}" 
                               id="temp_${field.name}_${sf.name}" placeholder="${sf.label}" 
                               class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:border-blue-500">
                    </td>`
      )
      .join('')

     setTimeout(() => {
      if (window.renderRepeater) window.renderRepeater(field.name, subFields)
     }, 0)

     return `
                <div class="col-span-full bg-gray-50 p-4 rounded-xl border border-gray-200">
                    ${labelHtml}
                    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden mb-2 shadow-sm">
                        <table class="w-full text-left">
                            <thead class="bg-gray-100 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                                <tr>${subFields.map((sf) => `<th class="p-3">${sf.label}</th>`).join('')}<th class="w-10 text-center">#</th></tr>
                            </thead>
                            <tbody id="repeater_${field.name}_body"></tbody>
                            <tfoot class="bg-gray-50 border-t border-gray-200">
                                <tr>${footerInputs}<td class="p-1 text-center"><button type="button" id="btn-add-${field.name}" data-schema='${JSON.stringify(subFields)}' onclick="window.addRepeaterItem('${field.name}')" class="w-8 h-8 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md active:scale-95 flex items-center justify-center"><i class="fas fa-plus"></i></button></td></tr>
                            </tfoot>
                        </table>
                    </div>
                    <input type="hidden" name="${field.name}" value='[]'>
                </div>`
    }

    if (field.type === 'image') {
     const previewSrc = val || ''
     const hasImg = previewSrc
      ? `<img src="${previewSrc}" class="w-full h-full object-cover rounded-lg shadow-sm">`
      : `<div class="flex flex-col items-center justify-center text-gray-300"><i class="fas fa-image text-2xl mb-1"></i><span class="text-[9px]">Preview</span></div>`
     return `<div class="space-y-1">${labelHtml}<div class="flex gap-4 items-start p-3 border border-gray-200 rounded-xl border-dashed bg-gray-50"><div id="preview-${field.name}" class="w-24 h-24 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">${hasImg}</div><div class="flex-1 space-y-2"><input type="file" name="${field.name}" accept="image/*" onchange="window.previewImage(this, 'preview-${field.name}')" class="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-all"/></div></div></div>`
    }

    if (field.type === 'boolean') {
     const isChecked = val === true || val === 'true' || val === 1 ? 'checked' : ''
     return `<div class="space-y-1"><div class="flex items-center justify-between p-3.5 border border-gray-200 rounded-xl bg-white hover:border-blue-300 transition-colors cursor-pointer" onclick="this.querySelector('input').click()"><span class="text-xs font-bold text-gray-700 uppercase tracking-wide">${field.label}</span><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" name="${field.name}" value="true" class="sr-only peer" ${isChecked} onclick="event.stopPropagation()"><div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label></div></div>`
    }

    if (field.type === 'select') {
     const opts = field.options || []
     const optionsHtml = opts
      .map((opt) => {
       const v = typeof opt === 'object' ? opt.value : opt
       const l = typeof opt === 'object' ? opt.label : opt
       const isSel = String(val) === String(v) ? 'selected' : ''
       return `<option value="${v}" ${isSel}>${l}</option>`
      })
      .join('')
     return `<div class="space-y-1">${labelHtml}<div class="relative"><select name="${field.name}" class="${baseInputClass} appearance-none cursor-pointer" ${field.required ? 'required' : ''}><option value="">-- Pilih --</option>${optionsHtml}</select><div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500"><i class="fas fa-chevron-down text-xs"></i></div></div></div>`
    }

    if (field.type === 'currency') {
     return `<div class="space-y-1">${labelHtml}<div class="relative"><div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-bold text-xs border-r border-gray-100 pr-3 bg-gray-50 rounded-l-xl">Rp</div><input type="number" name="${field.name}" value="${val}" class="${baseInputClass} pl-16" placeholder="0" ${field.required ? 'required' : ''}></div></div>`
    }

    if (field.type === 'textarea') {
     return `<div class="space-y-1 col-span-full">${labelHtml}<textarea name="${field.name}" rows="3" class="${baseInputClass} resize-none" ${field.required ? 'required' : ''}>${val}</textarea></div>`
    }

    return `<div class="space-y-1">${labelHtml}<input type="${field.type || 'text'}" name="${field.name}" value="${val}" class="${baseInputClass}" ${field.required ? 'required' : ''} ${field.ui?.readonly ? 'readonly' : ''}></div>`
   })
  )

  form.innerHTML = `
            <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
                <div class="grid grid-cols-1 gap-5">
                    ${renderedFields.join('')}
                </div>
            </div>
            
            <div class="p-5 border-t border-gray-100 bg-white shrink-0 flex gap-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10">
                <button type="button" onclick="closeModal()" class="flex-1 py-3.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-50 transition-colors">
                    Batal
                </button>
                <button type="submit" class="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                    <i class="fas fa-save"></i> Simpan
                </button>
            </div>`
 } catch (err) {
  console.error('Form Rendering Error:', err)
  form.innerHTML = `<div class="flex-1 flex flex-col items-center justify-center text-center p-8 text-red-500"><i class="fas fa-bug text-2xl mb-2"></i><p class="text-xs font-bold">Gagal memuat formulir.</p></div>`
 }
}

window.closeModal = function () {
 const modal = document.getElementById('crud-modal')
 const panel = document.getElementById('modal-panel')
 const backdrop = document.getElementById('modal-backdrop')

 backdrop.classList.add('opacity-0')
 panel.classList.add('translate-y-full', 'md:translate-x-full')

 setTimeout(() => {
  modal.classList.add('hidden')
 }, 300)
}
