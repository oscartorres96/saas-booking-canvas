import apiClient from './axiosConfig';

export interface Booking {
    _id: string;
    businessId: string;
    serviceId: string;
    clientId?: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    scheduledAt: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    notes?: string;
    accessCode?: string;
    serviceName?: string;
    createdAt?: string;
    updatedAt?: string;
}

export const getBookingsByBusiness = async (businessId: string): Promise<Booking[]> => {
    const { data } = await apiClient.get<Booking[]>(`/bookings?businessId=${businessId}`);
    return data;
};

export const getBookingsByClient = async (clientId: string): Promise<Booking[]> => {
    const { data } = await apiClient.get<Booking[]>(`/bookings?clientId=${clientId}`);
    return data;
};

export const getBookingById = async (bookingId: string): Promise<Booking> => {
    const { data } = await apiClient.get<Booking>(`/bookings/${bookingId}`);
    return data;
};

export const createBooking = async (bookingData: Partial<Booking>): Promise<Booking> => {
    const { data } = await apiClient.post<Booking>('/bookings', bookingData);
    return data;
};

export const lookupBookings = async (params: { clientEmail: string; accessCode: string; businessId?: string }): Promise<Booking[]> => {
    const { data } = await apiClient.post<Booking[]>('/bookings/lookup', params);
    return data;
};

export const cancelBookingPublic = async (params: { bookingId: string; clientEmail: string; accessCode: string }): Promise<Booking> => {
    const { data } = await apiClient.post<Booking>('/bookings/cancel-public', params);
    return data;
};

export const updateBooking = async (bookingId: string, bookingData: Partial<Booking>): Promise<Booking> => {
    const { data } = await apiClient.patch<Booking>(`/bookings/${bookingId}`, bookingData);
    return data;
};

export const deleteBooking = async (bookingId: string): Promise<void> => {
    await apiClient.delete(`/bookings/${bookingId}`);
};
