<template>
    <div class="test-connection">
      <h3>Backend Connection Test</h3>
      <button @click="testConnection">Test Connection</button>
      <div v-if="status" :class="['status', status.success ? 'success' : 'error']">
        {{ status.message }}
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import api from '../services/api';
  
  const status = ref(null);
  
  const testConnection = async () => {
    try {
      const response = await api.get('/test');
      status.value = {
        success: true,
        message: `Connected successfully! Server time: ${response.data.timestamp}`
      };
    } catch (error) {
      status.value = {
        success: false,
        message: `Connection failed: ${error.message}`
      };
      console.error('Connection test error:', error);
    }
  };
  </script>
  
  <style scoped>
  .test-connection {
    padding: 1rem;
    text-align: center;
  }
  .status {
    margin-top: 1rem;
    padding: 0.5rem;
    border-radius: 4px;
  }
  .success {
    background-color: #d4edda;
    color: #155724;
  }
  .error {
    background-color: #f8d7da;
    color: #721c24;
  }
  </style>