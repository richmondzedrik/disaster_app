import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://disaster-app-backend.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true,
    timeout: 30000
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        
        if (token) {
            config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        }

        // Ensure proper API path formatting
        if (!config.url.startsWith('/')) {
            config.url = `/${config.url}`;
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor with better error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('❌ Response error:', {
            url: error.config?.url,
            method: error.config?.method,
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        if (error.code === 'ERR_NETWORK') {
            error.message = 'Unable to connect to the server. Please check your connection.';
        }

        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        
        return Promise.reject(error);
    }
);

export default api; 