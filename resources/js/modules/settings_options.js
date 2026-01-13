// options_menu.js
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

// Options menu specific helper functions
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
