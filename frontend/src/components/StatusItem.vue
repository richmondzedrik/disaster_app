<template>
    <div v-if="status" :class="['status', status.success ? 'success' : 'error']">
      <i :class="['fas', status.success ? 'fa-check-circle' : 'fa-times-circle']"></i>
      <div class="status-content">
        <span class="status-title">{{ title }}:</span>
        <span class="status-message">{{ status.message }}</span>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    title: String,
    status: Object
  });
  </script>
  
  <style scoped>
  .status {
    padding: 0.75rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
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