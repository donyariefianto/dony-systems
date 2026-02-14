import { showToast } from '../utils/helpers.js'

/**
 * ==================================================================================
 * 1. CONFIGURATION: AION ENTERPRISE BLUEPRINT
 * ==================================================================================
 */
const DRE_CONFIG = {
  categories: [
    {
      id: "triggers",
      label: "Start / Triggers",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      items: [
        {
          type: "trigger_db",
          label: "Database Event",
          icon: "fa-database",
          headerColor: "bg-emerald-600",
          desc: "Trigger on DB mutations",
          inputs: 0,
          outputs: 1,
          fields: [
            { name: "collection", label: "Target Collection", type: "text", placeholder: "e.g. transactions", required: true },
            { name: "event_type", label: "Trigger On", type: "select", options: ["onInsert (New Record)", "onUpdate (Modification)", "onDelete (Removal)"] },
            { name: "filter", label: "Condition Filter (JSON)", type: "code_editor", height: "h-24", placeholder: "{ \"status\": \"pending\" }" }
          ]
        },
        {
          type: "trigger_webhook",
          label: "Webhook Listener",
          icon: "fa-satellite-dish",
          headerColor: "bg-emerald-700",
          desc: "External HTTP Trigger",
          inputs: 0,
          outputs: 1,
          fields: [
            { name: "route", label: "Endpoint Route", type: "text", prefix: "/api/hooks/" },
            { name: "method", label: "HTTP Method", type: "select", options: ["POST", "GET", "PUT", "DELETE"] },
            { name: "auth_token", label: "Require Auth Token", type: "text", placeholder: "Optional: Secret Key" }
          ]
        },
        {
          type: "trigger_schedule",
          label: "Scheduler (Cron)",
          icon: "fa-clock",
          headerColor: "bg-emerald-800",
          desc: "Time-based trigger",
          inputs: 0,
          outputs: 1,
          fields: [
            { name: "cron", label: "Cron Expression", type: "text", placeholder: "0 0 * * *" },
            { name: "timezone", label: "Timezone", type: "select", options: ["UTC", "Asia/Jakarta", "America/New_York"] }
          ]
        }
      ]
    },
    {
      id: "logic_flow",
      label: "Flow Logic & Control",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      items: [
        {
          type: "logic_condition",
          label: "If / Else Condition",
          icon: "fa-code-branch",
          headerColor: "bg-amber-600",
          desc: "Branching Logic",
          inputs: 1,
          outputs: 2, // 1: True, 2: False
          fields: [
            { name: "variable", label: "Variable", type: "text", placeholder: "data.amount" },
            { name: "operator", label: "Operator", type: "select", options: ["==", "!=", ">", "<", "Contains", "Matches Regex"] },
            { name: "value", label: "Value", type: "text" }
          ]
        },
        {
          type: "logic_iterator",
          label: "Loop / Iterator",
          icon: "fa-sync",
          headerColor: "bg-amber-700",
          desc: "Process Array Items",
          inputs: 1,
          outputs: 2, // 1: Item, 2: Done
          fields: [
            { name: "source", label: "Array Source", type: "text", placeholder: "data.items" }
          ]
        },
        {
          type: "logic_delay",
          label: "Sleep / Delay",
          icon: "fa-hourglass-half",
          headerColor: "bg-slate-600",
          desc: "Pause Execution",
          inputs: 1,
          outputs: 1,
          fields: [
            { name: "duration", label: "Duration (Seconds)", type: "number", default: 5 }
          ]
        }
      ]
    },
    {
      id: "data_spe",
      label: "Data & SPE Processing",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      items: [
        {
          type: "spe_mapper",
          label: "Object Mapper",
          icon: "fa-random",
          headerColor: "bg-indigo-600",
          desc: "Transform Payload Structure",
          inputs: 1,
          outputs: 1,
          fields: [
            { name: "mapping", label: "Field Mapping", type: "mapping_builder" }
          ]
        },
        {
          type: "spe_script",
          label: "Execute Script",
          icon: "fa-terminal",
          headerColor: "bg-slate-800",
          desc: "Custom JS Logic",
          inputs: 1,
          outputs: 1,
          fields: [
            { name: "code", label: "Function Body", type: "code_editor", height: "h-48", placeholder: "// data.newField = 'value';\nreturn data;" }
          ]
        },
        {
          type: "spe_aggregator",
          label: "Aggregator",
          icon: "fa-calculator",
          headerColor: "bg-indigo-700",
          desc: "Math on Data Stream",
          inputs: 1,
          outputs: 1,
          fields: [
            { name: "fn", label: "Function", type: "select", options: ["SUM", "AVG", "COUNT", "MIN", "MAX"] },
            { name: "field", label: "Target Field", type: "text" }
          ]
        }
      ]
    },
    {
      id: "database_crud",
      label: "Database Actions (CRUD)",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      items: [
        {
          type: "crud_find",
          label: "DB Find",
          icon: "fa-search",
          headerColor: "bg-blue-600",
          desc: "Query Records",
          inputs: 1,
          outputs: 1,
          fields: [
            { name: "collection", label: "Collection", type: "text" },
            { name: "query", label: "Query (JSON)", type: "code_editor", height: "h-20" }
          ]
        },
        {
          type: "crud_insert",
          label: "DB Insert",
          icon: "fa-plus-circle",
          headerColor: "bg-blue-700",
          desc: "Create Record",
          inputs: 1,
          outputs: 1,
          fields: [
            { name: "collection", label: "Collection", type: "text" },
            { name: "data", label: "Payload (Leave empty for current)", type: "text" }
          ]
        },
        {
          type: "crud_update",
          label: "DB Update",
          icon: "fa-pen",
          headerColor: "bg-blue-800",
          desc: "Update Record",
          inputs: 1,
          outputs: 1,
          fields: [
            { name: "collection", label: "Collection", type: "text" },
            { name: "query", label: "Filter", type: "text" },
            { name: "update", label: "Update Ops", type: "code_editor", height: "h-20", placeholder: "{\"$set\": ...}" }
          ]
        },
        {
          type: "crud_delete",
          label: "DB Delete",
          icon: "fa-trash",
          headerColor: "bg-rose-600",
          desc: "Remove Record",
          inputs: 1,
          outputs: 1,
          fields: [
            { name: "collection", label: "Collection", type: "text" },
            { name: "query", label: "Filter", type: "text" }
          ]
        }
      ]
    },
    {
      id: "actions",
      label: "External Actions",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      items: [
        {
          type: "action_http",
          label: "HTTP Request",
          icon: "fa-globe",
          headerColor: "bg-purple-600",
          desc: "Call External API",
          inputs: 1,
          outputs: 1,
          fields: [
            { name: "method", label: "Method", type: "select", options: ["GET", "POST", "PUT", "PATCH"] },
            { name: "url", label: "URL", type: "text" },
            { name: "headers", label: "Headers", type: "code_editor", height: "h-20" }
          ]
        },
        {
          type: "action_notify",
          label: "Send Notification",
          icon: "fa-bell",
          headerColor: "bg-purple-700",
          desc: "Alert Users",
          inputs: 1,
          outputs: 1,
          fields: [
            { name: "channel", label: "Channel", type: "select", options: ["Email", "Slack", "System Log"] },
            { name: "template", label: "Message", type: "textarea" }
          ]
        }
      ]
    }
  ]
}

// Global State
let editor = null
let currentRuleId = null
let isEditMode = false 
let selectedNodeId = null

/**
 * ==================================================================================
 * 2. VIEW RENDERING (HTML STRUCTURE)
 * ==================================================================================
 */
export function renderDRETab() {
  return `
    <div class="flex h-full w-full bg-slate-950 text-slate-300 font-sans overflow-hidden relative select-none">
        
        <div class="flex-1 relative bg-slate-950 flex flex-col min-w-0 group/canvas z-0">
             
             <div class="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                <div id="rule-status-badge" class="pointer-events-auto hidden flex flex-col items-start gap-1">
                     <div class="px-3 py-1 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-md shadow-lg flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <div class="flex flex-col">
                             <span id="current-rule-name" class="text-xs font-bold text-slate-200 leading-none">No Rule Selected</span>
                             <span class="text-[9px] text-slate-500 font-mono mt-0.5 tracking-tight">AION ENTERPRISE • V2.5</span>
                        </div>
                     </div>
                </div>

                <div class="pointer-events-auto flex items-center gap-2">
                    <button id="btn-toggle-edit" onclick="toggleEditMode()" disabled class="h-8 px-3 rounded bg-slate-900/80 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 transition disabled:opacity-50 hover:bg-slate-800">
                        <i class="fas fa-lock" id="icon-edit-mode"></i> <span id="text-edit-mode">Locked</span>
                    </button>
                    <button id="btn-save-flow" onclick="saveDREFlow()" disabled class="h-8 px-4 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide rounded shadow-lg transition border border-indigo-500 flex items-center gap-2 disabled:bg-slate-800 disabled:border-slate-700 disabled:text-slate-600 disabled:shadow-none hover:bg-indigo-500">
                        <i class="fas fa-save"></i> Save & Deploy
                    </button>
                </div>
             </div>

             <div class="absolute bottom-6 left-6 z-20 flex flex-col gap-1 bg-slate-900/80 backdrop-blur rounded-lg border border-slate-800 shadow-xl overflow-hidden">
                <button onclick="editor.zoom_in()" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition border-b border-slate-800"><i class="fas fa-plus text-[10px]"></i></button>
                <button onclick="editor.zoom_reset()" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition border-b border-slate-800"><i class="fas fa-compress text-[10px]"></i></button>
                <button onclick="editor.zoom_out()" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"><i class="fas fa-minus text-[10px]"></i></button>
             </div>

             <div id="canvas-overlay" class="absolute inset-0 z-10 bg-slate-950/90 backdrop-blur-[2px] flex flex-col items-center justify-center text-slate-500 transition-opacity duration-300">
                <div class="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 shadow-2xl relative group cursor-default">
                    <div class="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping opacity-20"></div>
                    <i class="fas fa-network-wired text-4xl text-indigo-500/50 group-hover:text-indigo-400 transition"></i>
                </div>
                <h3 class="text-sm font-bold text-slate-200 uppercase tracking-widest">AION Engine Idle</h3>
                <p class="text-[11px] text-slate-500 mt-2">Select a Rule from the sidebar to begin orchestration.</p>
             </div>

             <div id="drawflow-container" class="w-full h-full outline-none" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
        </div>

        <div class="w-80 flex-shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col z-30 shadow-2xl relative">
            
            <div id="panel-main" class="flex flex-col h-full w-full absolute inset-0 transition-transform duration-300 transform bg-slate-900">
                <div class="flex border-b border-slate-800 bg-slate-900 shrink-0">
                    <button onclick="switchSidebar('rules')" id="btn-tab-rules" class="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-white border-b-2 border-indigo-500 bg-slate-800/50">Rules</button>
                    <button onclick="switchSidebar('toolbox')" id="btn-tab-toolbox" class="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b-2 border-transparent hover:text-slate-300">Toolbox</button>
                </div>

                <div id="sidebar-rules" class="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                     <div class="p-4 border-b border-slate-800">
                        <button onclick="createNewRule()" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wide rounded flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20 border border-indigo-500">
                            <i class="fas fa-plus"></i> Create New Rule
                        </button>
                     </div>
                     <div class="flex-1 p-3 space-y-2">
                        ${renderRuleItem('Payment Success Handler', 'Active', 101)}
                        ${renderRuleItem('User Churn Prediction', 'Paused', 102)}
                        ${renderRuleItem('Inventory Sync', 'Draft', 103)}
                     </div>
                </div>

                <div id="sidebar-toolbox" class="hidden flex-1 flex flex-col bg-slate-900/50 transition-opacity duration-300 opacity-50 pointer-events-none relative h-full">
                     <div id="toolbox-lock-msg" class="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-6">
                        <div class="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mb-3 text-slate-500"><i class="fas fa-lock"></i></div>
                        <p class="text-xs text-slate-400">Enable <b>Edit Mode</b> to access components.</p>
                    </div>
                    <div class="p-3 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
                        <div class="relative">
                            <i class="fas fa-search absolute left-3 top-2.5 text-slate-600 text-[10px]"></i>
                            <input type="text" onkeyup="filterToolbox(this.value)" placeholder="Search triggers, logic, actions..." class="w-full bg-slate-950 border border-slate-800 rounded px-3 pl-8 py-2 text-[10px] text-slate-300 focus:border-indigo-500 outline-none transition placeholder-slate-600">
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        ${renderToolboxAccordion()}
                    </div>
                </div>
            </div>

            <div id="panel-properties" class="flex flex-col h-full w-full absolute inset-0 bg-slate-900 transition-transform duration-300 transform translate-x-full z-40 border-l border-slate-800 shadow-2xl">
                <div class="h-12 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-850 shrink-0">
                    <div class="flex items-center gap-2">
                         <i class="fas fa-sliders-h text-slate-500 text-xs"></i>
                         <span class="text-[10px] font-black uppercase tracking-widest text-slate-300">Properties</span>
                    </div>
                    <button onclick="closePropertiesPanel()" class="w-6 h-6 rounded hover:bg-slate-700 text-slate-500 hover:text-white flex items-center justify-center transition">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
                
                <div id="properties-content" class="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                    </div>

                <div class="p-4 border-t border-slate-800 bg-slate-950/50 text-center shrink-0">
                    <p class="text-[9px] text-slate-600 font-mono mb-3" id="prop-node-id">Selection: None</p>
                    <button onclick="deleteSelectedNode()" class="w-full py-2 rounded border border-rose-900/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white text-[10px] font-bold uppercase tracking-wide transition flex items-center justify-center gap-2">
                        <i class="fas fa-trash-alt"></i> Delete Component
                    </button>
                </div>
            </div>

        </div>
    </div>
    ${getStyles()}
  `
}

/**
 * ==================================================================================
 * 3. CONTROLLER & LOGIC
 * ==================================================================================
 */
export async function initDREController() {
    // Dynamic Import for Drawflow
    if (typeof Drawflow === 'undefined') {
        await loadScript('https://cdn.jsdelivr.net/gh/jerosoler/Drawflow/dist/drawflow.min.js');
        await loadCSS('https://cdn.jsdelivr.net/gh/jerosoler/Drawflow/dist/drawflow.min.css');
    }

    const container = document.getElementById("drawflow-container");
    if (!container) return;
    container.innerHTML = '';

    editor = new Drawflow(container);
    editor.reroute = true;
    editor.reroute_fix_curvature = true;
    editor.editor_mode = 'fixed'; 
    editor.start();

    setupDragAndDrop();
    setupKeyboardShortcuts();
    
    // Core Event: Open Inspector on Click
    editor.on('nodeSelected', function(id) {
        if(!isEditMode) return;
        selectedNodeId = id;
        openPropertiesPanel(id);
    });

    editor.on('nodeUnselected', function(e) {
        selectedNodeId = null;
        closePropertiesPanel();
    });

    // Expose Functions Globally
    window.editor = editor;
    window.toggleEditMode = toggleEditMode;
    window.selectRule = selectRule;
    window.createNewRule = createNewRule;
    window.saveDREFlow = exportFlow;
    window.deleteSelectedNode = deleteSelectedNode;
    window.switchSidebar = switchSidebar;
    window.toggleToolboxCategory = toggleToolboxCategory;
    window.filterToolbox = filterToolbox;
    window.closePropertiesPanel = closePropertiesPanel;
    
    // Data Handlers
    window.updateNodeData = updateNodeData; 
    window.addMappingRow = addMappingRow;
    window.removeMappingRow = removeMappingRow;
    window.updateMappingRow = updateMappingRow;
}

// ------------------------------------------------
// INSPECTOR ENGINE (Enterprise Logic)
// ------------------------------------------------

function openPropertiesPanel(nodeId) {
    const node = editor.drawflow.drawflow.Home.data[nodeId];
    const panel = document.getElementById('panel-properties');
    const content = document.getElementById('properties-content');
    const idDisplay = document.getElementById('prop-node-id');

    // Find Schema
    let schema = null;
    DRE_CONFIG.categories.forEach(cat => {
        const item = cat.items.find(i => i.type === node.name);
        if (item) schema = item;
    });

    if (!schema) return;

    // Build Header
    let html = `
        <div class="flex items-start gap-3 pb-4 border-b border-slate-800">
            <div class="w-10 h-10 rounded-lg ${schema.headerColor} flex items-center justify-center text-white shadow-lg shrink-0">
                <i class="fas ${schema.icon} text-lg"></i>
            </div>
            <div>
                <h3 class="text-sm font-bold text-slate-200 leading-tight">${schema.label}</h3>
                <p class="text-[10px] text-slate-500 mt-1 leading-snug">${schema.desc}</p>
            </div>
        </div>
        <div class="space-y-5">
    `;

    // Render Fields
    if (schema.fields) {
        schema.fields.forEach(field => {
            const value = (node.data && node.data[field.name]) !== undefined ? node.data[field.name] : (field.default || '');
            
            if (field.type === 'mapping_builder') {
                html += renderMappingBuilder(nodeId, field.name, value);
            } else if (field.type === 'code_editor') {
                html += renderCodeEditor(nodeId, field.name, value, field.height, field.placeholder);
            } else {
                html += renderStandardField(nodeId, field, value);
            }
        });
    }
    html += `</div>`;

    content.innerHTML = html;
    idDisplay.innerText = `Node #${nodeId} • ${schema.type.toUpperCase()}`;
    panel.classList.remove('translate-x-full');
}

// Renderer: Standard Fields
function renderStandardField(nodeId, field, value) {
    let inputHtml = '';
    const labelHtml = `<label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">${field.label} ${field.required?'<span class="text-rose-500">*</span>':''}</label>`;

    if (field.type === 'select') {
        const opts = field.options.map(o => `<option value="${o}" ${o === value ? 'selected' : ''}>${o}</option>`).join('');
        inputHtml = `<div class="relative"><select onchange="updateNodeData(${nodeId}, '${field.name}', this.value)" class="w-full bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-2 focus:border-indigo-500 outline-none appearance-none hover:border-slate-600 transition">${opts}</select><i class="fas fa-chevron-down absolute right-3 top-3 text-slate-600 text-[10px] pointer-events-none"></i></div>`;
    } 
    else if (field.type === 'textarea') {
        inputHtml = `<textarea onchange="updateNodeData(${nodeId}, '${field.name}', this.value)" class="w-full bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-2 focus:border-indigo-500 outline-none font-mono min-h-[80px] hover:border-slate-600 transition" placeholder="${field.placeholder || ''}">${value}</textarea>`;
    } 
    else {
        // Text, Number, etc
        const prefix = field.prefix ? `<span class="absolute left-2 top-2 text-slate-500 text-xs">${field.prefix}</span>` : '';
        const pl = field.prefix ? 'pl-8' : 'px-2';
        inputHtml = `<div class="relative">${prefix}<input type="${field.type}" value="${value}" onkeyup="updateNodeData(${nodeId}, '${field.name}', this.value)" class="w-full bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded ${pl} py-2 focus:border-indigo-500 outline-none placeholder-slate-600 hover:border-slate-600 transition" placeholder="${field.placeholder || ''}"></div>`;
    }

    return `<div class="group">${labelHtml}${inputHtml}</div>`;
}

// Renderer: Code Editor
function renderCodeEditor(nodeId, fieldName, value, height = 'h-32', placeholder = '') {
    return `
        <div class="group">
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Expression / Code</label>
            <div class="bg-slate-950 border border-slate-800 rounded-md overflow-hidden relative">
                <textarea onchange="updateNodeData(${nodeId}, '${fieldName}', this.value)" 
                    class="w-full bg-transparent text-indigo-300 text-[11px] font-mono leading-relaxed p-2 outline-none ${height} resize-none" 
                    spellcheck="false"
                    placeholder="${placeholder}">${value}</textarea>
            </div>
        </div>
    `;
}

// Renderer: Mapping Builder
function renderMappingBuilder(nodeId, fieldName, data) {
    const mappings = Array.isArray(data) ? data : [];
    
    let rowsHtml = mappings.map((row, index) => `
        <div class="flex items-start gap-1 mb-2 bg-slate-900 p-1.5 rounded border border-slate-800 group hover:border-slate-600 transition">
            <div class="flex-1">
                <input type="text" value="${row.key || ''}" onkeyup="updateMappingRow(${nodeId}, '${fieldName}', ${index}, 'key', this.value)" placeholder="Target Key" class="w-full bg-transparent text-[10px] text-indigo-300 placeholder-slate-600 border-none outline-none font-mono">
            </div>
            <div class="w-16 border-l border-r border-slate-700 px-1">
                 <select onchange="updateMappingRow(${nodeId}, '${fieldName}', ${index}, 'mode', this.value)" class="w-full bg-transparent text-[9px] text-slate-400 border-none outline-none appearance-none cursor-pointer">
                    <option value="Direct" ${row.mode === 'Direct' ? 'selected' : ''}>Direct</option>
                    <option value="Formula" ${row.mode === 'Formula' ? 'selected' : ''}>Formula</option>
                    <option value="Static" ${row.mode === 'Static' ? 'selected' : ''}>Static</option>
                 </select>
            </div>
            <div class="flex-1">
                <input type="text" value="${row.value || ''}" onkeyup="updateMappingRow(${nodeId}, '${fieldName}', ${index}, 'value', this.value)" placeholder="Value" class="w-full bg-transparent text-[10px] text-slate-300 placeholder-slate-600 border-none outline-none px-1">
            </div>
            <button onclick="removeMappingRow(${nodeId}, '${fieldName}', ${index})" class="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-rose-500 transition"><i class="fas fa-times text-[10px]"></i></button>
        </div>
    `).join('');

    return `
        <div class="bg-slate-950 border border-slate-800 rounded p-3">
            <div class="flex justify-between items-center mb-2">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Data Mapping</label>
                <button onclick="addMappingRow(${nodeId}, '${fieldName}')" class="text-[9px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded font-bold transition"><i class="fas fa-plus mr-1"></i> ADD</button>
            </div>
            <div class="flex text-[9px] text-slate-600 px-1 mb-1 font-mono uppercase">
                <div class="flex-1">Key</div>
                <div class="w-16 text-center">Type</div>
                <div class="flex-1 pl-2">Source / Expr</div>
                <div class="w-5"></div>
            </div>
            <div id="mapping-container-${nodeId}">
                ${rowsHtml.length > 0 ? rowsHtml : '<div class="text-[10px] text-slate-600 text-center py-2 italic">No mappings defined</div>'}
            </div>
        </div>
    `;
}

// ------------------------------------------------
// DATA SYNC LOGIC
// ------------------------------------------------

function updateNodeData(id, key, value) {
    let node = editor.drawflow.drawflow.Home.data[id];
    if(!node.data) node.data = {};
    node.data[key] = value;
}

function addMappingRow(id, fieldName) {
    let node = editor.drawflow.drawflow.Home.data[id];
    if(!node.data[fieldName]) node.data[fieldName] = [];
    node.data[fieldName].push({ key: "", mode: "Direct", value: "" });
    openPropertiesPanel(id);
}

function removeMappingRow(id, fieldName, index) {
    let node = editor.drawflow.drawflow.Home.data[id];
    if(node.data[fieldName]) {
        node.data[fieldName].splice(index, 1);
        openPropertiesPanel(id);
    }
}

function updateMappingRow(id, fieldName, index, prop, val) {
    let node = editor.drawflow.drawflow.Home.data[id];
    if(node.data[fieldName] && node.data[fieldName][index]) {
        node.data[fieldName][index][prop] = val;
    }
}

// ------------------------------------------------
// UI & NAVIGATION CONTROLLERS
// ------------------------------------------------

function closePropertiesPanel() {
    const panel = document.getElementById('panel-properties');
    panel.classList.add('translate-x-full');
    if(selectedNodeId) {
        editor.removeNodeSelected();
        selectedNodeId = null;
    }
}

function selectRule(id, name) {
    currentRuleId = id;
    document.getElementById('rule-status-badge').classList.remove('hidden');
    document.getElementById('current-rule-name').innerText = name;
    document.getElementById('canvas-overlay').classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('btn-toggle-edit').disabled = false;
    
    setEditMode(false);
    editor.clearModuleSelected();
    
    // Auto-open Toolbox 'triggers' category
    setTimeout(() => { toggleToolboxCategory('triggers'); }, 300);
}

function createNewRule() {
    const name = prompt("Name your new Rule:");
    if(!name) return;
    const newId = Date.now();
    selectRule(newId, name);
    setEditMode(true);
    switchSidebar('toolbox');
}

function toggleEditMode() {
    if (!currentRuleId) return showToast('Select a rule first!', 'error');
    setEditMode(!isEditMode);
}

function setEditMode(active) {
    isEditMode = active;
    const btnEdit = document.getElementById('btn-toggle-edit');
    const icon = document.getElementById('icon-edit-mode');
    const text = document.getElementById('text-edit-mode');
    const btnSave = document.getElementById('btn-save-flow');
    const toolbox = document.getElementById('sidebar-toolbox');
    const lockMsg = document.getElementById('toolbox-lock-msg');

    if (active) {
        editor.editor_mode = 'edit';
        btnEdit.className = "h-8 px-3 rounded bg-indigo-600 border border-indigo-500 text-white text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 transition shadow-lg shadow-indigo-600/20";
        icon.className = "fas fa-unlock";
        text.innerText = "Editing";
        btnSave.disabled = false;
        toolbox.classList.remove('opacity-50', 'pointer-events-none');
        lockMsg.classList.add('hidden');
    } else {
        editor.editor_mode = 'fixed';
        btnEdit.className = "h-8 px-3 rounded bg-slate-900/80 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 transition";
        icon.className = "fas fa-lock";
        text.innerText = "Locked";
        btnSave.disabled = true;
        toolbox.classList.add('opacity-50', 'pointer-events-none');
        lockMsg.classList.remove('hidden');
        closePropertiesPanel();
    }
}

function switchSidebar(tab) {
    const toolbox = document.getElementById('sidebar-toolbox');
    const rules = document.getElementById('sidebar-rules');
    const btnToolbox = document.getElementById('btn-tab-toolbox');
    const btnRules = document.getElementById('btn-tab-rules');
    
    closePropertiesPanel();

    const activeClass = "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-white border-b-2 border-indigo-500 bg-slate-800/50";
    const inactiveClass = "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b-2 border-transparent hover:text-slate-300";

    if (tab === 'toolbox') {
        toolbox.classList.remove('hidden');
        rules.classList.add('hidden');
        btnToolbox.className = activeClass;
        btnRules.className = inactiveClass;
    } else {
        toolbox.classList.add('hidden');
        rules.classList.remove('hidden');
        btnRules.className = activeClass;
        btnToolbox.className = inactiveClass;
    }
}

// ------------------------------------------------
// DRAG, DROP & RENDER NODES
// ------------------------------------------------

function setupDragAndDrop() {
    const items = document.querySelectorAll('.dre-tool-item');
    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            if (!currentRuleId || !isEditMode) { e.preventDefault(); return false; }
            e.dataTransfer.setData('node_type', e.currentTarget.getAttribute('data-node'));
        });
    });
    window.allowDrop = (e) => { if(isEditMode) e.preventDefault(); };
    window.drop = (e) => {
        e.preventDefault();
        if (!isEditMode) return;
        const type = e.dataTransfer.getData('node_type');
        addNodeToCanvas(type, e.clientX, e.clientY);
    }
}

function addNodeToCanvas(type, clientX, clientY) {
    let nodeConfig = null;
    DRE_CONFIG.categories.forEach(cat => {
        const found = cat.items.find(i => i.type === type);
        if (found) nodeConfig = found;
    });
    if (!nodeConfig) return;

    const container = document.getElementById("drawflow-container");
    const rect = container.getBoundingClientRect();
    const x = (clientX - rect.left) * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)) - (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)) * editor.canvas_x;
    const y = (clientY - rect.top) * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)) - (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)) * editor.canvas_y;

    const html = `
        <div class="w-[180px] rounded-lg overflow-hidden bg-slate-800 shadow-xl border border-slate-700 group transition hover:border-slate-500 hover:shadow-indigo-500/20">
            <div class="h-8 ${nodeConfig.headerColor} flex items-center px-3 gap-2 text-white font-bold text-[10px] uppercase tracking-wide relative">
                <i class="fas ${nodeConfig.icon} opacity-90"></i> 
                <span class="truncate flex-1">${nodeConfig.label}</span>
            </div>
            <div class="p-2 bg-slate-900/50 flex justify-center items-center gap-2">
                 <span class="text-[9px] text-slate-500 font-mono">ID: <span class="node-id-display">#</span></span>
            </div>
        </div>`;

    const defaultData = {};
    if(nodeConfig.fields) nodeConfig.fields.forEach(f => { if(f.default) defaultData[f.name] = f.default; });

    editor.addNode(type, nodeConfig.inputs, nodeConfig.outputs, x, y, type, defaultData, html);
}

// ------------------------------------------------
// UTILITIES
// ------------------------------------------------

function deleteSelectedNode() {
    if (!isEditMode) return;
    if (selectedNodeId !== null) {
        editor.removeNodeId('node-' + selectedNodeId);
        closePropertiesPanel();
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (!isEditMode) return;
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
             const activeTag = document.activeElement.tagName.toLowerCase();
             if (activeTag !== 'input' && activeTag !== 'textarea') deleteSelectedNode();
        }
    });
}

function toggleToolboxCategory(id) {
    const content = document.getElementById(`cat-content-${id}`);
    const icon = document.getElementById(`cat-icon-${id}`);
    if(!content) return;
    
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
        icon.classList.remove('rotate-180');
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
        icon.classList.add('rotate-180');
    }
}

function filterToolbox(query) {
    const term = query.toLowerCase();
    document.querySelectorAll('.dre-tool-item').forEach(item => {
        const label = item.getAttribute('data-label').toLowerCase();
        item.style.display = label.includes(term) ? "flex" : "none";
    });
    document.querySelectorAll('.toolbox-category').forEach(cat => {
        const id = cat.getAttribute('data-id');
        const content = document.getElementById(`cat-content-${id}`);
        content.style.maxHeight = term.length > 0 ? "1000px" : null;
    });
}

function exportFlow() {
    if (!isEditMode) return;
    const raw = editor.export();
    console.log("🚀 Payload:", JSON.stringify(raw, null, 2));
    showToast('Configuration Saved', 'success');
}

function renderRuleItem(name, status, id) {
    const statusDot = status === 'Active' ? 'bg-emerald-500' : (status === 'Paused' ? 'bg-amber-500' : 'bg-slate-500');
    return `
    <div onclick="selectRule(${id}, '${name}')" class="group p-3 rounded bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-indigo-500/50 cursor-pointer transition relative overflow-hidden">
        <div class="flex items-center justify-between mb-1">
            <span class="text-[11px] font-bold text-slate-300 group-hover:text-white truncate">${name}</span>
            <div class="w-1.5 h-1.5 rounded-full ${statusDot} shadow-sm"></div>
        </div>
        <div class="flex items-center gap-2 text-[9px] text-slate-500 font-mono">
            <span>ID: ${id}</span>
            <span class="opacity-50">|</span>
            <span class="uppercase">${status}</span>
        </div>
    </div>`
}

function renderToolboxAccordion() {
    return DRE_CONFIG.categories.map(cat => `
        <div class="toolbox-category mb-2 rounded-lg overflow-hidden border border-transparent transition-all duration-300" data-id="${cat.id}">
            <button onclick="toggleToolboxCategory('${cat.id}')" class="w-full flex items-center justify-between p-2 bg-slate-800/80 hover:bg-slate-800 transition ${cat.border} border-l-2 shadow-sm">
                <span class="text-[10px] font-bold uppercase tracking-wide ${cat.color} flex items-center gap-2">${cat.label}</span>
                <i id="cat-icon-${cat.id}" class="fas fa-chevron-down text-[9px] text-slate-500 transition-transform duration-300"></i>
            </button>
            <div id="cat-content-${cat.id}" class="max-h-0 overflow-hidden transition-[max-height] duration-300 ease-in-out bg-slate-900/40">
                <div class="p-2 grid grid-cols-2 gap-2">
                    ${cat.items.map(item => `
                        <div class="dre-tool-item flex flex-col items-center justify-center p-3 rounded bg-slate-800 border border-slate-700 hover:border-slate-500 hover:bg-slate-700 cursor-grab active:cursor-grabbing transition group relative h-20 shadow-sm" draggable="true" data-node="${item.type}" data-label="${item.label}">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center ${item.headerColor} text-white shadow-lg mb-2 group-hover:scale-110 transition"><i class="fas ${item.icon} text-xs"></i></div>
                            <span class="text-[9px] font-bold text-slate-300 text-center leading-tight group-hover:text-white">${item.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('')
}

function loadScript(url) { return new Promise((resolve) => { const s = document.createElement('script'); s.src = url; s.onload = resolve; document.head.appendChild(s); }); }
function loadCSS(url) { return new Promise((resolve) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = url; l.onload = resolve; document.head.appendChild(l); }); }

// ==========================================
// 4. STYLES
// ==========================================
function getStyles() {
    return `
    <style>
        #drawflow-container { background-color: #020617; background-image: linear-gradient(rgba(30, 41, 59, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 41, 59, 0.4) 1px, transparent 1px); background-size: 24px 24px; }
        
        .drawflow-node { background: transparent !important; border: none !important; padding: 0 !important; width: auto !important; min-width: 180px; box-shadow: none !important; }
        .drawflow-node.selected .w-\\[180px\\] { border-color: #6366f1 !important; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4) !important; }
        .drawflow-node .input, .drawflow-node .output { width: 10px !important; height: 10px !important; background: #0f172a !important; border: 2px solid #64748b !important; border-radius: 50% !important; top: 16px !important; transition: all 0.2s; }
        .drawflow-node .input:hover, .drawflow-node .output:hover { background: #6366f1 !important; border-color: white; transform: scale(1.4); }
        .drawflow-node .input { left: -6px !important; }
        .drawflow-node .output { right: -6px !important; }
        .drawflow .connection .main-path { stroke-width: 2px; stroke: #475569; }
        .drawflow .connection.selected .main-path { stroke: #6366f1; stroke-width: 3px; }
        .drawflow-delete { display: none; }
    </style>
    `
}