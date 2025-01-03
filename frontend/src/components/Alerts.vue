<template>
  <div class="alerts-container">
    <h2>Alerts</h2>
    <div v-if="loading" class="loading">Loading alerts...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div v-if="alerts.length === 0" class="no-alerts">
        No active alerts at this time.
      </div>
      <div v-else class="alerts-list">
        <div v-for="alert in sortedAlerts" :key="alert.id" 
             :class="['alert', `alert-${alert.type}`, `priority-${alert.priority}`]">
          <div class="alert-content">
            <div class="alert-header">
              <span class="alert-type">{{ formatAlertType(alert.type) }}</span>
              <span class="alert-date">{{ formatDate(alert.created_at) }}</span>
            </div>
            <p class="alert-message">{{ alert.message }}</p>
            <div class="alert-footer">
              <span class="alert-priority">Priority: {{ formatPriority(alert.priority) }}</span>
              <span class="alert-author">By: {{ alert.created_by_username || 'System' }}</span>
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
import { alertService } from '../services/alertService';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const alerts = ref([]);
const loading = ref(true);
const error = ref('');

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
    const response = await alertService.getActiveAlerts();
    
    if (response?.success) {
      alerts.value = response.alerts || [];
    } else {
      throw new Error(response?.message || 'Failed to load alerts');
    }
  } catch (err) {
    console.error('Error loading alerts:', err);
    error.value = 'Failed to load alerts. Please try again.';
    notificationStore.error('Failed to load alerts');
    alerts.value = [];
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
</style> 