import api from './api';
import { useAuthStore } from '../stores/auth';

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
      const response = await api.get('/api/admin/alerts', { 
        headers,
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
        message: error.response?.data?.message || 'Failed to fetch admin alerts'
      };
    }
  },

  async getActiveAlerts() {
    try {
      const headers = getHeaders();
      const response = await api.get('/alerts/active', { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      throw error;
    }
  },

  async getAlertCount() {
    try {
      const headers = getHeaders();
      const response = await api.get('/alerts/count', { headers });
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

      const response = await api.post('/admin/alerts', formattedData, { headers });
      
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
      const response = await api.post(`/alerts/deactivate/${alertId}`, {}, { headers });
      
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
      const response = await api.post(`/alerts/reactivate/${alertId}`, {}, { headers });
      
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
      const response = await api.delete(`/alerts/${alertId}`, { headers });
      
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
  },

  async testAdminAlerts() {
    try {
      const headers = getHeaders();
      const response = await api.get('/api/admin/alerts/test', { 
        headers,
        withCredentials: true
      });
      
      const isValid = response.data?.success && Array.isArray(response.data?.data?.alerts);
      
      return {
        success: isValid,
        message: isValid ? 'Admin alerts service operational' : 'Invalid response format',
        data: response.data?.data || null
      };
    } catch (error) {
      console.error('Error testing admin alerts:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to test admin alerts'
      };
    }
  },

  async testAdminAlertOperations() {
    try {
      const headers = getHeaders();
      
      // Create a test alert
      const testAlert = {
        message: 'Test Alert',
        type: 'info',
        priority: 0,
        is_public: true
      };
      
      // Test creation
      const createResponse = await api.post('/api/admin/alerts', testAlert, { 
        headers,
        withCredentials: true 
      });
      
      if (!createResponse.data?.success) {
        throw new Error('Failed to create test alert');
      }
      
      const alertId = createResponse.data.data.id;
      
      // Test deactivation
      const deactivateResponse = await api.put(`/api/admin/alerts/${alertId}/status`, 
        { isActive: false }, 
        { headers, withCredentials: true }
      );
      
      if (!deactivateResponse.data?.success) {
        throw new Error('Failed to deactivate test alert');
      }
      
      // Test deletion
      const deleteResponse = await api.delete(`/api/admin/alerts/${alertId}`, 
        { headers, withCredentials: true }
      );
      
      return {
        success: true,
        message: 'Admin alert operations test successful',
        testResults: {
          create: createResponse.data?.success,
          deactivate: deactivateResponse.data?.success,
          delete: deleteResponse.data?.success
        }
      };
    } catch (error) {
      console.error('Error testing admin alert operations:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to test admin alert operations'
      };
    }
  }
};

export default alertService;