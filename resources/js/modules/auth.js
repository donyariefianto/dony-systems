import { apiFetch } from '../core/api.js';
import { AppState } from '../core/state.js';
import { navigate } from '../core/router.js';
import { logout } from '../utils/helpers.js';

export async function initApp() {
    const token = localStorage.getItem('auth_token');
    const isLoginPage = window.location.pathname.includes('login');

    if (!token && !isLoginPage) {
        window.location.href = '/login';
        return;
    }

    if (token && isLoginPage) {
        window.location.href = '/';
        return;
    }

    if (token) {
        try {
            const response = await apiFetch('api/menu');
            if (!response) return; // Auth failed inside apiFetch

            const data = await response.json();
            AppState.menuData = data.daftar_sidemenu;

            // Update UI User
            const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
            const nameEl = document.querySelector('.text-xs.font-bold.text-gray-800');
            if (nameEl && userInfo.name) nameEl.innerText = userInfo.name;

            renderSidebar(AppState.menuData);
            handleInitialRouting();
        } catch (error) {
            console.error('Critical Error: Gagal memuat menu.', error);
        }
    }
}

function renderSidebar(menus) {
    const container = document.getElementById('menu-container');
    if (!container) return;

    container.innerHTML = menus.map((menu) => {
        if (menu.daftar_sub_sidemenu) {
            return `
        <div class="mb-4">
            <p class="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">${menu.name}</p>
            <div class="space-y-1">
                ${menu.daftar_sub_sidemenu.map((sub) => `
                    <button onclick="navigate('${sub.path}')" data-path="${sub.path}" 
                            class="menu-item w-full flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-800 text-left text-white">
                        <i class="${sub.icon} w-5 text-center text-xs text-gray-400"></i>
                        <span class="truncate">${sub.name}</span>
                    </button>
                `).join('')}
            </div>
        </div>`;
        }
        return `
            <button onclick="navigate('${menu.path}')" data-path="${menu.path}" 
                    class="menu-item w-full flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-800 mb-1 text-left text-white">
                <i class="${menu.icon} w-5 text-center text-xs text-gray-400"></i>
                <span class="truncate">${menu.name}</span>
            </button>`;
    }).join('');
}

function handleInitialRouting() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (hash) {
        navigate(hash);
    } else if (AppState.menuData.length > 0) {
        const first = AppState.menuData[0];
        navigate(first.daftar_sub_sidemenu ? first.daftar_sub_sidemenu[0].path : first.path);
    }
}