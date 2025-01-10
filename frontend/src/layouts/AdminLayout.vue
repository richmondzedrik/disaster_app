<template>
  <div class="admin-layout">
    <AdminNav />
    <main class="admin-content">
      <div class="content-wrapper">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import AdminNav from '@/components/admin/AdminNav.vue';
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: calc(100vh - 80px);
  background: #f8fafc;
  margin-top: 80px;
}

.admin-content {
  flex: 1;
  margin-left: 280px;
  min-height: calc(100vh - 80px);
  background: #f8fafc;
  overflow-x: hidden;
}

.content-wrapper {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .admin-content {
    margin-left: 0;
    padding: 0;
  }

  .content-wrapper {
    padding: 1rem;
  }
}

/* Table styles */
:deep(.table-container) {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
  overflow: hidden;
  border: 1px solid rgba(0, 173, 173, 0.1);
}

:deep(table) {
  width: 100%;
  border-collapse: collapse;
}

:deep(th), :deep(td) {
  padding: 1.25rem;
  text-align: left;
  border-bottom: 1px solid rgba(0, 173, 173, 0.1);
}

:deep(th) {
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.05) 0%, rgba(64, 82, 214, 0.05) 100%);
  font-weight: 600;
  color: #1f2937;
}

:deep(.action-buttons) {
  display: flex;
  gap: 0.75rem;
}

:deep(.btn) {
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.btn-primary) {
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  color: white;
}

:deep(.btn-danger) {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

:deep(.btn-warning) {
  background: rgba(234, 179, 8, 0.1);
  color: #eab308;
}

:deep(.status-badge) {
  padding: 0.375rem 0.75rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 500;
}
</style>  