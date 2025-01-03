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
    return {
      success: true,
      message: response.data.message || 'Connected successfully'
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
  // Reset all statuses
  Object.keys(status.value).forEach(key => status.value[key] = null);

  try {
    // Test core systems
    status.value.backend = await testEndpoint('/test');
    status.value.database = await testEndpoint('/db-test');

    // Test API services
    status.value.alerts = await testEndpoint('/alerts/test');
    status.value.news = await testEndpoint('/news/test');
    status.value.checklist = await testEndpoint('/checklist/test');

    // Test auth services
    status.value.auth = await testEndpoint('/auth/test');
    status.value.admin = await testEndpoint('/admin/test');

  } catch (error) {
    console.error('System test error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<!-- Create a new StatusItem component -->
<script setup name="StatusItem">
const props = defineProps({
  title: String,
  status: Object
});
</script>

<template>
  <div v-if="status" :class="['status', status.success ? 'success' : 'error']">
    <i :class="['fas', status.success ? 'fa-check-circle' : 'fa-times-circle']"></i>
    <div class="status-content">
      <span class="status-title">{{ title }}:</span>
      <span class="status-message">{{ status.message }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Existing styles remain the same */

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
</style>