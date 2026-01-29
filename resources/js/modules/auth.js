import { apiFetch } from '../core/api.js'
import { AppState } from '../core/state.js'
import { navigate } from '../core/router.js'
import { logout, decryptData } from '../utils/helpers.js'
import { settingsData } from './settings_general.js'

export async function initApp() {
 const token = localStorage.getItem('auth_token')
 const isLoginPage = window.location.pathname.includes('login')
 if (!token && !isLoginPage) {
  window.location.href = '/login'
  return
 }

 if (token && isLoginPage) {
  window.location.href = '/'
  return
 }

 if (token) {
  try {
   const content = document.getElementById('splash-content')
   if (content) content.classList.remove('opacity-0', 'scale-95')
   await window.updateProgress(30)
   const response = await apiFetch('api/list-menu')
   if (!response) return
   let data = await response.json()
   data = decryptData(data.nonce, data.ciphertext)
   data = JSON.parse(data)
   AppState.menuData = data.sidemenu
   const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}')
   const nameEl = document.querySelector('.text-xs.font-bold.text-gray-800')
   if (nameEl && userInfo.name) nameEl.innerText = userInfo.name
   const splashName = document.getElementById('splash-name')
   const splashIcon = document.getElementById('splash-icon')
   await window.updateProgress(50)
   const settings_data = await settingsData()
   if (splashName) splashName.innerText = settings_data.app_name
   if (splashIcon)
    splashIcon.className = `fas ${settings_data.app_icon || 'fa-cube'} text-white text-4xl`
   await window.updateProgress(70)
   localStorage.setItem('app_name', settings_data.app_name)
   localStorage.setItem('app_icon', settings_data.app_icon || 'fa-cube')
   await window.updateProgress(100)
   renderSidebar(AppState.menuData)
   handleInitialRouting()
   hideSplashScreen()
  } catch (error) {
   await window.updateProgress(70)
   console.error('Critical Error: Gagal memuat menu.', error)
  }
 }
}

export function renderSidebar(menus) {
 const container = document.getElementById('menu-container')
 if (!container) return
 container.innerHTML = menus
  .map((menu) => {
   if (menu.sub_sidemenu) {
    return `
        <div class="mb-4">
            <p class="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">${menu.name}</p>
            <div class="space-y-1">
                ${menu.sub_sidemenu
                 .map(
                  (sub) => `
                    <button onclick="navigate('${sub.path}')" data-path="${sub.path}" 
                            class="menu-item w-full flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-800 text-left text-white">
                        <i class="${sub.icon} w-5 text-center text-xs text-gray-400"></i>
                        <span class="truncate">${sub.name}</span>
                    </button>
                `
                 )
                 .join('')}
            </div>
        </div>`
   }
   return `
            <button onclick="navigate('${menu.path}')" data-path="${menu.path}" 
                    class="menu-item w-full flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-800 mb-1 text-left text-white">
                <i class="${menu.icon} w-5 text-center text-xs text-gray-400"></i>
                <span class="truncate">${menu.name}</span>
            </button>`
  })
  .join('')
}

function handleInitialRouting() {
 const hash = window.location.hash.replace(/^#\/?/, '')
 if (hash) {
  navigate(hash)
 } else if (AppState.menuData.length > 0) {
  const first = AppState.menuData[0]
  navigate(first.sub_sidemenu ? first.sub_sidemenu[0].path : first.path)
 }
}
