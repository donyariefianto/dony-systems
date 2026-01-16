import { apiFetch } from '../core/api.js'
import { AppState } from '../core/state.js'
import { showToast, showConfirmDialog, decryptDataRandom } from '../utils/helpers.js'

const API_CONFIG = {
 URL_LOAD: 'api/list-menu',
 URL_SAVE: 'api/patch-menu',
 headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + localStorage.getItem('token'),
 },
}

if (!window.menuBuilderState) {
 window.menuBuilderState = {
  selectedId: null,
  data: [],
  isConfigModalOpen: false,
 }
}

const FIXED_DASHBOARD = {
 id: 'fixed_dashboard',
 name: 'Dashboard',
 icon: 'fas fa-home',
 sub_sidemenu: [
  {
   id: '1.1',
   name: 'Dashboard',
   icon: 'fas fa-chart-line',
   type: 'chartview',
   path: 'dashboard',
   permissions: ['admin', 'user'],
   config: {
    endpoint: '/api/dashboard/stats',
    charts: ['overview', 'performance'],
    refreshInterval: 30000,
   },
  },
 ],
}

const FIXED_SETTINGS = {
 id: 'fixed_settings',
 name: 'Settings',
 icon: 'fas fa-cogs',
 type: 'group',
 path: 'settings',
 locked: true,
 permissions: ['admin'],
 sub_sidemenu: [
  {
   id: '8.1',
   name: 'User Management',
   icon: 'fas fa-users-cog',
   type: 'tableview',
   path: 'settings/users',
   config: {
    endpoint: '/api/collections/users',
    collectionName: 'users',
    fields: [
     {
      name: 'username',
      label: 'Username',
      type: 'text',
      required: true,
      unique: true,
     },
     {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      unique: true,
     },
     {
      name: 'role',
      label: 'Role',
      type: 'select',
      options: ['admin', 'warehouse', 'finance', 'user'],
      required: true,
     },
     {
      name: 'status',
      label: 'Status Akun',
      type: 'select',
      options: ['Active', 'Inactive', 'Suspended'],
      default: 'Active',
     },
     {
      name: 'last_login',
      label: 'Terakhir Login',
      type: 'datetime',
      readonly: true,
     },
    ],
    operations: {
     create: true,
     read: true,
     update: true,
     delete: true,
     reset_password: true,
    },
   },
  },
  {
   id: '8.2',
   name: 'App Config',
   icon: 'fas fa-sliders-h',
   type: 'settings',
   path: 'settings/config',
   config: {
    endpoint: '/api/settings/general',
    collectionName: 'app_config',
    fields: [
     {
      name: 'app_name',
      label: 'Nama Aplikasi',
      type: 'text',
      default: 'TB Sahabat System',
     },
     {
      name: 'maintenance_mode',
      label: 'Mode Maintenance',
      type: 'boolean',
      default: false,
     },
     {
      name: 'timezone',
      label: 'Zona Waktu Default',
      type: 'select',
      options: ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'],
      default: 'Asia/Jakarta',
     },
    ],
   },
  },
 ],
}

window.findItemById = function (items, id) {
 for (let item of items) {
  if (item.id === id) return item
  if (item.sub_sidemenu) {
   const found = window.findItemById(item.sub_sidemenu, id)
   if (found) return found
  }
 }
 return null
}

window.findParentArray = function (items, id) {
 const index = items.findIndex((i) => i.id === id)
 if (index > -1) {
  return items
 }

 for (let item of items) {
  if (item.sub_sidemenu && item.sub_sidemenu.length > 0) {
   const found = window.findParentArray(item.sub_sidemenu, id)
   if (found) return found
  }
 }

 return null
}

window.getAllCollections = function () {
 const collections = []

 function traverse(items) {
  if (!items) return
  items.forEach((item) => {
   if (item.type === 'tableview' && item.config && item.config.collectionName) {
    collections.push({
     id: item.id,
     name: item.name,
     collection: item.config.collectionName,
     endpoint: item.config.endpoint,
    })
   }
   if (item.sub_sidemenu && item.sub_sidemenu.length > 0) {
    traverse(item.sub_sidemenu)
   }
  })
 }
 traverse(window.menuBuilderState.data)
 return collections
}

export function renderSideMenuTab(settings) {
 if (window.menuBuilderState.data.length === 0 && settings.menu_items) {
  window.menuBuilderState.data = settings.menu_items.filter(
   (item) => item.id !== 'fixed_dashboard' && item.id !== 'fixed_settings'
  )
 }

 setTimeout(() => {
  if (window.menuBuilderState.data.length === 0) {
   window.initMenuBuilder()
  }
 }, 100)
 return `
        <div class="w-full h-[calc(100vh-100px)] flex flex-col gap-4 relative overflow-hidden">
            
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex justify-between items-center shrink-0 z-10">
                <div>
                    <h2 class="text-base lg:text-lg font-bold text-gray-800 flex items-center gap-2">
                        <i class="fas fa-sitemap text-blue-600"></i>
                        Menu Builder
                    </h2>
                </div>
                <div class="flex items-center gap-2.5">
                    <button onclick="window.resetMenuBuilder()" 
                        class="group h-10 w-10 lg:w-auto lg:px-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 active:scale-95 shadow-sm">
                        <i class="fas fa-undo transition-transform group-hover:-rotate-45"></i> 
                        <span class="hidden lg:inline tracking-wide uppercase">Reset</span>
                    </button>

                    <button onclick="window.exportMenuJSON()" 
                        class="group h-10 w-10 lg:w-auto lg:px-4 flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50/50 border border-emerald-100 rounded-xl transition-all duration-200 hover:bg-emerald-50 hover:border-emerald-200 active:scale-95 shadow-sm">
                        <i class="fas fa-code transition-transform group-hover:scale-110"></i> 
                        <span class="hidden lg:inline tracking-wide uppercase">JSON</span>
                    </button>

                    <button onclick="saveMenuSettings()" 
                        class="group h-10 w-10 lg:w-auto lg:px-5 flex items-center justify-center gap-2 text-xs font-bold text-white bg-blue-600 rounded-xl transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 -translate-y-[1px] active:translate-y-0 active:scale-95 shadow-md shadow-blue-100">
                        <i class="fas fa-save transition-transform group-hover:scale-110"></i> 
                        <span class="hidden lg:inline tracking-wide uppercase">Save Changes</span>
                    </button>
                </div>
            </div>

            <div class="flex-1 flex lg:gap-4 min-h-0 relative">
                
                <div class="w-full lg:w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div class="p-3 border-b border-gray-100 bg-gray-50 rounded-t-xl flex justify-between items-center">
                        <h3 class="font-bold text-gray-700 text-sm">Structure</h3>
                        <div class="flex gap-2">
                            <button onclick="window.addTemplateItem('tableview', 'Table', 'fas fa-table')" class="text-[10px] font-bold bg-white text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:text-blue-600 shadow-sm flex items-center gap-1 transition-all active:scale-95">
                                <i class="fas fa-plus"></i> Table
                            </button>
                            <button onclick="window.addRootItem()" class="text-[10px] font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-1 transition-all active:scale-95">
                                <i class="fas fa-folder-plus"></i> Folder
                            </button>
                        </div>
                    </div>
                    
                    <div id="menu-tree-canvas" class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-gray-50/30">
                        ${renderFixedItem(FIXED_DASHBOARD)}
                        <div class="flex items-center gap-2 my-2 opacity-50"><div class="h-px bg-gray-300 flex-1 border-t border-dashed"></div><span class="text-[9px] font-bold text-gray-400 uppercase">Custom</span><div class="h-px bg-gray-300 flex-1 border-t border-dashed"></div></div>
                        <div id="user-menu-list" class="min-h-[100px]">${renderTree(window.menuBuilderState.data)}</div>
                        <div class="flex items-center gap-2 my-2 opacity-50"><div class="h-px bg-gray-300 flex-1 border-t border-dashed"></div><span class="text-[9px] font-bold text-gray-400 uppercase">System</span><div class="h-px bg-gray-300 flex-1 border-t border-dashed"></div></div>
                        ${renderFixedItem(FIXED_SETTINGS)}
                    </div>
                </div>

                <div id="properties-backdrop" onclick="window.closePropertiesDrawer()" 
                     class="hidden lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30 transition-opacity duration-300 opacity-0"></div>

                <div id="properties-drawer" class="fixed inset-y-0 right-0 w-[85%] sm:w-[400px] lg:w-1/2 lg:static bg-white lg:rounded-xl shadow-2xl lg:shadow-sm border-l lg:border border-gray-200 flex flex-col transform translate-x-full lg:translate-x-0 transition-transform duration-300 z-40">
                    
                    <div class="lg:hidden p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 class="font-bold text-gray-800">Item Properties</h3>
                        <button onclick="window.closePropertiesDrawer()" class="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-500 shadow-sm active:scale-95 transition-transform"><i class="fas fa-times"></i></button>
                    </div>

                    <div class="hidden lg:flex p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                        <h3 class="font-bold text-gray-700 text-sm">Properties</h3>
                    </div>

                    <div id="menu-properties-panel" class="flex-1 overflow-y-auto h-full custom-scrollbar bg-white relative">
                        ${renderPropertiesPanel()}
                    </div>
                </div>

            </div>
        </div>
        
        <div id="table-config-overlay" class="fixed inset-0 h-[100dvh] z-[60] bg-gray-50 hidden flex-col transition-transform duration-300 translate-y-full">
            <div class="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm shrink-0 safe-top">
                <div class="flex items-center gap-3">
                    <button onclick="window.closeTableConfig()" class="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <div class="flex-1 min-w-0">
                        <h2 class="text-sm font-black text-gray-800 tracking-tight flex items-center gap-2 truncate">
                            <i class="fas fa-database text-blue-600"></i>
                            <span class="truncate">Table Config</span>
                        </h2>
                        <p id="overlay-subtitle" class="text-[10px] text-gray-500 truncate">Editing...</p>
                    </div>
                </div>
                <button onclick="window.closeTableConfig()" class="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-sm text-xs flex items-center gap-2">
                    <i class="fas fa-check"></i> <span class="hidden sm:inline">Done</span>
                </button>
            </div>
            
            <div id="table-config-body" class="flex-1 w-full h-full overflow-hidden relative">
                </div>
        </div>

        <div id="json-output-modal" class="hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div class="bg-white p-4 rounded-xl w-full max-w-2xl h-3/4 flex flex-col shadow-2xl">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg">JSON Output</h3>
                    <button onclick="document.getElementById('json-output-modal').classList.add('hidden')"><i class="fas fa-times"></i></button>
                </div>
                <textarea id="json-output-textarea" class="flex-1 bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono resize-none"></textarea>
                <div class="mt-4 text-right"><button onclick="copyJSON()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Copy</button></div>
            </div>
        </div>
    `
}

function renderPropertiesPanel() {
 const selectedId = window.menuBuilderState.selectedId
 if (!selectedId) {
  return `
        <div class="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/30">
            <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300 shadow-inner">
                <i class="fas fa-mouse-pointer text-2xl animate-pulse"></i>
            </div>
            <h4 class="text-sm font-bold text-gray-600">No Selection</h4>
            <p class="text-xs mt-1">Select a menu item from the tree<br>to configure its properties.</p>
        </div>
    `
 }

 const item = window.findItemById(window.menuBuilderState.data, selectedId)
 if (!item) return '<p class="p-4 text-red-500 text-center text-xs">Error: Item not found</p>'

 const isTable = item.type === 'tableview'
 const isGroup = !item.type || item.type === 'group'

 return `
        <div class="flex flex-col h-full bg-white">
            
            <div class="border-b border-gray-100">
                <div class="px-5 py-3 bg-gray-50/50 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                    <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider">General Information</h4>
                </div>
                <div class="p-5 space-y-4">
                     <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Label Name</label>
                        <input type="text" value="${item.name}" oninput="window.updateProperty('name', this.value)"
                               class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Icon Class</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <i class="${item.icon}"></i>
                                </div>
                                <input type="text" value="${item.icon}" oninput="window.updateProperty('icon', this.value)"
                                    class="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500">
                            </div>
                        </div>
                        ${
                         !isGroup
                          ? `
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Route Path</label>
                            <input type="text" value="${item.path || ''}" onchange="window.updateProperty('path', this.value)"
                                   class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 placeholder-gray-300" placeholder="e.g. data/users">
                        </div>`
                          : '<div></div>'
                        }
                    </div>
                     <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Access Permissions</label>
                        <input type="text" value="${(item.permissions || []).join(', ')}" placeholder="e.g. admin, manager" onchange="window.updateProperty('permissions', this.value)"
                               class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500">
                        <p class="text-[9px] text-gray-400 mt-1">Comma separated roles. Leave empty for public.</p>
                     </div>
                </div>
            </div>

            ${
             isTable
              ? `
            <div class="p-5 bg-blue-50 border-t border-b border-blue-100 text-center">
                <div class="mb-3">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-blue-600 shadow-sm mb-2">
                        <i class="fas fa-table text-xl"></i>
                    </div>
                    <h3 class="text-sm font-bold text-gray-800">Table Configuration</h3>
                    <p class="text-xs text-gray-500 mt-1 px-4">Manage fields, validation rules, and data sources in a wide editor.</p>
                </div>
                <button onclick="window.openTableConfig()" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                    <i class="fas fa-pen-to-square"></i> Open Field Editor
                </button>
                <div class="mt-3 text-[10px] text-gray-400 font-mono">
                    ${item.config?.fields?.length || 0} fields configured
                </div>
            </div>
            `
              : ''
            }
            
            <div class="mt-auto p-4 bg-gray-50 border-t border-gray-200">
                <details>
                    <summary class="text-[10px] font-bold text-gray-400 cursor-pointer hover:text-blue-600 text-center list-none select-none">
                        <i class="fas fa-bug mr-1"></i> Debug Raw Config
                    </summary>
                    <pre class="mt-3 text-[9px] bg-gray-800 text-green-400 p-3 rounded-lg overflow-auto max-h-32 custom-scrollbar border border-gray-700">${JSON.stringify(item.config || {}, null, 2)}</pre>
                </details>
            </div>
        </div>
    `
}

function renderTableConfigOverlay(item) {
 const config = item.config || { endpoint: '', collectionName: '', fields: [] }
 const fields = config.fields || []

 return `
    <div class="flex flex-col h-full bg-gray-50">
        
        <div class="bg-white border-b border-gray-200 px-4 py-4 shrink-0 shadow-sm z-10">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">API Endpoint</label>
                    <input type="text" value="${config.endpoint || ''}" placeholder="/api/v1/resource" 
                            onchange="window.updateTableConfig('endpoint', this.value)"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono focus:bg-white focus:border-blue-500 transition-colors">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Collection Name</label>
                    <input type="text" value="${config.collectionName || ''}" 
                            onchange="window.updateTableConfig('collectionName', this.value)"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono focus:bg-white focus:border-blue-500 transition-colors">
                </div>
            </div>
        </div>

        <div class="px-4 py-2 bg-gray-100 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2 shrink-0 z-10">
            <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-gray-600 uppercase bg-white px-2 py-1 rounded border border-gray-200">
                    ${fields.length} Fields
                </span>
                <div class="h-4 w-px bg-gray-300 mx-1"></div>
                <button onclick="window.toggleAllFields(true)" class="p-1.5 bg-white border rounded hover:text-blue-600 text-gray-500"><i class="fas fa-expand-alt text-xs"></i></button>
                <button onclick="window.toggleAllFields(false)" class="p-1.5 bg-white border rounded hover:text-blue-600 text-gray-500"><i class="fas fa-compress-alt text-xs"></i></button>
            </div>
            
            <button onclick="window.addNewField()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase rounded shadow-sm flex items-center gap-1">
                <i class="fas fa-plus"></i> Add Field
            </button>
        </div>

        <div class="flex-1 overflow-y-auto min-h-0 p-4 pb-32 custom-scrollbar overscroll-contain">
            ${
             fields.length === 0
              ? `<div class="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 min-h-[200px]">
                    <i class="fas fa-columns text-4xl mb-2"></i>
                    <p class="text-xs">No fields configured yet</p>
                    </div>`
              : `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${fields.map((field, idx) => renderFieldCard(field, idx)).join('')}
                    </div>`
            }
        </div>
    </div>
    `
}

function renderFieldCard(field, idx) {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 const totalFields = item?.config?.fields?.length || 0
 const isCollapsed = field._isCollapsed === true

 const isRepeater = field.type === 'repeater'
 const isRelation = field.type === 'relation'
 const isSelect = field.type === 'select'
 const isNumeric = ['number', 'currency'].includes(field.type)

 const cardBorderColor = isRepeater ? 'border-purple-200' : 'border-gray-200'
 const activeRing = isRepeater ? 'focus-within:ring-purple-500/20' : 'focus-within:ring-blue-500/20'

 const safeOptions = Array.isArray(field.options) ? field.options : []

 const collections = window.getAllCollections()
 const autoPopStr = Object.entries(field.relation?.auto_populate || {})
  .map(([k, v]) => `${k}:${v}`)
  .join(', ')
 const isAutoPopEnabled = field.relation?.enable_auto_populate === true

 return `
    <div class="bg-white border ${cardBorderColor} rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col group relative overflow-hidden mb-3 focus-within:ring-4 ${activeRing} animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        <div class="flex items-center gap-2 p-2 bg-gray-50/80 border-b ${cardBorderColor} select-none">
            <button onclick="window.toggleFieldCollapse(${idx})" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-400 hover:text-blue-600 transition-all active:scale-90">
                <i class="fas fa-chevron-down transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}"></i>
            </button>
            
            <div class="w-6 h-6 bg-gray-200 rounded text-[10px] font-bold flex items-center justify-center text-gray-600 shrink-0 shadow-inner">
                ${idx + 1}
            </div>
            
            <div class="flex-1 min-w-0">
                <input type="text" value="${field.label || ''}" 
                    oninput="window.updateField(${idx}, 'label', this.value)" 
                    class="bg-transparent font-bold text-xs md:text-sm text-gray-800 w-full outline-none focus:text-blue-600 placeholder-gray-400 truncate transition-colors" 
                    placeholder="Label Field (Contoh: Nama Produk)">
            </div>
            
            <div class="flex items-center gap-1">
                <button onclick="window.moveField(${idx}, -1)" ${idx === 0 ? 'disabled class="opacity-30 cursor-not-allowed w-7 h-7 flex items-center justify-center text-gray-400"' : 'class="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-gray-500 hover:text-blue-600 active:scale-90 transition-all"'} title="Naik"><i class="fas fa-arrow-up text-[10px]"></i></button>
                <button onclick="window.moveField(${idx}, 1)" ${idx === totalFields - 1 ? 'disabled class="opacity-30 cursor-not-allowed w-7 h-7 flex items-center justify-center text-gray-400"' : 'class="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-gray-500 hover:text-blue-600 active:scale-90 transition-all"'} title="Turun"><i class="fas fa-arrow-down text-[10px]"></i></button>
                <div class="w-px h-4 bg-gray-300 mx-1"></div>
                <button onclick="window.duplicateField(${idx})" class="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors" title="Duplikat"><i class="fas fa-copy text-[10px]"></i></button>
                <button onclick="window.removeField(${idx})" class="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors" title="Hapus"><i class="fas fa-trash text-[10px]"></i></button>
            </div>
        </div>

        <div class="${isCollapsed ? 'hidden' : 'block'} p-4 bg-white">
            
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
                <div class="md:col-span-7">
                    <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Tipe Data</label>
                    <div class="relative">
                        <select onchange="window.updateField(${idx}, 'type', this.value)" class="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:border-blue-500 outline-none appearance-none font-medium text-gray-700 transition-colors shadow-sm">
                            <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text (Singkat)</option>
                            <option value="number" ${field.type === 'number' ? 'selected' : ''}>Number (Angka)</option>
                            <option value="currency" ${field.type === 'currency' ? 'selected' : ''}>Currency (Uang)</option>
                            <option value="date" ${field.type === 'date' ? 'selected' : ''}>Datetime (Tgl & Jam)</option>
                            <option value="select" ${field.type === 'select' ? 'selected' : ''}>Select (Dropdown)</option>
                            <option value="relation" ${field.type === 'relation' ? 'selected' : ''}>Relation (Lookup)</option>
                            <option value="repeater" ${field.type === 'repeater' ? 'selected' : ''}>Repeater (Tabel)</option>
                            <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Textarea (Paragraf)</option>
                            <option value="image" ${field.type === 'image' ? 'selected' : ''}>Image (Upload)</option>
                            <option value="boolean" ${field.type === 'boolean' ? 'selected' : ''}>Boolean (Switch)</option>
                        </select>
                        <div class="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400"><i class="fas fa-chevron-down text-[10px]"></i></div>
                    </div>
                </div>
                <div class="md:col-span-5">
                    <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Database Key</label>
                    <input type="text" value="${field.name || ''}" oninput="window.updateField(${idx}, 'name', this.value)" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono bg-yellow-50 focus:bg-white focus:border-yellow-400 outline-none transition-colors shadow-sm" placeholder="db_column_name">
                </div>
            </div>

            ${
             isSelect
              ? `
            <div class="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-2 animate-in slide-in-from-top-1">
                <div class="flex justify-between items-center">
                    <label class="text-[10px] font-bold text-blue-600 uppercase"><i class="fas fa-list-ul mr-1"></i> Static Options</label>
                    <span class="text-[9px] text-blue-400 bg-white px-1.5 rounded border border-blue-100">Pisahkan koma</span>
                </div>
                <textarea rows="2" onchange="window.updateFieldOptions(${idx}, this.value)" class="w-full px-3 py-2 border border-blue-200 rounded-lg text-xs font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none placeholder-blue-300" placeholder="Pcs, Box, Pack">${safeOptions.join(', ')}</textarea>
            </div>`
              : ''
            }
            
            ${
             isRelation
              ? `
            <div class="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100 space-y-3 animate-in slide-in-from-top-1">
                <div class="flex items-center gap-2 text-indigo-800 border-b border-indigo-200/50 pb-2">
                    <i class="fas fa-link"></i> <span class="text-xs font-bold uppercase">Konfigurasi Relasi</span>
                </div>
                <select onchange="window.updateDeepField(${idx}, 'relation.collection', this.value)" class="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs bg-white outline-none">
                    <option value="">-- Pilih Collection --</option>
                    ${collections.map((c) => `<option value="${c.collection}" ${field.relation?.collection === c.collection ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
                <div class="grid grid-cols-2 gap-3">
                    <input value="${field.relation?.key || '_id'}" oninput="window.updateDeepField(${idx}, 'relation.key', this.value)" class="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs bg-white" placeholder="Key (_id)">
                    <input value="${field.relation?.display || 'name'}" oninput="window.updateDeepField(${idx}, 'relation.display', this.value)" class="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs bg-white" placeholder="Display Label">
                </div>
                
                <div class="pt-1">
                     <label class="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" ${isAutoPopEnabled ? 'checked' : ''} onchange="window.updateDeepField(${idx}, 'relation.enable_auto_populate', this.checked); window.refreshBuilderUI()" class="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-indigo-300">
                        <span class="text-[9px] font-bold text-indigo-600 uppercase">Aktifkan Auto Fill</span>
                    </label>
                    ${
                     isAutoPopEnabled
                      ? `
                    <div class="mt-2 animate-in slide-in-from-top-1">
                        <input value="${autoPopStr}" onchange="window.updateAutoPopulate(${idx}, this.value)" class="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs font-mono bg-white" placeholder="field_sumber:field_target, ...">
                    </div>`
                      : ''
                    }
                </div>
            </div>`
              : ''
            }

            ${isNumeric ? renderCalculationConfig(field, idx) : ''}

            ${
             isRepeater
              ? `
            <div class="bg-white border-2 border-dashed border-purple-200 rounded-xl overflow-hidden animate-in slide-in-from-top-1">
                <div class="flex justify-between items-center p-3 bg-purple-50 border-b border-purple-100">
                    <div class="flex items-center gap-2 text-purple-700">
                        <i class="fas fa-table"></i><span class="text-xs font-bold uppercase">Kolom Tabel (Sub-Fields)</span>
                    </div>
                    <button onclick="window.addSubField(${idx})" class="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg shadow-sm font-bold flex items-center gap-1 transition-all">
                        <i class="fas fa-plus"></i> Add Col
                    </button>
                </div>
                <div class="p-3 bg-gray-50/50 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                    ${(field.sub_fields || []).map((sf, sIdx) => renderSubFieldItem(sf, idx, sIdx)).join('')}
                    ${!field.sub_fields || field.sub_fields.length === 0 ? '<p class="text-center text-gray-400 text-[10px] italic py-4">Belum ada kolom. Klik "Add Col".</p>' : ''}
                </div>
            </div>`
              : ''
            }

            <div class="flex flex-wrap items-center gap-4 pt-4 mt-2 border-t border-gray-100">
                <label class="flex items-center gap-2 cursor-pointer select-none group/chk">
                    <input type="checkbox" ${field.required ? 'checked' : ''} onchange="window.updateField(${idx}, 'required', this.checked)" class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-gray-300">
                    <span class="text-[10px] font-bold text-gray-500 group-hover/chk:text-blue-600 uppercase transition-colors">Wajib Diisi</span>
                </label>
                
                <label class="flex items-center gap-2 cursor-pointer select-none group/chk">
                    <input type="checkbox" ${field.ui?.readonly ? 'checked' : ''} onchange="window.updateDeepField(${idx}, 'ui.readonly', this.checked)" class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-gray-300">
                    <span class="text-[10px] font-bold text-gray-500 group-hover/chk:text-blue-600 uppercase transition-colors">Read Only</span>
                </label>

                <div class="ml-auto flex items-center gap-2">
                    <span class="text-[10px] font-bold text-gray-400 uppercase">Lebar:</span>
                    <select onchange="window.updateField(${idx}, 'width', this.value)" class="text-[10px] font-bold border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none focus:border-blue-500 transition-colors">
                        <option value="50">50% (Setengah)</option>
                        <option value="100" ${field.width === '100' ? 'selected' : ''}>100% (Penuh)</option>
                        <option value="33" ${field.width === '33' ? 'selected' : ''}>33% (Sepertiga)</option>
                        <option value="66" ${field.width === '66' ? 'selected' : ''}>66% (Dua pertiga)</option>
                    </select>
                </div>
            </div>
        </div>
    </div>`
}

function renderSelectConfig(field, idx) {
 return `
    <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1.5">
        <label class="text-[10px] font-bold text-gray-500 uppercase">Opsi Pilihan (Pisahkan dengan koma)</label>
        <textarea onchange="window.updateFieldOptions(${idx}, this.value)" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none resize-none" placeholder="Contoh: Tunai, Transfer, Kredit">${(field.options || []).join(', ')}</textarea>
    </div>`
}

function renderRelationConfig(field, idx) {
 const collections = window.getAllCollections()
 const autoPopStr = Object.entries(field.relation?.auto_populate || {})
  .map(([k, v]) => `${k}:${v}`)
  .join(', ')

 return `
    <div class="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100 space-y-3">
        <div class="flex items-center gap-2 text-indigo-800 border-b border-indigo-200/50 pb-2">
            <i class="fas fa-link"></i> <span class="text-xs font-bold uppercase">Konfigurasi Relasi</span>
        </div>
        
        <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-indigo-400 uppercase">Ambil Data Dari</label>
            <select onchange="window.updateDeepField(${idx}, 'relation.collection', this.value)" class="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs bg-white focus:border-indigo-500 outline-none h-10">
                <option value="">-- Pilih Koleksi --</option>
                ${collections.map((c) => `<option value="${c.collection}" ${field.relation?.collection === c.collection ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
                <label class="text-[10px] font-bold text-indigo-400 uppercase">Value Key</label>
                <input value="${field.relation?.key || '_id'}" oninput="window.updateDeepField(${idx}, 'relation.key', this.value)" class="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs bg-white" placeholder="_id">
            </div>
            <div class="space-y-1">
                <label class="text-[10px] font-bold text-indigo-400 uppercase">Label Display</label>
                <input value="${field.relation?.display || 'name'}" oninput="window.updateDeepField(${idx}, 'relation.display', this.value)" class="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs bg-white" placeholder="nama">
            </div>
        </div>
        
        <div class="space-y-1">
            <label class="text-[10px] font-bold text-indigo-400 uppercase">Auto Populate (Isi Otomatis)</label>
            <input value="${autoPopStr}" onchange="window.updateAutoPopulate(${idx}, this.value)" class="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs font-mono bg-white" placeholder="Format: field_sini:field_sana, ...">
        </div>
    </div>`
}

function renderCalculationConfig(field, idx) {
 const calc = field.calculation || { is_enabled: false, operation: '', fields: [] }
 const isEnabled = calc.is_enabled === true
 const currentOp = calc.operation || ''

 let placeholderTxt = 'field1, field2'
 let hintTxt = 'Masukkan key field dipisah koma.'

 if (['sum', 'avg', 'min', 'max'].includes(currentOp)) {
  placeholderTxt = 'cart_items.subtotal'
  hintTxt = 'Format: <b>nama_repeater.nama_kolom</b>'
 } else if (['subtract', 'divide', 'add', 'multiply'].includes(currentOp)) {
  placeholderTxt = 'grand_total, discount'
  hintTxt = 'Urutan berpengaruh (Field1 - Field2)'
 }

 return `
    <div class="bg-green-50 p-3 rounded-lg border border-green-100 space-y-2 mt-2">
        <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer select-none text-green-700">
                <input type="checkbox" ${isEnabled ? 'checked' : ''} 
                    onchange="window.updateDeepField(${idx}, 'calculation.is_enabled', this.checked); window.refreshBuilderUI()" 
                    class="rounded text-green-600 focus:ring-green-500 w-3.5 h-3.5 border-green-300">
                <span class="text-[10px] font-bold uppercase flex items-center gap-1">
                    <i class="fas fa-calculator"></i> Auto Calc
                </span>
            </label>
        </div>

        ${
         isEnabled
          ? `
        <div class="animate-in slide-in-from-top-1 duration-200 space-y-2 pt-1">
            <div class="flex flex-col gap-2">
                <select onchange="window.updateDeepField(${idx}, 'calculation.operation', this.value); window.refreshBuilderUI()" 
                    class="w-full text-[10px] border border-green-200 rounded px-2 py-1.5 bg-white focus:border-green-500 outline-none font-bold text-gray-700">
                    <option value="">-- Pilih Operasi --</option>
                    
                    <optgroup label="Matematika (Field Utama)">
                        <option value="subtract" ${currentOp === 'subtract' ? 'selected' : ''}>Pengurangan ( - )</option>
                        <option value="add" ${currentOp === 'add' ? 'selected' : ''}>Penjumlahan ( + )</option>
                        <option value="multiply" ${currentOp === 'multiply' ? 'selected' : ''}>Perkalian ( x )</option>
                        <option value="divide" ${currentOp === 'divide' ? 'selected' : ''}>Pembagian ( / )</option>
                    </optgroup>

                    <optgroup label="Aggregasi (Ambil dari Repeater)">
                        <option value="sum" ${currentOp === 'sum' ? 'selected' : ''}>SUM (Total)</option>
                        <option value="avg" ${currentOp === 'avg' ? 'selected' : ''}>AVG (Rata-rata)</option>
                        <option value="count" ${currentOp === 'count' ? 'selected' : ''}>COUNT (Jumlah Data)</option>
                        <option value="max" ${currentOp === 'max' ? 'selected' : ''}>MAX (Nilai Tertinggi)</option>
                        <option value="min" ${currentOp === 'min' ? 'selected' : ''}>MIN (Nilai Terendah)</option>
                    </optgroup>
                </select>
                
                <input value="${(calc.fields || []).join(', ')}" 
                    onchange="window.updateCalculationFields(${idx}, this.value)" 
                    class="w-full text-[10px] border border-green-200 rounded px-2 py-1.5 font-mono bg-white focus:border-green-500 outline-none" 
                    placeholder="${placeholderTxt}">
            </div>
            
            <p class="text-[9px] text-green-600 italic leading-tight opacity-80">${hintTxt}</p>
        </div>`
          : ''
        }
    </div>`
}

function renderRepeaterConfig(field, idx) {
 return `
    <div class="bg-white border-2 border-dashed border-purple-200 rounded-xl overflow-hidden">
        <div class="flex justify-between items-center p-3 bg-purple-50 border-b border-purple-100">
            <div class="flex items-center gap-2 text-purple-700">
                <i class="fas fa-table"></i>
                <span class="text-xs font-bold uppercase">Kolom Tabel (Sub-fields)</span>
            </div>
            <button onclick="window.addSubField(${idx})" class="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg shadow-sm font-bold transition-all active:scale-95 flex items-center gap-1">
                <i class="fas fa-plus"></i> <span class="hidden sm:inline">Tambah Kolom</span>
            </button>
        </div>
        
        <div class="p-3 bg-gray-50/50 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            ${(field.sub_fields || []).map((subField, sIdx) => renderSubFieldItem(subField, idx, sIdx)).join('')}
            ${
             !field.sub_fields || field.sub_fields.length === 0
              ? `
                <div class="py-8 flex flex-col items-center justify-center text-gray-400 text-center">
                    <i class="fas fa-columns text-2xl mb-2 opacity-30"></i>
                    <p class="text-xs">Belum ada kolom.<br>Klik tombol tambah diatas.</p>
                </div>`
              : ''
            }
        </div>
    </div>`
}

function renderSubFieldItem(sf, fIdx, sIdx) {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 const totalSubs = item?.config?.fields?.[fIdx]?.sub_fields?.length || 0
 let extraConfig = ''

 if (sf.type === 'relation') {
  extraConfig = renderSubRelationConfig(sf, fIdx, sIdx)
 } else if (['number', 'currency'].includes(sf.type)) {
  extraConfig = renderSubCalculationConfig(sf, fIdx, sIdx)
 } else if (sf.type === 'select') {
  extraConfig = `
        <div class="mt-2 pt-2 border-t border-dashed border-gray-200">
            <label class="text-[9px] font-bold text-gray-400 uppercase">Opsi Pilihan (Pisahkan Koma)</label>
            <input value="${(sf.options || []).join(',')}" onchange="window.updateSubFieldOptions(${fIdx}, ${sIdx}, this.value)" class="w-full text-[10px] border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none" placeholder="Contoh: Pcs, Box, Kg">
        </div>`
 }

 return `
    <div class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm relative group hover:border-blue-400 transition-all mb-3">
        <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
                <div class="w-6 h-6 bg-gray-100 rounded text-[10px] font-bold flex items-center justify-center text-gray-500 select-none">${sIdx + 1}</div>
                
                <div class="flex-1">
                    <input value="${sf.label || ''}" oninput="window.updateSubField(${fIdx}, ${sIdx}, 'label', this.value)" 
                        class="w-full text-xs font-bold border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent placeholder-gray-300 transition-colors" 
                        placeholder="Label Kolom (Misal: Qty)">
                </div>
                
                <div class="flex items-center bg-gray-50 rounded p-0.5 border border-gray-100">
                    <button onclick="window.moveSubField(${fIdx}, ${sIdx}, -1)" ${sIdx === 0 ? 'disabled class="opacity-30"' : ''} class="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-white rounded transition-all"><i class="fas fa-chevron-up text-[9px]"></i></button>
                    <button onclick="window.moveSubField(${fIdx}, ${sIdx}, 1)" ${sIdx === totalSubs - 1 ? 'disabled class="opacity-30"' : ''} class="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-white rounded transition-all"><i class="fas fa-chevron-down text-[9px]"></i></button>
                </div>

                <button onclick="window.removeSubField(${fIdx}, ${sIdx})" class="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Hapus Kolom"><i class="fas fa-times"></i></button>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">DB Key</label>
                    <input value="${sf.name || ''}" oninput="window.updateSubField(${fIdx}, ${sIdx}, 'name', this.value)" class="w-full text-[10px] font-mono border border-gray-300 rounded px-2 py-1.5 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none" placeholder="field_name">
                </div>
                <div>
                    <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Tipe Data</label>
                    <select onchange="window.updateSubField(${fIdx}, ${sIdx}, 'type', this.value)" class="w-full text-[10px] border border-gray-300 rounded px-2 py-1.5 bg-white focus:border-blue-500 outline-none">
                        <option value="text" ${sf.type === 'text' ? 'selected' : ''}>Text</option>
                        <option value="date" ${sf.type === 'date' ? 'selected' : ''}>Datetime</option>
                        <option value="number" ${sf.type === 'number' ? 'selected' : ''}>Number</option>
                        <option value="currency" ${sf.type === 'currency' ? 'selected' : ''}>Currency</option>
                        <option value="relation" ${sf.type === 'relation' ? 'selected' : ''}>Relation</option>
                        <option value="select" ${sf.type === 'select' ? 'selected' : ''}>Select</option>
                    </select>
                </div>
            </div>
            
            <div class="flex items-center gap-3 border-t border-dashed border-gray-100 pt-2">
                 <label class="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" ${sf.ui?.readonly ? 'checked' : ''} onchange="window.updateDeepSubField(${fIdx}, ${sIdx}, 'ui.readonly', this.checked)" class="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5 border-gray-300">
                    <span class="text-[9px] font-bold text-gray-500 uppercase">ReadOnly</span>
                </label>
                <div class="ml-auto flex items-center gap-1">
                     <span class="text-[9px] font-bold text-gray-400 uppercase">Lebar:</span>
                     <select onchange="window.updateSubField(${fIdx}, ${sIdx}, 'width', this.value)" class="text-[9px] border border-gray-200 rounded px-1 py-0.5 bg-gray-50">
                        <option value="">Auto</option>
                        <option value="100px">Kecil</option>
                        <option value="200px">Sedang</option>
                        <option value="300px">Lebar</option>
                     </select>
                </div>
            </div>
        </div>
        
        ${extraConfig}
    </div>`
}

function renderSubRelationConfig(sf, fIdx, sIdx) {
 const collections = window.getAllCollections()
 const autoPopStr = Object.entries(sf.relation?.auto_populate || {})
  .map(([k, v]) => `${k}:${v}`)
  .join(', ')
 const isAutoPopEnabled = sf.relation?.enable_auto_populate === true

 return `
    <div class="mt-3 pt-3 border-t border-purple-100 bg-purple-50/40 -mx-3 px-3 pb-3 rounded-b-lg space-y-2">
        <div class="flex items-center gap-2 text-purple-700 mb-1">
            <i class="fas fa-link text-[10px]"></i> <span class="text-[9px] font-bold uppercase">Setup Relasi</span>
        </div>
        
        <select onchange="window.updateDeepSubField(${fIdx}, ${sIdx}, 'relation.collection', this.value)" class="w-full text-[10px] border border-purple-200 rounded px-2 py-1.5 bg-white focus:border-purple-500 outline-none shadow-sm">
            <option value="">-- Pilih Sumber Data (Collection) --</option>
            ${collections.map((c) => `<option value="${c.collection}" ${sf.relation?.collection === c.collection ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
        
        <div class="grid grid-cols-2 gap-2">
            <div>
                <input value="${sf.relation?.key || '_id'}" oninput="window.updateDeepSubField(${fIdx}, ${sIdx}, 'relation.key', this.value)" class="w-full text-[10px] border border-purple-200 rounded px-2 py-1.5 focus:border-purple-500 outline-none" placeholder="Key (_id)">
            </div>
            <div>
                <input value="${sf.relation?.display || 'name'}" oninput="window.updateDeepSubField(${fIdx}, ${sIdx}, 'relation.display', this.value)" class="w-full text-[10px] border border-purple-200 rounded px-2 py-1.5 focus:border-purple-500 outline-none" placeholder="Label Tampil">
            </div>
        </div>

        <div class="pt-1">
            <label class="flex items-center gap-2 cursor-pointer select-none mb-1">
                <input type="checkbox" ${isAutoPopEnabled ? 'checked' : ''} onchange="window.updateDeepSubField(${fIdx}, ${sIdx}, 'relation.enable_auto_populate', this.checked); window.refreshBuilderUI()" class="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5 border-purple-300">
                <span class="text-[9px] font-bold text-purple-600 uppercase">Aktifkan Auto Fill</span>
            </label>
            
            ${
             isAutoPopEnabled
              ? `
            <div class="animate-in slide-in-from-top-1 duration-200">
                <input value="${autoPopStr}" onchange="window.updateSubAutoPopulate(${fIdx}, ${sIdx}, this.value)" 
                    class="w-full text-[10px] border border-purple-300 bg-purple-50 rounded px-2 py-1.5 font-mono text-purple-800 placeholder-purple-300 focus:bg-white focus:border-purple-500 outline-none" 
                    placeholder="Format: field_sumber:field_target, ...">
                <p class="text-[8px] text-purple-400 mt-0.5">Contoh: <code>price:unit_price, code:item_code</code></p>
            </div>`
              : ''
            }
        </div>
    </div>`
}

function renderSubCalculationConfig(sf, fIdx, sIdx) {
 const isCalcEnabled = sf.calculation?.is_enabled === true

 return `
    <div class="mt-3 pt-3 border-t border-green-100 bg-green-50/40 -mx-3 px-3 pb-3 rounded-b-lg space-y-2">
        <label class="flex items-center gap-2 cursor-pointer select-none text-green-700">
            <input type="checkbox" ${isCalcEnabled ? 'checked' : ''} onchange="window.updateDeepSubField(${fIdx}, ${sIdx}, 'calculation.is_enabled', this.checked); window.refreshBuilderUI()" class="rounded text-green-600 focus:ring-green-500 w-3.5 h-3.5 border-green-300">
            <span class="text-[9px] font-bold uppercase flex items-center gap-1"><i class="fas fa-calculator"></i> Kalkulasi Baris</span>
        </label>

        ${
         isCalcEnabled
          ? `
        <div class="animate-in slide-in-from-top-1 duration-200 space-y-2">
            <div class="flex gap-2">
                <select onchange="window.updateDeepSubField(${fIdx}, ${sIdx}, 'calculation.operation', this.value)" class="w-1/3 text-[10px] border border-green-200 rounded px-2 py-1.5 bg-white focus:border-green-500 outline-none font-bold text-gray-600">
                    <option value="">- Operasi -</option>
                    <option value="multiply" ${sf.calculation?.operation === 'multiply' ? 'selected' : ''}>Perkalian ( x )</option>
                    <option value="add" ${sf.calculation?.operation === 'add' ? 'selected' : ''}>Penjumlahan ( + )</option>
                    <option value="subtract" ${sf.calculation?.operation === 'subtract' ? 'selected' : ''}>Pengurangan ( - )</option>
                    <option value="divide" ${sf.calculation?.operation === 'divide' ? 'selected' : ''}>Pembagian ( / )</option>
                </select>
                
                <input value="${(sf.calculation?.fields || []).join(',')}" onchange="window.updateSubCalculation(${fIdx}, ${sIdx}, this.value)" 
                    class="w-2/3 text-[10px] border border-green-200 rounded px-2 py-1.5 font-mono bg-white focus:border-green-500 outline-none" 
                    placeholder="qty, price">
            </div>
            
            <p class="text-[8px] text-green-500 italic">
                Hanya berlaku untuk field dalam satu baris ini.
            </p>
        </div>`
          : ''
        }
    </div>`
}

function renderFixedItem(item) {
 return `
        <div class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 opacity-70 select-none cursor-not-allowed grayscale">
            <div class="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                <i class="${item.icon}"></i>
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-xs font-bold text-gray-600 uppercase tracking-wide">${item.name}</div>
                <div class="text-[9px] text-gray-400">System Locked</div>
            </div>
            <i class="fas fa-lock text-gray-300 text-xs"></i>
        </div>
    `
}

function renderTree(items, level = 0, parentId = null) {
 if (!items || items.length === 0) {
  if (level === 0)
   return `<div class="flex flex-col items-center justify-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <i class="fas fa-layer-group text-2xl mb-2 opacity-30"></i>
                    <span class="text-xs font-medium italic">Custom Area Empty</span>
                    <span class="text-[10px]">Add items from Library</span>
                   </div>`
  return ''
 }

 return `
        <ul class="space-y-2 ${level > 0 ? 'ml-4 pl-3 border-l-2 border-gray-100' : ''}">
            ${items
             .map((item) => {
              const isSelected = window.menuBuilderState.selectedId === item.id
              const hasChildren = item.sub_sidemenu && item.sub_sidemenu.length > 0

              return `
                <li class="relative">
                    <div class="flex items-center gap-2 p-2.5 rounded-lg border transition-all cursor-pointer group touch-manipulation
                        ${isSelected ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm z-10' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}"
                        onclick="window.selectMenuItem('${item.id}')"
                    >
                        <div class="text-gray-300 cursor-move hover:text-gray-500 px-1"><i class="fas fa-grip-vertical text-xs"></i></div>
                        
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400 group-hover:text-blue-500'}">
                            <i class="${item.icon || 'fas fa-circle'} text-xs"></i>
                        </div>
                        
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium text-gray-800 truncate">${item.name || 'Untitled'}</div>
                            ${item.type ? `<div class="text-[9px] font-mono text-gray-400 uppercase tracking-wide">${item.type === 'group' ? 'Folder' : 'Module'}</div>` : ''}
                        </div>

                        <div class="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg px-1 shadow-sm absolute right-2 border border-gray-100 lg:border-none">
                             
                             <button onclick="event.stopPropagation(); window.moveItemUp('${item.id}')" 
                                     class="p-2 lg:p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-blue-600 transition-colors">
                                <i class="fas fa-arrow-up text-[10px]"></i>
                             </button>
                             
                             <button onclick="event.stopPropagation(); window.moveItemDown('${item.id}')" 
                                     class="p-2 lg:p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-blue-600 transition-colors">
                                <i class="fas fa-arrow-down text-[10px]"></i>
                             </button>
                             
                             <button onclick="event.stopPropagation(); window.deleteMenuItem('${item.id}')" 
                                     class="p-2 lg:p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500 transition-colors">
                                <i class="fas fa-trash-alt text-[10px]"></i>
                             </button>
                        </div>
                    </div>
                    ${hasChildren ? renderTree(item.sub_sidemenu, level + 1, item.id) : ''}
                </li>
                `
             })
             .join('')}
        </ul>
    `
}

window.refreshBuilderUI = function () {
 const listEl = document.getElementById('user-menu-list')
 if (listEl) listEl.innerHTML = renderTree(window.menuBuilderState.data)

 const propsEl = document.getElementById('menu-properties-panel')
 if (propsEl) propsEl.innerHTML = renderPropertiesPanel()

 if (window.menuBuilderState.isConfigModalOpen) {
  const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
  if (item && item.type === 'tableview') {
   document.getElementById('table-config-body').innerHTML = renderTableConfigOverlay(item)
  }
 }
}

window.openTableConfig = function () {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (!item) return

 const overlay = document.getElementById('table-config-overlay')
 const body = document.getElementById('table-config-body')
 const subtitle = document.getElementById('overlay-subtitle')

 subtitle.innerText = `Editing: ${item.name}`
 body.innerHTML = renderTableConfigOverlay(item)

 overlay.classList.remove('hidden')
 setTimeout(() => overlay.classList.remove('translate-y-full'), 10)
 window.menuBuilderState.isConfigModalOpen = true
}

window.closeTableConfig = function () {
 const overlay = document.getElementById('table-config-overlay')
 overlay.classList.add('translate-y-full')
 setTimeout(() => {
  overlay.classList.add('hidden')
  window.menuBuilderState.isConfigModalOpen = false
 }, 300)
}

window.selectMenuItem = function (id) {
 window.menuBuilderState.selectedId = id
 window.refreshBuilderUI()

 if (window.innerWidth < 1024) {
  window.openPropertiesDrawer()
 }
}

window.addTemplateItem = function (type, label, icon) {
 const newId = Date.now().toString()
 const newItem = { id: newId, name: label, icon: icon, type: type, sub_sidemenu: [] }
 if (type === 'tableview') {
  newItem.config = {
   endpoint: '/api/resource',
   collectionName: 'resource',
   fields: [{ name: 'name', label: 'Name', type: 'text', required: true }],
  }
 }

 if (window.menuBuilderState.selectedId) {
  const parent = window.findItemById(
   window.menuBuilderState.data,
   window.menuBuilderState.selectedId
  )
  if (parent && (parent.type === 'group' || !parent.type)) {
   if (!parent.sub_sidemenu) parent.sub_sidemenu = []
   parent.sub_sidemenu.push(newItem)
  } else {
   window.menuBuilderState.data.push(newItem)
  }
 } else {
  window.menuBuilderState.data.push(newItem)
 }

 window.menuBuilderState.selectedId = newId
 window.refreshBuilderUI()

 if (window.innerWidth < 1024) {
  window.openPropertiesDrawer()
 }
}

window.addRootItem = function () {
 window.menuBuilderState.selectedId = null
 window.addTemplateItem('group', 'New Folder', 'fas fa-folder')
}

window.deleteMenuItem = async function (id) {
 const isConfirmed = await showConfirmDialog({
  title: 'Remove Component?',
  text: `Delete permanent ${id}`,
  icon: 'warning',
  confirmText: 'Yes',
  cancelText: 'No',
  dangerMode: true,
 })
 if (!isConfirmed) return
 function removeFromList(items, idToRemove) {
  const idx = items.findIndex((i) => i.id === idToRemove)
  if (idx > -1) {
   items.splice(idx, 1)
   return true
  }
  for (let item of items) {
   if (item.sub_sidemenu) {
    if (removeFromList(item.sub_sidemenu, idToRemove)) return true
   }
  }
  return false
 }
 removeFromList(window.menuBuilderState.data, id)
 if (window.menuBuilderState.selectedId === id) window.menuBuilderState.selectedId = null
 window.refreshBuilderUI()
}

window.updateProperty = function (key, value) {
 if (!window.menuBuilderState.selectedId) return
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item) {
  if (key === 'permissions')
   item[key] = value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s)
  else item[key] = value

  if (key === 'name' || key === 'icon') {
   const listEl = document.getElementById('user-menu-list')
   if (listEl) listEl.innerHTML = renderTree(window.menuBuilderState.data)
  }
 }
}

window.updateTableConfig = function (key, value) {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item && item.config) item.config[key] = value
}

window.addNewField = function () {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item && item.config) {
  if (!item.config.fields) item.config.fields = []
  item.config.fields.push({
   name: 'new_field',
   label: 'New Field',
   type: 'text',
   required: false,
   _isOpen: true,
  })
  window.refreshBuilderUI()
 }
}

window.removeField = async function (index) {
 const isConfirmed = await showConfirmDialog({
  title: 'Remove field?',
  text: `Delete permanent field`,
  icon: 'warning',
  confirmText: 'Yes',
  cancelText: 'No',
  dangerMode: true,
 })
 if (!isConfirmed) return
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item && item.config && item.config.fields) {
  item.config.fields.splice(index, 1)
  window.refreshBuilderUI()
 }
}

window.updateField = function (index, key, value) {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)

 if (item && item.config && item.config.fields[index]) {
  item.config.fields[index][key] = value

  const structuralKeys = ['type', 'dataSource', 'required', 'unique', 'width']

  const isStructuralChange = structuralKeys.includes(key) || key.includes('relation.')

  if (isStructuralChange) {
   window.refreshBuilderUI()
  } else {
   if (key === 'label' || key === 'name') {
    const listEl = document.getElementById('user-menu-list')
    if (listEl) listEl.innerHTML = renderTree(window.menuBuilderState.data)
   }
  }
 }
}

window.updateDeepField = function (fieldIndex, path, value) {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (!item || !item.config || !item.config.fields[fieldIndex]) return
 const field = item.config.fields[fieldIndex]
 const parts = path.split('.')
 let current = field
 for (let i = 0; i < parts.length - 1; i++) {
  if (!current[parts[i]]) current[parts[i]] = {}
  current = current[parts[i]]
 }
 if (parts[parts.length - 1] === 'min' || parts[parts.length - 1] === 'max') value = Number(value)
 current[parts[parts.length - 1]] = value
}

window.switchTab = function (btn, tabId) {
 const container = document.getElementById(tabId).parentElement
 const contents = container.querySelectorAll('.field-tab-content')
 contents.forEach((c) => c.classList.add('hidden'))
 document.getElementById(tabId).classList.remove('hidden')

 const buttons = btn.parentElement.querySelectorAll('button')
 buttons.forEach((b) => {
  b.classList.remove('border-blue-600', 'text-blue-600')
  b.classList.add('border-transparent')
 })
 btn.classList.remove('border-transparent')
 btn.classList.add('border-blue-600', 'text-blue-600')

 const parts = tabId.split('-')
 const tabName = parts[0]
 const idx = parts[1]

 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item && item.config && item.config.fields[idx]) {
  item.config.fields[idx]._activeTab = tabName
 }
}

window.toggleFieldDetails = function (index) {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item && item.config && item.config.fields[index]) {
  item.config.fields[index]._isOpen = !item.config.fields[index]._isOpen
  setTimeout(() => window.refreshBuilderUI(), 0)
 }
}

window.toggleAllFields = function (isOpen) {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item && item.config && item.config.fields) {
  item.config.fields.forEach((field) => (field._isOpen = isOpen))
  window.refreshBuilderUI()
 }
}

window.duplicateField = function (index) {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item && item.config && item.config.fields) {
  const copy = JSON.parse(JSON.stringify(item.config.fields[index]))
  copy.name += '_copy'
  copy.label += ' (Copy)'
  copy._isOpen = true
  item.config.fields.splice(index + 1, 0, copy)
  window.refreshBuilderUI()
 }
}

window.moveItemUp = function (id) {
 const list = window.findParentArray(window.menuBuilderState.data, id)

 if (!list) return

 const index = list.findIndex((i) => i.id === id)

 if (index > 0) {
  ;[list[index - 1], list[index]] = [list[index], list[index - 1]]

  window.refreshBuilderUI()
 }
}

window.moveItemDown = function (id) {
 const list = window.findParentArray(window.menuBuilderState.data, id)

 if (!list) return

 const index = list.findIndex((i) => i.id === id)

 if (index < list.length - 1) {
  ;[list[index + 1], list[index]] = [list[index], list[index + 1]]

  window.refreshBuilderUI()
 }
}

window.resetMenuBuilder = async function () {
 const isConfirmed = await showConfirmDialog({
  title: 'Reset All Changes?',
  text: `Reset all menu configuration`,
  icon: 'warning',
  confirmText: 'Yes',
  cancelText: 'No',
  dangerMode: true,
 })
 if (isConfirmed) {
  window.menuBuilderState.data = []
  window.menuBuilderState.selectedId = null
  window.refreshBuilderUI()
 }
}

window.exportMenuJSON = function () {
 const final = {
  name: 'menu',
  sidemenu: [FIXED_DASHBOARD, ...window.menuBuilderState.data, FIXED_SETTINGS],
 }
 document.getElementById('json-output-textarea').value = JSON.stringify(final, null, 2)
 document.getElementById('json-output-modal').classList.remove('hidden')
}

window.copyJSON = function () {
 document.getElementById('json-output-textarea').select()
 document.execCommand('copy')
 showToast('Copied!')
}

window.updateFieldOptions = (idx, strValue) => {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (!item?.config?.fields?.[idx]) return

 const optionsArray = strValue
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s !== '')

 item.config.fields[idx].options = optionsArray
}

function cleanMenuData(items) {
 return items
  .filter((item) => !['fixed_dashboard', 'fixed_settings'].includes(item.id))
  .map((item) => {
   const cleanItem = { ...item }

   cleanItem.path = item.path || ''
   cleanItem.icon = item.icon || ''
   cleanItem.permissions = item.permissions || []

   delete cleanItem._isCollapsed

   if (cleanItem.type === 'group') {
    delete cleanItem.config
   }

   if (cleanItem.sub_sidemenu && cleanItem.sub_sidemenu.length > 0) {
    cleanItem.sub_sidemenu = cleanMenuData(cleanItem.sub_sidemenu)
   } else {
    delete cleanItem.sub_sidemenu
   }

   return cleanItem
  })
}

window.saveMenuSettings = async () => {
 const isConfirmed = await showConfirmDialog({
  title: 'Simpan Perubahan?',
  text: 'Struktur menu akan diperbarui untuk seluruh user.',
  icon: 'warning',
  confirmText: 'Ya, Simpan',
  cancelText: 'Batal',
 })

 if (!isConfirmed) return

 const btn = document.querySelector('button[onclick="window.saveMenuSettings()"]')
 const originalContent = btn ? btn.innerHTML : 'Save'

 if (btn) {
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Saving...'
 }

 try {
  const dirtyData = window.menuBuilderState.data || []
  const cleanData = cleanMenuData(dirtyData)

  const payload = {
   id: 'fixed_menu',
   sidemenu: cleanData,
  }

  const response = await apiFetch(API_CONFIG.URL_SAVE, {
   method: 'PATCH',
   headers: API_CONFIG.headers,
   body: JSON.stringify(payload),
  })

  if (!response.ok) {
   const errJson = await response.json().catch(() => ({}))
   throw new Error(errJson.message || 'Gagal menyimpan konfigurasi.')
  }

  showToast('Menu berhasil disimpan!', 'success')
 } catch (error) {
  console.error('Save Error:', error)
  showToast(error.message, 'error')
 } finally {
  if (btn) {
   btn.disabled = false
   btn.innerHTML = originalContent
  }
 }
}

window.addSubField = (fIdx) => {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item?.config?.fields?.[fIdx]) {
  if (!item.config.fields[fIdx].sub_fields) item.config.fields[fIdx].sub_fields = []

  item.config.fields[fIdx].sub_fields.push({
   name: 'col_' + Date.now(),
   label: 'New Column',
   type: 'text',
   width: 'auto',
  })
  window.refreshBuilderUI()
 }
}

window.removeSubField = function (fieldIndex, subIndex) {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item && item.config && item.config.fields[fieldIndex]) {
  item.config.fields[fieldIndex].sub_fields.splice(subIndex, 1)

  const overlayBody = document.getElementById('table-config-body')
  if (overlayBody) overlayBody.innerHTML = renderTableConfigOverlay(item)
 }
}

window.updateSubField = (fIdx, sIdx, k, v) => {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item?.config?.fields?.[fIdx]?.sub_fields?.[sIdx]) {
  item.config.fields[fIdx].sub_fields[sIdx][k] = v

  if (k === 'type') window.refreshBuilderUI()
 }
}

window.updateDeepSubField = (fIdx, sIdx, path, v) => {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (!item?.config?.fields?.[fIdx]?.sub_fields?.[sIdx]) return

 const parts = path.split('.')
 let obj = item.config.fields[fIdx].sub_fields[sIdx]

 for (let i = 0; i < parts.length - 1; i++) {
  if (!obj[parts[i]]) obj[parts[i]] = {}
  obj = obj[parts[i]]
 }
 obj[parts[parts.length - 1]] = v
}

window.updateSubFieldOptions = (fIdx, sIdx, str) => {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item?.config?.fields?.[fIdx]?.sub_fields?.[sIdx]) {
  item.config.fields[fIdx].sub_fields[sIdx].options = str
   .split(',')
   .map((s) => s.trim())
   .filter((s) => s)
 }
}

window.updateSubAutoPopulate = (fIdx, sIdx, str) => {
 try {
  const map = {}
  str.split(',').forEach((s) => {
   const parts = s.split(':')
   if (parts.length === 2) {
    const k = parts[0].trim()
    const v = parts[1].trim()
    if (k && v) map[k] = v
   }
  })
  window.updateDeepSubField(fIdx, sIdx, 'relation.auto_populate', map)
 } catch (e) {
  console.error('Auto Populate Parse Error', e)
 }
}

window.updateSubCalculation = (fIdx, sIdx, str) => {
 const arr = str
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s)
 window.updateDeepSubField(fIdx, sIdx, 'calculation.fields', arr)
}

window.openPropertiesDrawer = function () {
 const drawer = document.getElementById('properties-drawer')
 const backdrop = document.getElementById('properties-backdrop')
 if (drawer && backdrop) {
  drawer.classList.remove('translate-x-full')
  backdrop.classList.remove('hidden')
  setTimeout(() => backdrop.classList.remove('opacity-0'), 10)
 }
}

window.closePropertiesDrawer = function () {
 const drawer = document.getElementById('properties-drawer')
 const backdrop = document.getElementById('properties-backdrop')
 if (drawer && backdrop) {
  drawer.classList.add('translate-x-full')
  backdrop.classList.add('opacity-0')
  setTimeout(() => backdrop.classList.add('hidden'), 300)
 }
}

window.initMenuBuilder = async function () {
 const treeContainer = document.getElementById('user-menu-list')

 if (treeContainer) {
  treeContainer.innerHTML = `
    <div class="animate-pulse space-y-3 p-4">
        <div class="h-10 bg-gray-100 rounded-lg"></div>
        <div class="h-10 bg-gray-100 rounded-lg"></div>
        <div class="h-10 bg-gray-100 rounded-lg"></div>
    </div>`
 }

 try {
  const response = await apiFetch(API_CONFIG.URL_LOAD, {
   method: 'GET',
   headers: API_CONFIG.headers,
  })
  if (!response.ok) throw new Error('Failed to load menu data')
  let result = await response.text()
  result = await decryptDataRandom(result, AppState.app_key)
  result = JSON.parse(result)

  const serverData = result.sidemenu || result.menu_structure || []
  window.menuBuilderState.data = serverData.filter(
   (item) => item.id !== 'fixed_dashboard' && item.id !== 'fixed_settings'
  )

  window.refreshBuilderUI()
 } catch (error) {
  console.error('Load Error:', error)
  if (treeContainer) {
   treeContainer.innerHTML = `
    <div class="p-4 text-center text-red-500 text-xs">
        <p class="font-bold">Gagal memuat data</p>
        <button onclick="window.initMenuBuilder()" class="mt-2 text-blue-600 underline">Coba Lagi</button>
    </div>`
  }
 }
}

window.updateCalculation = function (index, key, value) {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item && item.config && item.config.fields[index]) {
  if (!item.config.fields[index].calculation) {
   item.config.fields[index].calculation = { operation: '', fields: [] }
  }

  if (key === 'fields') {
   item.config.fields[index].calculation.fields = value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s)
  } else {
   item.config.fields[index].calculation[key] = value
  }
 }
}

window.updateAutoPopulate = function (index, value) {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item && item.config && item.config.fields[index]) {
  const map = {}
  value.split(',').forEach((pair) => {
   const [source, target] = pair.split(':')
   if (source && target) {
    map[source.trim()] = target.trim()
   }
  })

  if (!item.config.fields[index].relation) item.config.fields[index].relation = {}
  item.config.fields[index].relation.auto_populate = map
 }
}

window.moveField = (idx, direction) => {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (!item?.config?.fields) return

 const fields = item.config.fields
 const newIdx = idx + direction

 if (newIdx < 0 || newIdx >= fields.length) return
 ;[fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]]

 window.refreshBuilderUI()
}

window.moveSubField = (fIdx, sIdx, direction) => {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (!item?.config?.fields?.[fIdx]?.sub_fields) return

 const subFields = item.config.fields[fIdx].sub_fields
 const newSubIdx = sIdx + direction

 if (newSubIdx < 0 || newSubIdx >= subFields.length) return
 ;[subFields[sIdx], subFields[newSubIdx]] = [subFields[newSubIdx], subFields[sIdx]]
 window.refreshBuilderUI()
}

window.toggleFieldCollapse = (idx) => {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item?.config?.fields?.[idx]) {
  item.config.fields[idx]._isCollapsed = !item.config.fields[idx]._isCollapsed
  window.refreshBuilderUI()
 }
}

window.updateCalculationFields = (idx, strValue) => {
 const fieldsArray = strValue
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s !== '')

 window.updateDeepField(idx, 'calculation.fields', fieldsArray)
}

window.updateDeepField = (idx, path, value) => {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (!item?.config?.fields?.[idx]) return

 const parts = path.split('.')
 let obj = item.config.fields[idx]

 for (let i = 0; i < parts.length - 1; i++) {
  const key = parts[i]

  if (!obj[key]) {
   obj[key] = {}
  }
  obj = obj[key]
 }

 obj[parts[parts.length - 1]] = value

 if (path.includes('operation')) {
  window.refreshBuilderUI(true)
 }
}

window.updateSubCalculation = (fIdx, sIdx, strValue) => {
 const arr = strValue
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s)
 window.updateDeepSubField(fIdx, sIdx, 'calculation.fields', arr)
}
