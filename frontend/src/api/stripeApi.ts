import apiClient from './axiosConfig';

export interface CreateCheckoutSessionParams {
    userId: string;
    businessId: string;
    priceId?: string;
    billingPeriod?: 'monthly' | 'annual' | 'trial';
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
    amount: number;
    currency?: string;
    serviceName: string;
    successUrl?: string;
    cancelUrl?: string;
}

export const createCheckoutSession = async (params: CreateCheckoutSessionParams) => {
    const { data } = await apiClient.post('/stripe/checkout/subscription', params);
    return data;
};

export const createBookingCheckout = async (params: CreateBookingCheckoutParams) => {
    const { data } = await apiClient.post('/stripe/checkout/booking', params);
    return data;
};

export const createPortalSession = async (businessId: string) => {
    const { data } = await apiClient.post<CreatePortalSessionResponse>('/stripe/portal-session', { businessId });
    return data;
};
