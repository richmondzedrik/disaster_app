<template>
  <div class="notifications-container">
    <div v-for="notification in notifications" 
         :key="notification.id"
         :class="['notification', notification.type]">
      <div class="notification-content">
        <i :class="getIconClass(notification.type)"></i>
        <span>{{ notification.message }}</span>
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
  top: 100px;
  right: 20px;
  max-width: 400px;
  z-index: 9999;
  pointer-events: none;
}

.notification {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 8px 16px rgba(56, 0, 10, 0.12);
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: slideIn 0.3s ease-out;
  pointer-events: auto;
  border: 1px solid rgba(205, 28, 24, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.notification:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(56, 0, 10, 0.15);
}

.notification.success {
  border-left: 4px solid #CD1C18;
  background: linear-gradient(to right, rgba(255, 168, 150, 0.1), rgba(255, 255, 255, 0.95));
}

.notification.error {
  border-left: 4px solid #9B1313;
  background: linear-gradient(to right, rgba(155, 19, 19, 0.1), rgba(255, 255, 255, 0.95));
}

.notification.info {
  border-left: 4px solid #38000A;
  background: linear-gradient(to right, rgba(56, 0, 10, 0.1), rgba(255, 255, 255, 0.95));
}

.notification.warning {
  border-left: 4px solid #FFA896;
  background: linear-gradient(to right, rgba(255, 168, 150, 0.1), rgba(255, 255, 255, 0.95));
}

.notification-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.notification-content i {
  font-size: 1.25rem;
  color: #CD1C18;
}

.notification-message {
  color: #38000A;
  font-size: 0.95rem;
  line-height: 1.4;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  color: #CD1C18;
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

.close-btn:hover {
  background: rgba(205, 28, 24, 0.1);
  transform: rotate(90deg);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .notifications-container {
    top: 80px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .notification {
    margin: 0.5rem;
    padding: 1rem;
  }
}
</style> 