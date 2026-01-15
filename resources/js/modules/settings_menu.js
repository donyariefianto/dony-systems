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
 const validation = field.validation || {}
 const ui = field.ui || {}
 const relation = field.relation || { collection: '', key: '_id', display: 'name' }
 const dataSource = field.dataSource || 'manual'
 const availableCollections = window.getAllCollections()

 const isSelect = ['select', 'multiselect', 'radio'].includes(field.type)
 const isRelation = field.type === 'relation'
 const isRepeater = field.type === 'repeater'
 const isOpen = field._isOpen || false

 const activeTab = field._activeTab || 'general'

 const getTabClass = (tabName) => {
  return activeTab === tabName
   ? 'border-blue-600 text-blue-600'
   : 'border-transparent hover:text-blue-600'
 }

 const getContentClass = (tabName) => {
  return activeTab === tabName ? '' : 'hidden'
 }

 return `
    <div class="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col ${isOpen ? 'ring-2 ring-blue-500/30' : ''}">
        
        <div class="p-4 flex items-start gap-3 cursor-pointer select-none border-b border-gray-100 ${isOpen ? 'bg-blue-50/30' : ''}" 
             onclick="window.toggleFieldDetails(${idx})">
            
            <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                ${idx + 1}
            </div>
            
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start">
                    <h4 class="text-sm font-bold text-gray-800 truncate pr-2">${field.label || 'Untitled'}</h4>
                    <div class="flex gap-1">
                        <button onclick="event.stopPropagation(); window.duplicateField(${idx})" class="w-6 h-6 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><i class="fas fa-copy text-xs"></i></button>
                        <button onclick="event.stopPropagation(); window.removeField(${idx})" class="w-6 h-6 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><i class="fas fa-trash-alt text-xs"></i></button>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2 mt-1">
                    <span class="text-[10px] px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 font-mono font-bold uppercase">${field.type}</span>
                    <span class="text-[10px] px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 font-mono">${field.name}</span>
                    ${isRepeater ? '<span class="text-[10px] px-1.5 py-0.5 bg-purple-50 border border-purple-200 rounded text-purple-700 font-bold"><i class="fas fa-layer-group mr-1"></i>Repeater</span>' : ''}
                    ${isRelation ? '<span class="text-[10px] px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 font-bold"><i class="fas fa-link mr-1"></i>Relation</span>' : ''}
                </div>
            </div>
        </div>

        <div class="${isOpen ? 'block' : 'hidden'} animate-in slide-in-from-top-2 duration-200">
            
            <div class="flex border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-500">
                <button class="flex-1 py-2.5 hover:bg-white border-b-2 transition-colors ${getTabClass('general')}" onclick="window.switchTab(this, 'general-${idx}')">GENERAL</button>
                <button class="flex-1 py-2.5 hover:bg-white border-b-2 transition-colors ${getTabClass('validation')}" onclick="window.switchTab(this, 'validation-${idx}')">RULES</button>
                <button class="flex-1 py-2.5 hover:bg-white border-b-2 transition-colors ${getTabClass('ui')}" onclick="window.switchTab(this, 'ui-${idx}')">UI</button>
                ${isSelect || isRelation || isRepeater ? `<button class="flex-1 py-2.5 hover:bg-white border-b-2 transition-colors ${getTabClass('data')}" onclick="window.switchTab(this, 'data-${idx}')">DATA CONFIG</button>` : ''}
            </div>

            <div class="p-5 space-y-4">
                
                <div id="general-${idx}" class="field-tab-content space-y-3 ${getContentClass('general')}">
                     <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Display Label</label>
                        <input type="text" value="${field.label || ''}" oninput="window.updateField(${idx}, 'label', this.value)" class="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:border-blue-500">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Field Type</label>
                            <select onchange="window.updateField(${idx}, 'type', this.value)" class="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg bg-white">
                                <optgroup label="Basic">
                                    <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                                    <option value="number" ${field.type === 'number' ? 'selected' : ''}>Number</option>
                                    <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Text Area</option>
                                    <option value="boolean" ${field.type === 'boolean' ? 'selected' : ''}>Switch (Boolean)</option>
                                </optgroup>
                                <optgroup label="Advanced">
                                    <option value="currency" ${field.type === 'currency' ? 'selected' : ''}>Currency (Rp)</option>
                                    <option value="date" ${field.type === 'date' ? 'selected' : ''}>Date</option>
                                    <option value="image" ${field.type === 'image' ? 'selected' : ''}>Image Upload</option>
                                    <option value="file" ${field.type === 'file' ? 'selected' : ''}>File Upload</option>
                                </optgroup>
                                <optgroup label="Complex Data">
                                    <option value="select" ${field.type === 'select' ? 'selected' : ''}>Select Dropdown</option>
                                    <option value="relation" ${field.type === 'relation' ? 'selected' : ''}>Relation (Lookup)</option>
                                    <option value="repeater" ${field.type === 'repeater' ? 'selected' : ''}>Repeater (Nested)</option>
                                </optgroup>
                            </select>
                        </div>
                        <div>
                             <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Database Key</label>
                             <input type="text" value="${field.name || ''}" oninput="window.updateField(${idx}, 'name', this.value)" class="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono bg-yellow-50">
                        </div>
                    </div>
                </div>

                <div id="validation-${idx}" class="field-tab-content space-y-3 ${getContentClass('validation')}">
                     <div class="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <label class="flex items-center text-xs cursor-pointer text-gray-700 font-medium">
                            <input type="checkbox" ${field.required ? 'checked' : ''} onchange="window.updateField(${idx}, 'required', this.checked)" class="mr-2 rounded text-blue-600"> Required
                        </label>
                        <label class="flex items-center text-xs cursor-pointer text-gray-700 font-medium">
                            <input type="checkbox" ${field.unique ? 'checked' : ''} onchange="window.updateField(${idx}, 'unique', this.checked)" class="mr-2 rounded text-orange-600"> Unique Value
                        </label>
                    </div>
                </div>

                <div id="ui-${idx}" class="field-tab-content space-y-3 ${getContentClass('ui')}">
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 mb-1">Placeholder Text</label>
                        <input type="text" value="${field.placeholder || ''}" oninput="window.updateField(${idx}, 'placeholder', this.value)" class="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg">
                    </div>
                    
                    ${
                     field.type === 'boolean'
                      ? `
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 mb-1">Default State</label>
                        <select onchange="window.updateField(${idx}, 'defaultValue', this.value === 'true')" class="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg bg-white">
                            <option value="true" ${field.defaultValue === true ? 'selected' : ''}>ON (True)</option>
                            <option value="false" ${field.defaultValue !== true ? 'selected' : ''}>OFF (False)</option>
                        </select>
                    </div>
                    `
                      : `
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 mb-1">Grid Width</label>
                        <select onchange="window.updateField(${idx}, 'width', this.value)" class="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg bg-white">
                            <option value="100" ${field.width === '100' ? 'selected' : ''}>Full Width (100%)</option>
                            <option value="50" ${field.width === '50' || !field.width ? 'selected' : ''}>Half Width (50%)</option>
                            <option value="33" ${field.width === '33' ? 'selected' : ''}>1/3 Width</option>
                        </select>
                    </div>
                    `
                    }
                </div>

                ${
                 isSelect || isRelation || isRepeater
                  ? `
                <div id="data-${idx}" class="field-tab-content space-y-4 ${getContentClass('data')}">
                    
                    ${
                     isSelect
                      ? `
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 mb-1">Options List (Comma Separated)</label>
                            <textarea rows="3" class="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:border-blue-500" placeholder="Option A, Option B, Option C" oninput="window.updateField(${idx}, 'options', this.value.split(',').map(s=>s.trim()))">${(field.options || []).join(', ')}</textarea>
                            <p class="text-[9px] text-gray-400 mt-1">Example: Baru, Bekas, Refurbished</p>
                        </div>
                    `
                      : ''
                    }

                    ${
                     isRelation
                      ? `
                        <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
                             <div>
                                 <label class="block text-[10px] font-bold text-indigo-700 uppercase mb-1">Target Collection (Table)</label>
                                 <select onchange="window.updateDeepField(${idx}, 'relation.collection', this.value)" class="w-full px-2 py-2 text-xs border border-indigo-200 rounded-lg bg-white focus:border-indigo-500">
                                    <option value="">-- Select Source Table --</option>
                                    ${availableCollections.map((c) => `<option value="${c.collection}" ${relation.collection === c.collection ? 'selected' : ''}>${c.name} (${c.collection})</option>`).join('')}
                                 </select>
                             </div>
                             <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-[9px] font-bold text-indigo-500 mb-1">Value Field (ID)</label>
                                    <input value="${relation.key || '_id'}" oninput="window.updateDeepField(${idx}, 'relation.key', this.value)" class="w-full px-2 py-1.5 text-xs border border-indigo-200 rounded-lg" placeholder="_id">
                                </div>
                                <div>
                                    <label class="block text-[9px] font-bold text-indigo-500 mb-1">Display Field (Label)</label>
                                    <input value="${relation.display || 'name'}" oninput="window.updateDeepField(${idx}, 'relation.display', this.value)" class="w-full px-2 py-1.5 text-xs border border-indigo-200 rounded-lg" placeholder="name">
                                </div>
                             </div>
                        </div>
                    `
                      : ''
                    }

                    ${
                     isRepeater
                      ? `
                        <div class="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-3">
                            <div class="flex justify-between items-center border-b border-purple-200 pb-2">
                                <label class="text-[10px] font-bold text-purple-800 uppercase flex items-center gap-1"><i class="fas fa-columns"></i> Sub Fields Configuration</label>
                                <button onclick="window.addSubField(${idx})" class="text-[9px] bg-purple-600 text-white px-2 py-1 rounded shadow-sm hover:bg-purple-700 transition-colors"><i class="fas fa-plus mr-1"></i> Add Column</button>
                            </div>
                            
                            <div class="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                ${(field.sub_fields || [])
                                 .map(
                                  (sub, sIdx) => `
                                    <div class="flex gap-2 items-center bg-white p-2 rounded-lg border border-purple-100 shadow-sm group/sub">
                                        <div class="flex-1 space-y-1">
                                            <input type="text" value="${sub.label}" placeholder="Label Name" oninput="window.updateSubField(${idx}, ${sIdx}, 'label', this.value)" class="w-full px-2 py-1 text-xs border rounded focus:border-purple-500">
                                            <div class="flex gap-1">
                                                <input type="text" value="${sub.name}" placeholder="key_name" oninput="window.updateSubField(${idx}, ${sIdx}, 'name', this.value)" class="flex-1 px-2 py-1 text-[10px] border rounded font-mono bg-gray-50 text-gray-600">
                                                <select onchange="window.updateSubField(${idx}, ${sIdx}, 'type', this.value)" class="w-20 px-1 py-1 text-[10px] border rounded bg-gray-50">
                                                    <option value="text" ${sub.type === 'text' ? 'selected' : ''}>Text</option>
                                                    <option value="number" ${sub.type === 'number' ? 'selected' : ''}>Number</option>
                                                    <option value="currency" ${sub.type === 'currency' ? 'selected' : ''}>Currency</option>
                                                    <option value="select" ${sub.type === 'select' ? 'selected' : ''}>Select</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button onclick="window.removeSubField(${idx}, ${sIdx})" class="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><i class="fas fa-times"></i></button>
                                    </div>
                                `
                                 )
                                 .join('')}
                                ${(field.sub_fields || []).length === 0 ? '<div class="text-center py-4 text-purple-300 italic text-xs border-2 border-dashed border-purple-100 rounded-lg">No columns added yet.</div>' : ''}
                            </div>
                        </div>
                    `
                      : ''
                    }

                </div>`
                  : ''
                }
            </div>
        </div>
    </div>
    `
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

window.addSubField = function (fieldIndex) {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item && item.config && item.config.fields[fieldIndex]) {
  if (!item.config.fields[fieldIndex].sub_fields) {
   item.config.fields[fieldIndex].sub_fields = []
  }
  item.config.fields[fieldIndex].sub_fields.push({
   name: 'new_column',
   label: 'New Column',
   type: 'text',
  })

  const overlayBody = document.getElementById('table-config-body')
  if (overlayBody) overlayBody.innerHTML = renderTableConfigOverlay(item)
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

window.updateSubField = function (fieldIndex, subIndex, key, value) {
 const item = window.findItemById(window.menuBuilderState.data, window.menuBuilderState.selectedId)
 if (item && item.config && item.config.fields[fieldIndex]) {
  item.config.fields[fieldIndex].sub_fields[subIndex][key] = value
 }
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
