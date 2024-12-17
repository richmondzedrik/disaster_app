<template>
  <div class="admin-login-container">
    <div class="admin-login-card">
      <div class="login-header">
        <i class="fas fa-shield-alt header-icon"></i>
        <h2>Admin Login</h2>
        <p class="subtitle">Access SafeAlert Admin Panel</p>
      </div>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">
            <i class="fas fa-envelope"></i> Admin Email
          </label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            placeholder="Enter admin email"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="password">
            <i class="fas fa-lock"></i> Password
          </label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            placeholder="Enter password"
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          {{ error }}
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <i class="fas fa-sign-in-alt"></i>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="back-link">
        <router-link to="/login">
          <i class="fas fa-arrow-left"></i> Back to Regular Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notification';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const validateForm = () => {
    error.value = '';
    
    if (!email.value || !password.value) {
        error.value = 'All fields are required';
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        error.value = 'Please enter a valid email address';
        return false;
    }

    return true;
};

const handleSubmit = async () => {
    if (!validateForm()) return;
    
    loading.value = true;
    error.value = '';
    
    try {
        const response = await authStore.login({
            email: email.value.trim(),
            password: password.value.trim(),
            isAdmin: true
        });

        if (response.success && response.user) {
            const userData = response.user;
            
            if (userData.role !== 'admin') {
                throw new Error('Access denied: Admin privileges required');
            }

            notificationStore.success('Welcome back, Admin!');
            await router.push('/admin');
        } else {
            throw new Error('Invalid admin credentials');
        }
    } catch (err) {
        error.value = err.response?.data?.message || err.message || 'Login failed';
        notificationStore.error(error.value);
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.admin-login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
}

.admin-login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

/* Reuse styles from Login.vue but with admin-specific colors */
.header-icon {
  font-size: 2.5rem;
  color: #1e40af;
  margin-bottom: 1rem;
}

.error-message {
  color: #dc2626;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.submit-btn {
  width: 100%;
  padding: 0.875rem;
  background: #1e40af;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-btn:hover {
  background: #1e3a8a;
}

.submit-btn:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.back-link {
  margin-top: 1.5rem;
  text-align: center;
}

.back-link a {
  color: #1e40af;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.back-link a:hover {
  text-decoration: underline;
}
</style> 