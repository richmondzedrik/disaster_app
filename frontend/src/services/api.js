import axios from 'axios';

const API_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL || 'https://disaster-app-backend.onrender.com'
  : 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        
        if (token) {
            const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            config.headers.Authorization = formattedToken;
        }

        // Log the request URL and method
        console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.url}`);

        // Remove any duplicate /api prefixes
        config.url = config.url.replace(/\/api\/api/, '/api');
        
        // Ensure single /api prefix for non-auth and non-admin routes
        if (!config.url.startsWith('/api/') && !config.url.startsWith('/auth/') && !config.url.startsWith('/admin/')) {
            config.url = `/api${config.url}`;
        }

        // Log the final URL after modifications
        console.log(`📝 Final URL: ${config.url}`);

        // Add CORS headers to every request
        config.headers['X-Requested-With'] = 'XMLHttpRequest';

        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
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