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

 dashboard: {
  activeId: '',
  intervals: [],
  charts: {},
 },

 tempBuilderWidgets: [],
 currentEditingDashboardId: null,
}
