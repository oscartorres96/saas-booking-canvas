import apiClient from './axiosConfig';

export interface User {
    _id: string;
    email: string;
    name?: string;
    role: 'owner' | 'business' | 'client';
    businessId?: string;
    createdAt?: string;
}

export const getAllUsers = async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
};

export const getUserById = async (userId: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/users/${userId}`);
    return data;
};
