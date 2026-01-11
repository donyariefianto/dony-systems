import { apiFetch } from '../core/api.js'
import { showToast } from '../utils/helpers.js'
import { renderDashboardGenerator, initDashboardGenerator } from './settings_dashboard.js'
import { renderGeneralTab, renderSideMenuTab, renderOptionsMenuTab } from './settings_general.js'

let currentActiveTab = 'generator'

export async function renderSettingsView(config, container) {
 container.className =
  'w-full h-[calc(100vh-64px)] bg-gray-50 flex flex-col overflow-hidden relative'
 container.innerHTML = `<div class="p-20 text-center text-gray-400 italic text-xs uppercase animate-pulse">Loading Workspace...</div>`

 try {
  const response = await apiFetch('api/settings')
  const settings = response ? await response.json() : {}

  container.innerHTML = `
            <div id="settings-header" class="shrink-0 bg-white border-b border-gray-200 z-30 h-14 flex items-center justify-between px-4 lg:px-6 shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white shadow-md">
                        <i class="fas fa-cogs"></i>
                    </div>
                    <h1 class="text-sm lg:text-base font-black text-gray-800 tracking-tight uppercase">System Config</h1>
                </div>
                
                <!-- Desktop Tab Buttons -->
                <div class="hidden lg:flex p-1 bg-gray-100 rounded-lg border border-gray-200">
                    <button onclick="window.switchSettingsTab('general')" id="tab-btn-general" 
                            class="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all rounded-md ${currentActiveTab === 'general' ? 'bg-white shadow-sm text-blue-600 border border-gray-200' : 'text-gray-500 hover:text-gray-800'}">
                        General
                    </button>
                    <button onclick="window.switchSettingsTab('generator')" id="tab-btn-generator" 
                            class="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all rounded-md ${currentActiveTab === 'generator' ? 'bg-white shadow-sm text-blue-600 border border-gray-200' : 'text-gray-500 hover:text-gray-800'}">
                        Dashboard
                    </button>
                    <button onclick="window.switchSettingsTab('sidemenu')" id="tab-btn-sidemenu" 
                            class="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all rounded-md ${currentActiveTab === 'sidemenu' ? 'bg-white shadow-sm text-blue-600 border border-gray-200' : 'text-gray-500 hover:text-gray-800'}">
                        Side Menu
                    </button>
                    <button onclick="window.switchSettingsTab('options_sidemenu')" id="tab-btn-options_sidemenu" 
                            class="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all rounded-md ${currentActiveTab === 'options_sidemenu' ? 'bg-white shadow-sm text-blue-600 border border-gray-200' : 'text-gray-500 hover:text-gray-800'}">
                        Options Menu
                    </button>
                </div>
            </div>

            <div class="flex-1 min-h-0 relative w-full bg-gray-50/50">
                <div id="tab-content-sidemenu" class="hidden h-full w-full overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32">
                    ${renderSideMenuTab(settings)}
                </div>

                <div id="tab-content-options_sidemenu" class="hidden h-full w-full overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32">
                    ${renderOptionsMenuTab(settings)}
                </div>
                
                <div id="tab-content-general" class="hidden h-full w-full overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32">
                    ${renderGeneralTab(settings)}
                </div>

                <div id="tab-content-generator" class="h-full w-full flex flex-col">
                    ${renderDashboardGenerator()}
                </div>
            </div>

            <!-- Mobile Navigation for Settings Tabs - SELALU TAMPIL -->
            <div id="settings-mobile-nav" class="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-lg" style="padding-bottom: env(safe-area-inset-bottom);">
                <div class="flex items-center justify-around p-1.5">
                    <button onclick="window.switchSettingsTab('general')" id="mobile-btn-general"
                            class="flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${currentActiveTab === 'general' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}">
                        <i class="fas fa-sliders-h text-sm mb-1"></i>
                        <span class="text-[9px] font-bold uppercase tracking-wide mt-0.5">General</span>
                    </button>
                    
                    <button onclick="window.switchSettingsTab('generator')" id="mobile-btn-generator"
                            class="flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${currentActiveTab === 'generator' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}">
                        <i class="fas fa-chart-pie text-sm mb-1"></i>
                        <span class="text-[9px] font-bold uppercase tracking-wide mt-0.5">Dashboard</span>
                    </button>
                    
                    <button onclick="window.switchSettingsTab('sidemenu')" id="mobile-btn-sidemenu"
                            class="flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${currentActiveTab === 'sidemenu' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}">
                        <i class="fas fa-bars text-sm mb-1"></i>
                        <span class="text-[9px] font-bold uppercase tracking-wide mt-0.5">Side Menu</span>
                    </button>
                    
                    <button onclick="window.switchSettingsTab('options_sidemenu')" id="mobile-btn-options"
                            class="flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${currentActiveTab === 'options_sidemenu' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}">
                        <i class="fas fa-ellipsis-v text-sm mb-1"></i>
                        <span class="text-[9px] font-bold uppercase tracking-wide mt-0.5">Options</span>
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
    console.error('Failed to initialize dashboard generator:', error)
    showToast('Failed to load dashboard generator', 'error')
   }
  }, 100)
 } catch (err) {
  console.error(err)
  container.innerHTML = `<div class="flex items-center justify-center h-full text-red-500 font-bold text-sm">Gagal memuat modul.</div>`
 }
}

export function switchSettingsTab(tab, initialLoad = false) {
 currentActiveTab = tab

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

 const desktopTabButtons = [
  { id: 'tab-btn-general', tab: 'general' },
  { id: 'tab-btn-generator', tab: 'generator' },
  { id: 'tab-btn-sidemenu', tab: 'sidemenu' },
  { id: 'tab-btn-options_sidemenu', tab: 'options_sidemenu' },
 ]

 desktopTabButtons.forEach(({ id, tab: buttonTab }) => {
  const btn = document.getElementById(id)
  if (btn) {
   if (currentActiveTab === buttonTab) {
    btn.className =
     'px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all rounded-md bg-white shadow-sm text-blue-600 border border-gray-200'
   } else {
    btn.className =
     'px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all rounded-md text-gray-500 hover:text-gray-800'
   }
  }
 })

 const mobileTabButtons = [
  { id: 'mobile-btn-general', tab: 'general' },
  { id: 'mobile-btn-generator', tab: 'generator' },
  { id: 'mobile-btn-sidemenu', tab: 'sidemenu' },
  { id: 'mobile-btn-options', tab: 'options_sidemenu' },
 ]

 mobileTabButtons.forEach(({ id, tab: buttonTab }) => {
  const btn = document.getElementById(id)
  if (btn) {
   if (currentActiveTab === buttonTab) {
    btn.className =
     'flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 text-blue-600 bg-blue-50'
   } else {
    btn.className =
     'flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 text-gray-500 hover:text-gray-700'
   }
  }
 })

 const selectedTab = document.getElementById(`tab-content-${tab}`)
 if (selectedTab) {
  selectedTab.classList.remove('hidden')

  selectedTab.style.opacity = '0'
  selectedTab.style.transition = 'opacity 0.3s ease-in-out'
  setTimeout(() => {
   selectedTab.style.opacity = '1'
  }, 50)

  if (!initialLoad) {
   setTimeout(() => {
    selectedTab.scrollTo({ top: 0, behavior: 'smooth' })
   }, 100)
  }
 }

 if (tab === 'generator' && !initialLoad) {
  if (typeof initDashboardGenerator === 'function') {
   setTimeout(async () => {
    try {
     await initDashboardGenerator()
    } catch (error) {
     console.error('Error initializing dashboard generator:', error)
    }
   }, 300)
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
