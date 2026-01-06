import { initApp } from './modules/auth.js';
import { navigate } from './core/router.js';
import { AppState } from './core/state.js';

// --- PERBAIKAN DI SINI ---
// Hapus 'closeModal' dari import crud.js
import { 
    fetchTableData, 
    deleteData, 
    handleFormSubmit, 
    editData, 
    openCrudModal 
} from './modules/crud.js';

// Tambahkan 'closeModal' ke import helpers.js
import { 
    switchSettingsTab, 
    doGenSearch, 
    openWidgetEditor, 
    addWidgetToBuilder, 
    updateWidgetData, 
    removeBuilderWidget, 
    saveDashboardBuilder, 
    fetchDashboardsFromDB 
} from './modules/settings.js';

import { 
    toggleSidebar, 
    showToast, 
    logout, 
    closeModal // <--- Pindahkan ke sini (ambil dari helpers)
} from './utils/helpers.js';

// 1. Start App
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// 2. Form Listener Global
document.addEventListener('submit', async function (e) {
    if (e.target && e.target.id === 'dynamic-form') {
        e.preventDefault();
        await handleFormSubmit(e);
    }
});

// 3. EXPOSE GLOBAL FUNCTIONS
window.navigate = navigate;
window.toggleSidebar = toggleSidebar;
window.logout = logout;
window.showToast = showToast;

// Perbaikan Expose closeModal
window.closeModal = closeModal; 

// CRUD Exports
window.fetchTableData = fetchTableData;
window.deleteData = deleteData;
window.editData = editData;
window.openCrudModal = openCrudModal;

window.changePage = (p) => { 
    AppState.currentPage = p; 
    fetchTableData(); 
};

let searchTimer;
window.doSearch = (val) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        AppState.searchQuery = val;
        AppState.currentPage = 1;
        fetchTableData();
    }, 500);
};

// Settings/Builder Exports
window.switchSettingsTab = switchSettingsTab;
window.doGenSearch = doGenSearch;
window.openWidgetEditor = openWidgetEditor;
window.addWidgetToBuilder = addWidgetToBuilder;
window.updateWidgetData = updateWidgetData;
window.removeBuilderWidget = removeBuilderWidget;
window.saveDashboardBuilder = saveDashboardBuilder;
window.saveSettings = () => showToast('Disimpan!');
window.openAddDashboardModal = () => {
    const name = prompt("Nama Dashboard Baru:");
    if(name) showToast("Silakan implementasi API Create Dashboard"); 
};

// Tambahkan fungsi fetchDashboardsFromDB ke window agar bisa dipanggil jika perlu refresh manual
window.fetchDashboardsFromDB = fetchDashboardsFromDB;
window.loadGeneratorList = () => { /* Wrapper jika perlu dipanggil dari HTML */ };