<template>
  <div class="notifications-page">
    <div class="notifications-header">
      <h1><i class="fas fa-bell"></i> Notifications</h1>
      <div class="header-actions">
        <button @click="markAllAsRead" class="action-btn" :disabled="!hasUnread">
          <i class="fas fa-check-double"></i>
          Mark All as Read
        </button>
        <button @click="clearAll" class="action-btn" :disabled="!notifications.length">
          <i class="fas fa-trash"></i>
          Clear All
        </button>
      </div>
    </div>

    <div class="notifications-list" :class="{ empty: !notifications.length }">
      <div v-if="loading" class="loading-state">
        <i class="fas fa-circle-notch fa-spin"></i>
        Loading notifications...
      </div>
      
      <div v-else-if="!notifications.length" class="empty-state">
        <i class="fas fa-bell-slash"></i>
        <p>No notifications to display</p>
      </div>

      <TransitionGroup name="list" tag="div" v-else>
        <div 
          v-for="notification in sortedNotifications" 
          :key="notification.id"
          class="notification-item"
          :class="[notification.type, { unread: !notification.read }]"
        >
          <div class="notification-content">
            <i :class="getIconClass(notification.type)"></i>
            <div class="notification-details">
              <p class="notification-message">{{ notification.message }}</p>
              <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
            </div>
          </div>
          <button @click="removeNotification(notification.id)" class="delete-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotificationStore } from '../stores/notification';
import { storeToRefs } from 'pinia';

const notificationStore = useNotificationStore();
const { notifications } = storeToRefs(notificationStore);
const loading = ref(true);

const sortedNotifications = computed(() => {
  return [...notifications.value].sort((a, b) => b.timestamp - a.timestamp);
});

const hasUnread = computed(() => {
  return notifications.value.some(notification => !notification.read);
});

const getIconClass = (type) => {
  switch (type) {
    case 'success': return 'fas fa-check-circle';
    case 'error': return 'fas fa-exclamation-circle';
    case 'warning': return 'fas fa-exclamation-triangle';
    default: return 'fas fa-info-circle';
  }
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const removeNotification = (id) => {
  notificationStore.removeNotification(id);
};

const markAllAsRead = () => {
  notificationStore.markAllAsRead();
};

const clearAll = () => {
  notificationStore.clearAll();
};

onMounted(() => {
  // Simulate loading notifications
  setTimeout(() => {
    loading.value = false;
  }, 500);
});
</script>

<style scoped>
.notifications-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #334155;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notification-item {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.notification-details {
  flex: 1;
}

.notification-message {
  margin: 0;
  color: #334155;
}

.notification-time {
  font-size: 0.875rem;
  color: #64748b;
}

.delete-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  color: #64748b;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
}

.notification-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #DC2626;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

/* Transition animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Notification type styles */
.notification-item.success i { color: #16A34A; }
.notification-item.error i { color: #DC2626; }
.notification-item.warning i { color: #CA8A04; }
.notification-item.info i { color: #2563EB; }

.notification-item.unread {
  background: #f8fafc;
  border-left: 4px solid #2563EB;
}

@media (max-width: 640px) {
  .notifications-page {
    padding: 1rem;
  }

  .notifications-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>
