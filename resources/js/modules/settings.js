import { apiFetch } from '../core/api.js'
import { showToast } from '../utils/helpers.js'
import { renderDashboardGenerator, initDashboardGenerator } from './settings_dashboard.js'
import { renderGeneralTab, renderSideMenuTab, renderOptionsMenuTab } from './settings_general.js'

let currentActiveTab = 'general'

export async function renderSettingsView(config, container) {
 container.className =
  'w-full h-[calc(100vh-48px)] bg-gray-50 flex flex-col overflow-hidden relative'
 container.innerHTML = `<div class="p-20 text-center text-gray-400 italic text-xs uppercase animate-pulse">Loading...</div>`

 try {
  const response = await apiFetch('api/settings')
  const settings = response ? await response.json() : {}

  container.innerHTML = `
        <div id="settings-header" class="shrink-0 bg-white border-b border-gray-200 z-30 h-12 flex items-center justify-between px-4 lg:px-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] relative">
            
            <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center text-white shadow-sm">
                    <i class="fas fa-cogs text-[10px]"></i>
                </div>
                <div>
                    <h1 class="text-xs font-black text-gray-800 tracking-tight uppercase leading-none mt-0.5">Config</h1>
                </div>
            </div>
            
            <div class="hidden lg:flex relative p-0.5 bg-gray-100 rounded-lg border border-gray-200/50 w-[380px] h-8 items-center">
                
                <div id="desktop-nav-glider" class="absolute top-0.5 bottom-0.5 left-0.5 bg-white rounded-[6px] shadow-sm border border-gray-100 transition-all duration-300 ease-[cubic-bezier(0.2,1,0.4,1)]" style="width: 0; opacity: 0;"></div>

                <button onclick="window.switchSettingsTab('general')" id="tab-btn-general" 
                        class="desktop-tab-btn relative z-10 flex-1 h-full text-[10px] font-bold uppercase tracking-wide text-gray-500 transition-colors duration-200 flex items-center justify-center gap-1.5 outline-none hover:text-gray-800">
                    <i class="fas fa-sliders-h text-[9px]"></i> <span>General</span>
                </button>
                
                <button onclick="window.switchSettingsTab('generator')" id="tab-btn-generator" 
                        class="desktop-tab-btn relative z-10 flex-1 h-full text-[10px] font-bold uppercase tracking-wide text-gray-500 transition-colors duration-200 flex items-center justify-center gap-1.5 outline-none hover:text-gray-800">
                    <i class="fas fa-chart-pie text-[9px]"></i> <span>Dash</span>
                </button>
                
                <button onclick="window.switchSettingsTab('sidemenu')" id="tab-btn-sidemenu" 
                        class="desktop-tab-btn relative z-10 flex-1 h-full text-[10px] font-bold uppercase tracking-wide text-gray-500 transition-colors duration-200 flex items-center justify-center gap-1.5 outline-none hover:text-gray-800">
                    <i class="fas fa-bars text-[9px]"></i> <span>Menu</span>
                </button>
                
                <button onclick="window.switchSettingsTab('options_sidemenu')" id="tab-btn-options_sidemenu" 
                        class="desktop-tab-btn relative z-10 flex-1 h-full text-[10px] font-bold uppercase tracking-wide text-gray-500 transition-colors duration-200 flex items-center justify-center gap-1.5 outline-none hover:text-gray-800">
                    <i class="fas fa-ellipsis-v text-[9px]"></i> <span>Options</span>
                </button>
            </div>
        </div>

        <div class="flex-1 min-h-0 relative w-full bg-gray-50/50">
            <div id="tab-content-sidemenu" class="hidden h-full w-full overflow-y-auto custom-scrollbar p-4 md:p-6 pb-20">
                ${renderSideMenuTab(settings)}
            </div>

            <div id="tab-content-options_sidemenu" class="hidden h-full w-full overflow-y-auto custom-scrollbar p-4 md:p-6 pb-20">
                ${renderOptionsMenuTab(settings)}
            </div>
            
            <div id="tab-content-general" class="hidden h-full w-full overflow-y-auto custom-scrollbar p-4 md:p-6 pb-20">
                ${renderGeneralTab(settings)}
            </div>

            <div id="tab-content-generator" class="h-full w-full flex flex-col">
                ${renderDashboardGenerator()}
            </div>
        </div>

        <div id="settings-mobile-nav" class="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]" style="padding-bottom: env(safe-area-inset-bottom);">
            
            <div id="mobile-nav-glider" class="absolute top-0 left-0 h-[2px] bg-blue-600 shadow-[0_1px_6px_rgba(37,99,235,0.4)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] rounded-full"></div>

            <div class="grid grid-cols-4 h-12">
                <button onclick="window.switchSettingsTab('general')" id="mobile-btn-general"
                        class="mobile-nav-btn flex flex-col items-center justify-center gap-0.5 h-full active:bg-gray-50 transition-colors group">
                    <i class="fas fa-sliders-h text-sm text-gray-400 transition-all duration-300 group-active:scale-90"></i>
                    <span class="text-[8px] font-bold text-gray-400 uppercase tracking-wide">General</span>
                </button>
                
                <button onclick="window.switchSettingsTab('generator')" id="mobile-btn-generator"
                        class="mobile-nav-btn flex flex-col items-center justify-center gap-0.5 h-full active:bg-gray-50 transition-colors group">
                    <i class="fas fa-chart-pie text-sm text-gray-400 transition-all duration-300 group-active:scale-90"></i>
                    <span class="text-[8px] font-bold text-gray-400 uppercase tracking-wide">Dash</span>
                </button>
                
                <button onclick="window.switchSettingsTab('sidemenu')" id="mobile-btn-sidemenu"
                        class="mobile-nav-btn flex flex-col items-center justify-center gap-0.5 h-full active:bg-gray-50 transition-colors group">
                    <i class="fas fa-bars text-sm text-gray-400 transition-all duration-300 group-active:scale-90"></i>
                    <span class="text-[8px] font-bold text-gray-400 uppercase tracking-wide">Menu</span>
                </button>
                
                <button onclick="window.switchSettingsTab('options_sidemenu')" id="mobile-btn-options"
                        class="mobile-nav-btn flex flex-col items-center justify-center gap-0.5 h-full active:bg-gray-50 transition-colors group">
                    <i class="fas fa-ellipsis-v text-sm text-gray-400 transition-all duration-300 group-active:scale-90"></i>
                    <span class="text-[8px] font-bold text-gray-400 uppercase tracking-wide">Options</span>
                </button>
            </div>
        </div>
    `

  window.switchSettingsTab = switchSettingsTab

  setTimeout(async () => {
   try {
    switchSettingsTab(currentActiveTab, true)
    if (currentActiveTab === 'generator') {
     await initDashboardGenerator()
    }
   } catch (error) {
    console.error('Failed to initialize:', error)
   }
  }, 50)
 } catch (err) {
  console.error(err)
  container.innerHTML = `<div class="flex items-center justify-center h-full text-red-500 font-bold text-xs">Gagal memuat modul.</div>`
 }
}

export function switchSettingsTab(tab, initialLoad = false) {
 currentActiveTab = tab

 const desktopBtn = document.getElementById(`tab-btn-${tab}`)
 const desktopGlider = document.getElementById('desktop-nav-glider')

 if (desktopBtn && desktopGlider) {
  document.querySelectorAll('.desktop-tab-btn').forEach((btn) => {
   btn.classList.remove('text-gray-900')
   btn.classList.add('text-gray-500')
  })

  desktopBtn.classList.remove('text-gray-500')
  desktopBtn.classList.add('text-gray-900')

  desktopGlider.style.opacity = '1'
  desktopGlider.style.width = `${desktopBtn.offsetWidth}px`
  desktopGlider.style.transform = `translateX(${desktopBtn.offsetLeft}px)`
 }

 const mobileBtn = document.getElementById(
  `mobile-btn-${tab === 'options_sidemenu' ? 'options' : tab}`
 )
 const mobileGlider = document.getElementById('mobile-nav-glider')

 if (mobileBtn && mobileGlider) {
  document.querySelectorAll('.mobile-nav-btn').forEach((btn) => {
   const icon = btn.querySelector('i')
   const text = btn.querySelector('span')
   if (icon) icon.className = icon.className.replace('text-blue-600', 'text-gray-400')
   if (text) text.className = text.className.replace('text-blue-600', 'text-gray-400')
  })

  const activeIcon = mobileBtn.querySelector('i')
  const activeText = mobileBtn.querySelector('span')

  if (activeIcon)
   activeIcon.className = activeIcon.className.replace('text-gray-400', 'text-blue-600')
  if (activeText)
   activeText.className = activeText.className.replace('text-gray-400', 'text-blue-600')

  mobileGlider.style.width = `${mobileBtn.offsetWidth}px`
  mobileGlider.style.transform = `translateX(${mobileBtn.offsetLeft}px)`
 }

 const tabContents = [
  'tab-content-general',
  'tab-content-generator',
  'tab-content-sidemenu',
  'tab-content-options_sidemenu',
 ]

 tabContents.forEach((id) => {
  const element = document.getElementById(id)
  if (element) {
   element.classList.add('hidden')
   element.style.opacity = '0'
  }
 })

 const selectedTab = document.getElementById(`tab-content-${tab}`)
 if (selectedTab) {
  selectedTab.classList.remove('hidden')
  requestAnimationFrame(() => {
   selectedTab.style.transition = 'opacity 0.2s ease-out'
   selectedTab.style.opacity = '1'
  })
 }

 if (tab === 'generator' && !initialLoad) {
  if (typeof initDashboardGenerator === 'function') {
   setTimeout(async () => {
    try {
     await initDashboardGenerator()
    } catch (error) {
     console.error(error)
    }
   }, 100)
  }
 }
}

export function getCurrentActiveTab() {
 return currentActiveTab
}

export function setActiveTab(tab) {
 if (['general', 'generator', 'sidemenu', 'options_sidemenu'].includes(tab)) {
  switchSettingsTab(tab)
 }
}

if (typeof window !== 'undefined') {
 window.switchSettingsTab = switchSettingsTab
 window.setActiveTab = setActiveTab
 window.getCurrentActiveTab = getCurrentActiveTab
}
