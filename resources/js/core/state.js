import { CONFIG } from '../config/constants.js'
const appKey = import.meta.env.VITE_APP_KEY
export const AppState = {
 app_key: appKey,
 menuData: [],
 currentModule: null,
 currentPage: 1,
 pageSize: CONFIG.DEFAULT_PAGE_SIZE,
 searchQuery: '',
 chartInstances: {},
 tempBuilderWidgets: [],
 currentEditingDashboardId: null,
 genSearchQuery: '',
 genCurrentPage: 1,
 genPageSize: CONFIG.GEN_PAGE_SIZE,
 dbDashboards: { data: [] },
 isSubmitHandlerAttached: false,

 // --- TAMBAHAN BARU UNTUK DASHBOARD ---
 dashboard: {
  activeId: '695f7561f3e95366efe10afa', // ID Dashboard yang sedang dilihat
  intervals: [], // Simpan ID timer refresh agar bisa dibersihkan
  charts: {}, // Simpan instance ECharts untuk resize/dispose
 },

 // ... state sementara builder ...
 tempBuilderWidgets: [],
 currentEditingDashboardId: null,
}
