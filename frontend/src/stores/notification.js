import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([]);
  let nextId = 1;

  const addNotification = (notification) => {
    const id = nextId++;
    notifications.value.push({
      id,
      message: notification.message,
      type: notification.type,
      timeout: notification.timeout || 5000
    });

    // Auto remove after timeout
    setTimeout(() => {
      removeNotification(id);
    }, notification.timeout || 5000);
  };

  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  };

  const success = (message, timeout = 5000) => {
    addNotification({ message, type: 'success', timeout });
  };

  const error = (message, timeout = 5000) => {
    addNotification({ message, type: 'error', timeout });
  };

  const warning = (message, timeout = 5000) => {
    addNotification({ message, type: 'warning', timeout });
  };

  const info = (message, timeout = 5000) => {
    addNotification({ message, type: 'info', timeout });
  };

  const prompt = (message) => {
    return window.prompt(message);
  };

  const clearAll = () => {
    notifications.value = [];
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
    prompt,
    clearAll
  };
}); 