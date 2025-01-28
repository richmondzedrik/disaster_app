import { defineStore } from 'pinia';
import { ref } from 'vue';
import alertService from '../services/alertService';
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
        return { 
          success: true,
          alerts: response.alerts
        };
      }
      notificationStore.error(response.message || 'Failed to fetch alerts');
      return {
        success: false,
        alerts: [],
        message: response.message
      };
    } catch (error) {
      console.error('Error in fetchAlerts:', error);
      notificationStore.error(error.message || 'Failed to fetch alerts');
      return {
        success: false,
        alerts: [],
        message: error.message || 'Failed to fetch alerts'
      };
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
        notificationStore.success(`Alert ${isActive ? 'activated' : 'deactivated'} successfully`);
        return true;
      }
      throw new Error(response.message || `Failed to ${isActive ? 'activate' : 'deactivate'} alert`);
    } catch (error) {
      console.error('Error toggling alert status:', error);
      notificationStore.error(error.message || `Failed to ${isActive ? 'activate' : 'deactivate'} alert`);
      return false;
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      const response = await alertService.deleteAlert(alertId);
      if (response.success) {
        await fetchAlerts();
        notificationStore.success('Alert deleted successfully');
        return true;
      }
      throw new Error(response.message || 'Failed to delete alert');
    } catch (error) {
      console.error('Error deleting alert:', error);
      notificationStore.error(error.message || 'Failed to delete alert');
      return false;
    }
  };

  const markAsRead = async (alertId) => {
    try {
      const response = await alertService.markAlertAsRead(alertId);
      if (response.success) {
        alerts.value = alerts.value.map(alert => 
          alert.id === alertId 
            ? { ...alert, is_read: true }
            : alert
        );
        notificationStore.success('Alert marked as read');
        return true;
      }
      throw new Error(response.message || 'Failed to mark alert as read');
    } catch (error) {
      console.error('Error marking alert as read:', error);
      notificationStore.error(error.message || 'Failed to mark alert as read');
      return false;
    }
  };

  return {
    alerts,
    isLoading,
    fetchAlerts,
    createAlert,
    toggleAlertStatus,
    deleteAlert,
    markAsRead
  };
}); 