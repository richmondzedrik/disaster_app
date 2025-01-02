import axios from 'axios';

const API_URL = import.meta.env.PROD 
  ? 'https://disaster-app-backend.onrender.com'
  : 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});
/// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        
        if (token) {
            config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        }

        // Handle auth routes
        if (config.url.startsWith('/auth/')) {
            config.url = `/api${config.url}`;
            return config;
        }

        // For other routes, ensure they have /api prefix
        if (!config.url.startsWith('/api/')) {
            config.url = `/api${config.url}`;
        }

        // Remove any duplicate /api prefixes
        config.url = config.url.replace(/\/api\/api/, '/api');

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log(`✅ Response for ${response.config.url}:`, response.data);
        return response;
    },
    (error) => {
        // Enhanced error logging
        console.error('❌ Response error:', {
            url: error.config?.url,
            method: error.config?.method,
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        // Handle token expiration or invalid token
        if (error.response?.status === 401) {
            console.log('🔒 Authentication error - clearing local storage');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        
        return Promise.reject(error);
    }
);

export default api; 