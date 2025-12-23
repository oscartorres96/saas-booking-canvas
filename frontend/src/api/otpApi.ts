import axiosInstance from './axiosConfig';

export type OtpPurpose = 'ASSET_USAGE' | 'ONLINE_PAYMENT';

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
