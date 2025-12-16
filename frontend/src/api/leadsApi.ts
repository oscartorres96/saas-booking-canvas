import api from './axiosConfig';

export interface CreateLeadData {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message?: string;
    language?: string;
}

export const leadsApi = {
    requestDemo: async (data: CreateLeadData) => {
        const response = await api.post('/leads/demo', data);
        return response.data;
    },
};
