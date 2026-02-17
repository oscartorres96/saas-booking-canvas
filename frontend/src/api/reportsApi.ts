import api from './axiosConfig';

export interface ReportFilter {
    from?: string;
    to?: string;
    branchId?: string;
    paymentMethod?: string;
    status?: string;
    businessId?: string;
}

export interface ReportData {
    kpis: Record<string, any>;
    chartData: any[];
    details: any[];
}

export const reportsApi = {
    getOverview: async (filters: ReportFilter) => {
        const response = await api.get<ReportData>('/reports/overview', { params: filters });
        return response.data;
    },
    getRevenue: async (filters: ReportFilter) => {
        const response = await api.get<ReportData>('/reports/revenue', { params: filters });
        return response.data;
    },
    getPeakHours: async (filters: ReportFilter) => {
        const response = await api.get<ReportData>('/reports/peak-hours', { params: filters });
        return response.data;
    },
    getServices: async (filters: ReportFilter) => {
        const response = await api.get<ReportData>('/reports/services', { params: filters });
        return response.data;
    },
    getCustomers: async (filters: ReportData) => {
        const response = await api.get<ReportData>('/reports/customers', { params: filters });
        return response.data;
    },
    getNoShows: async (filters: ReportFilter) => {
        const response = await api.get<ReportData>('/reports/no-shows', { params: filters });
        return response.data;
    },
};
