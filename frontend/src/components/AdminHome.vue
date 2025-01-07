<template>
    <div class="admin-home">
      <section class="welcome-section">
        <div class="welcome-content">
          <h1>Welcome, Admin</h1>
          <p>Manage and monitor your disaster preparedness platform</p>
        </div>
      </section>
  
      <div class="quick-actions-grid">
        <router-link to="/admin/users" class="action-card">
          <i class="fas fa-users"></i>
          <h3>User Management</h3>
          <p>Manage user accounts and permissions</p>
        </router-link>
  
        <router-link to="/admin/posts" class="action-card">
          <i class="fas fa-newspaper"></i>
          <h3>News Posts</h3>
          <p>Manage and moderate news content</p>
        </router-link>
  
        <router-link to="/admin/alerts" class="action-card">
          <i class="fas fa-bell"></i>
          <h3>Alert System</h3>
          <p>Create and manage emergency alerts</p>
        </router-link>
  
        <router-link to="/hazard-map" class="action-card">
          <i class="fas fa-map-marked-alt"></i>
          <h3>Hazard Map</h3>
          <p>View and update hazard zones</p>
        </router-link>
      </div>
  
      <section class="stats-section">
        <h2>Platform Overview</h2>
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
      </section>
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref } from 'vue';
  import { useAdminStore } from '@/stores/admin';
  import { useNotificationStore } from '@/stores/notification';
  
  const adminStore = useAdminStore();
  const notificationStore = useNotificationStore();
  const stats = ref({ users: 0, posts: 0, alerts: 0 });
  
  onMounted(async () => {
    try {
      await adminStore.fetchDashboardStats();
      stats.value = adminStore.stats;
    } catch (error) {
      notificationStore.error('Failed to load dashboard statistics');
    }
  });
  </script>
  
  <style scoped>
  .admin-home {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .welcome-section {
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    padding: 3rem 2rem;
    border-radius: 16px;
    margin-bottom: 2rem;
    color: white;
    box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
  }
  
  .welcome-content h1 {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
  }
  
  .welcome-content p {
    font-size: 1.2rem;
    opacity: 0.9;
  }
  
  .quick-actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }
  
  .action-card {
    background: white;
    padding: 2rem;
    border-radius: 16px;
    text-decoration: none;
    color: #1f2937;
    border: 1px solid rgba(0, 173, 173, 0.1);
    transition: all 0.3s ease;
    text-align: center;
  }
  
  .action-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
    border-color: #00D1D1;
  }
  
  .action-card i {
    font-size: 2.5rem;
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 1rem;
  }
  
  .action-card h3 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    color: #1f2937;
  }
  
  .action-card p {
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .stats-section {
    background: white;
    padding: 2rem;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
  }
  
  .stats-section h2 {
    font-size: 1.8rem;
    color: #1f2937;
    margin-bottom: 2rem;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }
  
  .stat-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, rgba(0, 209, 209, 0.05) 0%, rgba(64, 82, 214, 0.05) 100%);
    border-radius: 12px;
  }
  
  .stat-icon {
    font-size: 2rem;
    color: #00D1D1;
  }
  
  .stat-content h3 {
    font-size: 1rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }
  
  .stat-content p {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  @media (max-width: 768px) {
    .admin-home {
      padding: 1rem;
    }
    
    .welcome-content h1 {
      font-size: 2rem;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
  </style>