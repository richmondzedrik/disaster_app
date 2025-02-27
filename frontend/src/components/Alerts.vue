<template>
  <div class="alerts-container">
    <h2>Alerts</h2>
    <div v-if="loading" class="alerts-list">
      <!-- Skeleton loading for 3 alerts -->
      <div v-for="i in 3" :key="i" class="alert skeleton-alert">
        <div class="alert-content">
          <div class="alert-header">
            <div class="skeleton-type"></div>
            <div class="skeleton-date"></div>
          </div>
          <div class="skeleton-message"></div>
          <div class="alert-footer">
            <div class="skeleton-priority"></div>
            <div class="alert-actions">
              <div class="skeleton-button"></div>
              <div class="skeleton-author"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div v-if="alerts.length === 0" class="no-alerts">
        No active alerts at this time.
      </div>
      <div v-else class="alerts-list">
        <div v-for="alert in sortedAlerts" :key="alert.id" 
             :class="['alert', `alert-${alert.type}`, `priority-${alert.priority}`, { 'is-read': alert.is_read }]">
          <div class="alert-content">
            <div class="alert-header">
              <span class="alert-type">{{ formatAlertType(alert.type) }}</span>
              <span class="alert-date">{{ formatDate(alert.created_at) }}</span>
            </div>
            <p class="alert-message">{{ alert.message }}</p>
            <div class="alert-footer">
              <span class="alert-priority">Priority: {{ formatPriority(alert.priority) }}</span>
              <div class="alert-actions">
                <button 
                  v-if="!alert.is_read"
                  @click="markAsRead(alert.id)" 
                  class="action-btn read-btn"
                  title="Mark as read"
                >
                  <i class="fas fa-check"></i> Mark as Read
                </button>
                <span v-else class="read-status">
                  <i class="fas fa-check-circle"></i> Read
                </span>
                <span class="alert-author">By: {{ alert.created_by_username || 'System' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notification';
import alertService from '../services/alertService'; 
import { useAlertStore } from '../stores/alert';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const alertStore = useAlertStore();

const alerts = ref([]);
const loading = ref(true);
const error = ref('');

const unreadAlerts = computed(() => {
  return alerts.value.filter(alert => 
    alert.is_active && !alert.is_read && 
    new Date(alert.expiry_date) > new Date()
  ).length;
});

const sortedAlerts = computed(() => {
  return [...alerts.value].sort((a, b) => {
    // Sort by priority first (higher priority first)
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    // Then by date (newer first)
    return new Date(b.created_at) - new Date(a.created_at);
  });
});

const loadAlerts = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    if (!authStore.isAuthenticated) {
      throw new Error('Authentication required');
    }
    
    const response = await alertService.getActiveAlerts();
    
    if (response?.success) {
      alerts.value = (response.alerts || []).map(alert => ({
        ...alert,
        is_active: Boolean(alert.is_active),
        is_public: Boolean(alert.is_public),
        is_read: Boolean(alert.is_read)
      }));

      window.dispatchEvent(new CustomEvent('alertCountUpdate', {
        detail: { count: unreadAlerts.value }
      }));
    } else {
      throw new Error(response?.message || 'Failed to load alerts');
    }
  } catch (err) {
    console.error('Error loading alerts:', err);       
    error.value = err.message || 'Failed to load alerts. Please try again.';
    notificationStore.error(error.value);
    alerts.value = [];
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return 'No expiry';
  const expiryDate = new Date(date);
  if (isNaN(expiryDate.getTime())) return 'Invalid date';
  
  return expiryDate.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const formatAlertType = (type) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const formatPriority = (priority) => {
  const priorities = {
    0: 'Low',
    1: 'Medium',
    2: 'High'
  };
  return priorities[priority] || 'Unknown';
};

const markAsRead = async (alertId) => {
  try {
    const response = await alertStore.markAsRead(alertId);
    
    if (response) {
      alerts.value = alerts.value.map(alert => 
        alert.id === alertId 
          ? { ...alert, is_read: true }
          : alert
      );

      // Update alert count using computed value
      window.dispatchEvent(new CustomEvent('alertCountUpdate', {
        detail: { count: unreadAlerts.value }
      }));
    } else {
      throw new Error('Failed to mark alert as read');
    }
  } catch (error) {
    console.error('Error marking alert as read:', error);
    notificationStore.error(error.message || 'Failed to mark alert as read');
  }
};

onMounted(() => {
  loadAlerts();
});
</script>

<style scoped>
.alerts-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.loading, .error, .no-alerts {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  color: #dc3545;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.alert {
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.alert-info {
  background-color: #cce5ff;
  border: 1px solid #b8daff;
}

.alert-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
}

.alert-danger {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}

.priority-2 {
  border-left: 5px solid #dc3545;
}

.priority-1 {
  border-left: 5px solid #ffc107;
}

.priority-0 {
  border-left: 5px solid #17a2b8;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.alert-type {
  font-weight: bold;
}

.alert-date {
  color: #666;
  font-size: 0.9em;
}

.alert-message {
  margin: 10px 0;
  line-height: 1.4;
}

.alert-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 0.9em;
  color: #666;
}

.alert-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.read-btn {
  background-color: #e2e8f0;
  color: #475569;
}

.read-btn:hover {
  background-color: #cbd5e1;
  color: #1e293b;
}

.read-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #16a34a;
  font-size: 0.875rem;
}

.is-read {
  opacity: 0.75;
}

.skeleton-alert {
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #f0f0f0;
}

.skeleton-type, .skeleton-date, .skeleton-message, .skeleton-priority, .skeleton-button, .skeleton-author {
  height: 16px;
  border-radius: 4px;
  background-color: #e0e0e0;
  margin-bottom: 8px;
}

.skeleton-type, .skeleton-date {
  width: 40%;
}

.skeleton-message {
  width: 60%;
}

.skeleton-priority {
  width: 20%;
}

.skeleton-button {
  width: 30%;
}

.skeleton-author {
  width: 40%;
}

.skeleton-alert {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-left: 5px solid #dee2e6;
}

.skeleton-type,
.skeleton-date,
.skeleton-priority,
.skeleton-button,
.skeleton-author {
  background: #e9ecef;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

.skeleton-type {
  width: 80px;
  height: 20px;
}

.skeleton-date {
  width: 150px;
  height: 20px;
}

.skeleton-message {
  width: 100%;
  height: 40px;
  background: #e9ecef;
  border-radius: 4px;
  margin: 10px 0;
  animation: pulse 1.5s infinite;
}

.skeleton-priority {
  width: 120px;
  height: 20px;
}

.skeleton-button {
  width: 120px;
  height: 32px;
  border-radius: 6px;
}

.skeleton-author {
  width: 100px;
  height: 20px;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.6;
  }
}
</style> 