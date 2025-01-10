<template>
  <div>
    <button class="mobile-menu-btn" @click="toggleMobileMenu" v-if="isMobileView">
      <i :class="isMobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
      <span>Menu</span>
    </button>
    
    <nav class="admin-nav" :class="{ 'active': isMobileMenuOpen }">
      <div class="admin-nav-content">
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
          <li v-for="(link, index) in navLinks" :key="index">
            <router-link :to="link.path" active-class="active" @click="handleNavClick">
              <i :class="link.icon"></i>
              <span>{{ link.name }}</span>
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
      </div>
    </nav>
  </div>           
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const isMobileView = ref(false);
const isMobileMenuOpen = ref(false);

const navLinks = [
  { path: '/admin/dashboard', icon: 'fas fa-tachometer-alt', name: 'Dashboard' },
  { path: '/admin/users', icon: 'fas fa-users', name: 'Users' },
  { path: '/admin/posts', icon: 'fas fa-newspaper', name: 'Posts' },
  { path: '/admin/alerts', icon: 'fas fa-bell', name: 'Alerts' }
];

const userName = computed(() => {
  return authStore.user?.name || authStore.user?.username || 'Admin';
});

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
  
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  document.body.style.overflow = isMobileMenuOpen.value ? 'hidden' : '';
};

const handleResize = () => {
  if (window.innerWidth > 768 && isMobileMenuOpen.value) {
    isMobileMenuOpen.value = false;
    document.body.style.overflow = '';
  }
};

const handleNavClick = () => {
  if (isMobileView.value) {
    isMobileMenuOpen.value = false;
    document.body.style.overflow = '';
    document.body.classList.remove('menu-open');
  }
};

const checkMobileView = () => {
  isMobileView.value = window.innerWidth <= 768;
  if (!isMobileView.value) {
    isMobileMenuOpen.value = false;
    document.body.style.overflow = '';
    
    // Reset display style when not in mobile view
    const adminNav = document.querySelector('.admin-nav');
    if (adminNav) {
      adminNav.style.display = '';
    }
  }
};

onMounted(() => {
  checkMobileView();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.admin-nav {
  background: #1a1a1a;
  width: 280px;
  height: calc(100vh - 80px);
  position: fixed;
  left: 0;
  top: 80px;
  padding: 1.5rem;
  color: white;
  overflow-y: auto;
  z-index: 100;
}

.mobile-menu-btn {
  display: none;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  cursor: pointer;
  position: fixed;
  top: 85px;
  right: 1rem;
  z-index: 1001;
  box-shadow: 0 4px 15px rgba(0, 209, 209, 0.3);
  transition: all 0.3s ease;
}

.mobile-menu-btn i {
  font-size: 1.25rem;
}

.mobile-menu-btn span {
  font-weight: 500;
  font-size: 0.95rem;
}

.mobile-menu-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 209, 209, 0.4);
  background: linear-gradient(135deg, #00E6E6 0%, #4052D6 100%);
}

.mobile-menu-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 10px rgba(0, 209, 209, 0.3);
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }

  .admin-nav {
    width: 100%;
    height: calc(100vh - 80px);
    padding: 1rem;
    position: fixed;
    top: 80px;
    left: 0;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    background: #1a1a1a;
    z-index: 1000;
  }

  .admin-nav.active {
    transform: translateX(0);
  }

  .admin-nav-content {
    background: #1a1a1a;
    border-radius: 12px;
    padding: 1rem;
  }

  .nav-links {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
    margin: 1rem 0;
  }
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
</style>