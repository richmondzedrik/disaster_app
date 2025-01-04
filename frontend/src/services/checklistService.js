import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
  const authStore = useAuthStore();
  
  // Get token from localStorage if not in store
  let token = authStore.token || localStorage.getItem('token'); 
  
  if (!token) {
    // Try to get it from auth header
    token = authStore.getAuthHeader?.Authorization;
  }
  
  if (!token) {
    console.warn('No auth token found');
    throw new Error('Authentication required');
  }

  // Clean up token format
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
      console.log('Request headers:', headers);
      
      const url = `${API_URL}/checklist/progress`;
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      if (error.message === 'Authentication required') {
        console.error('No authentication token available');
        return { success: false, items: [] };
      }
      
      console.error('Load progress error:', error);
      throw error;
    }
  },

  async updateProgress(item) {
    try {
      const headers = getHeaders();
      console.log('Update progress headers:', headers);
      
      // Verify we have auth header before making request
      if (!headers.Authorization) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(
        `${API_URL}/checklist/progress`, 
        { item },
        { headers }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update progress');
      }
      
      return response.data;
    } catch (error) {
      if (error.message === 'Authentication required') {
        console.error('No authentication token available');
        throw new Error('Please log in to save progress');
      }
      
      console.error('Update progress error:', error);
      throw error;
    }
  }
}; 