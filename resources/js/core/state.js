import { CONFIG } from '../config/constants.js'

export const AppState = {
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
}
