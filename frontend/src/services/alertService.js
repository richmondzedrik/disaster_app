import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://disaster-app-backend.onrender.com/api';

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

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});



const alertService = {
  async getAdminAlerts() {
    try {
      const headers = getHeaders();
      const response = await axiosInstance.get('/admin/alerts', { 
        headers,
        timeout: 30000,
        withCredentials: true
      });
      
      return {
        success: true,
        alerts: response.data?.alerts || []
      };
    } catch (error) {
      console.error('Error fetching admin alerts:', error);
      return {
        success: false,
        alerts: [],
        message: 'Failed to fetch alerts. Please try again.'
      };
    }
  },

  async getActiveAlerts() {
    try {
      const headers = getHeaders();
      const response = await axiosInstance.get('/alerts/active', { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      throw error;
    }
  },

  async getAlertCount() {
    try {
      const headers = getHeaders();
      const response = await axiosInstance.get('/alerts/count', { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching alert count:', error);
      throw error;
    }
  },

  async createAlert(alertData) {
    try {
      const headers = getHeaders();
      const formattedData = {
        message: alertData.message?.trim() || '',
        type: alertData.type || 'info',
        priority: alertData.priority === undefined ? 0 : parseInt(alertData.priority),
        expiry_date: alertData.expiryDate || null,
        is_public: alertData.isPublic === undefined ? false : Boolean(alertData.isPublic)
      };

      if (!formattedData.message) {
        throw new Error('Alert message is required');
      }

      const response = await axiosInstance.post('/admin/alerts', formattedData, { headers });
      
      return {
        success: true,
        message: response.data?.message || 'Alert created successfully',
        alert: response.data?.data
      };
    } catch (error) {
      console.error('Error creating alert:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create alert'
      };
    }
  },

  async deactivateAlert(alertId) {
    try {
      const headers = getHeaders();
      const response = await axiosInstance.post(`/alerts/deactivate/${alertId}`, {}, { headers });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message
        };
      }
      throw new Error(response.data?.message || 'Failed to deactivate alert');
    } catch (error) {
      console.error('Error deactivating alert:', error);
      throw new Error(error.response?.data?.message || 'Failed to deactivate alert');
    }
  },

  async reactivateAlert(alertId) {
    try {
      const headers = getHeaders();
      const response = await axiosInstance.post(`/alerts/reactivate/${alertId}`, {}, { headers });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message
        };
      }
      throw new Error(response.data?.message || 'Failed to reactivate alert');
    } catch (error) {
      console.error('Error reactivating alert:', error);
      throw new Error(error.response?.data?.message || 'Failed to reactivate alert');
    }
  },

  async deleteAlert(alertId) {
    try {
      const headers = getHeaders();
      const response = await axiosInstance.delete(`/alerts/${alertId}`, { headers });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message
        };
      }
      throw new Error(response.data?.message || 'Failed to delete alert');
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete alert');
    }
  }
};

export { alertService };