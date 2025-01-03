<template>
  <div class="test-connection">
    <h3>System Health Check</h3>
    <button @click="testAllSystems" :disabled="loading">
      <i class="fas fa-sync" :class="{ 'fa-spin': loading }"></i>
      {{ loading ? 'Testing...' : 'Test All Systems' }}
    </button>
    
    <div class="status-container" v-if="hasResults">
      <!-- Core Systems -->
      <div class="status-group">
        <h4>Core Systems</h4>
        <StatusItem title="Backend" :status="status.backend" />
        <StatusItem title="Database" :status="status.database" />
      </div>

      <!-- API Services -->
      <div class="status-group">
        <h4>API Services</h4>
        <StatusItem title="Alerts API" :status="status.alerts" />
        <StatusItem title="News API" :status="status.news" />
        <StatusItem title="Checklist API" :status="status.checklist" />
      </div>

      <!-- Auth Services -->
      <div class="status-group">
        <h4>Auth Services</h4>
        <StatusItem title="Auth API" :status="status.auth" />
        <StatusItem title="Admin API" :status="status.admin" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import api from '../services/api';
import StatusItem from './StatusItem.vue';

// Main component logic
const loading = ref(false);
const status = ref({
  backend: null,
  database: null,
  alerts: null,
  news: null,
  checklist: null,
  auth: null,
  admin: null
});

const hasResults = computed(() => 
  Object.values(status.value).some(val => val !== null)
);

const testEndpoint = async (endpoint, options = {}) => {
  try {
    const response = await api.get(endpoint, options);
    
    // Test both connection and content
    const contentCheck = {
      '/api/alerts/test': () => {
        return response.data?.success === true;
      },
      '/api/news/test': () => {
        return response.data?.success === true;
      },
      '/api/checklist/test': () => {
        return response.data?.success === true;
      }
    }[endpoint];

    const hasValidContent = contentCheck ? contentCheck() : true;

    return {
      success: response.data?.success && hasValidContent,
      message: response.data?.message || 'Connected successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
};

const testAllSystems = async () => {
  loading.value = true;
  Object.keys(status.value).forEach(key => status.value[key] = null);

  try {
    // Test core systems
    status.value.backend = await testEndpoint('/api/test');
    status.value.database = await testEndpoint('/api/db-test');

    // Test API services with content validation
    const alertsTest = await testEndpoint('/api/alerts/test');
    status.value.alerts = {
      ...alertsTest,
      message: alertsTest.success 
        ? 'Connected and content validated'
        : alertsTest.message
    };

    const newsTest = await testEndpoint('/api/news/test');
    status.value.news = {
      ...newsTest,
      message: newsTest.success 
        ? 'Connected and content validated'
        : newsTest.message
    };

    const checklistTest = await testEndpoint('/api/checklist/test');
    status.value.checklist = {
      ...checklistTest,
      message: checklistTest.success 
        ? 'Connected and content validated'
        : checklistTest.message
    };

    // Test auth services
    status.value.auth = await testEndpoint('/api/auth/test');
    status.value.admin = await testEndpoint('/api/admin/test');

  } catch (error) {
    console.error('System test error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.status-group {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.status-group h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-title {
  font-weight: 600;
}

.status-message {
  font-size: 0.9rem;
}

.status {
  padding: 0.75rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.success {
  background-color: #d4edda;
  color: #155724;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
}

.fa-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>