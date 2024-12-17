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
  top: 70px;
  right: 250px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.notification {
  padding: 8px 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  pointer-events: auto;
  max-width: 300px;
  margin-left: auto;
  font-size: 13px;
  line-height: 1.4;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(4px);
}

.notification.success {
  background-color: rgba(37, 99, 235, 0.95);
  color: white;
}

.notification.error {
  background-color: rgba(220, 38, 38, 0.95);
  color: white;
}

.notification.info {
  background-color: rgba(59, 130, 246, 0.95);
  color: white;
}

/* Transition animations */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style> 