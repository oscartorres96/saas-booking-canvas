import api from './axiosConfig';

export interface CreateLeadData {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message?: string;
    language?: string;
}

export interface Lead {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message?: string;
    type: 'demo' | 'registration';
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

export const leadsApi = {
    requestDemo: async (data: CreateLeadData) => {
        const response = await api.post('/leads/demo', data);
        return response.data;
    },

    getPendingLeads: async () => {
        const response = await api.get<Lead[]>('/leads/pending');
        return response.data;
    },

    getAllLeads: async () => {
        const response = await api.get<Lead[]>('/leads');
        return response.data;
    },

    approveLead: async (id: string, accessType: 'trial' | 'paid') => {
        const response = await api.post(`/leads/${id}/approve`, { accessType });
        return response.data;
    },

    rejectLead: async (id: string, reason: string) => {
        const response = await api.post(`/leads/${id}/reject`, { reason });
        return response.data;
    },
};
