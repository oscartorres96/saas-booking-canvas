import apiClient from './axiosConfig';

export interface Business {
  _id: string;
  name?: string;
  businessName: string;
  type?: string;
  ownerUserId?: string;
  ownerName?: string;
  ownerPassword?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionStatus?: string;
  createdAt?: string;
  onboardingStep?: number;
  isOnboardingCompleted?: boolean;
  metadata?: Record<string, unknown>;
  settings?: {
    primaryColor?: string;
    secondaryColor?: string;
    description?: string;
    defaultServiceDuration?: number;
    businessHours?: Array<{
      day: string;
      isOpen: boolean;
      startTime?: string;
      endTime?: string;
      intervals?: Array<{ startTime: string; endTime: string }>;
    }>;
  };
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

export const updateBusinessSettings = async (
  businessId: string,
  settings: any,
): Promise<Business> => {
  const { data } = await apiClient.put<Business>(`/businesses/${businessId}/settings`, settings);
  return data;
};

export const getBusinessSlots = async (
  businessId: string,
  date: string,
  serviceId: string,
): Promise<string[]> => {
  const { data } = await apiClient.get<string[]>(`/businesses/${businessId}/slots`, {
    params: { date, service: serviceId },
  });
  return data;
};

export const updateOnboarding = async (
  businessId: string,
  step: number,
  isCompleted: boolean
): Promise<Business> => {
  const { data } = await apiClient.put<Business>(`/businesses/${businessId}/onboarding`, { step, isCompleted });
  return data;
};
