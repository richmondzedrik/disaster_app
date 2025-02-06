import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const baseUrl = import.meta.env.VITE_API_URL || 'https://disaster-app-backend.onrender.com/api';

const getHeaders = () => {
  const authStore = useAuthStore();
  const token = authStore.token;
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const firstAidService = {
  async updateVideoUrl(guideIndex, newUrl) {
    try {
      const response = await axios.put(`${baseUrl}/admin/first-aid/update-video`, {
        guideIndex,
        videoUrl: newUrl
      }, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async getGuides() {
    try {
      const response = await axios.get(`${baseUrl}/first-aid`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      return {
        success: true,
        guides: [] // Return empty array as fallback
      };
    }
  }
};
