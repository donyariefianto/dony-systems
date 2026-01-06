import { apiFetch } from '../core/api.js';
import { AppState } from '../core/state.js';
import { showToast, closeModal, logout } from '../utils/helpers.js';

// --- TABLE RENDERER ---
export function renderTableView(config, container) {
    container.innerHTML = `
    <div class="space-y-6 animate-in fade-in duration-500">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">${config.name}</h1>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">System / ${config.name}</p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
                <div class="relative">
                    <input type="text" placeholder="Cari..." oninput="doSearch(this.value)" 
                            class="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-xs w-full md:w-64 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all">
                </div>
                <button onclick="openCrudModal()" class="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
                    <i class="fas fa-plus mr-2"></i> Tambah Data
                </button>
            </div>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            ${config.config.fields.map(f => `<th class="p-4 text-[10px] text-gray-400 uppercase tracking-widest font-black">${f.label}</th>`).join('')}
                            <th class="p-4 text-[10px] text-gray-400 uppercase tracking-widest font-black text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="table-data-body"></tbody>
                </table>
            </div>
            <div id="pagination-container" class="p-4 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between"></div>
        </div>
    </div>`;
}

// --- DATA OPERATIONS ---
export async function fetchTableData() {
    const tbody = document.getElementById('table-data-body');
    if (!tbody || !AppState.currentModule) return;

    tbody.innerHTML = '<tr><td colspan="100%" class="p-10 text-center text-gray-400 italic text-xs uppercase tracking-widest">Memuat data...</td></tr>';

    try {
        const colName = AppState.currentModule.config.collectionName;
        const url = `api/collections/${colName}?page=${AppState.currentPage}&limit=${AppState.pageSize}&search=${AppState.searchQuery}`;
        
        const response = await apiFetch(url);
        if (!response) return;

        const result = await response.json();
        const data = result.data || [];

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%" class="p-10 text-center text-gray-400 italic text-xs uppercase">Data Kosong</td></tr>';
            renderPaginationControls(0);
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr class="hover:bg-gray-50/50 transition border-b border-gray-50">
                ${AppState.currentModule.config.fields.map(f => `<td class="p-4 text-sm text-gray-600">${item[f.name] || '-'}</td>`).join('')}
                <td class="p-4 text-right">
                    <button onclick="editData('${item._id}')" class="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteData('${item._id}')" class="text-red-400 hover:bg-red-50 p-2 rounded-lg transition ml-1"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

        renderPaginationControls(result.totalPages);
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="100%" class="p-10 text-center text-red-400 font-bold">Gagal Koneksi Database</td></tr>';
    }
}

export async function deleteData(id) {
    const result = await Swal.fire({
        title: 'HAPUS DATA?',
        text: 'Data yang dihapus tidak dapat dikembalikan!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#f3f4f6',
        confirmButtonText: 'YA, HAPUS!',
        cancelButtonText: 'BATAL'
    });

    if (result.isConfirmed) {
        try {
            const colName = AppState.currentModule.config.collectionName;
            const response = await apiFetch(`api/collections/${colName}/${id}`, { method: 'DELETE' });
            if (response && response.ok) {
                fetchTableData();
                showToast('Data berhasil dihapus');
            }
        } catch (err) {
            Swal.fire('ERROR!', 'Gagal menghubungi server.', 'error');
        }
    }
}

export async function handleFormSubmit(e) {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Memproses...`;
    }

    const id = e.target.dataset.editingId;
    const colName = AppState.currentModule.config.collectionName;
    const url = `api/collections/${colName}${id ? '/' + id : ''}`;

    try {
        const response = await apiFetch(url, {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(Object.fromEntries(new FormData(e.target).entries()))
        });

        if (response && response.ok) {
            closeModal();
            fetchTableData();
            showToast('Data berhasil disimpan');
        }
    } catch (err) {
        console.error('Submit Error:', err);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Simpan`;
        }
    }
}

// Helper: Open Modal Logic
export async function editData(id) {
    try {
        const response = await apiFetch(`api/collections/${AppState.currentModule.config.collectionName}/${id}`);
        if (response) {
            const data = await response.json();
            openCrudModal(data);
        }
    } catch (err) {
        showToast('Gagal mengambil data', 'error');
    }
}

export function openCrudModal(existingData = null) {
    const modal = document.getElementById('crud-modal');
    const container = document.getElementById('modal-container');
    const form = document.getElementById('dynamic-form');

    delete form.dataset.editingId;
    form.reset();

    if (existingData) form.dataset.editingId = existingData._id;

    const fields = AppState.currentModule.config.fields || [];
    document.getElementById('modal-title').innerText = existingData ? `Edit ${AppState.currentModule.name}` : `Tambah ${AppState.currentModule.name}`;

    form.innerHTML = fields.map(field => {
        const val = existingData ? existingData[field.name] : field.default || '';
        return `
            <div class="space-y-1.5">
                <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">${field.label}</label>
                <input type="${field.type}" name="${field.name}" value="${val}" class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none" ${field.required ? 'required' : ''}>
            </div>`;
    }).join('') + '<div class="pt-4"><button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">Simpan</button></div>';

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.replace('opacity-0', 'opacity-100');
        container.classList.replace('scale-95', 'scale-100');
    }, 10);
}

function renderPaginationControls(totalPages) {
    const container = document.getElementById('pagination-container');
    if (!container || totalPages <= 1) {
        container.innerHTML = ''; return;
    }
    container.innerHTML = `
        <div class="text-xs text-gray-500">Hal ${AppState.currentPage} / ${totalPages}</div>
        <div class="flex gap-2">
            <button onclick="changePage(${AppState.currentPage - 1})" ${AppState.currentPage === 1 ? 'disabled' : ''} class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button onclick="changePage(${AppState.currentPage + 1})" ${AppState.currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
        </div>`;
}