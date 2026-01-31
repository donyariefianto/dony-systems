import { apiFetch } from '../core/api.js'
import { showToast, showConfirmDialog, decryptData } from '../utils/helpers.js'

export function getSPEView() {
 return `
    <div class="h-full bg-slate-50 font-sans text-slate-800 relative overflow-hidden flex flex-col">
        
        <div id="spe-view-list" class="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <header class="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 z-20">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-white shadow-lg shadow-zinc-200">
                        <i class="fas fa-cubes text-lg"></i>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-slate-900 leading-tight">SPE Manager</h1>
                        <p class="text-[11px] text-slate-500 font-medium">Smart Projection Engine v3.0</p>
                    </div>
                </div>
                <div class="flex items-center gap-3 w-full md:w-auto">
                    <div class="relative flex-1 md:flex-none group">
                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs group-focus-within:text-indigo-500 transition-colors"></i>
                        <input type="text" id="spe-search" placeholder="Search engine..." 
                            class="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-xs w-full md:w-64 focus:ring-2 focus:ring-indigo-500 transition-all outline-none">
                    </div>
                    <button id="spe-create-new" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md shadow-indigo-100 whitespace-nowrap">
                        <i class="fas fa-plus"></i> <span class="hidden md:inline">New Projection</span><span class="md:hidden">New</span>
                    </button>
                </div>
            </header>

            <div class="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar" id="spe-list-container">
                </div>
        </div>

        <div id="spe-view-triggers" class="hidden flex flex-col h-full bg-slate-50 animate-in slide-in-from-right-8 duration-300">
            <header class="bg-white border-b border-slate-200 px-4 md:px-6 py-3 shrink-0 z-30 flex items-center justify-between sticky top-0 shadow-sm">
                <div class="flex items-center gap-3">
                    <button data-action="back-to-list" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div>
                        <h2 class="text-sm font-bold text-slate-900 leading-tight">Engine Configuration</h2>
                        <p class="text-[10px] text-slate-400">Manage sources & mapping</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button id="spe-btn-delete-main" class="hidden px-3 py-1.5 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 transition-all flex items-center gap-2">
                        <i class="fas fa-trash-alt"></i> <span class="hidden md:inline">Delete</span>
                    </button>
                    <button id="spe-btn-save-global" class="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </header>

            <div class="flex-1 overflow-auto custom-scrollbar">
                <div class="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
                    
                    <section class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div class="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2">
                            <i class="fas fa-info-circle text-indigo-500"></i>
                            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wide">General Information</h3>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Feature Name <span class="text-red-500">*</span></label>
                                <input type="text" id="spe-input-name" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. Sync Master Data">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Collection (Output) <span class="text-red-500">*</span></label>
                                <div class="relative">
                                    <i class="fas fa-database absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                                    <input type="text" id="spe-input-target" class="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. warehouse_summary">
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div class="flex items-center justify-between mb-3 px-1">
                             <div class="flex items-center gap-2">
                                <span class="w-6 h-6 rounded bg-amber-50 text-amber-500 flex items-center justify-center text-xs border border-amber-100">
                                    <i class="fas fa-bolt"></i>
                                </span>
                                <h3 class="text-xs font-bold text-slate-600 uppercase tracking-widest">Event Triggers</h3>
                            </div>
                            
                            <button id="spe-btn-add-trigger" class="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 shadow-sm">
                                <i class="fas fa-plus"></i> Add Source
                            </button>
                        </div>

                        <div id="spe-triggers-container" class="space-y-3 pb-20">
                            </div>
                    </section>
                </div>
            </div>
        </div>

        <div id="spe-view-builder" class="hidden flex flex-col h-full animate-in zoom-in-95 duration-200 bg-slate-100">
            <header class="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-30">
                <div class="flex items-center gap-3 overflow-hidden">
                    <button data-action="back-to-triggers" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-all shrink-0">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="h-5 w-px bg-slate-200 shrink-0"></div>
                    <div class="flex flex-col min-w-0">
                        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mapping Builder</span>
                        <div id="builder-context-badge" class="flex items-center gap-2 text-xs font-bold text-slate-700 truncate"></div>
                    </div>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button id="spe-toggle-sidebar" class="md:hidden w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-600 rounded-lg">
                        <i class="fas fa-columns"></i>
                    </button>
                    <button id="spe-btn-add-root" class="hidden md:flex px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 text-xs font-bold hover:bg-indigo-100 transition-all items-center gap-2">
                        <i class="fas fa-plus"></i> Add Root
                    </button>
                    <button data-action="save-builder-state" class="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 shadow-sm transition-all flex items-center gap-2">
                        <i class="fas fa-check"></i> <span class="hidden md:inline">Done</span>
                    </button>
                </div>
            </header>

            <main class="flex-1 flex overflow-hidden relative">
                <aside id="spe-builder-sidebar" class="absolute md:relative w-64 h-full bg-white border-r border-slate-200 flex flex-col z-20 transform -translate-x-full md:translate-x-0 transition-transform duration-300 shadow-xl md:shadow-none">
                    <div class="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div>
                            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Source Fields</label>
                            <p id="builder-source-name" class="text-[10px] text-indigo-600 font-mono font-bold truncate max-w-[150px]">-</p>
                        </div>
                        <button id="spe-close-sidebar" class="md:hidden text-slate-400"><i class="fas fa-times"></i></button>
                    </div>
                    <div id="spe-source-fields-container" class="flex-1 overflow-auto p-2 space-y-1 custom-scrollbar pb-20"></div>
                    <div class="p-4 border-t border-slate-100 md:hidden">
                        <button id="spe-btn-add-root-mobile" class="w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs">+ Add Root Field</button>
                    </div>
                </aside>

                <div class="flex-1 bg-slate-100/50 p-4 md:p-8 overflow-auto relative custom-scrollbar" id="spe-canvas-wrapper">
                    <div id="spe-canvas-root" class="max-w-3xl mx-auto pb-40 space-y-2"></div>
                    <div id="spe-empty-state" class="hidden absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-60">
                        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-4">
                            <i class="fas fa-layer-group text-2xl text-slate-300"></i>
                        </div>
                        <p class="text-xs font-bold text-slate-500">Canvas Kosong</p>
                    </div>
                </div>
                <div id="spe-sidebar-overlay" class="md:hidden absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-10 hidden"></div>
            </main>
        </div>

        <div id="spe-drawer-overlay" class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] hidden opacity-0 transition-opacity duration-300"></div>
        <div id="spe-property-drawer" class="fixed top-0 right-0 w-full md:w-[420px] h-full bg-white shadow-2xl z-[70] transform translate-x-full transition-transform duration-300 ease-out flex flex-col">
             <div class="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50">
                <h3 class="text-xs font-bold text-slate-800 uppercase">Field Config</h3>
                <button id="spe-drawer-close" class="text-slate-400 hover:text-rose-500"><i class="fas fa-times"></i></button>
            </div>
            
            <div class="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar bg-white">
                <div>
                    <label class="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Key Name</label>
                    <input type="text" id="prop-key" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Type</label>
                    <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        <button class="prop-type-btn p-2 border rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 flex flex-col items-center gap-1" data-type="string"><i class="fas fa-font"></i>Str</button>
                        <button class="prop-type-btn p-2 border rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 flex flex-col items-center gap-1" data-type="number"><i class="fas fa-hashtag"></i>Num</button>
                        <button class="prop-type-btn p-2 border rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 flex flex-col items-center gap-1" data-type="boolean"><i class="fas fa-toggle-on"></i>Bool</button>
                        <button class="prop-type-btn p-2 border rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 flex flex-col items-center gap-1" data-type="object"><i class="fas fa-cube"></i>Obj</button>
                        <button class="prop-type-btn p-2 border rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 flex flex-col items-center gap-1" data-type="array"><i class="fas fa-cubes"></i>Arr</button>
                        <input type="hidden" id="prop-type-val">
                    </div>
                </div>
                <div id="prop-logic-section" class="space-y-3 pt-2 border-t border-dashed border-slate-200">
                    <label class="text-[10px] font-bold text-slate-500 uppercase block">Source Logic</label>
                    <div class="flex p-1 bg-slate-100 rounded-lg">
                        <button class="prop-mode-btn flex-1 py-1.5 text-[10px] font-bold rounded-md" data-mode="direct">Direct</button>
                        <button class="prop-mode-btn flex-1 py-1.5 text-[10px] font-bold rounded-md" data-mode="formula">Code</button>
                        <button class="prop-mode-btn flex-1 py-1.5 text-[10px] font-bold rounded-md" data-mode="static">Static</button>
                        <input type="hidden" id="prop-mode-val">
                    </div>
                    <div id="prop-input-direct" class="prop-input-area">
                        <select id="prop-val-direct" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"></select>
                    </div>
                    <div id="prop-input-formula" class="prop-input-area hidden">
                        <textarea id="prop-val-formula" rows="5" class="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg outline-none" placeholder="return source.val * 2;"></textarea>
                    </div>
                    <div id="prop-input-static" class="prop-input-area hidden">
                         <input type="text" id="prop-val-static" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none">
                    </div>
                </div>
                <div class="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <input type="checkbox" id="prop-encrypt" class="h-4 w-4 text-amber-600 rounded">
                    <label for="prop-encrypt" class="text-xs font-bold text-amber-800">Encrypt Value</label>
                </div>
            </div>
            <footer class="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                <button id="spe-drawer-delete" class="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50">Delete</button>
                <div class="flex-1"></div>
                <button id="spe-drawer-close-btn" class="px-4 py-2 text-slate-500 text-xs font-bold">Cancel</button>
                <button id="spe-drawer-save" class="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md">Apply</button>
            </footer>
        </div>
    </div>`
}

export function initSPEController() {
 const EVENT_CONFIGS = {
  onInsert: { color: 'emerald', icon: 'fa-plus', label: 'On Insert' },
  onUpdate: { color: 'indigo', icon: 'fa-pen', label: 'On Update' },
  onDelete: { color: 'rose', icon: 'fa-trash', label: 'On Delete' },
 }
 const DATA_TYPES = {
  string: { icon: 'fa-font', color: 'text-slate-500', bg: 'bg-slate-100' },
  number: { icon: 'fa-hashtag', color: 'text-blue-500', bg: 'bg-blue-50' },
  boolean: { icon: 'fa-toggle-on', color: 'text-purple-500', bg: 'bg-purple-50' },
  array: { icon: 'fa-cubes', color: 'text-amber-600', bg: 'bg-amber-50' },
  object: { icon: 'fa-cube', color: 'text-indigo-600', bg: 'bg-indigo-50' },
 }

 const debounce = (func, delay) => {
  let t
  return (...args) => {
   clearTimeout(t)
   t = setTimeout(() => func(...args), delay)
  }
 }

 const state = {
  configId: null,
  pagination: { page: 1, limit: 8, total: 0, lastPage: 1 },
  collections: [],
  triggers: [],
  activeTriggerId: null,
  currentBuilderRules: [],
  currentSourceSchema: [],
  editingNodeId: null,
  parentIdForNew: null,
 }

 const els = {
  views: {
   list: document.getElementById('spe-view-list'),
   triggers: document.getElementById('spe-view-triggers'),
   builder: document.getElementById('spe-view-builder'),
  },
  inputs: {
   search: document.getElementById('spe-search'),
   name: document.getElementById('spe-input-name'),
   target: document.getElementById('spe-input-target'),
  },
  containers: {
   list: document.getElementById('spe-list-container'),
   triggers: document.getElementById('spe-triggers-container'),
   canvas: document.getElementById('spe-canvas-root'),
   sourceFields: document.getElementById('spe-source-fields-container'),
   emptyState: document.getElementById('spe-empty-state'),
  },
  buttons: {
   create: document.getElementById('spe-create-new'),
   addTrigger: document.getElementById('spe-btn-add-trigger'),
   saveGlobal: document.getElementById('spe-btn-save-global'),
   deleteMain: document.getElementById('spe-btn-delete-main'),
   addRoot: document.getElementById('spe-btn-add-root'),
   backToList: document.querySelector('[data-action="back-to-list"]'),
   backToTriggers: document.querySelector('[data-action="back-to-triggers"]'),
   saveBuilder: document.querySelector('[data-action="save-builder-state"]'),
   toggleSidebar: document.getElementById('spe-toggle-sidebar'),
   closeSidebar: document.getElementById('spe-close-sidebar'),
   addRootMobile: document.getElementById('spe-btn-add-root-mobile'),
  },
  drawer: {
   el: document.getElementById('spe-property-drawer'),
   overlay: document.getElementById('spe-drawer-overlay'),
   key: document.getElementById('prop-key'),
   typeVal: document.getElementById('prop-type-val'),
   modeVal: document.getElementById('prop-mode-val'),
   valDirect: document.getElementById('prop-val-direct'),
   valFormula: document.getElementById('prop-val-formula'),
   valStatic: document.getElementById('prop-val-static'),
   encrypt: document.getElementById('prop-encrypt'),
   btnSave: document.getElementById('spe-drawer-save'),
   btnDelete: document.getElementById('spe-drawer-delete'),
   btnClose: document.getElementById('spe-drawer-close'),
   btnCloseBtn: document.getElementById('spe-drawer-close-btn'),
  },
 }

 const ui = {
  switchView: (viewName) => {
   Object.values(els.views).forEach((el) => el.classList.add('hidden'))
   if (viewName === 'list') {
    els.views.list.classList.remove('hidden')
    actions.fetchList()
   } else if (viewName === 'triggers') {
    els.views.triggers.classList.remove('hidden')
    ui.renderTriggerList()
   } else if (viewName === 'builder') {
    els.views.builder.classList.remove('hidden')
    canvasUI.render()
   }
  },

  renderTriggerList: () => {
   const container = els.containers.triggers
   container.innerHTML = ''

   if (state.triggers.length === 0) {
    container.innerHTML = `
                    <div class="text-center py-8 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                        <p class="text-xs text-slate-500 font-bold">No triggers added yet.</p>
                        <p class="text-[10px] text-slate-400">Click "+ Add Source" above to start.</p>
                    </div>`
    return
   }

   state.triggers.forEach((trigger, index) => {
    const config = EVENT_CONFIGS[trigger.event] || EVENT_CONFIGS.onInsert
    const fieldCount = trigger.mapping ? trigger.mapping.length : 0
    const sourceOptions =
     `<option value="" disabled ${!trigger.source ? 'selected' : ''}>Select Source...</option>` +
     state.collections
      .map(
       (c) =>
        `<option value="${c.name}" ${c.name === trigger.source ? 'selected' : ''}>${c.name}</option>`
      )
      .join('')
    const eventOptions = Object.keys(EVENT_CONFIGS)
     .map(
      (k) =>
       `<option value="${k}" ${k === trigger.event ? 'selected' : ''}>${EVENT_CONFIGS[k].label}</option>`
     )
     .join('')

    const html = `
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all animate-in slide-in-from-bottom-2 duration-300 flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div class="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200"><i class="fas fa-table text-xs"></i></div>
                    <div class="flex-1">
                        <label class="text-[9px] font-bold text-slate-400 uppercase">Source Collection</label>
                        <select class="trigger-source-select w-full bg-transparent text-xs font-bold text-slate-700 border-b border-slate-200 pb-1 focus:border-indigo-500 outline-none cursor-pointer" data-id="${trigger.id}">${sourceOptions}</select>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-${config.color}-50 flex items-center justify-center text-${config.color}-500 border border-${config.color}-100"><i class="fas ${config.icon} text-xs"></i></div>
                    <div class="flex-1">
                        <label class="text-[9px] font-bold text-slate-400 uppercase">Trigger Event</label>
                        <select class="trigger-event-select w-full bg-transparent text-xs font-bold text-slate-700 border-b border-slate-200 pb-1 focus:border-indigo-500 outline-none cursor-pointer" data-id="${trigger.id}">${eventOptions}</select>
                    </div>
                </div>
            </div>
            <div class="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                <span class="text-[10px] font-bold ${fieldCount > 0 ? 'text-emerald-600' : 'text-slate-400'} uppercase mr-2">${fieldCount} Mapped</span>
                <button class="trigger-config-btn px-3 py-1.5 bg-slate-900 text-white hover:bg-indigo-600 rounded-lg text-[10px] font-bold transition-all shadow-sm" data-id="${trigger.id}"><i class="fas fa-cog mr-1"></i> Setup</button>
                <button class="trigger-delete-btn w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" data-id="${trigger.id}"><i class="fas fa-times"></i></button>
            </div>
        </div>`
    container.insertAdjacentHTML('beforeend', html)
   })

   document
    .querySelectorAll('.trigger-source-select')
    .forEach((el) =>
     el.addEventListener('change', (e) =>
      actions.updateTrigger(e.target.dataset.id, 'source', e.target.value)
     )
    )
   document
    .querySelectorAll('.trigger-event-select')
    .forEach((el) =>
     el.addEventListener('change', (e) =>
      actions.updateTrigger(e.target.dataset.id, 'event', e.target.value)
     )
    )
   document
    .querySelectorAll('.trigger-config-btn')
    .forEach((el) =>
     el.addEventListener('click', (e) => actions.openBuilder(e.currentTarget.dataset.id))
    )
   document
    .querySelectorAll('.trigger-delete-btn')
    .forEach((el) =>
     el.addEventListener('click', (e) => actions.removeTrigger(e.currentTarget.dataset.id))
    )
  },

  renderListData: (items) => {
   const container = els.containers.list
   if (!items || items.length === 0) {
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-[450px] animate-in fade-in zoom-in duration-700">
            <div class="relative mb-8">
                <div class="absolute inset-0 bg-indigo-500/10 rounded-full blur-3xl transform scale-150"></div>
                
                <div class="relative w-28 h-28 bg-white border border-slate-100 rounded-[2rem] shadow-2xl flex items-center justify-center">
                    <i class="fas fa-project-diagram text-5xl text-slate-200"></i>
                    
                    <div class="absolute -top-2 -right-2 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg border-4 border-white animate-bounce">
                        <i class="fas fa-plus text-xs"></i>
                    </div>
                    <div class="absolute -bottom-4 -left-4 w-12 h-12 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-md">
                        <i class="fas fa-database text-slate-300 text-sm"></i>
                    </div>
                </div>
            </div>

            <div class="text-center space-y-2">
                <h3 class="text-xl font-bold text-slate-800 tracking-tight">Ready to sync data?</h3>
                <p class="text-sm text-slate-400 max-w-[320px] mx-auto leading-relaxed">
                    You don't have any engines configured yet. Connect your source collection to your target in minutes.
                </p>
            </div>

            <button onclick="document.getElementById('spe-create-new').click()" 
                class="mt-10 px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-3 group">
                <span>Start Creating a Smart Projection Engine</span>
                <i class="fas fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
            </button>
        </div>`
    return
   }
   container.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">${items
    .map((item) => {
     const safeId = item._id || item.id
     const triggerCount = item.triggers ? item.triggers.length : 0
     return `
        <div class="group bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between h-full min-h-[140px]" onclick="document.dispatchEvent(new CustomEvent('spe:edit-config', { detail: '${safeId}' }))">
            <div>
                <div class="flex justify-between items-start mb-3">
                    <div class="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors"><i class="fas fa-cube text-xs"></i></div>
                    <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase border border-emerald-100">Active</span>
                </div>
                <h3 class="text-sm font-bold text-slate-800 mb-1 leading-tight group-hover:text-indigo-700">${item.feature_name || 'Untitled'}</h3>
                <p class="text-[10px] text-slate-400 font-mono truncate"><i class="fas fa-arrow-right mr-1"></i> ${item.id_engine_collection || '-'}</p>
            </div>
            <div class="pt-3 border-t border-slate-50 flex items-center justify-between mt-auto">
                <span class="text-[10px] font-bold text-slate-500"><i class="fas fa-plug text-slate-300 mr-1"></i> ${triggerCount} Sources</span>
                <i class="fas fa-chevron-right text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0"></i>
            </div>
        </div>`
    })
    .join('')}</div>`
  },

  renderPagination: () => {
   const { page, lastPage, total } = state.pagination

   if (total === 0 || lastPage <= 1) return

   const html = `
            <div id="spe-pagination-ctrl" class="flex items-center justify-between px-2 py-6 mt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div class="flex flex-col">
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Page Progress</span>
                    <span class="text-xs font-bold text-slate-700">${page} <span class="text-slate-300 mx-1">/</span> ${lastPage}</span>
                </div>
                
                <div class="flex items-center gap-2">
                    <button id="btn-prev-page" ${page === 1 ? 'disabled' : ''} 
                        class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                        <i class="fas fa-chevron-left text-xs"></i>
                    </button>
                    
                    <button id="btn-next-page" ${page === lastPage ? 'disabled' : ''} 
                        class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                        <i class="fas fa-chevron-right text-xs"></i>
                    </button>
                </div>
            </div>`

   els.containers.list.insertAdjacentHTML('beforeend', html)

   document.getElementById('btn-prev-page').onclick = (e) => {
    e.preventDefault()
    if (state.pagination.page > 1) {
     state.pagination.page--
     actions.fetchList()
    }
   }

   document.getElementById('btn-next-page').onclick = (e) => {
    e.preventDefault()
    if (state.pagination.page < lastPage) {
     state.pagination.page++
     actions.fetchList()
    }
   }
  },
 }

 const canvasUI = {
  render: () => {
   const root = els.containers.canvas
   root.innerHTML = ''
   if (!state.currentBuilderRules || state.currentBuilderRules.length === 0) {
    els.containers.emptyState.classList.remove('hidden')
    return
   }
   els.containers.emptyState.classList.add('hidden')
   root.innerHTML = canvasUI.recursiveRender(helper.buildTree(state.currentBuilderRules))
  },
  recursiveRender: (nodes, level = 0) => {
   return nodes
    .map((n) => {
     const typeInfo = DATA_TYPES[n.dataType] || DATA_TYPES.string
     const isContainer = ['object', 'array'].includes(n.dataType)
     const ml = level * 20
     return `
        <div class="animate-in fade-in slide-in-from-bottom-1 duration-300" style="margin-left: ${ml}px">
            <div class="group flex items-center bg-white border border-slate-200 rounded-lg p-2 mb-2 hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer relative" onclick="document.dispatchEvent(new CustomEvent('spe:edit-node', {detail: ${n.id}}))">
                <div class="w-8 h-8 ${typeInfo.bg} rounded flex items-center justify-center mr-3 shrink-0"><i class="fas ${typeInfo.icon} ${typeInfo.color} text-xs"></i></div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2"><span class="text-xs font-bold text-slate-700 truncate">${n.target[n.target.length - 1]}</span>${n.encrypt ? '<i class="fas fa-lock text-[8px] text-amber-500"></i>' : ''}</div>
                    <div class="flex items-center gap-2 text-[10px] text-slate-400"><span class="uppercase font-bold tracking-wider text-[9px] bg-slate-50 px-1 rounded">${n.dataType}</span>${!isContainer ? `<i class="fas fa-long-arrow-alt-right text-slate-300"></i> <span class="font-mono text-indigo-600 truncate max-w-[150px]">${n.logic || '-'}</span>` : ''}</div>
                </div>
                <div class="flex items-center pl-2 border-l border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">${isContainer ? `<button class="w-7 h-7 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition-colors" onclick="event.stopPropagation(); document.dispatchEvent(new CustomEvent('spe:add-child', {detail: ${n.id}}))"><i class="fas fa-plus text-[10px]"></i></button>` : ''}</div>
            </div>
            ${isContainer && n.children ? canvasUI.recursiveRender(n.children, level + 1) : ''}
        </div>`
    })
    .join('')
  },
 }

 const actions = {
  fetchList: async () => {
   els.containers.list.innerHTML = `
    <div class="h-64 flex flex-col items-center justify-center text-slate-400">
        <i class="fas fa-circle-notch fa-spin text-2xl mb-3 text-indigo-500"></i>
        <span class="text-[10px] font-bold uppercase tracking-widest">Fetching Engines...</span>
    </div>`

   try {
    const searchStr = els.inputs.search.value
    let query_search = ''
    if (searchStr) {
     query_search = JSON.stringify({
      feature_name: searchStr.trim(),
      description: searchStr.trim(),
      id_engine_collection: searchStr.trim(),
      status: searchStr.trim(),
     })
    }
    const params = new URLSearchParams({
     page: state.pagination.page,
     limit: state.pagination.limit,
     search: query_search,
    })

    const res = await apiFetch(`api/collections/smart_projection_engine?${params}`)
    const json = await res.json()

    const data = json.ciphertext ? JSON.parse(decryptData(json.nonce, json.ciphertext)) : json
    state.pagination.total = data.total || 0
    state.pagination.lastPage = data.totalPages || 1
    state.pagination.page = data.page

    ui.renderListData(data.data || [])

    ui.renderPagination()
   } catch (e) {
    console.error('Fetch Error:', e)
    els.containers.list.innerHTML = `<div class="p-8 text-center text-rose-500 text-xs font-bold">Gagal memuat data dari server.</div>`
   }
  },

  loadCollections: async () => {
   try {
    const res = await apiFetch('api/list-menu')
    let json = await res.json()
    json = json.ciphertext ? JSON.parse(decryptData(json.nonce, json.ciphertext)) : json
    state.collections = []
    ;(json.sidemenu || []).forEach((m) =>
     m.sub_sidemenu.forEach((s) => {
      if (s.type === 'tableview' && s.config.collectionName)
       state.collections.push({ name: s.config.collectionName, fields: s.config.fields })
     })
    )
   } catch (e) {
    console.error(e)
   }
  },

  addTrigger: () => {
   state.triggers.push({ id: helper.uuid(), source: '', event: 'onInsert', mapping: [] })
   ui.renderTriggerList()
  },
  removeTrigger: async (id) => {
   state.triggers = state.triggers.filter((t) => t.id !== id)
   ui.renderTriggerList()
  },
  updateTrigger: (id, f, v) => {
   const t = state.triggers.find((x) => x.id === id)
   if (t) {
    t[f] = v
    ui.renderTriggerList()
   }
  },

  openBuilder: (triggerId) => {
   const trigger = state.triggers.find((t) => t.id === triggerId)
   if (!trigger || !trigger.source) return showToast('Select Source Collection first', 'warning')
   state.activeTriggerId = triggerId
   state.currentBuilderRules = JSON.parse(JSON.stringify(trigger.mapping || []))

   const eventConfig = EVENT_CONFIGS[trigger.event]
   document.getElementById('builder-context-badge').innerHTML =
    `<span class="text-indigo-600">${trigger.source}</span> <span class="text-slate-300 mx-1">/</span> <span class="text-${eventConfig.color}-500">${eventConfig.label}</span>`
   document.getElementById('builder-source-name').textContent = trigger.source

   const col = state.collections.find((c) => c.name === trigger.source)
   state.currentSourceSchema = col ? col.fields : []
   els.containers.sourceFields.innerHTML = state.currentSourceSchema
    .map(
     (f) => `
    <div class="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono text-slate-600 mb-1 flex justify-between items-center group hover:border-indigo-400 hover:bg-white cursor-copy transition-all" onclick="navigator.clipboard.writeText('source.${f.name}'); showToast('Copied!', 'success')">
        <span class="font-bold">source.${f.name}</span> <span class="bg-slate-200 px-1 py-0.5 rounded text-slate-500 uppercase text-[8px]">${f.type}</span>
    </div>`
    )
    .join('')

   els.buttons.toggleSidebar.classList.remove('hidden')
   const sb = document.getElementById('spe-builder-sidebar')
   sb.classList.add('-translate-x-full')
   document.getElementById('spe-sidebar-overlay').classList.add('hidden')
   ui.switchView('builder')
  },

  saveBuilderState: () => {
   const idx = state.triggers.findIndex((t) => t.id === state.activeTriggerId)
   if (idx !== -1) {
    state.triggers[idx].mapping = JSON.parse(JSON.stringify(state.currentBuilderRules))
    showToast('Mapping saved', 'success')
    ui.switchView('triggers')
   }
  },

  saveGlobal: async () => {
   const name = els.inputs.name.value
   const target = els.inputs.target.value
   if (!name || !target) return showToast('Name and Target required', 'error')
   if (state.triggers.length === 0) return showToast('Add at least one source', 'error')
   if (state.triggers.find((t) => !t.source)) return showToast('All triggers need source', 'error')

   const payload = {
    feature_name: name,
    id_engine_collection: target,
    status: 'active',
    triggers: state.triggers.map((t) => ({
     source: t.source,
     event: t.event,
     mapping: helper.formatNested(t.mapping),
    })),
   }
   const url = state.configId
    ? `api/collections/smart_projection_engine/${state.configId}`
    : `api/collections/smart_projection_engine`
   const method = state.configId ? 'PUT' : 'POST'

   try {
    els.buttons.saveGlobal.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...'
    const res = await apiFetch(url, {
     method,
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(payload),
    })
    if (res.ok) {
     showToast('Saved successfully', 'success')
     ui.switchView('list')
    } else throw new Error('Save failed')
   } catch (e) {
    showToast(e.message, 'error')
   } finally {
    els.buttons.saveGlobal.innerHTML = '<i class="fas fa-save"></i> Save'
   }
  },

  editConfig: async (id) => {
   try {
    const res = await apiFetch(`api/collections/smart_projection_engine/${id}`)
    const json = await res.json()
    const config = json.ciphertext ? JSON.parse(decryptData(json.nonce, json.ciphertext)) : json
    const data = config.data || config

    state.configId = id
    els.inputs.name.value = data.feature_name
    els.inputs.target.value = data.id_engine_collection

    els.buttons.deleteMain.classList.remove('hidden')

    if (state.collections.length === 0) await actions.loadCollections()
    state.triggers = (data.triggers || []).map((t) => ({
     id: helper.uuid(),
     source: t.source,
     event: t.event,
     mapping: helper.flattenRules(t.mapping, t.event),
    }))
    ui.switchView('triggers')
   } catch (e) {
    showToast(e.message, 'error')
   }
  },

  deleteConfig: async (id) => {
   const ok = await showConfirmDialog({
    title: 'Delete Engine?',
    text: 'Irreversible action.',
    confirmButtonText: 'Yes, Delete',
    icon: 'warning',
   })
   if (!ok) return
   try {
    const res = await apiFetch(`api/collections/smart_projection_engine/${id}`, {
     method: 'DELETE',
    })
    if (res.ok) {
     showToast('Deleted', 'success')
     ui.switchView('list')
     actions.fetchList()
    }
   } catch (e) {
    showToast(e.message, 'error')
   }
  },
 }

 const helper = {
  uuid: () =>
   'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
     v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
   }),
  buildTree: (flat) => {
   const root = []
   const map = {}
   flat.forEach((r) => (map[r.target.join('.')] = { ...r, children: [] }))
   flat.forEach((r) => {
    const p = r.target.join('.')
    if (r.target.length === 1) root.push(map[p])
    else {
     const pp = r.target.slice(0, -1).join('.')
     if (map[pp]) map[pp].children.push(map[p])
    }
   })
   return root
  },
  flattenRules: (nested, evt, pp = []) => {
   let r = []
   if (!nested) return []
   nested.forEach((n) => {
    const cp = [...pp, n.target_key]
    r.push({
     id: Math.random(),
     event: evt,
     target: cp,
     dataType: n.meta_data?.data_type || 'string',
     type: n.transformation_type || 'direct',
     logic: n.expression,
     encrypt: !!n.is_encrypted,
    })
    if (n.meta_data?.children) r = r.concat(helper.flattenRules(n.meta_data.children, evt, cp))
   })
   return r
  },
  formatNested: (flatRules) => {
   if (!flatRules || flatRules.length === 0) return []

   const tree = helper.buildTree(flatRules)

   const recursiveFormat = (nodes) => {
    return nodes.map((n) => {
     const type = n.type || 'direct'

     return {
      target_key: n.target[n.target.length - 1],
      transformation_type: type,
      expression: n.logic,
      is_encrypted: !!n.encrypt,
      meta_data: {
       data_type: n.dataType || 'string',

       children: n.children && n.children.length > 0 ? recursiveFormat(n.children) : [],
      },
     }
    })
   }

   return recursiveFormat(tree)
  },
 }

 const drawerUI = {
  open: (nid = null, pid = null) => {
   state.editingNodeId = nid
   state.parentIdForNew = pid
   els.drawer.key.value = ''
   els.drawer.encrypt.checked = false
   els.drawer.valDirect.innerHTML =
    '<option value="" disabled selected>Select Source...</option>' +
    state.currentSourceSchema
     .map((f) => `<option value="source.${f.name}">${f.name}</option>`)
     .join('')
   if (nid) {
    const n = state.currentBuilderRules.find((r) => r.id === nid)
    if (n) {
     els.drawer.key.value = n.target[n.target.length - 1]
     drawerUI.setType(n.dataType)
     drawerUI.setMode(n.type)
     if (n.type === 'direct') els.drawer.valDirect.value = n.logic
     else if (n.type === 'formula') els.drawer.valFormula.value = n.logic
     else els.drawer.valStatic.value = n.logic
     els.drawer.encrypt.checked = n.encrypt
    }
   } else {
    drawerUI.setType('string')
    drawerUI.setMode('direct')
   }
   els.drawer.overlay.classList.remove('hidden', 'opacity-0')
   els.drawer.el.classList.remove('translate-x-full')
  },
  close: () => {
   els.drawer.el.classList.add('translate-x-full')
   els.drawer.overlay.classList.add('opacity-0')
   setTimeout(() => els.drawer.overlay.classList.add('hidden'), 300)
  },
  save: () => {
   const k = els.drawer.key.value.trim()
   if (!k) return showToast('Key required', 'error')
   let tp = [k]
   if (state.parentIdForNew)
    tp = [...state.currentBuilderRules.find((r) => r.id === state.parentIdForNew).target, k]
   else if (state.editingNodeId)
    tp = [
     ...state.currentBuilderRules.find((r) => r.id === state.editingNodeId).target.slice(0, -1),
     k,
    ]
   const m = els.drawer.modeVal.value
   const l =
    m === 'direct'
     ? els.drawer.valDirect.value
     : m === 'formula'
       ? els.drawer.valFormula.value
       : els.drawer.valStatic.value
   const r = {
    id: state.editingNodeId || Math.random(),
    event: 'ctx',
    target: tp,
    dataType: els.drawer.typeVal.value,
    type: m,
    logic: l,
    encrypt: els.drawer.encrypt.checked,
   }
   if (state.editingNodeId)
    state.currentBuilderRules[
     state.currentBuilderRules.findIndex((x) => x.id === state.editingNodeId)
    ] = r
   else state.currentBuilderRules.push(r)
   canvasUI.render()
   drawerUI.close()
  },
  delete: () => {
   if (!state.editingNodeId) return
   const p = state.currentBuilderRules.find((r) => r.id === state.editingNodeId).target.join('.')
   state.currentBuilderRules = state.currentBuilderRules.filter(
    (r) => !r.target.join('.').startsWith(p)
   )
   canvasUI.render()
   drawerUI.close()
  },
  setType: (t) => {
   els.drawer.typeVal.value = t
   document
    .querySelectorAll('.prop-type-btn')
    .forEach(
     (b) =>
      (b.className =
       b.dataset.type === t
        ? 'prop-type-btn p-2 border border-indigo-500 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 shadow-sm'
        : 'prop-type-btn p-2 border rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 flex flex-col items-center gap-1 transition-all')
    )
  },
  setMode: (m) => {
   els.drawer.modeVal.value = m
   document
    .querySelectorAll('.prop-mode-btn')
    .forEach((b) =>
     b.dataset.mode === m
      ? b.classList.add('bg-white', 'text-indigo-600', 'shadow-sm')
      : b.classList.remove('bg-white', 'text-indigo-600', 'shadow-sm')
    )
   document.querySelectorAll('.prop-input-area').forEach((d) => d.classList.add('hidden'))
   document.getElementById(`prop-input-${m}`).classList.remove('hidden')
  },
 }

 const init = () => {
  actions.fetchList()
  actions.loadCollections()

  els.buttons.create.onclick = () => {
   state.configId = null
   state.triggers = []
   els.inputs.name.value = ''
   els.inputs.target.value = ''
   els.buttons.deleteMain.classList.add('hidden')
   ui.switchView('triggers')
  }
  els.buttons.backToList.onclick = () => ui.switchView('list')
  els.buttons.backToTriggers.onclick = () => ui.switchView('triggers')
  els.buttons.saveGlobal.onclick = actions.saveGlobal
  els.buttons.saveBuilder.onclick = actions.saveBuilderState
  els.buttons.addTrigger.onclick = actions.addTrigger

  els.buttons.toggleSidebar.onclick = () => {
   document.getElementById('spe-builder-sidebar').classList.remove('-translate-x-full')
   document.getElementById('spe-sidebar-overlay').classList.remove('hidden')
  }
  els.buttons.closeSidebar.onclick = () => {
   document.getElementById('spe-builder-sidebar').classList.add('-translate-x-full')
   document.getElementById('spe-sidebar-overlay').classList.add('hidden')
  }
  document.getElementById('spe-sidebar-overlay').onclick = els.buttons.closeSidebar.onclick
  els.buttons.addRootMobile.onclick = () => {
   els.buttons.closeSidebar.onclick()
   drawerUI.open()
  }

  els.buttons.addRoot.onclick = () => drawerUI.open()
  els.buttons.deleteMain.onclick = () => actions.deleteConfig(state.configId)

  document.addEventListener('spe:edit-config', (e) => actions.editConfig(e.detail))
  document.addEventListener('spe:add-child', (e) => drawerUI.open(null, e.detail))
  document.addEventListener('spe:edit-node', (e) => drawerUI.open(e.detail))

  els.drawer.btnClose.onclick = drawerUI.close
  els.drawer.btnCloseBtn.onclick = drawerUI.close
  els.drawer.btnSave.onclick = drawerUI.save
  els.drawer.btnDelete.onclick = drawerUI.delete
  document
   .querySelectorAll('.prop-type-btn')
   .forEach((b) => (b.onclick = () => drawerUI.setType(b.dataset.type)))
  document
   .querySelectorAll('.prop-mode-btn')
   .forEach((b) => (b.onclick = () => drawerUI.setMode(b.dataset.mode)))

  els.inputs.search.addEventListener(
   'input',
   debounce(() => {
    state.pagination.page = 1
    actions.fetchList()
   }, 500)
  )
 }
 init()
}
