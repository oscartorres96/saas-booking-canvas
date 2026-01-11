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
  language?: string; // e.g. 'es' | 'en'
  address?: string;
  subscriptionStatus?: string;
  createdAt?: string;
  onboardingStep?: number;
  isOnboardingCompleted?: boolean;
  metadata?: Record<string, unknown>;
  paymentConfig?: {
    paymentPolicy: 'RESERVE_ONLY' | 'PAY_BEFORE_BOOKING' | 'PACKAGE_OR_PAY';
    method: 'none' | 'bank_transfer';
    allowTransfer: boolean;
    allowCash: boolean;
    bank?: string;
    clabe?: string;
    holderName?: string;
    instructions?: string;
  };
  paymentMode?: 'BOOKPRO_COLLECTS' | 'DIRECT_TO_BUSINESS';
  stripeConnectAccountId?: string;
  connectStatus?: 'NOT_STARTED' | 'PENDING' | 'ACTIVE';
  resourceConfig?: {
    enabled: boolean;
    resourceType?: string;
    resourceLabel?: string;
    layoutType?: string;
    rows?: number;
    cols?: number;
    resources?: Array<{
      id: string;
      label: string;
      isActive: boolean;
      position: {
        row: number;
        col: number;
      };
    }>;
  };
  bookingCapacityConfig?: {
    mode: 'SINGLE' | 'MULTIPLE';
    maxBookingsPerSlot: number | null;
  };
  settings?: {
    primaryColor?: string;
    secondaryColor?: string;
    description?: string;
    language?: string;
    defaultServiceDuration?: number;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
    accentColor?: string;
    theme?: 'light' | 'dark' | 'custom' | 'system';
    currency?: string;
    businessHours?: Array<{
      day: string;
      isOpen: boolean;
      startTime?: string;
      endTime?: string;
      intervals?: Array<{ startTime: string; endTime: string }>;
    }>;
  };
  bookingConfig?: {
    allowMultipleBookingsPerDay: boolean;
    cancellationWindowHours: number;
    confirmationType: 'automatic' | 'manual';
    bookingViewMode?: 'CALENDAR' | 'WEEK';
    weekHorizonDays?: number;
    weekStart?: 'CURRENT' | 'NEXT';
    services: {
      enabled: boolean;
      paymentTiming: 'NONE' | 'BEFORE_BOOKING';
    };
    packages: {
      enabled: boolean;
      paymentTiming: 'BEFORE_BOOKING';
    };
  };
  taxConfig?: {
    enabled: boolean;
    taxName?: string;
    taxRate?: number;
    taxId?: string;
    invoicingEnabled?: boolean;
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

export interface Slot {
  time: string;
  isAvailable: boolean;
}

export const getBusinessSlots = async (
  businessId: string,
  date: string,
  serviceId: string,
): Promise<Slot[]> => {
  const { data } = await apiClient.get<Slot[]>(`/businesses/${businessId}/slots`, {
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

export const updatePaymentConfig = async (
  businessId: string,
  config: any
): Promise<Business> => {
  const { data } = await apiClient.put<Business>(`/businesses/${businessId}/payment-config`, config);
  return data;
};

export const updateBusinessResourceConfig = async (
  businessId: string,
  config: any
): Promise<any> => {
  const { data } = await apiClient.put(`/resource-map/${businessId}/config`, config);
  return data;
};
