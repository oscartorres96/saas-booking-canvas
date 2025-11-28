import apiClient from './axiosConfig';

export interface Business {
  _id: string;
  name?: string;
  businessName: string;
  type?: string;
  ownerUserId?: string;
  ownerName?: string;
  ownerPassword?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionStatus?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateBusinessResponse {
  business: Business;
  credentials: {
    email: string;
    password: string | null;
    note?: string;
  };
}

export const getAllBusinesses = async (): Promise<Business[]> => {
  const { data } = await apiClient.get<Business[]>('/businesses');
  return data;
};

export const getBusinessById = async (businessId: string): Promise<Business> => {
  const { data } = await apiClient.get<Business>(`/businesses/${businessId}`);
  return data;
};

export const createBusiness = async (businessData: Partial<Business>): Promise<CreateBusinessResponse> => {
  const { data } = await apiClient.post<CreateBusinessResponse>('/businesses', businessData);
  return data;
};

export const updateBusiness = async (
  businessId: string,
  businessData: Partial<Business> & { ownerPassword?: string },
): Promise<Business> => {
  const { data } = await apiClient.patch<Business>(`/businesses/${businessId}`, businessData);
  return data;
};

export const deleteBusiness = async (businessId: string): Promise<void> => {
  await apiClient.delete(`/businesses/${businessId}`);
};
