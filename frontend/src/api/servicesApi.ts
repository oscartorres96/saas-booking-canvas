import apiClient from './axiosConfig';

export interface Service {
    _id: string;
    businessId: string;
    name: string;
    description?: string;
    durationMinutes: number;
    price: number;
    active?: boolean;
    isOnline?: boolean;
    requirePayment?: boolean;
    requireResource?: boolean;
    requireProduct?: boolean;
    createdAt?: string;
}

export const getServicesByBusiness = async (businessId: string): Promise<Service[]> => {
    const { data } = await apiClient.get<Service[]>(`/services?businessId=${businessId}`);
    return data;
};

export const getServiceById = async (serviceId: string): Promise<Service> => {
    const { data } = await apiClient.get<Service>(`/services/${serviceId}`);
    return data;
};

export const createService = async (serviceData: Partial<Service>): Promise<Service> => {
    const { data } = await apiClient.post<Service>('/services', serviceData);
    return data;
};

export const updateService = async (serviceId: string, serviceData: Partial<Service>): Promise<Service> => {
    const { data } = await apiClient.patch<Service>(`/services/${serviceId}`, serviceData);
    return data;
};

export const deleteService = async (serviceId: string): Promise<void> => {
    await apiClient.delete(`/services/${serviceId}`);
};
