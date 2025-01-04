<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <i class="fas fa-shield-alt header-icon"></i>
        <h2>Welcome Back</h2>
        <p class="subtitle">Sign in to continue to SafeAlert</p>
      </div>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">
            <i class="fas fa-envelope"></i> Email
          </label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            placeholder="Enter your email"
            :disabled="loading"
            :class="{ 'error': error && error.toLowerCase().includes('email') }"
          />
          <span class="error-message" v-if="error && error.toLowerCase().includes('email')">
            <i class="fas fa-exclamation-triangle"></i>
            {{ error }}
          </span>
        </div>
        
        <div class="form-group">
          <label for="password">
            <i class="fas fa-lock"></i> Password
          </label>
          <div class="password-input">
            <input 
              :type="showPassword ? 'text' : 'password'"
              id="password" 
              v-model="password" 
              required 
              placeholder="Enter your password"
              :disabled="loading"
              :class="{ 'error': error && error.toLowerCase().includes('password') }"
            />
            <i 
              class="fas password-toggle" 
              :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"
              @click="showPassword = !showPassword"
            ></i>
          </div>
          <span class="error-message" v-if="error && error.toLowerCase().includes('password')">
            <i class="fas fa-exclamation-triangle"></i>
            {{ error }}
          </span>
        </div>

        <span class="error-message" v-if="error && !error.toLowerCase().includes('email') && !error.toLowerCase().includes('password')">
          <i class="fas fa-exclamation-triangle"></i>
          {{ error }}
        </span>

        <div class="form-options">
          <router-link to="/forgot-password" class="forgot-password-link">
            <i class="fas fa-key"></i>
            <span>Forgot Password?</span>
          </router-link>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <i class="fas fa-sign-in-alt"></i>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="links">
        <div class="links-divider">
          <span>or</span>
        </div>
        <p class="register-prompt">
          Don't have an account? 
          <router-link to="/register" class="register-link">
            <i class="fas fa-user-plus"></i> Create Account
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notification';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

// Add validation function
const validateForm = () => {
    error.value = '';
    
    if (!email.value.trim() || !password.value.trim()) {
        error.value = 'All fields are required';
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value.trim())) {
        error.value = 'Please enter a valid email address';
        return false;
    }

    if (password.value.trim().length < 6) {
        error.value = 'Password must be at least 6 characters';
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
            password: password.value.trim()
        });

        if (response && response.success) {
            const userData = response.user;
            
            if (!userData || !userData.role) {
                throw new Error('Invalid user data received');
            }

            notificationStore.success('Login successful!');

            if (userData.role === 'admin') {
                await router.push('/admin/dashboard');
            } else {
                await router.push('/');
            }
        } else {
            throw new Error(response?.message || 'Login failed');
        }
    } catch (err) {
        console.error('Login error:', err);
        error.value = err.response?.data?.message || err.message || 'Login failed. Please try again.';
        notificationStore.error(error.value);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    // Check if user just verified their email
    const verified = route.query.verified;
    const emailFromQuery = route.query.email;
    
    if (verified === 'true' && emailFromQuery) {
        email.value = emailFromQuery;
        notificationStore.success('Email verified successfully! Please login to continue.');
    }
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.1) 0%, rgba(64, 82, 214, 0.1) 100%);
}

.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 92, 92, 0.08);
  width: 100%;
  max-width: 450px;
  border: 1px solid rgba(0, 173, 173, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.header-icon {
  font-size: 3rem;
  color: #00D1D1;
  margin-bottom: 1.25rem;
  filter: drop-shadow(0 4px 6px rgba(0, 209, 209, 0.2));
}

h2 {
  color: #005C5C;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #00ADAD;
  font-size: 1.1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #005C5C;
  margin-bottom: 0.75rem;
  font-weight: 500;
  font-size: 1rem;
}

label i {
  color: #00D1D1;
}

input {
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(0, 173, 173, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  color: #005C5C;
}

input:focus {
  outline: none;
  border-color: #00D1D1;
  box-shadow: 0 0 0 4px rgba(0, 209, 209, 0.1);
}

input::placeholder {
  color: rgba(0, 92, 92, 0.4);
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 209, 209, 0.2);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 209, 209, 0.3);
}

.submit-btn:disabled {
  background: linear-gradient(135deg, #a8d5d5 0%, #9ba3e6 100%);
  cursor: not-allowed;
}

.forgot-password-link, .register-link {
  color: #4052D6;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.forgot-password-link:hover, .register-link:hover {
  color: #00D1D1;
}

.error {
  border-color: #ff3b3b;
}

.error-message {
  color: #ff3b3b;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

input.error {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.05);
}

input.error:focus {
  box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.1);
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 6px;
  background-color: rgba(220, 53, 69, 0.05);
}

.error-message i {
  color: #dc3545;
}

.table-container {
  padding: 2rem;
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
}

.admin-table th {
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.1) 0%, rgba(64, 82, 214, 0.1) 100%);
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  color: #005C5C;
  border-bottom: 2px solid rgba(0, 173, 173, 0.1);
  white-space: nowrap;
}

.admin-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 173, 173, 0.1);
  vertical-align: middle;
}

.username-cell, .email-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-cell {
  width: 120px;
}

.verification-cell {
  width: 140px;
}

.date-cell {
  width: 120px;
  white-space: nowrap;
}

.actions-cell {
  width: 100px;
  text-align: center;
}

.role-select {
  width: 100%;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(0, 173, 173, 0.2);
}

.admin-table tr:hover {
  background-color: rgba(0, 209, 209, 0.05);
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #6c757d;
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: #42b983;
}

.links {
  margin-top: 2rem;
  text-align: center;
}

.links-divider {
  position: relative;
  margin: 1.5rem 0;
}

.links-divider::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(0, 173, 173, 0.2);
}

.links-divider span {
  position: relative;
  background: white;
  padding: 0 1rem;
  color: #6c757d;
  font-size: 0.9rem;
}

.register-prompt {
  color: #005C5C;
  font-size: 1rem;
}

.register-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #4052D6;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-left: 0.5rem;
}

.register-link:hover {
  color: #00D1D1;
  transform: translateY(-1px);
}

.form-options {
  display: flex;
  justify-content: flex-end;
  margin: -0.5rem 0 1.5rem;
}

.forgot-password-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #4052D6;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 0.5rem;
  border-radius: 6px;
}

.forgot-password-link:hover {
  color: #00D1D1;
  transform: translateY(-1px);
  background: rgba(0, 209, 209, 0.05);
}

.forgot-password-link i {
  font-size: 0.9rem;
}
</style>