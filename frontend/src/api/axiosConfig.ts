import axios from 'axios';
import { clearAuthStorage, getAccessToken } from '../utils/storage';

let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

const apiBase =
  import.meta.env.VITE_API_URL ??
  `${window.location.protocol}//${window.location.hostname}:3000/api`;

const apiClient = axios.create({
  baseURL: apiBase,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage();

      // Determine if the current page is a public page where we should downgrade to guest
      // instead of forcing a logout/redirect.
      const path = window.location.pathname;
      const isPublicBookingPage = /\/business\/[^/]+\/booking/.test(path);
      const isPublicMyBookings = path === '/my-bookings';
      const isPublicLanding = path === '/';

      // Only trigger global logout (which redirects) if we are NOT on a public page
      if (!isPublicBookingPage && !isPublicMyBookings && !isPublicLanding && onUnauthorized) {
        onUnauthorized();
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
