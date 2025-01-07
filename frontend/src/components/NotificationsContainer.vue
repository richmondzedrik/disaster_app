<template>
  <div class="notifications-container">
    <div v-for="notification in notifications" 
         :key="notification.id"
         :class="['notification', notification.type]">
      <div class="notification-content">
        <i :class="getIconClass(notification.type)"></i>
        <span class="notification-message">{{ notification.message }}</span>
      </div>
      <button class="close-btn" @click="closeNotification(notification.id)">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useNotificationStore } from '../stores/notification';

const notificationStore = useNotificationStore();
const notifications = computed(() => notificationStore.notifications);

const getIconClass = (type) => {
  switch (type) {
    case 'success': return 'fas fa-check-circle';
    case 'error': return 'fas fa-exclamation-circle';
    case 'warning': return 'fas fa-exclamation-triangle';
    default: return 'fas fa-info-circle';
  }
};

const closeNotification = (id) => {
  notificationStore.removeNotification(id);
};
</script>

<style scoped>
.notifications-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  max-width: 400px;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  flex-direction: column-reverse;
  gap: 0.75rem;
}

.notification {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: slideIn 0.3s ease-out;
  pointer-events: auto;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.notification:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
}

.notification.success {
  border-left: 4px solid #16a34a;
  background: linear-gradient(to right, rgba(22, 163, 74, 0.1), rgba(255, 255, 255, 0.95));
}

.notification.error {
  border-left: 4px solid #dc2626;
  background: linear-gradient(to right, rgba(220, 38, 38, 0.1), rgba(255, 255, 255, 0.95));
}

.notification.warning {
  border-left: 4px solid #eab308;
  background: linear-gradient(to right, rgba(234, 179, 8, 0.1), rgba(255, 255, 255, 0.95));
}

.notification.info {
  border-left: 4px solid #3b82f6;
  background: linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(255, 255, 255, 0.95));
}

.notification-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.notification-content i {
  font-size: 1.25rem;
}

.notification.success i { color: #16a34a; }
.notification.error i { color: #dc2626; }
.notification.warning i { color: #eab308; }
.notification.info i { color: #3b82f6; }

.notification-message {
  color: #1f2937;
  font-size: 0.95rem;
  line-height: 1.4;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.notification.success .close-btn { color: #16a34a; }
.notification.error .close-btn { color: #dc2626; }
.notification.warning .close-btn { color: #eab308; }
.notification.info .close-btn { color: #3b82f6; }

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: rotate(90deg);
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .notifications-container {
    right: 10px;
    left: 10px;
    bottom: 10px;
    max-width: none;
  }
  
  .notification {
    margin: 0.5rem;
    padding: 0.875rem;
  }
}
</style> 