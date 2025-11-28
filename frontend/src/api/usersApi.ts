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

export const updateUser = async (userId: string, payload: Partial<User> & { password?: string }): Promise<User> => {
    const { data } = await apiClient.patch<User>(`/users/${userId}`, payload);
    return data;
};

export const createUser = async (payload: {
    email: string;
    name: string;
    password: string;
    role: 'business' | 'owner' | 'client';
    businessId?: string;
}): Promise<User> => {
    const { data } = await apiClient.post<User>('/users', payload);
    return data;
};
