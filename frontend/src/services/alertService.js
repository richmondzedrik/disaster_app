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

const alertService = {
  async getAdminAlerts() {
    try {
      const headers = getHeaders();
      const response = await axios.get(`${API_URL}/admin/alerts`, { 
        headers,
        withCredentials: true,
        timeout: 15000
      });
      
      return {
        success: true,
        alerts: response.data?.alerts || []
      };
    } catch (error) {
      console.error('Error fetching admin alerts:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Network error occurred'
      };
    }
  },

  async getActiveAlerts() {
    try {
      const headers = getHeaders();
      const response = await axios.get(`${API_URL}/alerts/active`, {
        headers,
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      throw error;
    }
  },

  async getAlertCount() {
    try {
      const headers = getHeaders();
      const response = await axios.get(`${API_URL}/alerts/count`, {
        headers,
        withCredentials: true
      });
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

      const response = await axios.post(`${API_URL}/admin/alerts`, formattedData, { 
        headers,
        withCredentials: true 
      });
      
      if (response.data?.success) {
        return {
          success: true,
          message: response.data.message || 'Alert created successfully',
          alert: response.data.data
        };
      }
      throw new Error(response.data?.message || 'Failed to create alert');
    } catch (error) {
      console.error('Error creating alert:', error);
      throw new Error(error.response?.data?.message || 'Failed to create alert');
    }
  },

  async deactivateAlert(alertId) {
    try {
      const headers = getHeaders();
      const response = await axios.post(`${API_URL}/alerts/deactivate/${alertId}`, {}, { 
        headers,
        withCredentials: true 
      });
      
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
      const response = await axios.post(`${API_URL}/alerts/reactivate/${alertId}`, {}, { 
        headers,
        withCredentials: true 
      });
      
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
      const response = await axios.delete(`${API_URL}/alerts/${alertId}`, { headers });
      
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