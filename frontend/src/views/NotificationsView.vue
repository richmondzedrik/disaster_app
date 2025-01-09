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
          :class="[`type-${notification.type}`, { unread: !notification.is_read }]"
        >
          <div class="notification-content">
            <i :class="getIconClass(notification.type)"></i>
            <div class="notification-details"> 
              <p class="notification-message">{{ notification.message }}</p>
              <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useNotificationStore } from '../stores/notification';
import { storeToRefs } from 'pinia';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const notificationStore = useNotificationStore();
const { notifications } = storeToRefs(notificationStore);
const loading = ref(true); 
const loadingError = ref(false);
const loadingAttempts = ref(0);
const maxRetries = 3;

const authStore = useAuthStore();
const refreshInterval = ref(null);

const sortedNotifications = computed(() => {
  return [...notifications.value].sort((a, b) => {
    try {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0; // Keep original order for invalid dates
      }
      
      return dateB.getTime() - dateA.getTime();
    } catch (err) {
      console.error('Error sorting notifications:', err);
      return 0;      
    }
  });
});

const hasUnread = computed(() => {
  return notifications.value.some(notification => !notification.is_read);
});

const getIconClass = (type) => {
  switch (type?.toLowerCase()) {
    case 'like': return 'fas fa-heart';
    case 'post': return 'fas fa-newspaper';
    case 'alert': return 'fas fa-bell';
    case 'info': return 'fas fa-info-circle';
    case 'warning': return 'fas fa-exclamation-triangle';
    case 'error': return 'fas fa-exclamation-circle';
    default: return 'fas fa-info-circle';
  }
};

const formatTime = (timestamp) => {
  if (!timestamp) return 'Unknown date';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',   
    hour12: true
  });
};

const removeNotification = async (id) => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://disaster-app-backend.onrender.com';
    await axios.delete(`${baseUrl}/api/notifications/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    notificationStore.removeNotification(id);
    notificationStore.success('Notification removed');
  } catch (error) {
    console.error('Failed to delete notification:', error);
    notificationStore.error('Failed to delete notification');
  }
};

const markAllAsRead = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://disaster-app-backend.onrender.com';
    await axios.put(`${baseUrl}/api/notifications/mark-all-read`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    notificationStore.markAllAsRead();
    notificationStore.success('All notifications marked as read');
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    notificationStore.error('Failed to mark notifications as read');
  }
};

const clearAll = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://disaster-app-backend.onrender.com';
    await axios.delete(`${baseUrl}/api/notifications/clear`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    notificationStore.clearAll();
    notificationStore.success('All notifications cleared');
  } catch (error) {
    console.error('Failed to clear notifications:', error);
    notificationStore.error('Failed to clear notifications');
  }
};

const fetchNotifications = async () => {
  if (loadingAttempts.value >= maxRetries) {
    loadingAttempts.value = 0; // Reset attempts
  }
  
  loading.value = true;
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://disaster-app-backend.onrender.com';
    const response = await axios.get(`${baseUrl}/api/notifications/user`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.data?.notifications) {
      const transformedNotifications = response.data.notifications
        .map(notification => {
          try {
            return {
              ...notification,
              type: notification.type?.toLowerCase() || 'info',
              message: notification.message || 'No message',
              is_read: Boolean(notification.is_read),
              created_at: notification.created_at 
                ? new Date(notification.created_at).toISOString()   
                : new Date().toISOString()
            };
          } catch (err) {
            console.error('Error transforming notification:', err);
            return null;
          }
        })
        .filter(Boolean);
      
      notificationStore.$patch({ notifications: transformedNotifications });
      loadingError.value = false;
      loadingAttempts.value = 0; // Reset attempts on success
    } else {
      throw new Error('No notifications data received');
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    loadingError.value = true;
    notificationStore.error('Failed to fetch notifications');
  } finally {
    loading.value = false;
  }
};

watch(() => authStore.isAuthenticated, (newValue) => {
  if (newValue) {
    fetchNotifications();
    // Start auto-refresh when authenticated
    refreshInterval.value = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
  } else {
    // Clear interval when logged out
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
      refreshInterval.value = null;
    }
    notificationStore.$patch({ notifications: [] });    
  }
});

watch(loading, async (isLoading, oldValue) => {
  if (isLoading && !oldValue) {
    // Reset error state when starting new load
    loadingError.value = false;
    loadingAttempts.value++;
    
    // Set a timeout to check if loading takes too long
    const timeoutId = setTimeout(() => {
      if (loading.value) {
        loadingError.value = true;
        loading.value = false;
        notificationStore.error('Loading notifications timed out. Please try again.');
        
        // Retry loading if under max attempts
        if (loadingAttempts.value < maxRetries) {
          fetchNotifications();
        }
      }
    }, 10000); // 10 second timeout

    // Clear timeout if loading completes
    watch(() => loading.value, (newLoadingState) => {
      if (!newLoadingState) {
        clearTimeout(timeoutId);
      }
    }, { immediate: true, once: true });
  }
});

// Add watcher for loading errors
watch(loadingError, (hasError) => {
  if (hasError && loadingAttempts.value >= maxRetries) {
    notificationStore.error('Failed to load notifications after multiple attempts');
  }
});

onMounted(() => {
  fetchNotifications();
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
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

.notification-item.type-like i { color: #EC4899; }
.notification-item.type-post i { color: #3B82F6; }
.notification-item.type-alert i { color: #EF4444; }
.notification-item.type-info i { color: #2563EB; }
.notification-item.type-warning i { color: #CA8A04; }
.notification-item.type-error i { color: #DC2626; }
  
.notification-item.unread {
  background: #f8fafc;
  border-left: 4px solid #3B82F6;
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
