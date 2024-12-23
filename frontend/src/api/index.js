import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const api = axios.create({
  baseURL: '/', // Use relative URL since we're using Vite proxy
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ') 
        ? token 
        : `Bearer ${token}`;
    }
    
    // Add retry configuration
    config.retry = 3;
    config.retryDelay = 1000;
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add retry logic
api.interceptors.response.use(undefined, async (err) => {
  const { config } = err;
  if (!config || !config.retry) return Promise.reject(err);
  
  config.retryCount = config.retryCount || 0;
  
  if (config.retryCount >= config.retry) {
    return Promise.reject(err);
  }
  
  config.retryCount += 1;
  
  const backoff = new Promise(resolve => {
    setTimeout(() => resolve(), config.retryDelay || 1000);
  });
  
  await backoff;
  return api(config);
});

export default api;