import { showToast } from '../utils/helpers.js'

// ==========================================
// 1. CONFIGURATION
// ==========================================
const DRE_CONFIG = {
 categories: [
  {
   id: 'triggers',
   label: 'Triggers',
   color: 'text-emerald-400',
   items: [
    {
     type: 'schedule',
     label: 'Schedule',
     icon: 'fa-clock',
     headerColor: 'bg-emerald-600',
     desc: 'Run on cron schedule',
     inputs: 0,
     outputs: 1,
     fields: [{ name: 'cron', label: 'Cron', type: 'text' }],
    },
    {
     type: 'webhook',
     label: 'Webhook In',
     icon: 'fa-bolt',
     headerColor: 'bg-emerald-600',
     desc: 'Trigger via HTTP',
     inputs: 0,
     outputs: 1,
     fields: [{ name: 'path', label: 'Path', type: 'text' }],
    },
   ],
  },
  {
   id: 'logic',
   label: 'Logic Flow',
   color: 'text-indigo-400',
   items: [
    {
     type: 'condition',
     label: 'If / Else',
     icon: 'fa-code-branch',
     headerColor: 'bg-indigo-600',
     desc: 'Branching logic',
     inputs: 1,
     outputs: 2,
     fields: [
      { name: 'op', label: 'Operator', type: 'select', options: ['==', '>', '<'] },
      { name: 'val', label: 'Value', type: 'text' },
     ],
    },
    {
     type: 'delay',
     label: 'Delay',
     icon: 'fa-hourglass-half',
     headerColor: 'bg-indigo-500',
     desc: 'Wait timer',
     inputs: 1,
     outputs: 1,
     fields: [{ name: 'sec', label: 'Seconds', type: 'number' }],
    },
   ],
  },
  {
   id: 'actions',
   label: 'Actions',
   color: 'text-rose-400',
   items: [
    {
     type: 'notification',
     label: 'Send Alert',
     icon: 'fa-bell',
     headerColor: 'bg-rose-600',
     desc: 'Send notification',
     inputs: 1,
     outputs: 1,
     fields: [{ name: 'msg', label: 'Message', type: 'text' }],
    },
    {
     type: 'update_db',
     label: 'Update DB',
     icon: 'fa-database',
     headerColor: 'bg-rose-500',
     desc: 'Modify record',
     inputs: 1,
     outputs: 1,
     fields: [{ name: 'query', label: 'Query', type: 'text' }],
    },
   ],
  },
 ],
}

// Global State
let editor = null
let currentRuleId = null
let isEditMode = false // Default Locked

// ==========================================
// 2. VIEW RENDERING
// ==========================================
export function renderDRETab() {
 return `
    <div class="flex h-full w-full bg-slate-950 text-slate-300 font-sans overflow-hidden relative select-none">
        
        <div class="w-72 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col z-30 shadow-2xl">
            <div class="flex border-b border-slate-800">
                <button onclick="switchSidebar('rules')" id="btn-tab-rules" class="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-white border-b-2 border-indigo-500 bg-slate-800/50">My Rules</button>
                <button onclick="switchSidebar('toolbox')" id="btn-tab-toolbox" class="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition border-b-2 border-transparent">Toolbox</button>
            </div>

            <div id="sidebar-rules" class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                 <div class="p-2 space-y-2">
                    <button onclick="createNewRule()" class="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition mb-4">
                        <i class="fas fa-plus"></i> Create New Rule
                    </button>
                    <div class="text-[9px] font-bold text-slate-500 uppercase px-1">Active Rules</div>
                    ${renderRuleItem('Factory Overheat Guard', 'Active', 101)}
                    ${renderRuleItem('Shift Change Alert', 'Paused', 102)}
                    ${renderRuleItem('Inventory Low Stock', 'Draft', 103)}
                 </div>
            </div>

            <div id="sidebar-toolbox" class="hidden flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar transition-opacity duration-300 opacity-50 pointer-events-none">
                <div class="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-2 rounded text-[10px] mb-4 flex items-center gap-2" id="toolbox-warning">
                    <i class="fas fa-lock"></i> <span>Enable <b>Edit Mode</b> to use tools</span>
                </div>
                ${renderToolboxFromConfig()}
            </div>
        </div>

        <div class="flex-1 relative bg-slate-950 flex flex-col min-w-0 group/canvas">
             
             <div class="absolute top-4 right-4 z-20 flex items-center gap-2">
                <div id="rule-status-badge" class="hidden px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-mono text-slate-400">
                    <span id="current-rule-name">No Rule Selected</span>
                </div>

                <button id="btn-toggle-edit" onclick="toggleEditMode()" disabled class="px-4 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-lock" id="icon-edit-mode"></i> <span id="text-edit-mode">View Only</span>
                </button>

                <button id="btn-save-flow" onclick="saveDREFlow()" disabled class="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition border border-indigo-500 flex items-center gap-2 disabled:bg-slate-800 disabled:border-slate-700 disabled:text-slate-600 disabled:shadow-none disabled:cursor-not-allowed">
                    <i class="fas fa-save"></i> Save
                </button>
             </div>

             <div id="canvas-overlay" class="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-slate-500 transition-opacity duration-300">
                <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 shadow-xl border border-slate-700">
                    <i class="fas fa-mouse-pointer text-2xl text-slate-600"></i>
                </div>
                <h3 class="text-sm font-bold text-slate-300">No Rule Selected</h3>
                <p class="text-xs text-slate-600 mt-1">Please select or create a rule to start editing</p>
             </div>

             <div id="drawflow-container" class="w-full h-full outline-none" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
             
             <div id="dre-action-bar" class="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-800/90 backdrop-blur border border-slate-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-4 transition-all duration-300 opacity-0 translate-y-10 pointer-events-none">
                 <div class="text-xs font-mono text-slate-400 border-r border-slate-600 pr-3 mr-1" id="selected-node-info">Node #ID</div>
                 <button onclick="deleteSelectedNode()" class="text-rose-400 hover:text-rose-200 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                    <i class="fas fa-trash"></i> Delete
                 </button>
             </div>
        </div>
    </div>
    ${getStyles()}
  `
}

// ==========================================
// 3. LOGIC CONTROLLER
// ==========================================
export async function initDREController() {
 // Load Dependency
 if (typeof Drawflow === 'undefined') {
  await loadScript('https://cdn.jsdelivr.net/gh/jerosoler/Drawflow/dist/drawflow.min.js')
  await loadCSS('https://cdn.jsdelivr.net/gh/jerosoler/Drawflow/dist/drawflow.min.css')
 }

 const container = document.getElementById('drawflow-container')
 if (!container) return
 container.innerHTML = ''

 editor = new Drawflow(container)
 editor.reroute = true
 editor.editor_mode = 'fixed' // Start Locked
 editor.start()

 // Event Bindings
 setupDragAndDrop()
 setupKeyboardShortcuts()
 setupSelectionEvents()

 // Global Exposure
 window.editor = editor
 window.toggleEditMode = toggleEditMode
 window.selectRule = selectRule
 window.createNewRule = createNewRule
 window.saveDREFlow = exportFlow
 window.deleteSelectedNode = deleteSelectedNode
 window.switchSidebar = switchSidebar
}

// ------------------------------------------------
// CORE: STATE MANAGEMENT (The "Tight" Part)
// ------------------------------------------------

// 1. User Selects a Rule
function selectRule(id, name) {
 currentRuleId = id

 // Update UI Header
 document.getElementById('rule-status-badge').classList.remove('hidden')
 document.getElementById('current-rule-name').innerText = name
 document.getElementById('current-rule-name').classList.add('text-indigo-400')

 // Remove Overlay
 const overlay = document.getElementById('canvas-overlay')
 overlay.classList.add('opacity-0', 'pointer-events-none')

 // Enable Toggle Button (But stay in View Mode initially)
 const btnEdit = document.getElementById('btn-toggle-edit')
 btnEdit.disabled = false

 // Reset to View Mode first (Safety first)
 setEditMode(false)

 // Load Data (Simulation)
 editor.clearModuleSelected()
 console.log(`Loading Rule ID: ${id}`)

 // Optional: Auto switch to Toolbox tab for convenience?
 // switchSidebar('toolbox');
}

// 2. User Creates New Rule
function createNewRule() {
 const name = prompt('Enter Rule Name:')
 if (!name) return

 // Simulate ID generation
 const newId = Math.floor(Math.random() * 9000)
 selectRule(newId, name)

 // Auto Enable Edit Mode for new rule
 setEditMode(true)
 showToast('New Rule Created. Edit Mode Active.', 'success')
}

// 3. Toggle Edit Mode
function toggleEditMode() {
 if (!currentRuleId) {
  showToast('Select a rule first!', 'error')
  return
 }
 setEditMode(!isEditMode)
}

// 4. Set Mode Logic
function setEditMode(active) {
 isEditMode = active

 const btnEdit = document.getElementById('btn-toggle-edit')
 const icon = document.getElementById('icon-edit-mode')
 const text = document.getElementById('text-edit-mode')
 const btnSave = document.getElementById('btn-save-flow')
 const toolbox = document.getElementById('sidebar-toolbox')
 const warning = document.getElementById('toolbox-warning')

 if (active) {
  // --- MODE: EDITING ---
  editor.editor_mode = 'edit'

  // Update Button Style
  btnEdit.className =
   'px-4 py-1.5 rounded-lg border border-indigo-500 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 transition hover:bg-indigo-500'
  icon.className = 'fas fa-unlock'
  text.innerText = 'Editing'

  // Enable Save
  btnSave.disabled = false

  // Enable Toolbox (Visual & Interaction)
  toolbox.classList.remove('opacity-50', 'pointer-events-none')
  warning.classList.add('hidden') // Hide warning

  showToast('Edit Mode Enabled', 'info')
 } else {
  // --- MODE: VIEW ONLY ---
  editor.editor_mode = 'fixed'

  // Update Button Style
  btnEdit.className =
   'px-4 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 transition hover:text-slate-300'
  icon.className = 'fas fa-lock'
  text.innerText = 'View Only'

  // Disable Save
  btnSave.disabled = true

  // Disable Toolbox
  toolbox.classList.add('opacity-50', 'pointer-events-none')
  warning.classList.remove('hidden') // Show warning

  // Clear selections
  selectedNodeId = null
  const actionBar = document.getElementById('dre-action-bar')
  if (actionBar) actionBar.classList.add('opacity-0', 'pointer-events-none')
 }
}

// ------------------------------------------------
// DRAG & DROP (Controlled by State)
// ------------------------------------------------
function setupDragAndDrop() {
 const items = document.querySelectorAll('.dre-tool-item')

 items.forEach((item) => {
  item.addEventListener('dragstart', (e) => {
   // STRICT CHECK: Cannot drag if not in edit mode or no rule selected
   if (!currentRuleId || !isEditMode) {
    e.preventDefault()
    return false
   }
   e.dataTransfer.setData('node_type', e.currentTarget.getAttribute('data-node'))
  })
 })

 window.allowDrop = (e) => {
  if (!isEditMode) return // Prevent drop indicator
  e.preventDefault()
 }

 window.drop = (e) => {
  e.preventDefault()
  if (!isEditMode) return // Prevent actual drop
  const type = e.dataTransfer.getData('node_type')
  addNodeToCanvas(type, e.clientX, e.clientY)
 }
}

// ------------------------------------------------
// OTHER HELPERS
// ------------------------------------------------

let selectedNodeId = null

function setupSelectionEvents() {
 editor.on('nodeSelected', function (id) {
  if (!isEditMode) return // Don't show delete actions in View Mode
  selectedNodeId = id
  const actionBar = document.getElementById('dre-action-bar')
  const info = document.getElementById('selected-node-info')
  if (actionBar && info) {
   const node = editor.drawflow.drawflow.Home.data[id]
   info.innerText = `${node.name}`
   actionBar.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none')
  }
 })

 editor.on('click', function (e) {
  if (e.target.closest('#drawflow-container') && !e.target.closest('.drawflow-node')) {
   selectedNodeId = null
   const actionBar = document.getElementById('dre-action-bar')
   if (actionBar) actionBar.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none')
  }
 })
}

function deleteSelectedNode() {
 if (!isEditMode) return // Safety check
 if (selectedNodeId !== null) {
  editor.removeNodeId('node-' + selectedNodeId)
  selectedNodeId = null
  document
   .getElementById('dre-action-bar')
   .classList.add('opacity-0', 'translate-y-10', 'pointer-events-none')
 }
}

function setupKeyboardShortcuts() {
 document.addEventListener('keydown', function (e) {
  if (!isEditMode) return // Ignore keys in View Mode
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
   const activeTag = document.activeElement.tagName.toLowerCase()
   if (activeTag !== 'input' && activeTag !== 'textarea') deleteSelectedNode()
  }
 })
}

function addNodeToCanvas(type, clientX, clientY) {
 let nodeConfig = null
 DRE_CONFIG.categories.forEach((cat) => {
  const found = cat.items.find((i) => i.type === type)
  if (found) nodeConfig = found
 })
 if (!nodeConfig) return

 const pos = editor.getUuid()
 const container = document.getElementById('drawflow-container')
 const rect = container.getBoundingClientRect()
 const x =
  (clientX - rect.left) *
   (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)) -
  (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)) * editor.canvas_x
 const y =
  (clientY - rect.top) *
   (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)) -
  (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)) * editor.canvas_y

 let inputsHtml = `<div class="p-3 bg-slate-900/50 space-y-2 pointer-events-auto">` // Enable pointer events for inputs
 if (nodeConfig.fields) {
  nodeConfig.fields.forEach((field) => {
   inputsHtml += `<div><label class="text-[9px] font-bold text-slate-500 uppercase">${field.label}</label><input type="text" class="nodrag w-full bg-slate-950 border border-slate-700 text-slate-300 text-[10px] rounded px-1 py-1" df-${field.name}></div>`
  })
 }
 inputsHtml += `</div>`

 const html = `
        <div class="w-[220px] rounded-lg overflow-hidden bg-slate-800 shadow-xl border border-slate-700">
            <div class="h-8 ${nodeConfig.headerColor} flex items-center px-3 gap-2 text-white font-bold text-xs uppercase">
                <i class="fas ${nodeConfig.icon}"></i> <span>${nodeConfig.label}</span>
            </div>
            ${inputsHtml}
        </div>`

 editor.addNode(type, nodeConfig.inputs, nodeConfig.outputs, x, y, type, {}, html)
}

function exportFlow() {
 if (!isEditMode) return
 const data = editor.export()
 console.log('Saving...', data)
 showToast('Flow Saved Successfully', 'success')
}

// UI Helpers
function switchSidebar(tab) {
 const toolbox = document.getElementById('sidebar-toolbox')
 const rules = document.getElementById('sidebar-rules')
 const btnToolbox = document.getElementById('btn-tab-toolbox')
 const btnRules = document.getElementById('btn-tab-rules')

 if (tab === 'toolbox') {
  toolbox.classList.remove('hidden')
  rules.classList.add('hidden')
  btnToolbox.className =
   'flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-white border-b-2 border-indigo-500 bg-slate-800/50'
  btnRules.className =
   'flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b-2 border-transparent'
 } else {
  toolbox.classList.add('hidden')
  rules.classList.remove('hidden')
  btnRules.className =
   'flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-white border-b-2 border-indigo-500 bg-slate-800/50'
  btnToolbox.className =
   'flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b-2 border-transparent'
 }
}

function renderRuleItem(name, status, id) {
 const statusColor =
  status === 'Active' ? 'bg-emerald-500' : status === 'Paused' ? 'bg-amber-500' : 'bg-slate-500'
 return `
    <div onclick="selectRule(${id}, '${name}')" class="bg-slate-800 border border-slate-700 p-3 rounded hover:border-indigo-500 cursor-pointer group transition relative overflow-hidden">
        <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-bold text-slate-200 group-hover:text-white">${name}</span>
            <span class="w-2 h-2 rounded-full ${statusColor} shadow-[0_0_8px_rgba(0,0,0,0.5)]"></span>
        </div>
        <div class="text-[9px] text-slate-500 font-mono">ID: ${id} • v1.0</div>
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition"></div>
    </div>`
}

function renderToolboxFromConfig() {
 return DRE_CONFIG.categories
  .map(
   (cat) => `
        <div class="mb-4">
            <div class="text-[9px] font-black uppercase tracking-widest ${cat.color} mb-2">${cat.label}</div>
            <div class="grid grid-cols-1 gap-2">
                ${cat.items
                 .map(
                  (item) => `
                    <div class="dre-tool-item bg-slate-800 border border-slate-700 p-2 rounded cursor-grab active:cursor-grabbing hover:border-slate-500 transition flex items-center gap-3" draggable="true" data-node="${item.type}">
                        <div class="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white ${item.headerColor}"><i class="fas ${item.icon} text-[10px]"></i></div>
                        <span class="text-[10px] font-bold text-slate-300">${item.label}</span>
                    </div>
                `
                 )
                 .join('')}
            </div>
        </div>
    `
  )
  .join('')
}

function loadScript(url) {
 return new Promise((resolve) => {
  const s = document.createElement('script')
  s.src = url
  s.onload = resolve
  document.head.appendChild(s)
 })
}
function loadCSS(url) {
 return new Promise((resolve) => {
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = url
  l.onload = resolve
  document.head.appendChild(l)
 })
}

// ==========================================
// 4. STYLES
// ==========================================
function getStyles() {
 return `
    <style>
        #drawflow-container { background-color: #020617; background-image: radial-gradient(#334155 1px, transparent 1px); background-size: 20px 20px; }
        .drawflow-node { background: transparent !important; border: none !important; padding: 0 !important; width: auto !important; box-shadow: none !important; }
        .drawflow-node.selected .w-\\[220px\\] { border-color: #6366f1 !important; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4), 0 20px 25px -5px rgba(0, 0, 0, 0.5) !important; }
        .drawflow-node .input, .drawflow-node .output { width: 10px !important; height: 10px !important; background: #0f172a !important; border: 2px solid #64748b !important; border-radius: 50% !important; top: 14px !important; transition: all 0.2s; }
        .drawflow-node .input:hover, .drawflow-node .output:hover { background: #6366f1 !important; border-color: white !important; transform: scale(1.3); }
        .drawflow-node .input { left: -5px !important; }
        .drawflow-node .output { right: -5px !important; }
        .drawflow .connection .main-path { stroke-width: 2px; stroke: #475569; }
        .drawflow .connection.selected .main-path { stroke: #6366f1; stroke-width: 3px; }
        .drawflow-delete { display: none; }
    </style>
    `
}
