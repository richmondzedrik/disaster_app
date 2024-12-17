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

export const alertService = {
  async getAdminAlerts() {
    try {
      const headers = getHeaders();
      const response = await axios.get(`${API_URL}/alerts/admin`, { 
        headers,
        withCredentials: true 
      });
      
      if (response.data?.success) {
        return {
          success: true,
          alerts: response.data.alerts || []
        };
      }
      throw new Error(response.data?.message || 'Failed to fetch admin alerts');
    } catch (error) {
      console.error('Error fetching admin alerts:', error);
      if (error.response?.status === 401) {
        const authStore = useAuthStore();
        authStore.handleAuthError();
      }
      throw error;
    }
  },

  async getActiveAlerts() {
    try {
      const headers = getHeaders();
      const response = await axios.get(`${API_URL}/alerts/active`, { 
        headers,
        withCredentials: true
      });
      
      if (response.data?.success) {
        return {
          success: true,
          alerts: (response.data.alerts || [])
            .filter(alert => alert.is_active)
            .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        };
      }
      throw new Error(response.data?.message || 'Failed to fetch active alerts');
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      if (error.response?.status === 401) {
        const authStore = useAuthStore();
        authStore.handleAuthError();
      }
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
        is_public: alertData.isPublic === undefined ? false : Boolean(alertData.isPublic),
        is_active: true,
        send_email: true,
        email_subject: alertData.email_subject,
        email_content: alertData.email_content
      };

      if (!formattedData.message) {
        throw new Error('Alert message is required');
      }

      const response = await axios.post(`${API_URL}/alerts`, formattedData, { 
        headers,
        withCredentials: true 
      });
      
      if (response.data?.success) {
        return {
          success: true,
          message: response.data.message || 'Alert created successfully',
          alert: response.data.alert,
          emailSent: response.data.emailSent
        };
      }
      throw new Error(response.data?.message || 'Failed to create alert');
    } catch (error) {
      console.error('Error creating alert:', error);
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || error.message;
        if (error.response.status === 401) {
          const authStore = useAuthStore();
          authStore.handleAuthError();
          throw new Error('Authentication required');
        } else if (error.response.status === 403) {
          throw new Error('Admin access required');
        } else if (error.response.status === 400) {
          throw new Error(errorMessage || 'Invalid alert data');
        } else if (error.response.status === 500) {
          throw new Error(errorMessage || 'Database error occurred while creating alert');
        }
      }
      throw new Error(error.message || 'Failed to create alert');
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