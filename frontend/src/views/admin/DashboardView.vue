<template>
  <div class="dashboard-view">
    <div class="welcome-banner">
      <div class="welcome-content">
        <h1>Welcome to Admin Dashboard</h1>
        <p>Monitor and manage your platform's key metrics</p>
      </div>
      <div class="quick-actions">
        <button @click="router.push('/admin/alerts')" class="action-btn">
          <i class="fas fa-bell"></i>
          Manage Alerts
        </button>
        <button @click="router.push('/admin/users')" class="action-btn">
          <i class="fas fa-users"></i>
          Manage Users
        </button>
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-content">
          <h3>Total Users</h3>
          <p>{{ stats.users || 0 }}</p>
          <span class="stat-label">Active Community Members</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-newspaper"></i>
        </div>
        <div class="stat-content">
          <h3>Total Posts</h3>
          <p>{{ stats.posts || 0 }}</p>
          <span class="stat-label">Published Updates</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-bell"></i>
        </div>
        <div class="stat-content">
          <h3>Active Alerts</h3>
          <p>{{ stats.alerts || 0 }}</p>
          <span class="stat-label">Current Notifications</span>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-card">
        <div class="card-header">
          <h2><i class="fas fa-tasks"></i> Quick Tasks</h2>
        </div>
        <div class="card-content">
          <div class="task-list">
            <div class="task-item">
              <i class="fas fa-check-circle"></i>
              <span>Review pending posts</span>
              <button @click="router.push('/admin/posts')" class="task-btn">Review</button>
            </div>
            <div class="task-item">
              <i class="fas fa-user-check"></i>
              <span>Verify new users</span>
              <button @click="router.push('/admin/users')" class="task-btn">Verify</button>
            </div>
            <div class="task-item">
              <i class="fas fa-bell"></i>
              <span>Update alert status</span>
              <button @click="router.push('/admin/alerts')" class="task-btn">Update</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue';
import { useAdminStore } from '@/stores/admin';
import { useNotificationStore } from '@/stores/notification';
import { useRouter } from 'vue-router';

const adminStore = useAdminStore();
const notificationStore = useNotificationStore();
const router = useRouter();
const isLoading = ref(false);

const stats = computed(() => adminStore.stats);
const recentActivity = computed(() => adminStore.recentActivity);

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const getActivityIcon = (action) => {
  switch (action) {
    case 'deleted_post':
      return 'fas fa-trash';
    case 'created_post':
      return 'fas fa-plus';
    case 'created_alert':
      return 'fas fa-bell';
    case 'approved_post':
      return 'fas fa-check';
    case 'rejected_post':
      return 'fas fa-times';
    default:
      return 'fas fa-circle';
  }
};

const formatAction = (action) => {
  switch (action) {
    case 'deleted_post':
      return 'Deleted a post';
    case 'created_post':
      return 'Created a new post';
    case 'created_alert':
      return 'Created a new alert';
    case 'approved_post':
      return 'Approved a post';
    case 'rejected_post':
      return 'Rejected a post';
    default:
      return action;
  }
};

const fetchData = async () => {
  try {
    isLoading.value = true;
    const success = await adminStore.fetchDashboardStats();
    
    if (!success) {
      console.warn('Using fallback data for dashboard');
      // Implement fallback data if needed
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    notificationStore.error('Failed to load dashboard data');
  } finally {
    isLoading.value = false;
  }
};

// Add error retry logic
onMounted(async () => {
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      await fetchData();
      break;
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        notificationStore.error('Failed to load dashboard after multiple attempts');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
});
</script>

<style scoped>
.dashboard-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-banner {
  background: linear-gradient(135deg, #005C5C 0%, #4052D6 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-content h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.welcome-content p {
  opacity: 0.9;
}

.quick-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
  border: 1px solid rgba(0, 173, 173, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 2rem;
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-content h3 {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-content p {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.dashboard-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 173, 173, 0.1);
}

.card-header h2 {
  font-size: 1.25rem;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-header i {
  color: #00D1D1;
}

.card-content {
  padding: 1.5rem;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.task-item i {
  color: #00D1D1;
}

.task-btn {
  margin-left: auto;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  background: #00D1D1;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.task-btn:hover {
  background: #00ADAD;
  transform: translateY(-2px);
}

.system-metrics {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00D1D1, #4052D6);
  transition: width 0.3s ease;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.status-badge.online {
  background: #e8f5e9;
  color: #1b5e20;
}

@media (max-width: 768px) {
  .dashboard-view {
    padding: 1rem;
  }

  .welcome-banner {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .quick-actions {
    width: 100%;
    justify-content: center;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>