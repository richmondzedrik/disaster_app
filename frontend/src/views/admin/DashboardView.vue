<template>
  <div class="dashboard-view">
    <h1>Admin Dashboard</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-content">
          <h3>Total Users</h3>
          <p>{{ stats.users || 0 }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-newspaper"></i>
        </div>
        <div class="stat-content">
          <h3>Total Posts</h3>
          <p>{{ stats.posts || 0 }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-bell"></i>
        </div>
        <div class="stat-content">
          <h3>Active Alerts</h3>
          <p>{{ stats.alerts || 0 }}</p>
        </div>
      </div>
    </div>

    <section class="recent-activity-section">
      <div class="section-header">
        <h2>Recent Activity</h2>
      </div>
      <div class="activity-grid">
        <div v-for="activity in recentActivity" 
             :key="activity.id" 
             class="activity-card">
          <div class="activity-icon">
            <i :class="getActivityIcon(activity.action)"></i>
          </div>
          <div class="activity-content">
            <p class="activity-action">{{ formatAction(activity.action) }}</p>
            <div class="activity-meta">
              <span class="activity-user">
                <i class="fas fa-user"></i>
                {{ activity.username }}
              </span>
              <span class="activity-time">
                <i class="fas fa-clock"></i>
                {{ formatDate(activity.timestamp) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue';
import { useAdminStore } from '@/stores/admin';
import { useNotificationStore } from '@/stores/notification';

const adminStore = useAdminStore();
const notificationStore = useNotificationStore();
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

h1 {
  font-size: 2.5rem;
  color: #1f2937;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #005C5C 0%, #4052D6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
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
  font-size: 2.5rem;
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-content h3 {
  font-size: 1.2rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.stat-content p {
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
}

.recent-activity-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
  border: 1px solid rgba(0, 173, 173, 0.1);
}

.section-header h2 {
  font-size: 1.8rem;
  color: #1f2937;
  margin-bottom: 2rem;
  position: relative;
  padding-bottom: 0.5rem;
}

.section-header h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #00D1D1, #4052D6);
  border-radius: 2px;
}

.activity-grid {
  display: grid;
  gap: 1.5rem;
}

.activity-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.05) 0%, rgba(64, 82, 214, 0.05) 100%);
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.activity-card:hover {
  transform: translateX(5px);
}

.activity-icon {
  font-size: 1.5rem;
  color: #4052D6;
}

.activity-content {
  flex: 1;
}

.activity-action {
  font-size: 1.1rem;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.activity-meta {
  display: flex;
  gap: 1.5rem;
  color: #6b7280;
  font-size: 0.9rem;
}

.activity-meta i {
  margin-right: 0.5rem;
}

.activity-user, .activity-time {
  display: flex;
  align-items: center;
}
</style>