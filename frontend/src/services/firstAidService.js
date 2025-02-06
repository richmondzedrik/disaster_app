import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const baseUrl = import.meta.env.VITE_API_URL || 'https://disaster-app-backend.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
  };
};

export const firstAidService = {
  async updateVideoUrl(guideIndex, newUrl) {
    try {
      const response = await axios.put(`${baseUrl}/first-aid/update-video`, {
        guideIndex,
        videoUrl: newUrl
      }, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Please login to edit video URLs');
      }
      throw error.response?.data || error;
    }
  },

  async getGuides() {
    try {
      const response = await axios.get(`${baseUrl}/first-aid/guides`, {
        headers: getHeaders()
      });
      return {
        success: true,
        guides: response.data.guides || []
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          success: true,
          guides: []
        };
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      }
      throw error;
    }
  }
};
