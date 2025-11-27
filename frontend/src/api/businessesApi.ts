import apiClient from './axiosConfig';

export interface Business {
  _id: string;
  name?: string;
  businessName: string;
  type?: string;
  ownerUserId?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionStatus?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export const getAllBusinesses = async (): Promise<Business[]> => {
  const { data } = await apiClient.get<Business[]>('/businesses');
  return data;
};

export const getBusinessById = async (businessId: string): Promise<Business> => {
  const { data } = await apiClient.get<Business>(`/businesses/${businessId}`);
  return data;
};

export const createBusiness = async (businessData: Partial<Business>): Promise<Business> => {
  const { data } = await apiClient.post<Business>('/businesses', businessData);
  return data;
};

export const updateBusiness = async (businessId: string, businessData: Partial<Business>): Promise<Business> => {
  const { data } = await apiClient.put<Business>(`/businesses/${businessId}`, businessData);
  return data;
};

export const deleteBusiness = async (businessId: string): Promise<void> => {
  await apiClient.delete(`/businesses/${businessId}`);
};
