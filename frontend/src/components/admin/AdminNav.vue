<template>
  <nav class="admin-nav">
    <div class="admin-profile">
      <div class="profile-image">
        <i class="fas fa-user-shield"></i> 
      </div>
      <div class="profile-info">
        <p class="profile-name">{{ userName }}</p>
        <span class="profile-role">Administrator</span>
      </div>
    </div>

    <ul class="nav-links"> 
      <li>
        <router-link to="/admin/dashboard" active-class="active">
          <i class="fas fa-tachometer-alt"></i>
          <span>Dashboard</span>
          <span class="nav-indicator"></span>
        </router-link>
      </li>
      <li>
        <router-link to="/admin/users" active-class="active">
          <i class="fas fa-users"></i>
          <span>Users</span>
          <span class="nav-indicator"></span>
        </router-link>
      </li>
      <li>
        <router-link to="/admin/posts" active-class="active">
          <i class="fas fa-newspaper"></i>
          <span>Posts</span>
          <span class="nav-indicator"></span>
        </router-link>
      </li>
      <li>
        <router-link to="/admin/alerts" active-class="active">
          <i class="fas fa-bell"></i>
          <span>Alerts</span>
          <span class="nav-indicator"></span>
        </router-link>
      </li>
    </ul>

    <div class="nav-footer">
      <button @click="handleLogout" class="logout-btn">
        <i class="fas fa-sign-out-alt"></i>
        <span>Logout</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const userName = computed(() => {
  return authStore.user?.name || authStore.user?.username || 'Admin';
});

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.admin-nav {
  background: #1a1a1a;
  width: 280px;
  height: 100vh;
  padding: 1.5rem;
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 80px;
  overflow-y: auto;
  z-index: 100;   
  height: calc(100vh - 80px);
}

/* Add a custom scrollbar for the navigation */
.admin-nav::-webkit-scrollbar {
  width: 4px;
}

.admin-nav::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.admin-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.admin-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.nav-header {
  padding: 1rem;
  margin-bottom: 2rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.brand i {
  font-size: 1.75rem;
  color: #00D1D1;
}

.brand h2 {
  color: #fff;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.nav-subtitle {
  color: #00D1D1;
  font-size: 0.875rem;
  opacity: 0.8;
  margin: 0;
}

.admin-profile {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.profile-image {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-image i {
  font-size: 1.5rem;
  color: white;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-weight: 600;
  margin: 0;
  font-size: 1rem;
}

.profile-role {
  font-size: 0.75rem;
  color: #00D1D1;
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.nav-links li {
  margin-bottom: 0.5rem;
}

.nav-links a {
  display: flex;
  align-items: center;
  padding: 1rem;
  color: #ccc;
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-links a i {
  margin-right: 1rem;
  width: 20px;
  text-align: center;
  font-size: 1.25rem;
}

.nav-links a:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-links a.active {
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.1) 0%, rgba(64, 82, 214, 0.1) 100%);
  color: #00D1D1;
}

.nav-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #00D1D1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-links a.active .nav-indicator {
  opacity: 1;
}

.nav-footer {
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-btn {
  width: 100%;
  padding: 1rem;
  background: rgba(220, 38, 38, 0.1);
  color: #ef4444;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #ef4444;
  color: white;
}

@media (max-width: 768px) {
  .admin-nav {
    width: 100%;
    height: auto;
    position: relative;
    padding: 1rem;
  }
  
  .nav-links {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .nav-links li {
    width: calc(50% - 0.5rem);
  }
  
  .nav-footer {
    margin-top: 1rem;
  }
}
</style>