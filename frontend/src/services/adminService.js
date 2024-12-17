import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
  const authStore = useAuthStore();
  const token = authStore.accessToken || localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
  };
};

const adminService = {
  async getUsers() {
    try {
        const headers = getHeaders();
        console.log('Fetching users with headers:', headers);
        
        const response = await axios.get(`${API_URL}/admin/users`, {
            headers,
            withCredentials: true,
            timeout: 5000 // Add timeout
        });
        
        // Log full response for debugging
        console.log('Raw API Response:', response);
        
        // Handle both response formats (direct data or nested data)
        const userData = response.data?.data || response.data;
        
        if (!userData) {
            throw new Error('No user data received');
        }

        return {
            success: true,
            data: Array.isArray(userData) ? userData : []
        };
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout - please try again');
        }
        if (error.response?.status === 401) {
            throw new Error('Authentication failed - please login again');
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
},

  async updateUserRole(userId, role) {
    const headers = getHeaders();
    const response = await axios.put(`${API_URL}/admin/users/${userId}/role`, 
      { role },
      { 
        headers,
        withCredentials: true
      }
    );
    return response.data;
  },

  async deleteUser(userId) {
    const headers = getHeaders();
    const response = await axios.delete(`${API_URL}/admin/users/${userId}`, {
      headers,
      withCredentials: true
    });
    return response.data;
  },

  async getPosts() {
    try {
        const headers = getHeaders();
        const response = await axios.get(`${API_URL}/admin/posts`, {
            headers,
            withCredentials: true
        });
        
        if (!response.data?.success) {
            throw new Error('Failed to fetch posts');
        }

        return response.data;
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
},

  async createPost(postData) {
    const response = await api.post('/admin/posts', postData);
    return response.data;
  },

  async updatePost(postId, postData) {
    const response = await api.put(`/admin/posts/${postId}`, postData);
    return response.data;
  },

  async deletePost(postId) {
    const response = await api.delete(`/admin/posts/${postId}`);
    return response.data;
  },

  async getAlerts() {
    const response = await api.get('/admin/alerts');
    return response.data;
  },

  async createAlert(alertData) {
    const response = await api.post('/admin/alerts', alertData);
    return response.data;
  },

  async updateAlertStatus(alertId, isActive) {
    const response = await api.put(`/admin/alerts/${alertId}/status`, { isActive });
    return response.data;
  },

  async deleteAlert(alertId) {
    const response = await api.delete(`/admin/alerts/${alertId}`);
    return response.data;
  },

  async getDashboardStats() {
    const maxRetries = 3;
    let retryCount = 0;
  
    const attemptFetch = async () => {
      try {
        const headers = getHeaders();
        const response = await axios.get(`${API_URL}/admin/dashboard/stats`, { 
          headers,
          withCredentials: true 
        });
  
        // Validate response structure
        if (!response.data || typeof response.data !== 'object') {
          throw new Error('Invalid response format');
        }
  
        // Handle error response
        if (response.data.success === false) {
          throw new Error(response.data.message || 'Failed to fetch dashboard stats');
        }
  
        // Validate required fields
        if (!response.data.stats || typeof response.data.stats !== 'object') {
          throw new Error('Invalid stats data format');
        }
  
        return {
          success: true,
          stats: {
            users: parseInt(response.data.stats.users) || 0,
            posts: parseInt(response.data.stats.posts) || 0,
            alerts: parseInt(response.data.stats.alerts) || 0
          },
          recentActivity: Array.isArray(response.data.recentActivity) 
            ? response.data.recentActivity.map(activity => ({
                ...activity,
                timestamp: new Date(activity.timestamp).toISOString()
              }))
            : []
        };
      } catch (error) {
        if (error.response?.status === 401) {
          const authStore = useAuthStore();
          authStore.handleAuthError();
        }
        console.error('Error fetching dashboard stats:', error);
        throw error;
      }
    };
  
    while (retryCount < maxRetries) {
      try {
        return await attemptFetch();
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) throw error;
        
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        console.log(`Retrying getDashboardStats (${retryCount}/${maxRetries}) after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};

export default adminService;