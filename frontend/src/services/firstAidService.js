import api from './api';

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
      const response = await api.put('/api/first-aid/update-video', {
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
      const response = await api.get('/api/first-aid/guides', {
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
