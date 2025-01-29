<template>
  <div class="users-view">
    <div class="header">
      <div class="header-content">
        <h1>User Management</h1>
        <p>Manage user accounts, roles, and permissions</p>
      </div>
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search users..."
          @input="filterUsers"
        >
      </div>
    </div>

    <div v-if="error" class="error-container">
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
        <button @click="fetchUsers(true)" class="retry-btn">
          <i class="fas fa-redo"></i> Retry
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="table-container">
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Verified</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in 5" :key="i" class="skeleton-row">
            <td>
              <div class="skeleton-text"></div>
            </td>
            <td>
              <div class="skeleton-text"></div>
            </td>
            <td>
              <div class="skeleton-badge"></div>
            </td>
            <td>
              <div class="skeleton-badge short"></div>
            </td>
            <td>
              <div class="skeleton-text short"></div>
            </td>
            <td>
              <div class="skeleton-button"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Verified</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>
              <select 
                v-model="user.role"
                @change="updateUserRole(user.id, user.role)"
                :disabled="user.id === currentUserId"
                class="role-select"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td>
              <span :class="['status-badge', user.email_verified ? 'verified' : 'unverified']">
                {{ user.email_verified ? 'Verified' : 'Unverified' }}
              </span>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td class="action-buttons">
              <button 
                @click="deleteUser(user.id)"
                :disabled="user.role === 'admin' || user.id === currentUserId"
                class="btn btn-danger"
              >
                <i class="fas fa-trash"></i>
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';
import adminService from '@/services/adminService';
import { ref as vueRef } from 'vue';
import { useRouter } from 'vue-router';

const users = ref([]);
const filteredUsers = ref([]);
const searchQuery = ref('');
const isLoading = ref(true);
const error = ref(null);
const retryCount = ref(0);
const maxRetries = 3;

const notificationStore = useNotificationStore();
const authStore = useAuthStore();
const router = useRouter();

const currentUserId = computed(() => authStore.user?.id);

const filterUsers = () => {
  const query = searchQuery.value.toLowerCase();
  filteredUsers.value = users.value.filter(user => 
    user.username?.toLowerCase().includes(query) ||
    user.email?.toLowerCase().includes(query)
  );
};

// Add this before fetchUsers
const checkAuth = () => {
    const token = authStore.accessToken || localStorage.getItem('token');
    if (!token) {
        notificationStore.error('Authentication required');
        router.push('/login');
        return false;
    }
    return true;
};

// Modify fetchUsers to check auth first
const fetchUsers = async (retry = false) => {
    if (!checkAuth()) return;
    
    if (retry && retryCount.value >= maxRetries) {
        notificationStore.error('Maximum retry attempts reached. Please refresh the page.');
        return;
    }

    try {
        isLoading.value = true;
        error.value = null;

        const response = await adminService.getUsers();
        
        if (!response?.data) {
            throw new Error('Invalid response format');
        }

        users.value = response.data;
        filteredUsers.value = response.data;
        retryCount.value = 0;
        error.value = null;

    } catch (err) {
        console.error('Error fetching users:', err);
        error.value = err.message;
        
        if (err.message.includes('Authentication failed')) {
            notificationStore.error('Session expired. Please login again.');
            router.push('/login');
            return;
        }
        
        if (retry && retryCount.value < maxRetries) {
            retryCount.value++;
            const delay = Math.min(1000 * Math.pow(2, retryCount.value), 10000);
            setTimeout(() => fetchUsers(true), delay);
            notificationStore.warning(`Retrying... Attempt ${retryCount.value} of ${maxRetries}`);
        }
    } finally {
        isLoading.value = false;
    }
};

// Add error handling for role updates
const updateUserRole = async (userId, newRole) => {
  try {
    await adminService.updateUserRole(userId, newRole);
    notificationStore.success('User role updated successfully');
    
    // Refresh user list to ensure consistency
    await fetchUsers();
    
  } catch (error) {
    console.error('Role update error:', error);
    notificationStore.error('Failed to update user role. Please try again.');
    
    // Revert the role selection in the UI
    const user = users.value.find(u => u.id === userId);
    if (user) {
      user.role = user.originalRole;
    }
  }
};

// Add confirmation and error handling for user deletion
const deleteUser = async (userId) => {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }
  
  try {
    isLoading.value = true;
    await adminService.deleteUser(userId);
    await fetchUsers();
    notificationStore.success('User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    notificationStore.error('Failed to delete user. Please try again.');
  } finally {
    isLoading.value = false;
  }
};

// Initialize with retry capability
onMounted(() => {
  fetchUsers(true);
});

// Watch for search query changes
watch(searchQuery, () => {
  filterUsers();
});

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>

<style scoped>
.users-view {
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  padding: 3rem 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
  animation: slideDown 0.6s ease;
}

@keyframes slideDown {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.header-content h1 {
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: 800;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content p {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.search-bar {
  position: relative;
  width: 300px;
  margin-left: auto;
}

.search-bar input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: 'Inter', sans-serif;
  letter-spacing: -0.01em;
  animation: slideIn 0.5s ease;
}

@keyframes slideIn {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.search-bar input:focus {
  outline: none;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.search-bar::before {
  content: '\f002';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #4052D6;
}

.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
  overflow: hidden;
  border: 1px solid rgba(0, 173, 173, 0.1);
  transition: all 0.3s ease;
  animation: fadeUp 0.7s ease;
}

@keyframes fadeUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.table-container.loading {
  opacity: 1;
  pointer-events: none;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.1) 0%, rgba(64, 82, 214, 0.1) 100%);
  padding: 1.25rem 1.5rem;
  font-weight: 600;
  color: #005C5C;
  text-align: left;
  border-bottom: 2px solid rgba(0, 173, 173, 0.1);
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  font-size: 0.875rem;
}

td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(0, 173, 173, 0.1);
  color: #1f2937;
  font-family: 'Inter', sans-serif;
  letter-spacing: -0.01em;
  line-height: 1.5;
}

.role-select {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(0, 173, 173, 0.2);
  border-radius: 8px;
  background: white;
  color: #005C5C;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 120px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.role-select:disabled {
  background: #f8fafc;
  cursor: not-allowed;
  opacity: 0.7;
}

.role-select:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 173, 173, 0.15);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.02em;
  transition: all 0.3s ease;
}

.status-badge.verified {
  background: #e8f5e9;
  color: #1b5e20;
}

.status-badge.unverified {
  background: #fde7e7;
  color: #c62828;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.01em;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-danger {
  background: #fde7e7;
  color: #c62828;
}

.btn-danger:hover:not(:disabled) {
  background: #c62828;
  color: white;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(198, 40, 40, 0.2);
}

tr {
  transition: all 0.3s ease;
}

tr:hover {
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.02) 0%, rgba(64, 82, 214, 0.02) 100%);
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1.5rem;
    padding: 2rem 1.5rem;
  }

  .search-bar {
    width: 100%;
    margin-left: 0;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .table-container {
    overflow-x: auto;
  }

  td, th {
    padding: 1rem;
  }
}

.error-container {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 8px;
  background: #fde7e7;
  color: #c62828;
  animation: fadeIn 0.3s ease;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.retry-btn {
  margin-left: auto;
  padding: 0.5rem 1rem;
  border: 1px solid #c62828;
  border-radius: 6px;
  background: transparent;
  color: #c62828;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #c62828;
  color: white;
}

.skeleton-row td {
  padding: 1.25rem 1.5rem;
}

.skeleton-text {
  height: 20px;
  background: #f0f0f0;
  border-radius: 4px;
  width: 100%;
  animation: pulse 1.5s infinite;
}

.skeleton-text.short {
  width: 80px;
}

.skeleton-badge {
  height: 32px;
  width: 100px;
  background: #f0f0f0;
  border-radius: 999px;
  animation: pulse 1.5s infinite;
}

.skeleton-badge.short {
  width: 80px;
}

.skeleton-button {
  height: 38px;
  width: 90px;
  background: #f0f0f0;
  border-radius: 8px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.6;
  }
}
</style>