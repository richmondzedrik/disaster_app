import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
  const authStore = useAuthStore();
  let token = authStore.token || localStorage.getItem('token'); 
  
  if (!token) {
    token = authStore.getAuthHeader?.Authorization;
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
      const url = `${API_URL}/checklist/progress`;
      const response = await axios.get(url, { headers });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to load checklist progress');
      }
      
      return {
        success: true,
        items: response.data.items.map(item => ({
          ...item,
          completed: Boolean(item.completed),
          required: Boolean(item.required)
        }))
      };
    } catch (error) {
      console.error('Load progress error:', error);
      return { 
        success: false, 
        items: [],
        message: error.message || 'Failed to load checklist progress'
      };
    }
  },

  async updateProgress(item) {
    try {
      const headers = getHeaders();
      
      if (!headers.Authorization) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(
        `${API_URL}/checklist/progress`, 
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
  }
};

export default checklistService; 