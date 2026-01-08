import { apiFetch } from '../core/api.js'
import { AppState } from '../core/state.js'
import { showToast, closeModal, logout, showConfirmDialog } from '../utils/helpers.js'

export function renderTableView(config, container) {
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

export function openCrudModal(existingData = null) {
 const modal = document.getElementById('crud-modal')
 const panel = document.getElementById('modal-panel')
 const backdrop = document.getElementById('modal-backdrop')
 const form = document.getElementById('dynamic-form')

 delete form.dataset.editingId
 form.reset()

 if (existingData) form.dataset.editingId = existingData._id

 const fields = AppState.currentModule.config.fields || []

 document.getElementById('modal-title').innerText = existingData ? 'EDIT DATA' : 'TAMBAH DATA BARU'

 form.innerHTML = `
    <div class="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-gray-50/30">
        <div class="grid grid-cols-1 gap-5">
            ${fields
             .map((field) => {
              const val = existingData ? existingData[field.name] : field.default || ''

              const inputClass =
               'w-full px-4 py-3 bg-white border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm font-medium text-gray-800 outline-none transition-all placeholder-gray-400'

              let inputElement = `<input type="text" name="${field.name}" value="${val}" class="${inputClass}" ${field.required ? 'required' : ''}>`

              if (field.type === 'number') {
               inputElement = `<input type="number" name="${field.name}" value="${val}" class="${inputClass}" ${field.required ? 'required' : ''}>`
              } else if (field.type === 'textarea') {
               inputElement = `<textarea name="${field.name}" class="${inputClass} resize-none" rows="4" ${field.required ? 'required' : ''}>${val}</textarea>`
              }

              return `
                    <div class="space-y-1.5">
                        <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                            ${field.label} ${field.required ? '<span class="text-red-500">*</span>' : ''}
                        </label>
                        ${inputElement}
                    </div>`
             })
             .join('')}
        </div>
    </div>
    
    <div class="p-5 border-t border-gray-100 bg-white shrink-0 flex gap-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10">
        <button type="button" onclick="closeModal()" class="flex-1 py-3.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-50 transition-colors">
            Batal
        </button>
        <button type="submit" class="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
            <i class="fas fa-save"></i> Simpan
        </button>
    </div>
 `

 modal.classList.remove('hidden')
 setTimeout(() => {
  backdrop.classList.remove('opacity-0')

  panel.classList.remove('translate-y-full', 'md:translate-x-full')
 }, 10)
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

window.handleFormSubmit = async function (e) {
 e.preventDefault()
 const submitBtn = e.target.querySelector('button[type="submit"]')
 const originalText = submitBtn.innerHTML

 submitBtn.disabled = true
 submitBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i>`

 const id = e.target.dataset.editingId
 const colName = AppState.currentModule.config.collectionName
 const url = `api/collections/${colName}${id ? '/' + id : ''}`

 try {
  const payload = Object.fromEntries(new FormData(e.target).entries())
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
