import apiClient from './axiosConfig';

export interface CreateCheckoutSessionParams {
    userId: string;
    businessId: string;
    priceId?: string;
    billingPeriod?: 'monthly' | 'annual';
    successUrl?: string;
    cancelUrl?: string;
}

export interface CreatePortalSessionResponse {
    success: boolean;
    data: {
        url: string;
    };
}

export interface CreateBookingCheckoutParams {
    bookingId: string;
    businessId: string;
    amount?: number;
    currency?: string;
    serviceName?: string;
    successUrl?: string;
    cancelUrl?: string;
}

export const createCheckoutSession = async (params: CreateCheckoutSessionParams) => {
    const { data } = await apiClient.post<{ success: boolean, data: { url: string } }>('/stripe/checkout/subscription', params);
    return data.data;
};

export const createBookingCheckout = async (params: CreateBookingCheckoutParams) => {
    const { data } = await apiClient.post<{ success: boolean, data: { url: string, sessionId: string } }>('/stripe/checkout/booking', params);
    return data.data;
};

export const createPortalSession = async (businessId: string) => {
    const { data } = await apiClient.post<CreatePortalSessionResponse>('/stripe/portal-session', { businessId });
    return data.data;
};

export const getPaymentsByBusiness = async (businessId: string) => {
    const { data } = await apiClient.get<{ success: boolean, data: any[] }>(`/stripe/payments/${businessId}`);
    return data.data;
};

export const createConnectAccount = async (businessId: string) => {
    const { data } = await apiClient.post<{ success: boolean, data: { url: string } }>('/stripe/connect/account', { businessId });
    return data.data;
};

export const syncConnectAccount = async (businessId: string) => {
    const { data } = await apiClient.post<{ success: boolean, data: any }>(`/stripe/connect/sync/${businessId}`);
    return data.data;
};
