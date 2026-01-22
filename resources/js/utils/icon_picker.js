class IconPickerSystem {
 constructor() {
  this.modalId = 'global-icon-picker-modal'
  this.data = null
  this.onSelectCallback = null
  this.jsonPath = '/fa.json' // Sesuai lokasi file fa.json Anda

  // Daftarkan instance ke window agar bisa diakses oleh HTML string (onclick)
  window.GlobalIconPickerInstance = this
  this.injectModalHtml()
 }

 getIconPrefix(iconName) {
  const brandsIcons = ['accessible-icon', 'apple', 'facebook', 'google', 'twitter', 'github']
  return brandsIcons.some((b) => iconName.includes(b)) ? 'fa-brands' : 'fa-solid'
 }

 injectModalHtml() {
  if (document.getElementById(this.modalId)) return

  const modalHtml = `
        <div id="${this.modalId}" class="fixed inset-0 z-[9999] hidden flex items-center justify-center p-4 font-sans">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onclick="GlobalIconPickerInstance.close()"></div>
            
            <div class="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col h-[80vh] overflow-hidden animate-in zoom-in-95 duration-300">
                <div class="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white z-10">
                    <div class="min-w-0">
                        <h3 class="font-bold text-lg text-slate-800 tracking-tight">Icon Library</h3>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Choose Icons</p>
                    </div>
                    
                    <div class="relative flex-1 sm:max-w-[240px]">
                        <input type="text" oninput="GlobalIconPickerInstance.filterIcons(this.value)" 
                               placeholder="Search icons..." 
                               class="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 focus:bg-white transition-all">
                        <i class="fas fa-search absolute left-3 top-3 text-slate-300 text-xs"></i>
                    </div>
                </div>

                <div id="gip-grid-container" class="flex-1 overflow-y-auto p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 bg-slate-50/50 custom-scrollbar content-start">
                    <div class="col-span-full py-20 text-center">
                        <i class="fas fa-circle-notch fa-spin text-slate-200 text-3xl mb-3"></i>
                        <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Library...</p>
                    </div>
                </div>
            </div>
        </div>`

  document.body.insertAdjacentHTML('beforeend', modalHtml)
 }

 async open(callback) {
  this.onSelectCallback = callback
  document.getElementById(this.modalId).classList.remove('hidden')

  if (!this.data) {
   await this.loadData()
  } else {
   this.renderIcons(this.data)
  }
 }

 close() {
  document.getElementById(this.modalId).classList.add('hidden')
 }

 async loadData() {
  try {
   const res = await fetch(this.jsonPath)
   this.data = await res.json()
   this.renderIcons(this.data)
  } catch (error) {
   console.error('GIP Error:', error)
   document.getElementById('gip-grid-container').innerHTML =
    `<div class="col-span-full text-center p-10 text-rose-500 text-xs font-bold">Gagal memuat fa.json</div>`
  }
 }

 renderIcons(data, filter = '') {
  const container = document.getElementById('gip-grid-container')
  container.innerHTML = ''
  let found = false

  Object.keys(data).forEach((catKey) => {
   const category = data[catKey]
   const matches = category.icons.filter((icon) =>
    icon.toLowerCase().includes(filter.toLowerCase())
   )

   if (matches.length > 0) {
    found = true
    container.insertAdjacentHTML(
     'beforeend',
     `
        <div class="col-span-full pt-4 pb-2 sticky top-0 bg-slate-50/90 backdrop-blur z-10">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">${category.label}</span>
        </div>
    `
    )

    matches.forEach((icon) => {
     const prefix = this.getIconPrefix(icon)
     container.insertAdjacentHTML(
      'beforeend',
      `
            <button onclick="GlobalIconPickerInstance.handleSelect('${prefix} fa-${icon}')" 
                    class="flex flex-col items-center justify-center aspect-square rounded-2xl bg-white border border-slate-100 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all group p-2">
                <i class="${prefix} fa-${icon}"></i>
                <span class="text-[8px] text-slate-400 font-bold mt-2 truncate w-full text-center">${icon}</span>
            </button>
        `
     )
    })
   }
  })

  if (!found) {
   container.innerHTML = `<div class="col-span-full text-center py-20 text-slate-300 italic text-xs">Ikon tidak ditemukan</div>`
  }
 }

 filterIcons(keyword) {
  if (this.data) this.renderIcons(this.data, keyword)
 }

 handleSelect(fullIconClass) {
  console.log(fullIconClass)

  if (this.onSelectCallback) this.onSelectCallback(fullIconClass)
  this.close()
 }
}

export const iconPicker = new IconPickerSystem()
