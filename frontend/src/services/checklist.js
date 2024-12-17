import { api } from './api';
import { useAuthStore } from '../stores/auth';

const loadProgress = async () => {
  try {
    const authStore = useAuthStore();
    const response = await api.get('/checklist/progress', {
      headers: authStore.getAuthHeader
    });
    return response.data;
  } catch (error) {
    console.error('Load progress error:', error);
    throw error;
  }
};

const updateProgress = async (item) => {
  try {
    const authStore = useAuthStore();
    const response = await api.post('/checklist/progress', {
      item
    }, {
      headers: authStore.getAuthHeader
    });
    return response.data;
  } catch (error) {
    console.error('Update progress error:', error);
    throw error;
  }
};

export const checklistService = {
  loadProgress,
  updateProgress
}; 