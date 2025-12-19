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
    validityDays?: number;
    allowedServiceIds: string[];
    active: boolean;
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
    clientName?: string;
    successUrl?: string;
    cancelUrl?: string;
}): Promise<{ sessionId: string; url: string }> => {
    const { data } = await apiClient.post<{ success: boolean; data: { sessionId: string; url: string } }>('/stripe/checkout/product', payload);
    return data.data;
};
