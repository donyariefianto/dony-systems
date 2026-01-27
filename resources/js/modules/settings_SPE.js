import { apiFetch } from '../core/api.js'
import { showToast, showConfirmDialog, decryptData } from '../utils/helpers.js'

export function getSPEView() {
 return `
    <div class="h-full bg-slate-50 font-sans text-slate-800 relative overflow-hidden flex flex-col">
        
        <div id="spe-view-list" class="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-zinc-600 rounded-lg flex items-center justify-center text-white shadow-zinc-200/50 shadow-lg">
                        <i class="fas fa-cubes text-sm"></i>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-slate-900 leading-tight">SPE Manager</h1>
                        <span class="px-1.5 py-px rounded text-[8px] md:text-[9px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">Smart Projection Engine v3.0 (Pro)</span>
                    </div>
                </div>
                <button" id="spe-create-new" 
                    class="h-8 md:h-9 px-4 md:px-5 bg-slate-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-lg md:rounded-xl shadow-md shadow-slate-100 transition-all active:scale-95 flex items-center gap-2">
                    <i class="fa-solid fa-file-circle-plus"></i> Create New Engine
                </button>
            </header>

            <div class="flex-1 flex flex-col overflow-hidden relative">
                <div class="px-6 py-4 shrink-0 grid gap-4 bg-slate-50/80 backdrop-blur-sm z-10">
                    <div class="relative w-full max-w-md">
                        <input type="text" id="spe-search" placeholder="Search engine name or collection..." class="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all">
                        <i class="fas fa-search absolute left-3 top-3 text-slate-400 text-xs"></i>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar">
                    <div id="spe-list-container" class="space-y-3"></div>
                </div>
            </div>
        </div>

        <div id="spe-view-builder" class="hidden flex-col h-full bg-slate-50 absolute inset-0 z-30">
            <header class="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-sm z-30">
                <div class="flex items-center gap-3">
                    <button data-action="back" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="h-6 w-px bg-slate-200 mx-1"></div>
                    <div>
                        <h1 class="text-sm font-bold text-slate-900" id="spe-builder-title"></h1>
                        <p class="text-[10px] text-slate-400 font-mono hidden sm:block">Canvas Mode</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button id="spe-btn-delete-main" 
                    class="h-8 md:h-9 px-3 flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-transparent hover:bg-slate-50 rounded-lg transition-all active:scale-95 hidden">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button id="spe-btn-save" 
                    class="h-8 md:h-9 px-4 md:px-5 bg-slate-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-lg md:rounded-xl shadow-md shadow-slate-100 transition-all active:scale-95 flex items-center gap-2">
                        <i class="fas fa-save"></i> Save Config
                    </button>
                </div>
            </header>

            <div class="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                
                <aside class="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col z-10 shrink-0 h-full overflow-y-auto custom-scrollbar">
                    <div class="p-4 space-y-4">
                        <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                            <h3 class="text-[10px] font-bold text-indigo-800 uppercase mb-2">1. Identity & Trigger</h3>
                            <div class="space-y-3">
                                <input type="text" id="spe-input-name" placeholder="Engine Name" class="w-full px-3 py-2 bg-white border border-indigo-200 rounded text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none">
                                <input type="text" id="spe-input-id-target-collection" placeholder="ID Engine Coll. (e.g. report_sales)" class="w-full px-3 py-2 bg-white border border-indigo-200 rounded text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none">
                                <select id="spe-input-status" class="w-full px-2 py-2 border border-slate-200 rounded text-xs bg-white"><option selected value="">-- Select Status --</option><option value="active">Active</option><option value="pause">Pause</option><option value="draft">Draft</option></select>
                                <textarea id="spe-input-desc" placeholder="Description..." rows="2" class="w-full px-3 py-2 border border-slate-200 rounded text-xs resize-none"></textarea>
                            </div>
                        </div>

                         <div class="bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <h3 class="text-[10px] font-bold text-amber-800 uppercase mb-2">2. Data Source</h3>
                            <div class="space-y-3">
                                <select id="spe-input-collection" class="w-full px-3 py-2 bg-white border border-amber-200 rounded text-xs outline-none"></select>
                                <select id="spe-input-event" disabled class="w-full px-3 py-2 bg-white border border-amber-200 rounded text-xs outline-none disabled:opacity-50"></select>
                            </div>
                        </div>
                        
                        <div class="flex-1 flex flex-col min-h-[200px]">
                            <div class="text-[10px] font-bold text-slate-400 uppercase mb-2 flex justify-between">
                                <span>Source Available Keys</span>
                            </div>
                            <div id="spe-source-fields-container" class="flex-1 overflow-y-auto bg-slate-50 border border-slate-100 rounded-lg p-2 space-y-1 custom-scrollbar max-h-64"></div>
                        </div>
                    </div>
                </aside>

                <main class="flex-1 flex flex-col bg-slate-100/50 relative overflow-hidden w-full h-full">
                    
                    <div class="h-10 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0">
                        <div class="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                             <i class="fas fa-sitemap text-indigo-500"></i> Output Structure
                        </div>
                        <div class="flex gap-2">
                            <button id="spe-btn-add-root" disabled class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 text-[10px] font-bold hover:bg-indigo-100 disabled:opacity-50 transition-all">
                                <i class="fas fa-plus"></i> Add Root Field
                            </button>
                        </div>
                    </div>

                    <div class="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar relative" id="spe-canvas-wrapper">
                        <div id="spe-canvas-root" class="max-w-3xl mx-auto space-y-2 pb-32"></div>

                        <div id="spe-empty-state" class="absolute inset-0 flex flex-col items-center justify-center opacity-100 pointer-events-none transition-opacity">
                            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-3">
                                <i class="fas fa-layer-group text-slate-300 text-2xl"></i>
                            </div>
                            <p class="text-xs font-bold text-slate-500">Canvas is Empty</p>
                            <p class="text-[10px] text-slate-400">Select Trigger Source, then click "Add Root Field"</p>
                        </div>
                    </div>
                </main>
            </div>

            <div id="spe-drawer-overlay" class="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40 hidden transition-opacity opacity-0"></div>
            <div id="spe-property-drawer" class="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 transform translate-x-full transition-transform duration-300 flex flex-col border-l border-slate-200">
                <div class="h-14 border-b border-slate-100 flex items-center justify-between px-5 bg-slate-50">
                    <h3 class="text-sm font-bold text-slate-800"><i class="fas fa-sliders-h text-indigo-500 mr-2"></i>Field Properties</h3>
                    <button id="spe-drawer-close" class="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-5 space-y-6">
                    <div class="space-y-3">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Key Name</label>
                            <input type="text" id="prop-key" class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 font-mono placeholder:font-sans">
                            <p class="text-[9px] text-slate-400 mt-1">Key for the output JSON (e.g., <code class="bg-slate-100 px-1">user_id</code>)</p>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data Type</label>
                            <div class="grid grid-cols-3 gap-2">
                                <button type="button" class="prop-type-btn px-2 py-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center gap-1 hover:bg-slate-50" data-type="string">
                                    <i class="fas fa-font text-slate-400"></i> String
                                </button>
                                <button type="button" class="prop-type-btn px-2 py-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center gap-1 hover:bg-slate-50" data-type="number">
                                    <i class="fas fa-hashtag text-blue-400"></i> Number
                                </button>
                                <button type="button" class="prop-type-btn px-2 py-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center gap-1 hover:bg-slate-50" data-type="boolean">
                                    <i class="fas fa-toggle-on text-purple-400"></i> Bool
                                </button>
                                <button type="button" class="prop-type-btn px-2 py-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center gap-1 hover:bg-slate-50" data-type="object">
                                    <i class="fas fa-cube text-indigo-400"></i> Object
                                </button>
                                <button type="button" class="prop-type-btn px-2 py-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center gap-1 hover:bg-slate-50" data-type="array">
                                    <i class="fas fa-code text-amber-400"></i> Array
                                </button>
                            </div>
                            <input type="hidden" id="prop-type-val">
                        </div>
                    </div>

                    <div id="prop-logic-section" class="space-y-4 pt-4 border-t border-slate-100">
                        <label class="block text-[10px] font-bold text-slate-400 uppercase">Value Assignment</label>
                        
                        <div class="flex p-1 bg-slate-100 rounded-lg">
                            <button class="prop-mode-btn flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all text-slate-500" data-mode="direct">Direct</button>
                            <button class="prop-mode-btn flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all text-slate-500" data-mode="formula">Formula</button>
                            <button class="prop-mode-btn flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all text-slate-500" data-mode="static">Static</button>
                        </div>
                        <input type="hidden" id="prop-mode-val">

                        <div id="prop-input-direct" class="prop-input-area hidden">
                            <select id="prop-val-direct" class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"></select>
                            <p class="text-[9px] text-slate-400 mt-1">Select field from Source Collection.</p>
                        </div>

                        <div id="prop-input-formula" class="prop-input-area hidden">
                            <textarea 
                                id="prop-val-formula" 
                                rows="4" 
                                class="w-full px-3 py-2.5 bg-slate-900 text-emerald-400 border border-slate-700 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600 transition-all" 
                                placeholder="source.qty * source.price"></textarea>
                            
                            <div class="flex items-center justify-between mt-2">
                                <div class="flex gap-2">
                                    <span class="text-[9px] px-2 py-1 bg-slate-800 rounded text-slate-400 border border-slate-700 font-medium">JS Expression</span>
                                    <span class="text-[9px] px-2 py-1 bg-indigo-500/10 rounded text-indigo-400 border border-indigo-500/20 font-medium">Async Supported</span>
                                </div>

                                <button 
                                    id="spe-formula-test"
                                    type="button"
                                    class="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 hover:border-emerald-500 rounded-md transition-all active:scale-95 text-[10px] font-bold uppercase tracking-wider">
                                    <i class="fas fa-flask"></i>
                                    Run Test
                                </button>
                            </div>
                        </div>

                        <div id="prop-input-static" class="prop-input-area hidden">
                            <input type="text" id="prop-val-static" class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Fixed value...">
                        </div>
                    </div>

                    <div class="pt-4 border-t border-slate-100">
                         <label class="flex items-center justify-between cursor-pointer p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors">
                            <span class="text-[10px] font-bold text-slate-600 uppercase">Encrypt Value</span>
                            <div class="relative">
                                <input type="checkbox" id="prop-encrypt" class="sr-only peer">
                                <div class="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-amber-500 transition-colors"></div>
                                <div class="absolute left-1 top-1 w-3 h-3 bg-white rounded-full peer-checked:translate-x-4 transition-transform shadow-sm"></div>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="p-5 border-t border-slate-200 bg-slate-50 flex gap-3">
                    <button id="spe-drawer-delete" class="px-4 py-2 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors">
                        Delete
                    </button>
                    <button id="spe-drawer-save" class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors">
                        Apply Changes
                    </button>
                </div>
            </div>
        </div>

        <div id="formula-test-modal" class="fixed inset-0 z-[100] hidden">
            <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onclick="drawerUI.closeTestModal()"></div>
            
            <div class="absolute inset-0 flex items-center justify-center p-4">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[600px] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in duration-200">
                    
                    <div class="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                <i class="fas fa-vial"></i>
                            </div>
                            <div>
                                <h3 class="text-sm font-bold text-slate-800">Formula Laboratory</h3>
                                <p class="text-[11px] text-slate-500">Uji logika mapping dan manipulasi data secara real-time.</p>
                            </div>
                        </div>
                        <button id="btn-close-test-formula-modal" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="flex-1 grid grid-cols-12 divide-x divide-slate-100 overflow-hidden">
                        
                        <div class="col-span-5 flex flex-col bg-slate-50/50">
                            <div class="flex border-b border-slate-200 bg-white">
                                <button id="tab-btn-source" class="flex-1 py-3 text-[10px] font-bold text-emerald-600 border-b-2 border-emerald-600">SOURCE DATA</button>
                                <button id="tab-btn-old" class="flex-1 py-3 text-[10px] font-bold text-slate-400 hover:text-slate-600">OLD DATA</button>
                            </div>

                            <div class="flex-1 relative p-4">
                                <textarea id="test-input-source" class="w-full h-full p-4 font-mono text-[11px] text-slate-700 bg-white border border-slate-200 rounded-xl shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" placeholder='{ "price": 1000 }'></textarea>
                                <textarea id="test-input-old" class="w-full h-full p-4 font-mono text-[11px] text-slate-700 bg-white border border-slate-200 rounded-xl shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none hidden" placeholder='{ "price": 800 }'></textarea>
                            </div>
                            
                            <div class="px-4 py-3 bg-slate-100/50 border-t border-slate-200 flex justify-between items-center">
                                <span class="text-[10px] text-slate-400 font-medium tracking-wide">FORMAT: JSON</span>
                                <button onclick="drawerUI.formatTestJson()" class="text-[10px] font-bold text-emerald-600 hover:text-emerald-700">PRETTIFY JSON</button>
                            </div>
                        </div>

                        <div class="col-span-7 flex flex-col bg-white">
                            <div class="p-4 border-b border-slate-50">
                                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Formula Preview</span>
                                <div id="test-formula-preview" class="mt-1 p-2 bg-slate-900 rounded-lg text-[11px] font-mono text-emerald-400 truncate border border-slate-800"></div>
                            </div>

                            <div id="test-output-container" class="flex-1 p-6 overflow-auto bg-slate-50/30">
                                <div class="h-full flex flex-col items-center justify-center text-slate-300">
                                    <i class="fas fa-terminal text-5xl mb-3 opacity-10"></i>
                                    <p class="text-xs font-medium">Klik tombol di bawah untuk menjalankan tes</p>
                                </div>
                            </div>

                            <div class="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                                <div id="test-status-indicator" class="flex items-center gap-3 opacity-0 transition-all duration-300">
                                    <div class="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span id="test-status-text" class="text-[10px] font-bold text-emerald-700">SUCCESS</span>
                                    </div>
                                    <span id="test-execution-time" class="text-[10px] font-mono text-slate-400">12ms</span>
                                </div>

                                <button id="execute-run-test" class="px-8 py-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-slate-200 text-xs font-bold transition-all transform active:scale-95 flex items-center gap-2">
                                    <i class="fas fa-play text-[10px]"></i>
                                    RUN EXECUTION
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`
}

export function initSPEController() {
 const DATA_TYPES = {
  string: {
   label: 'String',
   icon: 'fa-font',
   color: 'text-slate-500',
   bg: 'bg-slate-50',
   border: 'border-slate-300',
  },
  number: {
   label: 'Number',
   icon: 'fa-hashtag',
   color: 'text-blue-600',
   bg: 'bg-blue-50',
   border: 'border-blue-300',
  },
  boolean: {
   label: 'Boolean',
   icon: 'fa-toggle-on',
   color: 'text-purple-600',
   bg: 'bg-purple-50',
   border: 'border-purple-300',
  },
  array: {
   label: 'Array',
   icon: 'fa-cubes',
   color: 'text-amber-600',
   bg: 'bg-amber-50',
   border: 'border-amber-300',
  },
  object: {
   label: 'Object',
   icon: 'fa-cube',
   color: 'text-indigo-600',
   bg: 'bg-indigo-50',
   border: 'border-indigo-300',
  },
 }

 const state = {
  configId: null,
  configs: null,
  pagination: { page: 1, limit: 5, total: 0, lastPage: 1 },
  collections: [],
  sourceSchema: [],
  rules: [],
  setup: { collection: null, event: null },
  editingNodeId: null,
 }

 const els = {
  viewList: document.getElementById('spe-view-list'),
  viewBuilder: document.getElementById('spe-view-builder'),
  listContainer: document.getElementById('spe-list-container'),
  canvasRoot: document.getElementById('spe-canvas-root'),
  emptyState: document.getElementById('spe-empty-state'),
  drawer: document.getElementById('spe-property-drawer'),
  drawerOverlay: document.getElementById('spe-drawer-overlay'),
  btnAddRoot: document.getElementById('spe-btn-add-root'),
  btnSave: document.getElementById('spe-btn-save'),
  btnDelete: document.getElementById('spe-btn-delete-main'),
  btnEmptyAndCreate: document.getElementById('spe-create-new'),
  btnTestFormula: document.getElementById('spe-formula-test'),
  btnCloseTestFormula: document.getElementById('btn-close-test-formula-modal'),
  btnTabSource: document.getElementById('tab-btn-source'),
  btnTabOld: document.getElementById('tab-btn-old'),
  btnRunExecuteFormula: document.getElementById('execute-run-test'),

  inputs: {
   name: document.getElementById('spe-input-name'),
   targetCol: document.getElementById('spe-input-id-target-collection'),
   desc: document.getElementById('spe-input-desc'),
   status: document.getElementById('spe-input-status'),
   collection: document.getElementById('spe-input-collection'),
   event: document.getElementById('spe-input-event'),
   search: document.getElementById('spe-search'),
  },

  prop: {
   key: document.getElementById('prop-key'),
   typeVal: document.getElementById('prop-type-val'),
   modeVal: document.getElementById('prop-mode-val'),
   valDirect: document.getElementById('prop-val-direct'),
   valFormula: document.getElementById('prop-val-formula'),
   valStatic: document.getElementById('prop-val-static'),
   encrypt: document.getElementById('prop-encrypt'),
   logicSection: document.getElementById('prop-logic-section'),
   btnSave: document.getElementById('spe-drawer-save'),
   btnDelete: document.getElementById('spe-drawer-delete'),
   btnClose: document.getElementById('spe-drawer-close'),
  },
 }

 const canvasUI = {
  render: () => {
   els.canvasRoot.innerHTML = ''

   if (state.rules.length === 0) {
    els.emptyState.classList.remove('hidden')
    els.emptyState.style.pointerEvents = 'auto'
    return
   } else {
    els.emptyState.classList.add('hidden')
    els.emptyState.style.pointerEvents = 'none'
   }

   const tree = drawerUI.buildTree(state.rules)

   const renderNodes = (nodes, level = 0) => {
    if (!nodes || !Array.isArray(nodes)) return ''

    return nodes
     .map((node, idx) => {
      const rawType = node.dataType || (node.meta_data && node.meta_data.data_type) || 'string'
      const dataType = rawType.toLowerCase()

      const isContainer = dataType === 'object' || dataType === 'array'
      const styles = DATA_TYPES[dataType] || DATA_TYPES.string

      const rawKey =
       node.target_key ||
       (Array.isArray(node.target) ? node.target[node.target.length - 1] : node.target)

      const isIndex = !isNaN(rawKey)

      const displayName = isIndex
       ? `<span class="bg-slate-100 text-slate-500 border border-slate-200 px-1.5 rounded text-[10px] mr-1 font-mono">INDEX ${rawKey}</span>`
       : `<span class="text-xs font-bold text-slate-800 truncate">${rawKey}</span>`

      let valuePreview = ''
      if (!isContainer) {
       if (node.type === 'direct') {
        valuePreview = `<span class="font-mono text-indigo-600 truncate max-w-[120px]" title="${node.logic}">
                    <i class="fas fa-link text-[8px] mr-1"></i>${node.logic || '-'}
                </span>`
       } else if (node.type === 'static') {
        valuePreview = `<span class="font-bold text-slate-700">"${node.logic || ''}"</span>`
       } else if (node.type === 'formula') {
        valuePreview = `<span class="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-mono">ƒ(x) Formula</span>`
       }
      }

      return `
            <div class="relative pl-6 animate-in fade-in slide-in-from-left-2 duration-300" style="animation-delay: ${level * 30}ms">
                ${level > 0 ? `<div class="spe-tree-connector"></div>` : ''}
                
                <div class="spe-node-card group flex items-stretch bg-white border ${styles.border} rounded-lg shadow-sm hover:shadow-md transition-all mb-2 overflow-hidden cursor-pointer" 
                     onclick="document.dispatchEvent(new CustomEvent('spe:open-drawer', {detail: ${node.id}}))">
                    
                    <div class="w-10 flex items-center justify-center ${styles.bg} border-r ${styles.border}">
                        <i class="fas ${styles.icon} ${styles.color} text-xs"></i>
                    </div>

                    <div class="flex-1 px-3 py-2 flex flex-col justify-center min-w-0">
                        <div class="flex items-center gap-2">
                            ${displayName}
                            
                            ${dataType === 'array' ? '<span class="text-[8px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold uppercase">List</span>' : ''}
                            ${dataType === 'object' ? '<span class="text-[8px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-bold uppercase">Map</span>' : ''}
                            ${node.encrypt ? '<i class="fas fa-lock text-[9px] text-amber-500" title="Encrypted"></i>' : ''}
                        </div>
                        
                        <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span class="uppercase font-medium tracking-tighter">${dataType}</span>
                            ${!isContainer ? `<i class="fas fa-long-arrow-alt-right text-[8px] opacity-50"></i> ${valuePreview}` : ''}
                        </div>
                    </div>

                    <div class="flex items-center border-l border-slate-100 bg-slate-50/50 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        ${
                         isContainer
                          ? `
                            <button class="w-9 h-full hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition-colors border-r border-slate-100" 
                                title="Tambah Child" 
                                onclick="event.stopPropagation(); document.dispatchEvent(new CustomEvent('spe:add-child', {detail: ${node.id}}))">
                                <i class="fas fa-plus-circle"></i>
                            </button>`
                          : ''
                        }
                        
                        <button class="w-9 h-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Edit">
                            <i class="fas fa-cog"></i>
                        </button>
                    </div>
                </div>

                ${
                 isContainer
                  ? `
                    <div class="relative border-l-2 border-dashed border-slate-200 ml-5 my-1">
                        ${
                         node.children && node.children.length > 0
                          ? renderNodes(node.children, level + 1)
                          : `<div class="py-2 pl-8 text-[10px] text-slate-300 italic">Kosong...</div>`
                        }
                    </div>
                `
                  : ''
                }
            </div>`
     })
     .join('')
   }

   els.canvasRoot.innerHTML = renderNodes(tree)
  },
 }

 const drawerUI = {
  generateDummyFromSchema: (isOld = false) => {
   if (!state.sourceSchema || !state.sourceSchema.length) return {}

   const dummy = {}
   state.sourceSchema.forEach((field) => {
    let defaultValue = ''
    const type = (field.type || 'string').toLowerCase()

    switch (type) {
     case 'number':
     case 'int':
     case 'float':
      defaultValue = isOld ? 500 : 1000
      break
     case 'boolean':
      defaultValue = true
      break
     case 'array':
      defaultValue = []
      break
     case 'object':
      defaultValue = {}
      break
     case 'date':
      defaultValue = new Date().toISOString()
      break
     default:
      defaultValue = isOld ? `Old ${field.name}` : `Sample ${field.name}`
    }

    dummy[field.name] = defaultValue
   })

   return dummy
  },

  flattenRules: (nestedMapping, parentPath = []) => {
   let flatResults = []

   nestedMapping.forEach((item, index) => {
    const currentKey = item.target_key
    const currentPath = [...parentPath, currentKey]
    flatResults.push({
     id: Date.now() + Math.random(),
     target: currentPath,
     dataType: item.meta_data?.data_type || 'string',
     type: item.transformation_type,
     logic: item.expression,
     encrypt: item.is_encrypted,
    })

    if (item.meta_data && item.meta_data.children && item.meta_data.children.length > 0) {
     const children = drawerUI.flattenRules(item.meta_data.children, currentPath)
     flatResults = flatResults.concat(children)
    }
   })

   return flatResults
  },

  findNodeByPath: (nodes, pathArr) => {
   for (const node of nodes) {
    if (JSON.stringify(node.target) === JSON.stringify(pathArr)) {
     return node
    }
    if (node.children && node.children.length > 0) {
     const found = drawerUI.findNodeByPath(node.children, pathArr)
     if (found) return found
    }
   }
   return null
  },

  buildTree: (rules) => {
   const root = { id: 'root', children: [] }
   const rulesCopy = JSON.parse(JSON.stringify(rules))
   rulesCopy.forEach((rule) => {
    const path = rule.target
    let currentLevel = root.children
    if (path.length === 1) {
     currentLevel.push({ ...rule, children: [] })
    } else {
     const parentPath = path.slice(0, -1)
     const parentNode = drawerUI.findNodeByPath(root.children, parentPath)
     if (parentNode) {
      parentNode.children.push({ ...rule, children: [] })
     } else {
      root.children.push({ ...rule, children: [], isOrphan: true })
     }
    }
   })
   return root.children
  },

  formatNestedRules: (rules, parentPath = []) => {
   return rules
    .filter((r) => {
     if (parentPath.length === 0) return r.target.length === 1
     const isChild = r.target.length === parentPath.length + 1
     const matchesParent = r.target.slice(0, parentPath.length).join('.') === parentPath.join('.')
     return isChild && matchesParent
    })
    .map((rule) => {
     const dataType = (rule.dataType || 'string').toLowerCase()
     const isContainer = dataType === 'object' || dataType === 'array'
     const localKey = rule.target[rule.target.length - 1]
     const node = {
      target_key: localKey,
      transformation_type: rule.type || 'direct',
      expression: rule.logic || '',
      is_encrypted: !!rule.encrypt,
      meta_data: {
       data_type: dataType,
      },
     }
     if (isContainer) {
      node.meta_data.children = drawerUI.formatNestedRules(rules, rule.target)
     }
     return node
    })
  },

  open: (nodeId = null, parentId = null) => {
   const isNew = nodeId === null
   state.editingNodeId = nodeId
   state.parentIdForNew = parentId

   els.prop.key.value = ''
   els.prop.key.disabled = false
   els.prop.valDirect.value = ''
   els.prop.valFormula.value = ''
   els.prop.valStatic.value = ''
   els.prop.encrypt.checked = false

   document.querySelectorAll('.prop-type-btn, .prop-mode-btn').forEach((b) => {
    b.classList.remove('bg-indigo-50', 'text-indigo-600', 'border-indigo-200')
    b.classList.add('border-transparent')
   })

   if (!isNew) {
    const node = state.rules.find((r) => r.id === nodeId)
    if (node) {
     const lastKey = node.target[node.target.length - 1]
     els.prop.key.value = lastKey

     if (!isNaN(lastKey)) els.prop.key.disabled = true

     const currentType = node.dataType || node.meta_data?.data_type || 'string'

     drawerUI.selectType(currentType)

     const currentMode = node.type || 'direct'
     drawerUI.selectMode(currentMode)

     if (currentMode === 'direct') els.prop.valDirect.value = node.logic || ''
     if (currentMode === 'formula') els.prop.valFormula.value = node.logic || ''
     if (currentMode === 'static') els.prop.valStatic.value = node.logic || ''

     els.prop.encrypt.checked = !!node.encrypt
     els.prop.btnDelete.classList.remove('hidden')
    }
   } else {
    els.prop.btnDelete.classList.add('hidden')

    if (parentId) {
     const parent = state.rules.find((r) => r.id === parentId)
     if (parent && (parent.dataType === 'array' || parent.meta_data?.data_type === 'array')) {
      const childrenCount = state.rules.filter(
       (r) =>
        r.target.join('.').startsWith(parent.target.join('.') + '.') &&
        r.target.length === parent.target.length + 1
      ).length
      els.prop.key.value = childrenCount.toString()
      els.prop.key.disabled = true
      drawerUI.selectType('object')
     } else {
      drawerUI.selectType('string')
     }
    } else {
     drawerUI.selectType('string')
    }
    drawerUI.selectMode('direct')
   }

   if (state.sourceSchema && state.sourceSchema.length) {
    els.prop.valDirect.innerHTML =
     `<option value="" disabled selected>-- Select Field --</option>` +
     state.sourceSchema
      .map((f) => `<option value="source.${f.name}">source.${f.name} (${f.type})</option>`)
      .join('')
   }
   els.drawerOverlay.classList.remove('hidden')
   setTimeout(() => {
    els.drawerOverlay.classList.remove('opacity-0')
    els.drawer.classList.remove('translate-x-full')
   }, 10)

   if (!els.prop.key.disabled) setTimeout(() => els.prop.key.focus(), 300)
  },

  close: () => {
   els.drawer.classList.add('translate-x-full')
   els.drawerOverlay.classList.add('opacity-0')
   setTimeout(() => els.drawerOverlay.classList.add('hidden'), 300)
   state.editingNodeId = null
   state.parentIdForNew = null
  },

  selectType: (type) => {
   els.prop.typeVal.value = type
   document.querySelectorAll('.prop-type-btn').forEach((b) => {
    b.classList.remove(
     'bg-indigo-50',
     'text-indigo-600',
     'border-indigo-200',
     'ring-1',
     'ring-indigo-200'
    )
    b.classList.add('border-transparent', 'text-slate-600')

    if (b.dataset.type === type) {
     b.classList.remove('border-transparent', 'text-slate-600')
     b.classList.add(
      'bg-indigo-50',
      'text-indigo-600',
      'border-indigo-200',
      'ring-1',
      'ring-indigo-200'
     )
    }
   })

   const logicSection = document.getElementById('prop-logic-section')
   if (logicSection) logicSection.classList.remove('hidden')

   const hintText = document.getElementById('prop-value-hint')
   if (hintText) {
    if (type === 'object') {
     hintText.innerHTML =
      '<i class="fas fa-info-circle"></i> Isi Logic untuk me-replace/merge object ini, atau biarkan kosong jika hanya sebagai container.'
    } else if (type === 'array') {
     hintText.innerHTML =
      '<i class="fas fa-info-circle"></i> Isi Logic (misal: Source Path / lookupList) untuk mengisi list ini secara otomatis.'
    } else {
     hintText.innerHTML = ''
    }
   }

   if (!els.prop.modeVal.value) {
    drawerUI.selectMode('direct')
   }
  },

  selectMode: (mode) => {
   els.prop.modeVal.value = mode
   document.querySelectorAll('.prop-mode-btn').forEach((btn) => {
    if (btn.dataset.mode === mode) {
     btn.classList.add('bg-slate-800', 'text-white', 'shadow-sm')
     btn.classList.remove('text-slate-500')
    } else {
     btn.classList.remove('bg-slate-800', 'text-white', 'shadow-sm')
     btn.classList.add('text-slate-500')
    }
   })

   document.querySelectorAll('.prop-input-area').forEach((el) => el.classList.add('hidden'))
   document.getElementById(`prop-input-${mode}`).classList.remove('hidden')
  },

  save: () => {
   const key = els.prop.key.value.trim()
   const dataType = els.prop.typeVal.value
   const transformationType = els.prop.modeVal.value

   if (!key) return alert('Key is required')

   let logicValue = ''
   if (transformationType === 'direct') logicValue = els.prop.valDirect.value
   else if (transformationType === 'formula') logicValue = els.prop.valFormula.value
   else if (transformationType === 'static') logicValue = els.prop.valStatic.value

   const parent = state.parentIdForNew
    ? state.rules.find((r) => r.id === state.parentIdForNew)
    : null
   const targetPath = parent ? [...parent.target, key] : [key]

   const ruleData = {
    id: state.editingNodeId || Date.now(),
    target: targetPath,
    dataType: dataType,
    type: transformationType,
    logic: logicValue,
    encrypt: els.prop.encrypt.checked,
    meta_data: {
     data_type: dataType,
    },
   }

   if (state.editingNodeId) {
    const index = state.rules.findIndex((r) => r.id === state.editingNodeId)
    if (index !== -1) state.rules[index] = ruleData
   } else {
    state.rules.push(ruleData)
   }

   canvasUI.render()
   drawerUI.close()
  },

  delete: async () => {
   const confirmed = await showConfirmDialog({
    title: 'Delete this field and all its children?',
    text: 'Delete All.',
    confirmText: 'Clear all fields',
    icon: 'info',
   })

   if (confirmed) {
    const nodeToDelete = state.rules.find((r) => r.id === state.editingNodeId)
    if (nodeToDelete) {
     const pathPrefix = JSON.stringify(nodeToDelete.target)
     state.rules = state.rules.filter((r) => {
      const rPath = JSON.stringify(r.target.slice(0, nodeToDelete.target.length))
      return rPath !== pathPrefix
     })

     drawerUI.close()
     canvasUI.render()
    }
   }
  },

  openTestModal: () => {
   const test_formula_modal = document.getElementById('formula-test-modal')
   const formula = document.getElementById('prop-val-formula').value
   if (!formula.trim()) return showToast('Formula is Empty!')
   const previewEl = document.getElementById('test-formula-preview')
   if (previewEl) previewEl.textContent = formula
   test_formula_modal.classList.remove('hidden')
   const sourceInput = document.getElementById('test-input-source')
   const oldInput = document.getElementById('test-input-old')

   if (!sourceInput.value.trim() || sourceInput.value === '{}') {
    const dummySource = drawerUI.generateDummyFromSchema(false)
    sourceInput.value = JSON.stringify(dummySource, null, 2)
   }

   if (!oldInput.value.trim() || oldInput.value === 'null') {
    const dummyOld = drawerUI.generateDummyFromSchema(true)
    oldInput.value = JSON.stringify(dummyOld, null, 2)
   }
   const outputContainer = document.getElementById('test-output-container')
   outputContainer.innerHTML = `
    <div class="h-full flex flex-col items-center justify-center text-slate-300">
        <i class="fas fa-flask text-5xl mb-3 opacity-10"></i>
        <p class="text-xs font-medium">Siap untuk pengujian logika.</p>
    </div>`

   document.getElementById('test-status-indicator').classList.add('opacity-0')
   document.getElementById('formula-test-modal').classList.remove('hidden')
  },

  closeTestModal: () => {
   document.getElementById('formula-test-modal').classList.add('hidden')
  },

  switchTestTab: (tab) => {
   const isSrc = tab === 'source'
   document.getElementById('test-input-source').classList.toggle('hidden', !isSrc)
   document.getElementById('test-input-old').classList.toggle('hidden', isSrc)

   const btnSrc = document.getElementById('tab-btn-source')
   const btnOld = document.getElementById('tab-btn-old')

   if (isSrc) {
    btnSrc.className =
     'flex-1 py-3 text-[10px] font-bold text-emerald-600 border-b-2 border-emerald-600 bg-white'
    btnOld.className =
     'flex-1 py-3 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors'
   } else {
    btnOld.className =
     'flex-1 py-3 text-[10px] font-bold text-emerald-600 border-b-2 border-emerald-600 bg-white'
    btnSrc.className =
     'flex-1 py-3 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors'
   }
  },

  formatTestJson: () => {
   try {
    const srcEl = document.getElementById('test-input-source')
    const oldEl = document.getElementById('test-input-old')
    if (srcEl.value.trim()) srcEl.value = JSON.stringify(JSON.parse(srcEl.value), null, 2)
    if (oldEl.value.trim()) oldEl.value = JSON.stringify(JSON.parse(oldEl.value), null, 2)
   } catch (e) {
    alert('Format JSON tidak valid! Periksa kembali tanda koma atau kurung Anda.')
   }
  },

  runTest: async () => {
   const code = document.getElementById('prop-val-formula').value
   const sourceStr = document.getElementById('test-input-source').value
   const oldStr = document.getElementById('test-input-old').value || 'null'
   const outputContainer = document.getElementById('test-output-container')
   const statusIndicator = document.getElementById('test-status-indicator')
   const statusText = document.getElementById('test-status-text')
   const timeText = document.getElementById('test-execution-time')
   try {
    const source = JSON.parse(sourceStr)
    const old = oldStr === 'null' ? null : JSON.parse(oldStr)
    const startTime = performance.now()

    outputContainer.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full text-emerald-500">
        <i class="fas fa-circle-notch fa-spin text-3xl mb-2"></i>
        <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Executing...</span>
    </div>`

    const response = await apiFetch('api/test-formula', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ code, source, old }),
    })

    const data = await response.json()
    const duration = Math.round(performance.now() - startTime)
    statusIndicator.classList.remove('opacity-0')
    timeText.textContent = `${duration}ms`

    if (data.success) {
     statusText.textContent = 'SUCCESS'
     statusText.className = 'text-[10px] font-bold text-emerald-700'
     statusIndicator.querySelector('div').className =
      'flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-100'

     outputContainer.innerHTML = `
        <div class="animate-in fade-in duration-300">
            <div class="flex items-center gap-2 mb-3">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Return Result:</span>
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded">${typeof data.result}</span>
            </div>
            <pre class="p-4 bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 font-mono text-xs overflow-auto max-h-[350px] shadow-inner">${JSON.stringify(data.result, null, 2)}</pre>
        </div>`
    } else {
     statusText.textContent = 'FAILED'
     statusText.className = 'text-[10px] font-bold text-rose-700'
     statusIndicator.querySelector('div').className =
      'flex items-center gap-1.5 px-2 py-1 bg-rose-50 rounded-full border border-rose-100'

     outputContainer.innerHTML = `
        <div class="animate-in slide-in-from-top-2 duration-300">
            <div class="flex items-center gap-2 mb-3">
                <i class="fas fa-exclamation-triangle text-rose-500"></i>
                <span class="text-[10px] font-bold text-rose-600 uppercase">Runtime Error:</span>
            </div>
            <div class="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 font-mono text-xs whitespace-pre-wrap leading-relaxed">${data.error}</div>
        </div>`
    }
   } catch (e) {
    outputContainer.innerHTML = `<div class="p-4 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-xs"><strong>JSON Error:</strong> ${e.message}</div>`
   }
  },
 }

 const actions = {
  init: async () => {
   await actions.fetchList()
   await actions.loadCollections()

   document.addEventListener('spe:open-drawer', (e) => drawerUI.open(e.detail))
   document.addEventListener('spe:add-child', (e) => drawerUI.open(null, e.detail))
  },

  fetchList: async () => {
   try {
    els.listContainer.innerHTML = `<div class="p-12 text-center text-xs text-slate-400 animate-pulse">Syncing...</div>`
    let query_search = ''
    if (els.inputs.search.value) {
     query_search = JSON.stringify({
      feature_name: els.inputs.search.value.trim(),
      description: els.inputs.search.value.trim(),
      id_engine_collection: els.inputs.search.value.trim(),
      status: els.inputs.search.value.trim(),
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
    state.configs = data || []
    ui.renderList()
   } catch (err) {
    els.listContainer.innerHTML = 'Error loading data.'
   }
  },

  loadCollections: async () => {
   try {
    const res = await apiFetch('api/list-menu')
    let json = await res.json()
    json = JSON.parse(decryptData(json.nonce, json.ciphertext))

    state.collections = []
    ;(json.sidemenu || []).forEach((m) => {
     m.sub_sidemenu.forEach((s) => {
      if (s.config.collectionName && s.type === 'tableview') {
       state.collections.push({ name: s.config.collectionName, field: s.config.fields })
      }
     })
    })

    els.inputs.collection.innerHTML =
     `<option value="" disabled selected>-- Select Source --</option>` +
     state.collections.map((c) => `<option value="${c.name}">${c.name}</option>`).join('')
   } catch (e) {
    console.error(e)
   }
  },

  loadSchema: (colName) => {
   const col = state.collections.find((c) => c.name === colName)
   state.sourceSchema = col ? col.field || [] : []
   document.getElementById('spe-source-fields-container').innerHTML = state.sourceSchema
    .map(
     (f) =>
      `<div class="text-[9px] px-2 py-1 bg-white border rounded text-slate-600 font-mono mb-1 truncate cursor-copy hover:text-indigo-600" title="Click to copy" onclick="navigator.clipboard.writeText('source.${f.name}'); showToast('Copied!', 'success')">source.${f.name}</div>`
    )
    .join('')
  },

  editConfig: async (id) => {
   ui.switchView('builder')
   els.btnDelete.classList.remove('hidden')
   els.btnDelete.setAttribute('data-id', id)

   state.rules = []
   state.configId = id
   canvasUI.render()

   try {
    const res = await apiFetch(`api/collections/smart_projection_engine/${id}`)
    let json = await res.json()
    json = JSON.parse(decryptData(json.nonce, json.ciphertext))
    const config = json.data || json

    els.inputs.name.value = config.feature_name
    els.inputs.targetCol.value = config.id_engine_collection || null
    els.inputs.desc.value = config.description
    els.inputs.status.value = config.status
    document.getElementById('spe-builder-title').textContent =
     `Edit Projection: ${config.feature_name}`

    state.setup = config.trigger
    els.inputs.collection.value = config.trigger.collection
    actions.loadSchema(config.trigger.collection)

    els.inputs.event.innerHTML = `<option selected value="">-- Select Action --</option><option value="onInsert">On Insert</option><option value="onUpdate">On Update</option><option value="onDelete">On Delete</option>`
    els.inputs.event.value = config.trigger.event
    els.inputs.event.disabled = false
    els.btnAddRoot.disabled = false

    if (config.mapping && Array.isArray(config.mapping)) {
     drawerUI.flattenRules(config.mapping)
     state.rules = drawerUI.flattenRules(config.mapping)
    }

    canvasUI.render()
   } catch (e) {
    console.error(e)
   }
  },

  saveConfig: async () => {
   if (!els.inputs.name.value) return showToast('Name required', 'error')
   if (state.rules.length === 0) return showToast('Canvas is empty', 'error')

   const nestedMapping = drawerUI.formatNestedRules(state.rules)

   const payload = {
    feature_name: els.inputs.name.value,
    id_engine_collection: els.inputs.targetCol.value,
    description: els.inputs.desc.value,
    status: els.inputs.status.value,
    trigger: { collection: els.inputs.collection.value, event: els.inputs.event.value },
    mapping: nestedMapping,
   }

   const url = state.configId
    ? `api/collections/smart_projection_engine/${state.configId}`
    : `api/collections/smart_projection_engine`

   els.inputs.name.disabled = true

   try {
    const res = await apiFetch(url, {
     method: state.configId ? 'PUT' : 'POST',
     body: JSON.stringify(payload),
     headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
     showToast('Saved successfully', 'success')
     actions.fetchList()
     ui.switchView('list')
    }
   } catch (e) {
    showToast(e.message, 'error')
   }
   els.inputs.name.disabled = false
  },

  deleteConfig: async (id) => {
   const confirmed = await showConfirmDialog({
    title: 'Delete this Engine ?',
    text: 'Delete SPE.',
    confirmText: 'Clear Smart Projection Engine',
    icon: 'info',
   })
   if (!confirmed) return

   try {
    const res = await apiFetch(`api/collections/smart_projection_engine/${id}`, {
     method: 'DELETE',
    })

    if (res.ok) {
     showToast('Konfigurasi berhasil dihapus', 'success')
     await actions.fetchList()
     ui.switchView('list')
    } else {
     throw new Error('Gagal menghapus data dari server')
    }
   } catch (error) {
    showToast(error.message, 'error')
   }
  },

  openBuilder: () => {
   document.getElementById('spe-builder-title').textContent = `New Projection Engine`
   state.configId = null
   state.rules = []
   Object.values(els.inputs).forEach((el) => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = ''
   })
   els.inputs.event.disabled = true
   els.btnAddRoot.disabled = true
   canvasUI.render()
   ui.switchView('builder')
  },
 }

 const ui = {
  switchView: (mode) => {
   if (mode === 'list') {
    els.viewBuilder.classList.add('hidden')
    els.viewBuilder.classList.remove('flex')
    els.viewList.classList.remove('hidden')
   } else {
    els.viewList.classList.add('hidden')
    els.viewBuilder.classList.remove('hidden')
    els.viewBuilder.classList.add('flex')
   }
  },
  renderList: () => {
   if (!state.configs || state.configs.total === 0) {
    els.listContainer.innerHTML = `
        <div class="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 animate-in fade-in zoom-in duration-300">
            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <i class="fas fa-box-open text-slate-300 text-2xl"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-700">Belum ada projection</h3>
            <p class="text-xs text-slate-400 mt-1 mb-4">Mulai buat engine pertamamu untuk memproses data.</p>
            <button id="spe-btn-empty-create" class="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors">
                + New Projection
            </button>
        </div>`
    document.getElementById('spe-btn-empty-create').onclick = actions.openBuilder
    return
   }

   const page = state.pagination.page
   const limit = state.pagination.limit
   const totalItems = state.configs.total
   const totalPages = Math.ceil(totalItems / limit)
   const startIndex = (page - 1) * limit
   const endIndex = Math.min(startIndex + limit, totalItems)
   const paginatedItems = state.configs.data
   const listHTML = paginatedItems
    .map((conf) => {
     const safeId = conf.id || conf._id
     if (!safeId) console.warn('Item tanpa ID ditemukan:', conf)
     let statusClass = 'bg-slate-100 text-slate-400'
     let statusIcon = 'fa-pause'
     if (conf.status === 'active') {
      statusClass = 'bg-emerald-100 text-emerald-600'
      statusIcon = 'fa-bolt'
     } else if (conf.status === 'draft') {
      statusClass = 'bg-amber-100 text-amber-600'
      statusIcon = 'fa-pencil-ruler'
     }
     const displayName = conf.feature_name || conf.name || 'Untitled Engine'
     const displayColl = conf.trigger?.collection || conf.collection || '-'
     const displayCollTarget = conf.id_engine_collection || '-'
     const displayEvent = conf.trigger?.event || conf.event || '-'
     const rulesCount = conf.mapping ? conf.mapping.length : conf.rules_count || 0

     return `
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300 mb-3">
            <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg ${statusClass} flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                    <i class="fas ${statusIcon}"></i>
                </div>
                
                <div>
                    <h3 class="text-sm font-bold text-slate-800 tracking-tight">${displayName}</h3>
                    <div class="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                        <span class="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 truncate max-w-[140px]" title="Target: ${displayCollTarget}">
                            <i class="fas fa-database text-indigo-400"></i> ${displayCollTarget}
                        </span>
                        <span class="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            <i class="fa-solid fa-book text-lime-500"></i> ${displayColl}
                        </span>
                        <span class="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            <i class="fas fa-code-branch text-amber-500"></i> ${displayEvent}
                        </span>
                        <span class="hidden sm:inline text-slate-400 border-l border-slate-200 pl-2 ml-1">
                            ${rulesCount} Mappings
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="flex items-center gap-2 pl-14 sm:pl-0">
                <button class="btn-edit w-8 h-8 flex items-center justify-center text-slate-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-all border border-transparent hover:border-yellow-100 active:scale-95" onclick="document.dispatchEvent(new CustomEvent('spe:edit', {detail: '${safeId}'}))">
                    <i class="fas fa-edit pointer-events-none"></i>
                </button>
                
                <button class="btn-delete w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 active:scale-95" onclick="document.dispatchEvent(new CustomEvent('spe:delete', {detail: '${safeId}'}))">
                    <i class="fas fa-trash-alt pointer-events-none"></i>
                </button>
            </div>
        </div>`
    })
    .join('')

   const paginationHTML =
    totalItems > limit
     ? `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
        <div class="order-2 sm:order-1">
            Showing <span class="font-bold text-slate-800">${startIndex + 1}</span> to <span class="font-bold text-slate-800">${endIndex}</span> of <span class="font-bold text-slate-800">${totalItems}</span> results
        </div>
        <div class="flex items-center gap-2 order-1 sm:order-2">
            <button id="spe-page-prev" ${page === 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm">
                <i class="fas fa-chevron-left text-[10px]"></i> Prev
            </button>
            
            <div class="px-2 font-bold text-slate-700">
                Page ${page} / ${totalPages}
            </div>

            <button id="spe-page-next" ${page === totalPages ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm">
                Next <i class="fas fa-chevron-right text-[10px]"></i>
            </button>
        </div>
    </div>`
     : ''

   els.listContainer.innerHTML = listHTML + paginationHTML

   if (totalItems > limit) {
    const btnPrev = document.getElementById('spe-page-prev')
    const btnNext = document.getElementById('spe-page-next')

    if (btnPrev) {
     btnPrev.onclick = () => {
      if (state.pagination.page > 1) {
       state.pagination.page--
       actions.fetchList()
      }
     }
    }

    if (btnNext) {
     btnNext.onclick = () => {
      if (state.pagination.page < totalPages) {
       state.pagination.page++
       actions.fetchList()
      }
     }
    }
   }
  },
 }

 els.btnAddRoot.onclick = () => drawerUI.open(null, null)

 document.querySelectorAll('.prop-type-btn').forEach((btn) => {
  btn.onclick = () => drawerUI.selectType(btn.dataset.type)
 })

 document.querySelectorAll('.prop-mode-btn').forEach((btn) => {
  btn.onclick = () => drawerUI.selectMode(btn.dataset.mode)
 })

 els.prop.btnSave.onclick = drawerUI.save
 els.prop.btnDelete.onclick = drawerUI.delete
 els.prop.btnClose.onclick = drawerUI.close
 els.drawerOverlay.onclick = drawerUI.close
 els.btnSave.onclick = actions.saveConfig
 els.btnEmptyAndCreate.onclick = actions.openBuilder
 els.btnTestFormula.addEventListener('click', function (event) {
  drawerUI.openTestModal()
 })
 els.btnCloseTestFormula.addEventListener('click', function (event) {
  drawerUI.closeTestModal()
 })
 els.btnTabSource.addEventListener('click', function (event) {
  drawerUI.switchTestTab('source')
 })
 els.btnTabOld.addEventListener('click', function (event) {
  drawerUI.switchTestTab('')
 })
 els.btnRunExecuteFormula.addEventListener('click', function (event) {
  drawerUI.runTest()
 })
 els.btnDelete.addEventListener('click', async function (event) {
  const clickedId = event.target.dataset.id
  await actions.deleteConfig(clickedId)
 })

 document.querySelector('[data-action="back"]').onclick = () => ui.switchView('list')
 document.addEventListener('spe:edit', (e) => actions.editConfig(e.detail))
 document.addEventListener('spe:delete', (e) => actions.deleteConfig(e.detail))

 els.inputs.collection.addEventListener('change', (e) => {
  actions.loadSchema(e.target.value)
  els.inputs.event.innerHTML = `<option selected value="">-- Select Action --</option><option value="onInsert">On Insert</option><option value="onUpdate">On Update</option><option value="onDelete">On Delete</option>`
  els.inputs.event.disabled = false
 })
 els.inputs.event.addEventListener('change', () => {
  els.btnAddRoot.disabled = false
  if (state.rules.length === 0) drawerUI.open()
 })

 els.inputs.search.addEventListener('input', () => actions.fetchList())

 actions.init()
}
