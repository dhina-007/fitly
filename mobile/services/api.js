import axios from 'axios';
import { authService } from './auth.service';
import { useAuthStore } from '../store/authStore';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api';
  return 'http://localhost:3000/api';
};

const API_URL = getBaseUrl();

const api = axios.create({ baseURL: API_URL, timeout: 30000, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(async (config) => {
  try {
    const authState = useAuthStore.getState();
    let token = authState.token;
    if (!token) {
      token = await authService.getIdToken();
    }
    if (!token && authState.user) {
      token = `dev-token-${authState.user.uid || 'demo'}`;
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('Failed to get auth token:', e.message);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;