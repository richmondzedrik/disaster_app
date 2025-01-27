<template>
  <div class="app-container">
    <nav class="navbar">
      <!-- Brand Logo -->
      <div class="nav-brand">
        <router-link to="/">
          <img src="https://res.cloudinary.com/dmgivh17b/image/upload/v1737989135/disaster-app/wlltguhlrboshbqeilwt.png" alt="AlertoAbra Logo" class="brand-logo" />
          AlertoAbra
        </router-link>
        <!-- Add mobile menu button -->
        <button class="mobile-menu-btn" @click="toggleMobileMenu" :aria-expanded="isMobileMenuOpen">
          <i :class="isMobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
          <span class="sr-only">Toggle menu</span>
        </button>
      </div> 

      <!-- Navigation Links -->
      <div class="nav-links" :class="{ 'active': isMobileMenuOpen }">
        <!-- Unauthenticated Navigation -->
        <template v-if="!isAuthenticated">
          <router-link to="/about" class="nav-link">
            <i class="fas fa-info-circle"></i> About
          </router-link>
          <router-link to="/news" class="nav-link">
            <i class="fas fa-newspaper"></i> News
          </router-link>
          <router-link to="/contact" class="nav-link">
            <i class="fas fa-envelope"></i> Contact
          </router-link>
          <router-link to="/login" class="nav-link login-btn">
            <i class="fas fa-sign-in-alt"></i> Login
          </router-link>
          <router-link to="/register" class="nav-link register-btn">
            <i class="fas fa-user-plus"></i> Register
          </router-link>
        </template>

        <!-- Admin Navigation -->
        <template v-else-if="isAdmin">
          <!-- Primary Admin Actions -->
          <router-link to="/admin/dashboard" class="nav-link">
            <i class="fas fa-users-cog"></i> Dashboard
          </router-link>
          
          <!-- Content Management Dropdown -->
          <div ref="contentDropdownRef" class="nav-dropdown" :class="{ active: isContentDropdownActive }">
            <button class="dropdown-btn" @click="toggleContentDropdown">
              <i class="fas fa-file-alt"></i> Content
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="dropdown-content">
              <router-link to="/news" class="dropdown-item">
                <i class="fas fa-newspaper"></i> News
              </router-link>
              <router-link to="/hazard-map" class="dropdown-item">
                <i class="fas fa-map-marked-alt"></i> Hazard Map
              </router-link>
              <router-link to="/evacuation-route" class="dropdown-item">
                <i class="fas fa-route"></i> Evacuation Route
              </router-link>
            </div>
          </div>

          <!-- Admin Profile Dropdown -->
          <div ref="adminDropdownRef" class="nav-dropdown" :class="{ active: isAdminDropdownActive }">
            <button class="dropdown-btn" @click="toggleAdminDropdown">
              <i class="fas fa-user-shield"></i> Admin
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="dropdown-content">
              <router-link to="/profile" class="dropdown-item">
                <i class="fas fa-user-circle"></i> Profile
              </router-link>
              <button @click="handleLogout" class="dropdown-item">
                <i class="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        </template>

        <!-- User Navigation -->
        <template v-else>
          <!-- Primary User Actions -->
          <router-link to="/dashboard" class="nav-link">
            <i class="fas fa-home"></i> Dashboard
          </router-link>
          
          <!-- News Link -->
          <router-link to="/news" class="nav-link">
            <i class="fas fa-newspaper"></i> News
          </router-link>
          
          <!-- Alert Center -->
          <router-link to="/alerts" class="nav-link">
            <i class="fas fa-bell"></i> Alerts
            <span v-if="alertCount > 0" class="alert-badge">{{ alertCount }}</span>
          </router-link>

          <!-- Resources Dropdown -->
          <div ref="resourcesDropdownRef" class="nav-dropdown resources" :class="{ active: isResourcesDropdownActive }">
            <button class="dropdown-btn" @click="toggleResourcesDropdown">
              <i class="fas fa-book"></i> Resources
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="dropdown-content">
              <router-link to="/hazard-map" class="dropdown-item">
                <i class="fas fa-map-marked-alt"></i> Hazard Map
              </router-link>
              <router-link to="/evacuation-route" class="dropdown-item">
                <i class="fas fa-route"></i> Evacuation Route
              </router-link>
              <router-link to="/checklist" class="dropdown-item">
                <i class="fas fa-tasks"></i> Checklist
              </router-link>
            </div>
          </div>

          <!-- User Profile Dropdown -->
          <div ref="userDropdownRef" class="nav-dropdown profile" :class="{ active: isUserDropdownActive }">
            <button class="dropdown-btn" @click="toggleUserDropdown">
              <i class="fas fa-user-circle"></i>
              <span>{{ displayName }}</span>
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="dropdown-content">
              <div class="profile-header">
                <div class="user-info">
                  <div class="avatar">{{ getUserInitials }}</div>
                  <div class="user-details">
                    <div class="user-name">{{ user.name }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </div>
              </div>
              
              <router-link to="/profile" class="dropdown-item">
                <i class="fas fa-user-cog"></i> Profile Settings
              </router-link>
              
              <router-link to="/notifications" class="dropdown-item notification-item">
                <i class="fas fa-bell"></i> Notifications
                <span v-if="unreadNotifications > 0" class="notification-badge">
                  {{ unreadNotifications }}
                </span>
              </router-link>
              
              <div class="dropdown-divider"></div>
              
              <button @click="handleLogout" class="dropdown-item logout-btn">
                <i class="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        </template>
      </div>
    </nav>

    <NotificationsContainer />
    <router-view></router-view>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useNotificationStore } from './stores/notification';
import NotificationsContainer from './components/NotificationsContainer.vue';
import alertService from './services/alertService';


// Store and router setup
const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const route = useRoute();

// Refs for dropdowns  
const adminDropdownRef = ref(null);
const userDropdownRef = ref(null);
const isAdminDropdownActive = ref(false);
const isUserDropdownActive = ref(false);
const contentDropdownRef = ref(null);
const resourcesDropdownRef = ref(null);
const isContentDropdownActive = ref(false);
const isResourcesDropdownActive = ref(false);

// Computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed(() => authStore.user || null);
const isAdmin = computed(() => user.value?.role === 'admin');
const getUserInitials = computed(() => {
  if (!user.value?.name) return '?';
  return user.value.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

// Dropdown handlers
const toggleAdminDropdown = (event) => {
  event.stopPropagation();
  isAdminDropdownActive.value = !isAdminDropdownActive.value;
  isUserDropdownActive.value = false;
};

const toggleUserDropdown = (event) => {
  event.stopPropagation();
  isUserDropdownActive.value = !isUserDropdownActive.value;
  isAdminDropdownActive.value = false;
};

// Click outside handler
const handleClickOutside = (event) => {
  if (adminDropdownRef.value && !adminDropdownRef.value.contains(event.target)) {
    isAdminDropdownActive.value = false;
  }
  if (userDropdownRef.value && !userDropdownRef.value.contains(event.target)) {
    isUserDropdownActive.value = false;
  }
  if (contentDropdownRef.value && !contentDropdownRef.value.contains(event.target)) {
    isContentDropdownActive.value = false;
  }
  if (resourcesDropdownRef.value && !resourcesDropdownRef.value.contains(event.target)) {
    isResourcesDropdownActive.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Logout handler
const handleLogout = async (event) => {
  event.stopPropagation();
  try {
    isAdminDropdownActive.value = false;
    isUserDropdownActive.value = false;
    await authStore.logout();
    notificationStore.success('Logged out successfully');
    router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
    notificationStore.error('Error logging out');
  }
};

const alertCount = ref(0);

// Update the fetchAlertCount function
const fetchAlertCount = async () => {
  try {
    const { alerts, success } = await alertService.getActiveAlerts();
    if (success) {
      // Count only active alerts
      alertCount.value = alerts.filter(alert => alert.is_active).length;
    }
  } catch (error) {
    console.error('Error fetching alert count:', error);
    alertCount.value = 0;
  }
};

// Add watch for authentication changes
watch(() => isAuthenticated.value, (newValue) => {
  if (newValue) {
    fetchAlertCount();
  } else {
    alertCount.value = 0;
  }
});

// Update onMounted to check authentication before fetching
onMounted(() => {
  if (isAuthenticated.value) {
    fetchAlertCount();
  }
});

// Add this computed property alongside other computed properties
const displayName = computed(() => {
  if (!user.value) return 'Profile';
  if (isAdmin.value) return 'Admin';
  return user.value.name || user.value.username || 'Profile';
});

// Add this with other refs near the top
const unreadNotifications = ref(0);

// Add this function to fetch notification count
const fetchUnreadNotifications = async () => {
  try {
    // This should be replaced with your actual API call
    const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    const data = await response.json();
    if (data.success) {
      unreadNotifications.value = data.count;
    }
  } catch (error) {
    console.error('Error fetching notification count:', error);
  }
};

// Add this to your existing watch section
watch(() => isAuthenticated.value, (newValue) => {
  if (newValue) {
    fetchUnreadNotifications();
  } else {
    unreadNotifications.value = 0;
  }
});

// Add this to your existing onMounted
onMounted(() => {
  if (isAuthenticated.value) {
    fetchUnreadNotifications();
  }
});

// Add these with other refs
const isMobileMenuOpen = ref(false); 

// Add this function
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  document.body.classList.toggle('menu-open', isMobileMenuOpen.value);
};

// Watch for route changes
watch(() => route.path, () => {
  isAdminDropdownActive.value = false;
  isUserDropdownActive.value = false;
  isContentDropdownActive.value = false;
  isResourcesDropdownActive.value = false;
  isMobileMenuOpen.value = false;
  document.body.classList.remove('menu-open');
});

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Add these methods
const toggleContentDropdown = (event) => {
  event.stopPropagation();
  isContentDropdownActive.value = !isContentDropdownActive.value;
  isAdminDropdownActive.value = false;
};

const toggleResourcesDropdown = (event) => {
  event.stopPropagation();
  isResourcesDropdownActive.value = !isResourcesDropdownActive.value;
  isUserDropdownActive.value = false;
};
</script>

<style scoped>
/* Base styles */
.app-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0f9ff, #ffffff);
  padding-top: 80px;
}

/* Navbar with glass effect */
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(0, 209, 209, 0.1);
  animation: slideInDown 0.5s ease;
} 

@keyframes slideInDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Brand styling */
.nav-brand a {
  color: #00ADAD;
  font-size: 1.75rem;
  font-weight: 800;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  text-shadow: 0 2px 4px rgba(0, 92, 92, 0.1);
}

.nav-brand a:hover {
  color: #4052D6;
  transform: translateY(-1px);
}

.nav-brand i {
  color: #00D1D1;
  font-size: 2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 209, 209, 0.2));
}

/* Navigation links */
.nav-links {
  display: flex;
  align-items: center;
  gap: clamp(1rem, 2vw, 1.5rem);
}

.nav-link {
  color: #005C5C;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;  
  transition: all 0.3s ease;
  padding: 0.75rem clamp(0.75rem, 2vw, 1.25rem);
  border-radius: 12px;
  font-size: clamp(0.875rem, 2vw, 1rem);
  white-space: nowrap;
}

.nav-link:hover {
  color: #00D1D1;
  background: rgba(0, 209, 209, 0.08);
  transform: translateY(-1px);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #00D1D1, #4052D6);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(-50%);
  border-radius: 2px;
}

.nav-link:hover::after {
  width: 100%;
}

.nav-link i {
  color: #4052D6;
  transition: transform 0.3s ease;
}

/* Login and Register buttons */
.login-btn {
  background: rgba(0, 209, 209, 0.1);
  color: #00ADAD;
  border-radius: 12px;
  font-weight: 600;
}

.login-btn:hover {
  background: rgba(64, 82, 214, 0.1);
  color: #4052D6;
}

.register-btn {
  background: #00D1D1;
  color: white;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 209, 209, 0.2);
}

.register-btn:hover {
  background: #00ADAD;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 209, 209, 0.3);
}

/* Dropdown styling */
.nav-dropdown {
  position: relative;
  margin-left: 0.5rem;
}

.dropdown-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: rgba(0, 209, 209, 0.08);
  border: 1px solid rgba(0, 173, 173, 0.2);
  color: #005C5C;
  font-weight: 600;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 209, 209, 0.15);
}

.dropdown-btn i:last-child {
  font-size: 0.8rem;
  margin-left: 0.25rem;
  transition: transform 0.3s ease;
}

.nav-dropdown.active .dropdown-btn {
  background: rgba(64, 82, 214, 0.1);
  border-color: #4052D6;
  color: #4052D6;
}

.nav-dropdown.active .dropdown-btn i:last-child {
  transform: rotate(180deg);
}

.dropdown-content {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 240px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 92, 92, 0.12);
  padding: 0.75rem;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 209, 209, 0.1);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  transform-origin: top right;
  animation: scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.nav-dropdown.active .dropdown-content {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

/* Profile Section in Dropdown */
.profile-header {
  padding: 1rem;
  border-radius: 12px;
  background: rgba(0, 209, 209, 0.05);
  margin-bottom: 0.75rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00D1D1, #4052D6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.avatar::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transform: rotate(45deg);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #005C5C;
  font-size: 0.95rem;
}

.user-email {
  color: #00ADAD;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  color: #005C5C;
  text-decoration: none;
  font-weight: 500;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  width: 100%;
  background: transparent;
  border: none;
  text-align: left;
  animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.dropdown-item:nth-child(1) { animation-delay: 0.1s; }
.dropdown-item:nth-child(2) { animation-delay: 0.15s; }
.dropdown-item:nth-child(3) { animation-delay: 0.2s; }
.dropdown-item:nth-child(4) { animation-delay: 0.25s; }

.dropdown-item:hover {
  background: rgba(0, 209, 209, 0.08);
  color: #00D1D1;
  transform: translateX(4px);
}

.dropdown-item i {
  color: #4052D6;
  font-size: 1.1rem;
  transition: transform 0.2s ease;
}

.dropdown-item:hover i {
  transform: scale(1.1);
}

.dropdown-divider {
  height: 1px;
  background: rgba(0, 209, 209, 0.1);
  margin: 0.75rem 0;
}

/* Logout button specific styling */
.dropdown-item.logout-btn {
  color: #DC2626;
}

.dropdown-item.logout-btn i {
  color: #DC2626;
}

.dropdown-item.logout-btn:hover {
  background: rgba(220, 38, 38, 0.08);
  color: #DC2626;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dropdown-btn {
    padding: 0.625rem;
  }
  
  .dropdown-btn span {
    display: none;
  }
  
  .dropdown-content {
    right: -2rem;
    min-width: 280px;
  }
}

/* Add these styles */
.nav-link {
  position: relative;
}

.alert-badge {
  position: absolute;
  top: -6px;
  right: 0;
  background: #DC2626;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
  z-index: 2;
  transform: translateX(50%);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Update nav-link for proper badge positioning */
.nav-link {
  position: relative;
  padding-right: 2rem;
}

.notification-item {
  position: relative;
}

.notification-badge {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: #DC2626;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-item:hover .notification-badge {
  background: #B91C1C;
}

.dropdown-item.notification-item {
  padding-right: 3rem;
}

/* Mobile Navigation */
@media (max-width: 768px) {
  .navbar {
    padding: 1rem;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .mobile-menu-btn {
    display: block;
    background: transparent;
    border: none;
    color: #005C5C;
    font-size: 1.5rem;
    padding: 0.5rem;
    cursor: pointer;
  }

  .nav-links {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    flex-direction: column;
    padding: 1.5rem;
    gap: 0.75rem;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    overflow-y: auto;
    z-index: 1000;
    height: calc(100vh - 70px);
  }

  .nav-links.active {
    transform: translateX(0);
  }

  .nav-link {
    width: 100%;
    padding: 1rem 1.5rem;
    font-size: 1.1rem;
    justify-content: flex-start;
    border-radius: 12px;
    margin: 0;
  }

  .nav-dropdown {
    width: 100%;
    margin: 0;
    padding: 0 1rem;
  }

  .dropdown-btn {
    width: 100%;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: rgba(0, 209, 209, 0.05);
    border: none;
  }

  .dropdown-content {
    position: static;
    width: 100%;
    opacity: 0;
    visibility: hidden;
    height: 0;
    transform: none;
    box-shadow: none;
    margin-top: 0;
    padding: 0;
    background: white;
    border: 1px solid rgba(0, 209, 209, 0.1);
    border-radius: 12px;
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .nav-dropdown.active .dropdown-content {
    opacity: 1;
    visibility: visible;
    height: auto;
    margin-top: 0.5rem;
    padding: 1rem;
  }

  /* Keep existing profile header and item styles */
  .profile-header {
    background: rgba(0, 209, 209, 0.05);
    margin: -1rem -1rem 1rem -1rem;
    padding: 1.5rem;
    border-radius: 12px 12px 0 0;
  }

  .user-info {
    gap: 1.25rem;
  }

  .avatar {
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
  }

  .user-name {
    font-size: 1.1rem;
  }

  .user-email {
    font-size: 0.9rem;
  }

  .dropdown-item {
    padding: 1rem 1.5rem;
    margin-bottom: 0.75rem;
    background: rgba(0, 209, 209, 0.05);
    border-radius: 12px;
    font-size: 1rem;
  }

  .dropdown-item:last-child {
    margin-bottom: 0;
  }

  .dropdown-divider {
    margin: 1rem -1rem;
    border-top: 1px solid rgba(0, 209, 209, 0.1);
  }

  .notification-item {
    position: relative;
    padding-right: 3.5rem;
  }

  .notification-badge {
    right: 1.5rem;
  }

  /* Animation for dropdown */
  .nav-dropdown.active .dropdown-content {
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {   
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Fix scrolling when menu is open */
  body.menu-open {
    overflow: hidden;
  }

  /* Ensure proper spacing for notification badges */
  .nav-link, 
  .dropdown-item {
    position: relative;
    padding-right: 3rem;
  }

  /* Improve touch targets */
  .nav-link,
  .dropdown-btn,
  .dropdown-item {
    min-height: 48px;
  }
}

/* Tablet Optimization */
@media (min-width: 769px) and (max-width: 1024px) {
  .nav-link span {
    display: none;
  }
  
  .nav-link i {
    font-size: 1.25rem;
  }
  
  .nav-link {
    padding: 0.75rem;
  }
}

/* Mobile Navigation Styles */
.mobile-menu-btn {
  display: none;
  background: transparent;
  border: none;
  color: #005C5C;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.3s ease;
}

.mobile-menu-btn:hover {
  color: #00D1D1;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 768px) {
  .navbar {
    padding: 0.75rem 1rem;
  }

  .mobile-menu-btn {
    display: block;
    margin-left: 1rem;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .nav-links {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    flex-direction: column;
    padding: 1.5rem;
    gap: 1rem;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
    z-index: 1000;
  }

  .nav-links.active {
    transform: translateX(0);
  }

  .nav-link {
    width: 100%;
    justify-content: flex-start;
    padding: 1rem;
    border-radius: 12px;
    font-size: 1.1rem;
  }

  .nav-dropdown {
    width: 100%;
    margin: 0;
  }

  .dropdown-btn {
    width: 100%;
    justify-content: flex-start;
  }

  .dropdown-content {
    position: static;
    width: 100%;
    opacity: 1;
    visibility: visible;
    transform: none;
    box-shadow: none;
    margin-top: 0.5rem;
    padding: 0;
    background: transparent;
    border: none;
  }

  .dropdown-item {
    padding: 1rem;
    background: rgba(0, 209, 209, 0.05);
    margin-bottom: 0.5rem;
    border-radius: 12px;
  }

  .alert-badge {
    right: 1rem;
  }

  .notification-badge {
    right: 1rem;
  }
}

/* Improve touch targets for mobile */
@media (max-width: 768px) {
  .nav-link,
  .dropdown-btn,
  .dropdown-item {
    min-height: 48px;
  }

  .mobile-menu-btn {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* Add smooth inertia scrolling for mobile */
@supports (-webkit-overflow-scrolling: touch) {
  .nav-links {
    -webkit-overflow-scrolling: touch;
  }
}

/* Resources Dropdown Specific Styles */
.nav-dropdown.resources .dropdown-btn {
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.1) 0%, rgba(64, 82, 214, 0.1) 100%);
  border: 1px solid rgba(0, 209, 209, 0.2);
}

.nav-dropdown.resources .dropdown-btn:hover {
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.15) 0%, rgba(64, 82, 214, 0.15) 100%);
}

.nav-dropdown.resources .dropdown-content {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(0, 209, 209, 0.15);
  padding: 0.5rem;
}

.nav-dropdown.resources .dropdown-item {
  border-radius: 8px;
  margin-bottom: 0.25rem;
  padding: 0.75rem 1rem;
}

.nav-dropdown.resources .dropdown-item i {
  color: #00D1D1;
  background: rgba(0, 209, 209, 0.1);
  padding: 0.5rem;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Profile Dropdown Specific Styles */
.nav-dropdown.profile .dropdown-btn {
  background: white;
  border: 1px solid rgba(64, 82, 214, 0.2);
  box-shadow: 0 2px 8px rgba(64, 82, 214, 0.1);
}

.nav-dropdown.profile .dropdown-btn:hover {
  border-color: #4052D6;
}

.nav-dropdown.profile .dropdown-content {
  background: white;
  border: none;
  box-shadow: 0 4px 20px rgba(64, 82, 214, 0.15);
}

.nav-dropdown.profile .profile-header {
  background: linear-gradient(135deg, #4052D6 0%, #00D1D1 100%);
  margin: -0.75rem -0.75rem 0.75rem -0.75rem;
  padding: 1.5rem;
  border-radius: 12px 12px 0 0;
  color: white;
}

.nav-dropdown.profile .user-info {
  gap: 1rem;
}

.nav-dropdown.profile .avatar {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
}

.nav-dropdown.profile .user-name {
  color: white;
  font-weight: 600;
}

.nav-dropdown.profile .user-email {
  color: rgba(255, 255, 255, 0.8);
}

.nav-dropdown.profile .dropdown-item {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-dropdown.profile .dropdown-item i {
  color: #4052D6;
}

.nav-dropdown.profile .dropdown-divider {
  background: rgba(64, 82, 214, 0.1);
}

.nav-dropdown.profile .logout-btn {
  color: #DC2626;
}

.nav-dropdown.profile .logout-btn i {
  color: #DC2626;
}

/* Mobile Responsive Adjustments */
@media (max-width: 768px) {
  .nav-dropdown.resources .dropdown-content,
  .nav-dropdown.profile .dropdown-content {
    background: white;
    border-radius: 12px;
    margin: 0.5rem 0;
  }
  
  .nav-dropdown.profile .profile-header {
    margin: 0 0 0.75rem 0;
    border-radius: 8px;
  }
}

/* Add this to your existing styles */
.brand-logo {
  height: 48px;
  width: auto;
  margin-right: 0.75rem;
}
</style>