import { CONFIG } from '../config/constants.js';

export const AppState = {
    // Core Application
    menuData: [],
    currentModule: null,

    // Table View
    currentPage: 1,
    pageSize: CONFIG.DEFAULT_PAGE_SIZE,
    searchQuery: '',

    // Dashboard & Charts
    chartInstances: {},

    // Dashboard Generator
    tempBuilderWidgets: [],
    currentEditingDashboardId: null,
    genSearchQuery: '',
    genCurrentPage: 1,
    genPageSize: CONFIG.GEN_PAGE_SIZE,
    dbDashboards: { data: [] },

    // UI State
    isSubmitHandlerAttached: false,
};