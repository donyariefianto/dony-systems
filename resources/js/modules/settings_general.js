// src/views/settings/settings_general.js
import { apiFetch } from '../core/api.js'

export function renderGeneralTab(settings) {
 return `
        <div class="max-w-6xl mx-auto">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-6 border-b border-gray-100">
                    <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <i class="fas fa-sliders-h text-blue-500"></i>
                        General Settings
                    </h2>
                    <p class="text-sm text-gray-500 mt-1">Configure your system's general preferences</p>
                </div>
                
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${renderSettingCard('Application Name', 'fas fa-tag', 'text', 'app_name', settings.app_name || 'My Application')}
                        ${renderSettingCard('Theme', 'fas fa-palette', 'select', 'theme', settings.theme || 'light', ['light', 'dark', 'auto'])}
                        ${renderSettingCard('Language', 'fas fa-language', 'select', 'language', settings.language || 'en', ['en', 'id', 'es'])}
                        ${renderSettingCard('Timezone', 'fas fa-globe', 'select', 'timezone', settings.timezone || 'UTC', ['UTC', 'Asia/Jakarta', 'America/New_York'])}
                    </div>
                    
                    <div class="mt-8 pt-6 border-t border-gray-100">
                        <h3 class="text-md font-bold text-gray-700 mb-4">Advanced Settings</h3>
                        ${renderAdvancedSettings(settings)}
                    </div>
                </div>
                
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button onclick="saveGeneralSettings()" class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    `
}

export function renderSideMenuTab(settings) {
 return `
        <div class="max-w-6xl mx-auto">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-6 border-b border-gray-100">
                    <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <i class="fas fa-bars text-blue-500"></i>
                        Side Menu Configuration
                    </h2>
                    <p class="text-sm text-gray-500 mt-1">Customize your application's side navigation menu</p>
                </div>
                
                <div class="p-6">
                    <div class="space-y-6">
                        ${renderMenuSetting('Menu Position', 'fas fa-arrows-alt-h', 'select', 'menu_position', settings.menu_position || 'left', ['left', 'right', 'top'])}
                        ${renderMenuSetting('Menu Width', 'fas fa-arrows-alt-h', 'number', 'menu_width', settings.menu_width || '240')}
                        ${renderMenuSetting('Collapsed by Default', 'fas fa-compress-alt', 'checkbox', 'menu_collapsed', settings.menu_collapsed || false)}
                        ${renderMenuSetting('Show Icons', 'fas fa-icons', 'checkbox', 'menu_show_icons', settings.menu_show_icons || true)}
                        ${renderMenuSetting('Show Labels', 'fas fa-font', 'checkbox', 'menu_show_labels', settings.menu_show_labels || true)}
                    </div>
                    
                    <div class="mt-8">
                        <h4 class="text-md font-bold text-gray-700 mb-4">Menu Items</h4>
                        <div id="menu-items-container" class="space-y-3">
                            ${renderMenuItems(settings.menu_items || [])}
                        </div>
                        <button onclick="addMenuItem()" class="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                            <i class="fas fa-plus"></i> Add Menu Item
                        </button>
                    </div>
                </div>
                
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button onclick="resetMenuSettings()" class="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                        Reset
                    </button>
                    <button onclick="saveMenuSettings()" class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Save Menu Configuration
                    </button>
                </div>
            </div>
        </div>
    `
}

export function renderOptionsMenuTab(settings) {
 return `
        <div class="max-w-6xl mx-auto">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-6 border-b border-gray-100">
                    <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <i class="fas fa-ellipsis-v text-blue-500"></i>
                        Options Menu Configuration
                    </h2>
                    <p class="text-sm text-gray-500 mt-1">Configure user options and preferences menu</p>
                </div>
                
                <div class="p-6">
                    <div class="space-y-6">
                        ${renderOptionsSetting('Show User Profile', 'fas fa-user', 'checkbox', 'show_profile', settings.show_profile || true)}
                        ${renderOptionsSetting('Show Notifications', 'fas fa-bell', 'checkbox', 'show_notifications', settings.show_notifications || true)}
                        ${renderOptionsSetting('Show Settings', 'fas fa-cog', 'checkbox', 'show_settings', settings.show_settings || true)}
                        ${renderOptionsSetting('Show Dark Mode Toggle', 'fas fa-moon', 'checkbox', 'show_dark_mode', settings.show_dark_mode || true)}
                        ${renderOptionsSetting('Show Logout', 'fas fa-sign-out-alt', 'checkbox', 'show_logout', settings.show_logout || true)}
                    </div>
                    
                    <div class="mt-8 pt-6 border-t border-gray-100">
                        <h4 class="text-md font-bold text-gray-700 mb-4">Custom Options</h4>
                        <div id="custom-options-container" class="space-y-3">
                            ${renderCustomOptions(settings.custom_options || [])}
                        </div>
                        <button onclick="addCustomOption()" class="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                            <i class="fas fa-plus"></i> Add Custom Option
                        </button>
                    </div>
                </div>
                
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button onclick="saveOptionsSettings()" class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Save Options
                    </button>
                </div>
            </div>
        </div>
    `
}

// Helper functions
function renderSettingCard(label, icon, type, name, value, options = []) {
 let inputField = ''

 if (type === 'select') {
  inputField = `
            <select name="${name}" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                ${options.map((opt) => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt.charAt(0).toUpperCase() + opt.slice(1)}</option>`).join('')}
            </select>
        `
 } else if (type === 'checkbox') {
  inputField = `
            <input type="checkbox" name="${name}" ${value ? 'checked' : ''} 
                   class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
        `
 } else {
  inputField = `
            <input type="${type}" name="${name}" value="${value}" 
                   class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        `
 }

 return `
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div class="flex items-center gap-3 mb-2">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i class="${icon} text-blue-600"></i>
                </div>
                <label class="font-medium text-gray-700">${label}</label>
            </div>
            ${inputField}
        </div>
    `
}

function renderMenuSetting(label, icon, type, name, value, options = []) {
 return renderSettingCard(label, icon, type, name, value, options)
}

function renderOptionsSetting(label, icon, type, name, value) {
 return `
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i class="${icon} text-blue-600"></i>
                </div>
                <div>
                    <h4 class="font-medium text-gray-700">${label}</h4>
                    <p class="text-sm text-gray-500">Show/hide this option in the menu</p>
                </div>
            </div>
            <input type="checkbox" name="${name}" ${value ? 'checked' : ''} 
                   class="w-6 h-6 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
        </div>
    `
}

function renderMenuItems(items) {
 if (items.length === 0) {
  return '<p class="text-gray-500 text-center py-4">No menu items configured</p>'
 }

 return items
  .map(
   (item, index) => `
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex items-center gap-3 flex-1">
                <i class="fas fa-grip-vertical text-gray-400 cursor-move"></i>
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i class="${item.icon || 'fas fa-link'} text-blue-600"></i>
                </div>
                <div class="flex-1">
                    <input type="text" value="${item.label || ''}" placeholder="Label" 
                           class="w-full px-3 py-1 bg-white border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div class="flex-1">
                    <input type="text" value="${item.url || ''}" placeholder="URL" 
                           class="w-full px-3 py-1 bg-white border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500">
                </div>
            </div>
            <button onclick="removeMenuItem(${index})" class="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `
  )
  .join('')
}

function renderCustomOptions(items) {
 if (items.length === 0) {
  return '<p class="text-gray-500 text-center py-4">No custom options configured</p>'
 }

 return items
  .map(
   (item, index) => `
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex items-center gap-3 flex-1">
                <i class="fas fa-grip-vertical text-gray-400 cursor-move"></i>
                <div class="flex-1">
                    <input type="text" value="${item.label || ''}" placeholder="Option Label" 
                           class="w-full px-3 py-1 bg-white border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div class="flex-1">
                    <input type="text" value="${item.action || ''}" placeholder="Action/URL" 
                           class="w-full px-3 py-1 bg-white border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div class="w-32">
                    <select class="w-full px-3 py-1 bg-white border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500">
                        <option value="link" ${item.type === 'link' ? 'selected' : ''}>Link</option>
                        <option value="modal" ${item.type === 'modal' ? 'selected' : ''}>Modal</option>
                        <option value="function" ${item.type === 'function' ? 'selected' : ''}>Function</option>
                    </select>
                </div>
            </div>
            <button onclick="removeCustomOption(${index})" class="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `
  )
  .join('')
}

function renderAdvancedSettings(settings) {
 return `
        <div class="space-y-4">
            ${renderAdvancedSetting('Enable Analytics', 'checkbox', 'enable_analytics', settings.enable_analytics || false)}
            ${renderAdvancedSetting('Enable Error Tracking', 'checkbox', 'enable_error_tracking', settings.enable_error_tracking || false)}
            ${renderAdvancedSetting('Auto Save Interval (seconds)', 'number', 'auto_save_interval', settings.auto_save_interval || 60)}
            ${renderAdvancedSetting('Max Upload Size (MB)', 'number', 'max_upload_size', settings.max_upload_size || 10)}
            ${renderAdvancedSetting('Session Timeout (minutes)', 'number', 'session_timeout', settings.session_timeout || 30)}
        </div>
    `
}

function renderAdvancedSetting(label, type, name, value) {
 return `
        <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">${label}</label>
            ${
             type === 'checkbox'
              ? `<input type="checkbox" name="${name}" ${value ? 'checked' : ''} class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500">`
              : `<input type="${type}" name="${name}" value="${value}" class="w-32 px-3 py-1 bg-white border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500">`
            }
        </div>
    `
}

// Window functions for inline event handlers
window.saveGeneralSettings = async function () {
 // Implementation untuk menyimpan settings
 console.log('Saving general settings...')
}

window.saveMenuSettings = async function () {
 // Implementation untuk menyimpan menu settings
 console.log('Saving menu settings...')
}

window.saveOptionsSettings = async function () {
 // Implementation untuk menyimpan options settings
 console.log('Saving options settings...')
}

window.addMenuItem = function () {
 // Implementation untuk menambah menu item
 console.log('Adding menu item...')
}

window.removeMenuItem = function (index) {
 // Implementation untuk menghapus menu item
 console.log('Removing menu item at index:', index)
}

window.addCustomOption = function () {
 // Implementation untuk menambah custom option
 console.log('Adding custom option...')
}

window.removeCustomOption = function (index) {
 // Implementation untuk menghapus custom option
 console.log('Removing custom option at index:', index)
}

window.resetMenuSettings = function () {
 // Implementation untuk reset menu settings
 console.log('Resetting menu settings...')
}
