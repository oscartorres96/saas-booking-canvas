import apiClient from './axiosConfig';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Record<string, unknown>;
  isOnboardingCompleted?: boolean;
  trialExpired?: boolean;
  trialEndsAt?: Date;
  subscriptionExpired?: boolean;
  subscriptionEndsAt?: Date;
  subscriptionPastDue?: boolean;
}


export const login = async (email: string, password: string) => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return data;
};

export const register = async (email: string, password: string, name: string) => {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', { email, password, name });
  return data;
};

export const activateAccount = async (token: string, newPassword: string) => {
  const { data } = await apiClient.post<AuthResponse>('/auth/activate', { token, newPassword });
  return data;
};

export const getProfile = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data;
};
