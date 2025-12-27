import axiosInstance from './axiosConfig';

export type OtpPurpose = 'ASSET_USAGE' | 'ONLINE_PAYMENT' | 'CLIENT_ACCESS';

export interface OtpRequestResponse {
    requiresOtp: boolean;
    reason?: OtpPurpose;
    expiresIn?: string;
}

export interface OtpVerifyResponse {
    verified: boolean;
    verificationToken?: string;
    expiresIn?: string;
}

export interface ClientDashboardData {
    clientName: string;
    bookings: any[];
    pastBookings: any[];
    assets: any[];
    consumedAssets?: any[];
}

export const requestOtp = async (email: string, businessId: string, purpose: OtpPurpose): Promise<OtpRequestResponse> => {
    const response = await axiosInstance.post('/bookings/otp/request', {
        email,
        businessId,
        purpose,
    });
    return response.data;
};

export const verifyOtp = async (email: string, code: string, purpose: OtpPurpose): Promise<OtpVerifyResponse> => {
    const response = await axiosInstance.post('/bookings/otp/verify', {
        email,
        code,
        purpose,
    });
    return response.data;
};

export const getDashboardData = async (email: string, token: string, businessId: string): Promise<ClientDashboardData> => {
    const response = await axiosInstance.get('/bookings/otp/dashboard', {
        params: { email, token, businessId }
    });
    return response.data;
};

export const logoutDashboard = async (email: string, token: string): Promise<void> => {
    await axiosInstance.post('/bookings/otp/logout', { email, token });
};
