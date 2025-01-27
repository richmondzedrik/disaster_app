import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://disaster-app-backend.onrender.com';

const getHeaders = () => {
  const authStore = useAuthStore();
  let token = authStore.token;
  
  if (!token) {
    token = localStorage.getItem('token');
  }
   
  if (!token) {
    console.warn('No auth token found');
    throw new Error('Authentication required');
  }

  token = token.replace('Bearer ', '');
    
  return {  
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}; 

export const checklistService = {
  async loadProgress() {
    try {
      const headers = getHeaders();
      const url = `${API_URL}/api/checklist/progress`;
      console.log('Loading checklist from:', url);
      
      const response = await axios.get(url, { 
        headers,
        withCredentials: true 
      });
      
      console.log('Checklist response:', response.data);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load checklist progress');
      }
      
      return {
        success: true, 
        items: Array.isArray(response.data.items) ? response.data.items : []
      };
    } catch (error) {
      console.error('Checklist load error:', error);
      throw error;
    }
  },

  async updateProgress(item) { 
    try {
      const headers = getHeaders();
      
      if (!headers.Authorization) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(
        `${API_URL}/api/checklist/progress`,
        { 
          item: {
            id: item.id, 
            completed: Boolean(item.completed)
          }
        },
        { headers }
      );
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to update progress');
      }
      
      return {
        success: true,
        message: 'Progress updated successfully',
        item: response.data.item
      };
    } catch (error) {
      console.error('Update progress error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update progress'
      };
    }
  },

  async testChecklistOperations() {
    try {
      const headers = getHeaders();
      
      // Test loading progress
      const loadResponse = await axios.get(`${API_URL}/checklist/test`, { 
        headers,
        withCredentials: true 
      });

      if (!loadResponse.data?.success) {
        throw new Error('Failed to load test checklist');
      }

      return {
        success: true,
        message: 'Checklist operations test successful',
        testResults: {
          load: true,
          data: loadResponse.data?.items || []
        }
      };
    } catch (error) {
      console.error('Error testing checklist operations:', error);
      return {
        success: false,
        message: error.message || 'Failed to test checklist operations',
        testResults: {
          load: false,
          data: []
        }
      };
    }
  },

  async addCustomItem(item) {
    try {
      const headers = getHeaders();
      const response = await axios.post(
        `${API_URL}/api/checklist/custom`,
        { item },
        { headers }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to add custom item');
      }

      return {
        success: true,
        message: 'Custom item added successfully',
        item: response.data.item || item
      };
    } catch (error) {
      console.error('Add custom item error:', error);
      throw error;
    }
  },

  async deleteCustomItem(itemId) {
    try {
      const headers = getHeaders();
      const response = await axios.delete(
        `${API_URL}/api/checklist/custom/${itemId}`,
        { headers }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to delete item');
      }

      return {
        success: true,
        message: 'Item deleted successfully'
      };
    } catch (error) {
      console.error('Delete item error:', error);
      throw error;
    }
  },

  async updateCustomItem(itemId, item) {
    try {
      const headers = getHeaders();
      const response = await axios.put(
        `${API_URL}/api/checklist/custom/${itemId}`,
        { item },
        { headers }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to update item');
      }

      return {
        success: true,
        message: 'Item updated successfully',
        item: response.data.item
      };
    } catch (error) {
      console.error('Update item error:', error);
      throw error;
    }
  }
};

export default checklistService;  