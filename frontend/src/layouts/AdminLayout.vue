<template>
  <div class="admin-layout">
    <AdminNav />
    <main class="admin-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import AdminNav from '@/components/admin/AdminNav.vue';
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-content {
  flex: 1;
  padding: 2rem;
  background: #f5f5f5;
}

/* Add consistent table styles */
:deep(.table-container) {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

:deep(table) {
  width: 100%;
  border-collapse: collapse;
}

:deep(th), :deep(td) {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

:deep(th) {
  background: #f8f9fa;
  font-weight: 600;
}

:deep(.action-buttons) {
  display: flex;
  gap: 0.5rem;
}

:deep(.btn) {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.btn-primary) {
  background: #005C5C;
  color: white;
}

:deep(.btn-danger) {
  background: #dc3545;
  color: white;
}

:deep(.btn-warning) {
  background: #ffc107;
  color: #000;
}

:deep(.status-badge) {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}
</style>