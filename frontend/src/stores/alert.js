import { defineStore } from 'pinia';
import { ref } from 'vue';
import { alertService } from '../services/alertService';
import { useNotificationStore } from './notification';



export const useAlertStore = defineStore('alert', () => {
  const alerts = ref([]);
  const isLoading = ref(false);
  const notificationStore = useNotificationStore();

  const fetchAlerts = async () => {
    try {
      isLoading.value = true;
      const response = await alertService.getAdminAlerts();
      if (response.success) {
        alerts.value = response.alerts;
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      notificationStore.error('Failed to fetch alerts');
    } finally {
      isLoading.value = false;
    }
  };

  const createAlert = async (alertData) => {
    try {
      const response = await alertService.createAlert(alertData);
      if (response && response.success) {
        await fetchAlerts();
        notificationStore.success(response.message || 'Alert created successfully');
        return true;
      }
      notificationStore.error(response?.message || 'Failed to create alert');
      return false;
    } catch (error) {
      console.error('Error creating alert:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Network error occurred while creating alert';
      notificationStore.error(errorMessage);
      return false;
    }
  };

  const toggleAlertStatus = async (alertId, isActive) => {
    try {
      const response = await alertService[isActive ? 'reactivateAlert' : 'deactivateAlert'](alertId);
      if (response.success) {
        await fetchAlerts();
      }
    } catch (error) {
      console.error('Error toggling alert status:', error);
      notificationStore.error('Failed to update alert status');
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      const response = await alertService.deleteAlert(alertId);
      if (response.success) {
        await fetchAlerts();
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      notificationStore.error('Failed to delete alert');
    }
  };

  return {
    alerts,
    isLoading,
    fetchAlerts,
    createAlert,
    toggleAlertStatus,
    deleteAlert
  };
}); 