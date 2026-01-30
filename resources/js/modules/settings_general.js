import { showToast, decryptData } from '../utils/helpers.js'
import { apiFetch } from '../core/api.js'

function renderInputGroup({
 label,
 name,
 type = 'text',
 value,
 icon,
 placeholder = '',
 suffix = '',
}) {
 return `
        <div class="group">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">${label}</label>
            <div class="relative flex items-center">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <i class="fas ${icon} text-slate-400 group-focus-within:text-blue-500 transition-colors"></i>
                </div>
                <input 
                    type="${type}" 
                    name="${name}" 
                    value="${value}" 
                    placeholder="${placeholder}"
                    class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                >
                ${suffix ? `<div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs font-bold text-slate-400 bg-transparent">${suffix}</div>` : ''}
            </div>
        </div>
    `
}
function renderSelectGroup({ label, name, value, icon, options = [] }) {
 return `
        <div class="group">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">${label}</label>
            <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <i class="fas ${icon} text-slate-400 group-focus-within:text-blue-500 transition-colors"></i>
                </div>
                <select 
                    name="${name}" 
                    class="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                >
                    ${options.map((opt) => `<option value="${opt.val}" ${opt.val == value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    <i class="fas fa-chevron-down text-xs text-slate-400"></i>
                </div>
            </div>
        </div>
    `
}
function renderToggle({ label, desc, name, checked }) {
 return `
        <div class="flex items-start justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group" onclick="this.querySelector('input').click()">
            <div class="flex-1 pr-4">
                <h3 class="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">${label}</h3>
                <p class="text-[11px] text-slate-400 leading-tight mt-1">${desc}</p>
            </div>
            
            <div class="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input type="checkbox" name="${name}" class="sr-only peer" ${checked ? 'checked' : ''} onclick="event.stopPropagation()">
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
            </div>
        </div>
    `
}
export function renderGeneralTab(settings) {
 return `
        <div class="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                        <i class="fas fa-sliders-h"></i>
                    </div>
                    <div>
                        <h2 class="text-base font-bold text-slate-800 tracking-tight">Preferensi Umum</h2>
                        <p class="text-xs text-slate-500 font-medium">Atur identitas aplikasi dan preferensi lokal</p>
                    </div>
                </div>
                
                <div class="p-6 md:p-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        ${renderInputGroup({
                         label: 'Application Name',
                         name: 'app_name',
                         type: 'text',
                         value: settings.app_name || 'My System',
                         icon: 'fa-tag',
                         placeholder: 'e.g. ERP Dashboard',
                        })}
                        ${renderInputGroup({
                         label: 'Short Name',
                         name: 'app_short_name',
                         type: 'text',
                         value: settings.app_short_name || 'MS',
                         icon: 'fa-tag',
                         placeholder: 'e.g. ERP Dashboard',
                        })}
                        
                        ${renderInputGroup({
                         label: 'Phone Number',
                         name: 'phone_number',
                         type: 'text',
                         value: settings.phone_number || '',
                         icon: 'fa-phone',
                         placeholder: '+62 812 3456 7890',
                        })}

                        ${renderInputGroup({
                         label: 'Address',
                         name: 'address',
                         type: 'text',
                         value: settings.address || '',
                         icon: 'fa-home',
                         placeholder: 'Address',
                        })}

                        ${renderSelectGroup({
                         label: 'Theme Mode',
                         name: 'theme',
                         value: settings.theme || 'light',
                         icon: 'fa-palette',
                         options: [
                          { val: 'light', label: 'Light Mode' },
                          { val: 'dark', label: 'Dark Mode' },
                          { val: 'auto', label: 'System Default' },
                         ],
                        })}

                        ${renderSelectGroup({
                         label: 'Language',
                         name: 'language',
                         value: settings.language || 'en',
                         icon: 'fa-language',
                         options: [
                          { val: 'en', label: 'English (US)' },
                          { val: 'id', label: 'Bahasa Indonesia' },
                          { val: 'es', label: 'Español' },
                         ],
                        })}

                        ${renderSelectGroup({
                         label: 'Timezone',
                         name: 'timezone',
                         value: settings.timezone || 'Asia/Jakarta',
                         icon: 'fa-globe',
                         options: [
                          { val: 'UTC', label: 'UTC (Universal)' },
                          { val: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB)' },
                          { val: 'Asia/Makassar', label: 'Asia/Makassar (WITA)' },
                          { val: 'America/New_York', label: 'New York (EST)' },
                         ],
                        })}
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                        <i class="fas fa-microchip"></i>
                    </div>
                    <div>
                        <h2 class="text-base font-bold text-slate-800 tracking-tight">Konfigurasi Sistem</h2>
                        <p class="text-xs text-slate-500 font-medium">Pengaturan teknis dan batasan sistem</p>
                    </div>
                </div>

                <div class="p-6 md:p-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        ${renderToggle({
                         label: 'Enable Analytics',
                         desc: 'Izinkan pengumpulan data analitik anonim',
                         name: 'enable_analytics',
                         checked: settings.enable_analytics,
                        })}

                        ${renderToggle({
                         label: 'Error Tracking',
                         desc: 'Laporkan crash sistem secara otomatis',
                         name: 'enable_error_tracking',
                         checked: settings.enable_error_tracking,
                        })}
                        
                        ${renderToggle({
                         label: 'Maintenance Mode',
                         desc: 'Enable system maintenance mode',
                         name: 'maintenance_mode',
                         checked: settings.maintenance_mode,
                        })}
                    </div>

                    <div class="border-t border-slate-100 my-6"></div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        ${renderInputGroup({
                         label: 'Auto Save (Detik)',
                         name: 'auto_save_interval',
                         type: 'number',
                         value: settings.auto_save_interval || 60,
                         icon: 'fa-clock',
                         suffix: 's',
                        })}

                        ${renderInputGroup({
                         label: 'Max Upload (MB)',
                         name: 'max_upload_size',
                         type: 'number',
                         value: settings.max_upload_size || 10,
                         icon: 'fa-cloud-upload-alt',
                         suffix: 'MB',
                        })}

                        ${renderInputGroup({
                         label: 'Session Timeout (Menit)',
                         name: 'session_timeout',
                         type: 'number',
                         value: settings.session_timeout || 30,
                         icon: 'fa-hourglass-half',
                         suffix: 'm',
                        })}
                    </div>
                </div>
            </div>
            
            <div class="flex justify-end pt-4">
                 <button onclick="saveSettings(event)" class="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <i class="fas fa-save"></i>
                    <span>Save</span>
                </button>
            </div>
        </div>
    `
}
export async function settingsData() {
 const response = await apiFetch('api/settings')
 if (!response) {
  showToast('Failed to load settings', 'error')
  return
 }

 let data = await response.json()
 data = decryptData(data.nonce, data.ciphertext)
 data = JSON.parse(data)
 return data
}
export async function saveSettings(e) {
 const inputs = document.querySelectorAll('input[name], select[name]')
 const settingsData = {}

 inputs.forEach((input) => {
  if (input.type === 'checkbox') {
   settingsData[input.name] = input.checked
  } else if (input.type === 'number') {
   settingsData[input.name] = parseFloat(input.value) || 0
  } else {
   settingsData[input.name] = input.value
  }
 })

 try {
  const btn =
   e?.target?.closest('button') || document.querySelector('button[onclick*="saveSettings"]')
  const originalContent = btn.innerHTML
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'
  btn.disabled = true

  const response = await fetch('api/settings', {
   method: 'PATCH',
   headers: {
    'Content-Type': 'application/json',
   },
   body: JSON.stringify(settingsData),
  })

  if (!response.ok) throw new Error('Failed save')

  showToast('Configuration updated successfully', 'success')

  btn.innerHTML = originalContent
  btn.disabled = false
 } catch (error) {
  console.error('Save Error:', error)
  showToast(error.message, 'error')

  const btn = document.querySelector('button[onclick="saveSettings()"]')
  if (btn) btn.disabled = false
 }
}
