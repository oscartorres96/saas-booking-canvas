import apiClient from './axiosConfig';

export interface CustomerAsset {
    _id: string;
    businessId: string;
    clientEmail: string;
    productId: any; // Populated Product
    remainingUses?: number;
    totalUses: number;
    isUnlimited: boolean;
    timesUsed: number;
    lastUsedAt?: string;
    expiresAt?: string;
    status: 'ACTIVE' | 'EXPIRED' | 'CONSUMED';
}


export const getActiveAssets = async (params: {
    businessId: string;
    email: string;
    phone?: string;
    serviceId?: string;
}): Promise<CustomerAsset[]> => {
    const { data } = await apiClient.get<CustomerAsset[]>('/customer-assets/active', { params });
    return data;
};
export const getByBusiness = async (businessId: string): Promise<CustomerAsset[]> => {
    const { data } = await apiClient.get<CustomerAsset[]>(`/customer-assets/by-business/${businessId}`);
    return data;
};
