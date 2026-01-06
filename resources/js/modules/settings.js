import { apiFetch } from '../core/api.js';
import { AppState } from '../core/state.js';
import { showToast } from '../utils/helpers.js';

// --- RENDERER UTAMA ---
export async function renderSettingsView(config, container) {
    container.innerHTML = `<div class="p-20 text-center text-gray-400 italic text-xs uppercase animate-pulse">Memuat Konfigurasi...</div>`;
    
    try {
        const response = await apiFetch('api/settings');
        if (!response) return;

        const settings = await response.json();
        container.innerHTML = `
            <div class="space-y-8 pb-10 px-4 md:px-8">
                <h1 class="text-3xl font-black text-gray-900 border-b border-gray-100 pb-6">Pengaturan</h1>
                
                <div class="flex gap-2 bg-gray-100 w-fit p-1 rounded-xl">
                    <button onclick="switchSettingsTab('general')" id="tab-btn-general" class="px-6 py-2 rounded-lg text-xs font-black uppercase bg-white shadow-sm text-blue-600">General</button>
                    <button onclick="switchSettingsTab('generator')" id="tab-btn-generator" class="px-6 py-2 rounded-lg text-xs font-black uppercase text-gray-400">Generator</button>
                </div>

                <div id="tab-content-general">${renderGeneralForm(settings)}</div>
                <div id="tab-content-generator" class="hidden">${renderGeneratorLayout()}</div>
            </div>`;
            
        await fetchDashboardsFromDB();
    } catch (err) {
        container.innerHTML = `<div class="text-red-500 text-center">Error loading settings</div>`;
    }
}

function renderGeneralForm(settings) {
    // HTML form settings sederhana
    return `<div class="bg-white p-8 rounded-[2rem] border border-gray-100">Form Settings Toko... <button onclick="saveSettings()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase mt-4">Simpan</button></div>`;
}

function renderGeneratorLayout() {
    return `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px]">
            <div class="lg:col-span-3 bg-white rounded-3xl border border-gray-100 p-4 flex flex-col">
                 <input type="text" placeholder="CARI..." oninput="doGenSearch(this.value)" class="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-3 mb-4">
                 <div id="generator-dashboard-list" class="flex-1 overflow-y-auto space-y-2"></div>
                 <button onclick="openAddDashboardModal()" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-xs uppercase mt-2">Buat Baru</button>
            </div>
            <div class="lg:col-span-9 bg-white rounded-3xl border border-gray-100 p-6 overflow-hidden flex flex-col">
                <div id="generator-empty-state" class="flex-1 flex items-center justify-center text-gray-400 font-bold uppercase text-xs">Pilih Dashboard untuk Edit</div>
                <div id="generator-editor-panel" class="hidden flex-col h-full">
                    <div class="flex justify-between items-center mb-4 border-b pb-4">
                        <span id="editing-dashboard-name" class="font-black text-blue-600 uppercase"></span>
                        <div class="flex gap-2">
                             <button onclick="addWidgetToBuilder()" class="bg-gray-100 px-4 py-2 rounded-lg text-xs font-bold">Tambah Widget</button>
                             <button onclick="saveDashboardBuilder()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Simpan</button>
                        </div>
                    </div>
                    <div id="builder-widgets-container" class="flex-1 overflow-y-auto space-y-4 pr-2"></div>
                </div>
            </div>
        </div>`;
}

// --- LOGIC GENERATOR ---
export async function fetchDashboardsFromDB() {
    try {
        const response = await apiFetch('api/collections/dashboard_settings');
        if (response) {
            AppState.dbDashboards = await response.json();
            loadGeneratorList();
        }
    } catch (e) { console.error(e); }
}

export function loadGeneratorList() {
    const container = document.getElementById('generator-dashboard-list');
    if (!container) return;
    
    const filtered = AppState.dbDashboards.data.filter(d => d.name.toLowerCase().includes(AppState.genSearchQuery));
    
    container.innerHTML = filtered.map(d => `
        <div onclick="openWidgetEditor('${d._id}', '${d.name}')" class="p-3 rounded-xl border border-gray-100 hover:bg-blue-50 cursor-pointer flex justify-between items-center group">
            <span class="text-[10px] font-black uppercase text-gray-600 group-hover:text-blue-600">${d.name}</span>
            <i class="fas fa-chevron-right text-[8px] text-gray-300"></i>
        </div>
    `).join('');
}

export async function openWidgetEditor(id, name) {
    try {
        const response = await apiFetch(`api/collections/dashboard_settings/${id}`);
        if (!response) return;

        const data = await response.json();
        AppState.currentEditingDashboardId = id;
        AppState.tempBuilderWidgets = data.config?.widgets || [];

        document.getElementById('generator-empty-state').classList.add('hidden');
        document.getElementById('generator-editor-panel').classList.remove('hidden');
        document.getElementById('generator-editor-panel').style.display = 'flex'; // Fix hidden override
        document.getElementById('editing-dashboard-name').innerText = `Editing: ${name}`;

        renderBuilderWidgets();
    } catch (e) { showToast('Gagal memuat dashboard', 'error'); }
}

export function renderBuilderWidgets() {
    const container = document.getElementById('builder-widgets-container');
    container.innerHTML = AppState.tempBuilderWidgets.map((w, idx) => `
        <div class="p-4 rounded-2xl border border-gray-200 bg-gray-50 relative group">
            <button onclick="removeBuilderWidget(${idx})" class="absolute top-2 right-2 text-gray-300 hover:text-red-500"><i class="fas fa-trash"></i></button>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-[9px] font-bold text-gray-400 uppercase">Label</label>
                    <input type="text" value="${w.label || ''}" oninput="updateWidgetData(${idx}, 'label', this.value)" class="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold">
                </div>
                <div>
                    <label class="text-[9px] font-bold text-gray-400 uppercase">Endpoint API</label>
                    <input type="text" value="${w.data_source?.endpoint || ''}" oninput="updateWidgetData(${idx}, 'data_source.endpoint', this.value)" class="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-mono">
                </div>
            </div>
        </div>
    `).join('');
}

export function addWidgetToBuilder() {
    AppState.tempBuilderWidgets.push({ id: Date.now(), label: 'Widget Baru', type: 'stat', width: 'half', data_source: { endpoint: '' }});
    renderBuilderWidgets();
}

export function updateWidgetData(index, field, value) {
    let obj = AppState.tempBuilderWidgets[index];
    if (field.includes('.')) {
        const [p1, p2] = field.split('.');
        if(!obj[p1]) obj[p1] = {};
        obj[p1][p2] = value;
    } else {
        obj[field] = value;
    }
}

export function removeBuilderWidget(index) {
    AppState.tempBuilderWidgets.splice(index, 1);
    renderBuilderWidgets();
}

export async function saveDashboardBuilder() {
    const id = AppState.currentEditingDashboardId;
    const name = document.getElementById('editing-dashboard-name').innerText.replace('Editing: ', '');
    const path = name.toLowerCase().replace(/\s+/g, '-');
    
    const payload = {
        name, path, type: 'dashboard',
        config: { dashboard_id: path.toUpperCase().replace(/-/g, '_'), widgets: AppState.tempBuilderWidgets }
    };

    try {
        const response = await apiFetch(`api/collections/dashboard_settings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        if (response && response.ok) showToast('Dashboard tersimpan!');
    } catch(e) { showToast('Gagal menyimpan', 'error'); }
}

export function switchSettingsTab(tab) {
    document.getElementById('tab-content-general').classList.add('hidden');
    document.getElementById('tab-content-generator').classList.add('hidden');
    document.getElementById('tab-btn-general').classList.replace('text-blue-600', 'text-gray-400');
    document.getElementById('tab-btn-general').classList.remove('bg-white', 'shadow-sm');
    document.getElementById('tab-btn-generator').classList.replace('text-blue-600', 'text-gray-400');
    document.getElementById('tab-btn-generator').classList.remove('bg-white', 'shadow-sm');

    document.getElementById(`tab-content-${tab}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`tab-btn-${tab}`);
    activeBtn.classList.replace('text-gray-400', 'text-blue-600');
    activeBtn.classList.add('bg-white', 'shadow-sm');
}

let genSearchTimer;
export function doGenSearch(val) {
    clearTimeout(genSearchTimer);
    genSearchTimer = setTimeout(() => {
        AppState.genSearchQuery = val.toLowerCase();
        loadGeneratorList();
    }, 300);
}