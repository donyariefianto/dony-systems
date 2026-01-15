const API_CONFIG = {
 URL_LOAD: '/api/menu',
 URL_SAVE: '/api/settings/menu/update',
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
 daftar_sub_sidemenu: [
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
 daftar_sub_sidemenu: [
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
  if (item.daftar_sub_sidemenu) {
   const found = window.findItemById(item.daftar_sub_sidemenu, id)
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
  if (item.daftar_sub_sidemenu && item.daftar_sub_sidemenu.length > 0) {
   const found = window.findParentArray(item.daftar_sub_sidemenu, id)
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
   if (item.daftar_sub_sidemenu && item.daftar_sub_sidemenu.length > 0) {
    traverse(item.daftar_sub_sidemenu)
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
                <div class="flex gap-2">
                    <button onclick="window.resetMenuBuilder()" class="w-9 h-9 lg:w-auto lg:px-3 lg:h-auto flex items-center justify-center text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                        <i class="fas fa-undo lg:mr-1"></i> <span class="hidden lg:inline">Reset</span>
                    </button>
                    <button onclick="window.exportMenuJSON()" class="w-9 h-9 lg:w-auto lg:px-3 lg:h-auto flex items-center justify-center text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-colors">
                        <i class="fas fa-code lg:mr-1"></i> <span class="hidden lg:inline">JSON</span>
                    </button>
                    <button onclick="saveMenuSettings()" class="w-9 h-9 lg:w-auto lg:px-3 lg:h-auto flex items-center justify-center text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors">
                        <i class="fas fa-save lg:mr-1"></i> <span class="hidden lg:inline">Save</span>
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

 const chevronRotation = isCollapsed ? '-rotate-90' : 'rotate-0'

 return `
    <div class="bg-white border ${cardBorderColor} rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col group relative overflow-hidden mb-3 focus-within:ring-4 ${activeRing}">
        
        <div class="flex items-center gap-2 p-2 bg-gray-50/80 border-b ${cardBorderColor} select-none">
            
            <button onclick="window.toggleFieldCollapse(${idx})" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-400 hover:text-blue-600 transition-all active:scale-90">
                <i class="fas fa-chevron-down transition-transform duration-300 ${chevronRotation}"></i>
            </button>

            <div class="w-6 h-6 bg-gray-200 rounded text-[10px] font-bold flex items-center justify-center text-gray-600 shrink-0">
                ${idx + 1}
            </div>

            <div class="flex-1 min-w-0">
                <input type="text" value="${field.label || ''}" 
                    oninput="window.updateField(${idx}, 'label', this.value)" 
                    class="bg-transparent font-bold text-xs md:text-sm text-gray-800 w-full outline-none focus:text-blue-600 placeholder-gray-400 truncate" 
                    placeholder="Label Field">
            </div>

            <div class="flex items-center gap-1">
                <button onclick="window.moveField(${idx}, -1)" ${idx === 0 ? 'disabled class="opacity-30 cursor-not-allowed w-7 h-7 flex items-center justify-center text-gray-400"' : 'class="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-gray-500 hover:text-blue-600 transition-all active:scale-90"'} title="Geser Naik">
                    <i class="fas fa-arrow-up text-[10px]"></i>
                </button>
                
                <button onclick="window.moveField(${idx}, 1)" ${idx === totalFields - 1 ? 'disabled class="opacity-30 cursor-not-allowed w-7 h-7 flex items-center justify-center text-gray-400"' : 'class="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-gray-500 hover:text-blue-600 transition-all active:scale-90"'} title="Geser Turun">
                    <i class="fas fa-arrow-down text-[10px]"></i>
                </button>

                <div class="w-px h-4 bg-gray-300 mx-1"></div>

                <button onclick="window.duplicateField(${idx})" class="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-all" title="Duplicate">
                    <i class="fas fa-copy text-[10px]"></i>
                </button>

                <button onclick="window.removeField(${idx})" class="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 hover:text-red-600 text-gray-400 transition-all" title="Hapus">
                    <i class="fas fa-trash text-[10px]"></i>
                </button>
            </div>
        </div>

        <div class="${isCollapsed ? 'hidden' : 'block'} p-4 bg-white animate-in slide-in-from-top-2 duration-200">
            
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
                <div class="md:col-span-7">
                    <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Tipe Data</label>
                    <div class="relative">
                        <select onchange="window.updateField(${idx}, 'type', this.value)" class="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:border-blue-500 outline-none appearance-none transition-colors">
                            <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                            <option value="number" ${field.type === 'number' ? 'selected' : ''}>Number</option>
                            <option value="currency" ${field.type === 'currency' ? 'selected' : ''}>Currency (Rp)</option>
                            <option value="date" ${field.type === 'date' ? 'selected' : ''}>Date</option>
                            <option value="select" ${field.type === 'select' ? 'selected' : ''}>Select (Dropdown)</option>
                            <option value="relation" ${field.type === 'relation' ? 'selected' : ''}>Relation (Lookup)</option>
                            <option value="repeater" ${field.type === 'repeater' ? 'selected' : ''}>Repeater (Tabel)</option>
                            <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Textarea</option>
                            <option value="image" ${field.type === 'image' ? 'selected' : ''}>Image</option>
                        </select>
                        <div class="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400"><i class="fas fa-chevron-down text-[10px]"></i></div>
                    </div>
                </div>
                <div class="md:col-span-5">
                    <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Database Key</label>
                    <input type="text" value="${field.name || ''}" oninput="window.updateField(${idx}, 'name', this.value)" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono bg-yellow-50 focus:bg-white focus:border-yellow-400 outline-none" placeholder="field_name">
                </div>
            </div>

            ${isSelect ? renderSelectConfig(field, idx) : ''}
            ${isRelation ? renderRelationConfig(field, idx) : ''}
            ${isNumeric ? renderCalculationConfig(field, idx) : ''}
            ${isRepeater ? renderRepeaterConfig(field, idx) : ''}

            <div class="flex flex-wrap items-center gap-4 pt-4 mt-2 border-t border-gray-100">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" ${field.required ? 'checked' : ''} onchange="window.updateField(${idx}, 'required', this.checked)" class="rounded text-blue-600 focus:ring-blue-500">
                    <span class="text-[10px] font-bold text-gray-500 uppercase">Wajib</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" ${field.ui?.readonly ? 'checked' : ''} onchange="window.updateDeepField(${idx}, 'ui.readonly', this.checked)" class="rounded text-blue-600 focus:ring-blue-500">
                    <span class="text-[10px] font-bold text-gray-500 uppercase">ReadOnly</span>
                </label>
                <div class="ml-auto flex items-center gap-2">
                    <span class="text-[10px] font-bold text-gray-400 uppercase">Width:</span>
                    <select onchange="window.updateField(${idx}, 'width', this.value)" class="text-[10px] font-bold border border-gray-200 rounded px-2 py-1 bg-white">
                        <option value="50">50%</option>
                        <option value="100" ${field.width === '100' ? 'selected' : ''}>100%</option>
                        <option value="33" ${field.width === '33' ? 'selected' : ''}>33%</option>
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
 return `
    <div class="bg-green-50 p-2 rounded border border-green-100 space-y-2">
        <label class="text-[9px] font-bold text-green-700 uppercase flex items-center gap-1"><i class="fas fa-calculator"></i> Auto Calc</label>
        <div class="flex gap-2">
            <select onchange="window.updateDeepField(${idx}, 'calculation.operation', this.value)" class="w-1/3 px-2 py-1 border border-green-200 rounded text-[10px] bg-white">
                <option value="">None</option>
                <option value="multiply">(*)</option>
                <option value="add">(+)</option>
            </select>
            <input value="${(field.calculation?.fields || []).join(',')}" onchange="window.updateCalculationFields(${idx}, this.value)" class="w-2/3 px-2 py-1 border border-green-200 rounded text-[10px] font-mono" placeholder="field1, field2">
        </div>
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
 const collections = window.getAllCollections()

 if (sf.type === 'relation') {
  const autoPopStr = Object.entries(sf.relation?.auto_populate || {})
   .map(([k, v]) => `${k}:${v}`)
   .join(', ')
  extraConfig = `
        <div class="mt-2 pt-2 border-t border-dashed border-purple-200 grid grid-cols-1 gap-2 bg-purple-50/50 p-2 rounded">
             <select onchange="window.updateDeepSubField(${fIdx}, ${sIdx}, 'relation.collection', this.value)" class="w-full text-[10px] border border-purple-200 rounded px-2 py-1 bg-white"><option value="">- Collection -</option>${collections.map((c) => `<option value="${c.collection}" ${sf.relation?.collection === c.collection ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
             <div class="flex gap-2"><input value="${sf.relation?.key || '_id'}" oninput="window.updateDeepSubField(${fIdx}, ${sIdx}, 'relation.key', this.value)" class="w-1/2 text-[10px] border rounded px-2 py-1" placeholder="Key"><input value="${sf.relation?.display || 'name'}" oninput="window.updateDeepSubField(${fIdx}, ${sIdx}, 'relation.display', this.value)" class="w-1/2 text-[10px] border rounded px-2 py-1" placeholder="Display"></div>
             <input value="${autoPopStr}" onchange="window.updateSubAutoPopulate(${fIdx}, ${sIdx}, this.value)" class="w-full text-[10px] border rounded px-2 py-1 font-mono" placeholder="AutoPop: price:unit_price">
        </div>`
 } else if (sf.type === 'select') {
  extraConfig = `<div class="mt-2"><input value="${(sf.options || []).join(',')}" onchange="window.updateSubFieldOptions(${fIdx}, ${sIdx}, this.value)" class="w-full text-[10px] border rounded px-2 py-1" placeholder="Options: A, B, C"></div>`
 }

 return `
    <div class="bg-white border border-gray-200 rounded-lg p-2 shadow-sm relative group hover:border-purple-300 transition-colors mb-2">
        <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
                <div class="w-5 h-5 bg-gray-100 rounded text-[9px] font-bold flex items-center justify-center text-gray-500">${sIdx + 1}</div>
                
                <input value="${sf.label || ''}" oninput="window.updateSubField(${fIdx}, ${sIdx}, 'label', this.value)" class="flex-1 text-xs font-bold border-b border-transparent hover:border-gray-300 focus:border-purple-500 outline-none bg-transparent placeholder-gray-300" placeholder="Label Kolom">
                
                <div class="flex items-center bg-gray-50 rounded p-0.5">
                    <button onclick="window.moveSubField(${fIdx}, ${sIdx}, -1)" ${sIdx === 0 ? 'disabled class="opacity-30"' : ''} class="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-purple-600 hover:bg-white rounded"><i class="fas fa-chevron-up text-[8px]"></i></button>
                    <button onclick="window.moveSubField(${fIdx}, ${sIdx}, 1)" ${sIdx === totalSubs - 1 ? 'disabled class="opacity-30"' : ''} class="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-purple-600 hover:bg-white rounded"><i class="fas fa-chevron-down text-[8px]"></i></button>
                </div>

                <button onclick="window.removeSubField(${fIdx}, ${sIdx})" class="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><i class="fas fa-times"></i></button>
            </div>

            <div class="grid grid-cols-2 gap-2">
                <input value="${sf.name || ''}" oninput="window.updateSubField(${fIdx}, ${sIdx}, 'name', this.value)" class="w-full text-[10px] font-mono border border-gray-200 rounded px-2 py-1 bg-gray-50 focus:bg-white" placeholder="db_key">
                <select onchange="window.updateSubField(${fIdx}, ${sIdx}, 'type', this.value)" class="w-full text-[10px] border border-gray-200 rounded px-1 py-1 bg-white focus:border-purple-500">
                    <option value="text" ${sf.type === 'text' ? 'selected' : ''}>Text</option>
                    <option value="number" ${sf.type === 'number' ? 'selected' : ''}>Number</option>
                    <option value="currency" ${sf.type === 'currency' ? 'selected' : ''}>Currency</option>
                    <option value="relation" ${sf.type === 'relation' ? 'selected' : ''}>Relation</option>
                    <option value="select" ${sf.type === 'select' ? 'selected' : ''}>Select</option>
                </select>
            </div>
        </div>
        ${extraConfig}
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
              const hasChildren = item.daftar_sub_sidemenu && item.daftar_sub_sidemenu.length > 0

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
                    ${hasChildren ? renderTree(item.daftar_sub_sidemenu, level + 1, item.id) : ''}
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
 const newItem = { id: newId, name: label, icon: icon, type: type, daftar_sub_sidemenu: [] }
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
   if (!parent.daftar_sub_sidemenu) parent.daftar_sub_sidemenu = []
   parent.daftar_sub_sidemenu.push(newItem)
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

window.deleteMenuItem = function (id) {
 if (!confirm('Delete this item?')) return
 function removeFromList(items, idToRemove) {
  const idx = items.findIndex((i) => i.id === idToRemove)
  if (idx > -1) {
   items.splice(idx, 1)
   return true
  }
  for (let item of items) {
   if (item.daftar_sub_sidemenu) {
    if (removeFromList(item.daftar_sub_sidemenu, idToRemove)) return true
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

window.removeField = function (index) {
 if (!confirm('Remove field?')) return
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

window.resetMenuBuilder = function () {
 if (confirm('Reset all changes?')) {
  window.menuBuilderState.data = []
  window.menuBuilderState.selectedId = null
  window.refreshBuilderUI()
 }
}

window.exportMenuJSON = function () {
 const final = {
  name: 'menu',
  daftar_sidemenu: [FIXED_DASHBOARD, ...window.menuBuilderState.data, FIXED_SETTINGS],
 }
 document.getElementById('json-output-textarea').value = JSON.stringify(final, null, 2)
 document.getElementById('json-output-modal').classList.remove('hidden')
}

window.copyJSON = function () {
 document.getElementById('json-output-textarea').select()
 document.execCommand('copy')
 alert('Copied!')
}

window.saveMenuSettings = async function () {
 const btn = document.getElementById('btn-save-menu')
 const originalText = btn.innerHTML

 btn.disabled = true
 btn.innerHTML = `<i class="fas fa-circle-notch fa-spin mr-1"></i> Saving...`

 try {
  const payload = {
   menu_structure: [FIXED_DASHBOARD, ...window.menuBuilderState.data, FIXED_SETTINGS],
  }

  const response = await fetch(API_CONFIG.URL_SAVE, {
   method: 'POST',
   headers: API_CONFIG.headers,
   body: JSON.stringify(payload),
  })

  const result = await response.json()

  if (!response.ok) throw new Error(result.message || 'Failed to save menu')

  alert('Menu successfully saved!')
  console.log('Server Response:', result)
 } catch (error) {
  console.error('Save Error:', error)
  alert('Error saving menu: ' + error.message)
 } finally {
  btn.disabled = false
  btn.innerHTML = originalText
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
   const [k, v] = s.split(':')
   if (k && v) map[k.trim()] = v.trim()
  })
  window.updateDeepSubField(fIdx, sIdx, 'relation.auto_populate', map)
 } catch (e) {
  console.error(e)
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
  const response = await fetch(API_CONFIG.URL_LOAD, {
   method: 'GET',
   headers: API_CONFIG.headers,
  })

  if (!response.ok) throw new Error('Failed to load menu data')

  const result = await response.json()

  const serverData = result.daftar_sidemenu || result.menu_structure || []

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
