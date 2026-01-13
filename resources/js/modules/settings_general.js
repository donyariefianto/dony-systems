// general.js
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
                        ${renderGeneralSettingCard('Application Name', 'fas fa-tag', 'text', 'app_name', settings.app_name || 'My Application')}
                        ${renderGeneralSettingCard('Theme', 'fas fa-palette', 'select', 'theme', settings.theme || 'light', ['light', 'dark', 'auto'])}
                        ${renderGeneralSettingCard('Language', 'fas fa-language', 'select', 'language', settings.language || 'en', ['en', 'id', 'es'])}
                        ${renderGeneralSettingCard('Timezone', 'fas fa-globe', 'select', 'timezone', settings.timezone || 'UTC', ['UTC', 'Asia/Jakarta', 'America/New_York'])}
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

// General-specific helper functions
function renderGeneralSettingCard(label, icon, type, name, value, options = []) {
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
