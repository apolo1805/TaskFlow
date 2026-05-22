import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// attach the JWT to every request
axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// redirect to login on 401
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;