<template>
  <div class="notifications-container">
    <TransitionGroup name="notification">
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        :class="['notification', notification.type]"
        @click="notificationStore.removeNotification(notification.id)"
      >
        {{ notification.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useNotificationStore } from '../stores/notification';
import { TransitionGroup } from 'vue';

const notificationStore = useNotificationStore();
</script>

<style scoped>
.notifications-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column-reverse;
  gap: 10px;
  pointer-events: none;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.notification {
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  pointer-events: auto;
  max-width: 300px;
  margin-left: auto;
  font-size: 14px;
  line-height: 1.5;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.notification.success {
  background-color: rgba(22, 163, 74, 0.95); /* Green */
  color: white;
  border-left: 4px solid #15803d;
}

.notification.error {
  background-color: rgba(220, 38, 38, 0.95); /* Red */
  color: white;
  border-left: 4px solid #991b1b;
}

.notification.warning {
  background-color: rgba(234, 179, 8, 0.95); /* Yellow */
  color: white;
  border-left: 4px solid #854d0e;
}

.notification.info {
  background-color: rgba(59, 130, 246, 0.95); /* Blue */
  color: white;
  border-left: 4px solid #1d4ed8;
}

/* Transition animations */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

@media (max-width: 768px) {
  .notifications-container {
    right: 10px;
    left: 10px;
    bottom: 10px;
  }
  
  .notification {
    max-width: none;
  }
}
</style> 