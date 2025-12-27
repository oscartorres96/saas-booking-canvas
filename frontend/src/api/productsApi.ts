import apiClient from './axiosConfig';

export enum ProductType {
    Single = 'SINGLE',
    Pass = 'PASS',
    Package = 'PACKAGE',
}

export interface Product {
    _id: string;
    businessId: string;
    name: string;
    description?: string;
    type: ProductType;
    price: number;
    totalUses?: number;
    isUnlimited?: boolean;
    validityDays?: number;
    allowedServiceIds: string[];
    active: boolean;
    stripe?: {
        syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'ERROR';
        lastSyncError?: string;
        lastSyncedAt?: string;
        retryCount?: number;
    };
}

export const getProductsByBusiness = async (businessId: string): Promise<Product[]> => {
    const { data } = await apiClient.get<Product[]>(`/products/business/${businessId}`);
    return data;
};

export const createProduct = async (productData: Partial<Product>): Promise<Product> => {
    const { data } = await apiClient.post<Product>('/products', productData);
    return data;
};

export const updateProduct = async (productId: string, productData: Partial<Product>): Promise<Product> => {
    const { data } = await apiClient.put<Product>(`/products/${productId}`, productData);
    return data;
};

export const deleteProduct = async (productId: string): Promise<void> => {
    await apiClient.delete(`/products/${productId}`);
};

export const createProductCheckout = async (payload: {
    productId: string;
    businessId: string;
    clientEmail: string;
    clientPhone?: string;
    clientName?: string;
    successUrl?: string;
    cancelUrl?: string;
    bookingData?: any;
}): Promise<{ sessionId: string; url: string }> => {
    const { data } = await apiClient.post<{ success: boolean; data: { sessionId: string; url: string } }>('/stripe/checkout/product', payload);
    return data.data;
};

export const retryProductSync = async (productId: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post<{ success: boolean }>(`/products/${productId}/stripe/retry`);
    return data;
};
