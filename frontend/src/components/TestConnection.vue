<template>
  <div class="test-connection">
    <h3>System Connection Test</h3>
    <button @click="testConnections" :disabled="loading">
      <i class="fas fa-sync" :class="{ 'fa-spin': loading }"></i>
      {{ loading ? 'Testing...' : 'Test Connections' }}
    </button>
    
    <div class="status-container" v-if="status.backend || status.database">
      <!-- Backend Status -->
      <div v-if="status.backend" :class="['status', status.backend.success ? 'success' : 'error']">
        <i :class="['fas', status.backend.success ? 'fa-check-circle' : 'fa-times-circle']"></i>
        <span>Backend: {{ status.backend.message }}</span>
      </div>
      
      <!-- Database Status -->
      <div v-if="status.database" :class="['status', status.database.success ? 'success' : 'error']">
        <i :class="['fas', status.database.success ? 'fa-check-circle' : 'fa-times-circle']"></i>
        <span>Database: {{ status.database.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../services/api';

const loading = ref(false);
const status = ref({
  backend: null,
  database: null
});

const testConnections = async () => {
  loading.value = true;
  status.value = { backend: null, database: null };

  try {
    // Test backend connection
    const backendResponse = await api.get('/test');
    status.value.backend = {
      success: true,
      message: `Connected successfully! Server time: ${backendResponse.data.timestamp}`
    };

    // Test database connection
    const dbResponse = await api.get('/db-test');
    status.value.database = {
      success: dbResponse.data.success,
      message: dbResponse.data.message
    };

  } catch (error) {
    console.error('Connection test error:', error);
    
    // Set appropriate error messages based on which connection failed
    if (!status.value.backend) {
      status.value.backend = {
        success: false,
        message: 'Backend connection failed: ' + error.message
      };
    }
    
    if (!status.value.database) {
      status.value.database = {
        success: false,
        message: 'Database connection failed: ' + (error.response?.data?.message || error.message)
      };
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.test-connection {
  padding: 1.5rem;
  text-align: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background: #42b983;
  color: white;
  cursor: pointer;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

button:hover:not(:disabled) {
  background: #3aa876;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.status-container {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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