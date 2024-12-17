<template>
  <div class="reset-password-container">
    <div class="reset-password-card">
      <div class="title-group">
        <i class="fas fa-key title-icon"></i>
        <h2>Reset Password</h2>
        <p class="subtitle">Enter your new password</p>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="password">New Password</label>
          <div class="input-group">
            <i class="fas fa-lock input-icon"></i>
            <input
              type="password"
              id="password"
              v-model="password"
              placeholder="Enter new password"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <div class="input-group">
            <i class="fas fa-lock input-icon"></i>
            <input
              type="password"
              id="confirmPassword"
              v-model="confirmPassword"
              placeholder="Confirm new password"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading || !isValid">
          <i :class="['fas', loading ? 'fa-spinner fa-spin' : 'fa-check']"></i>
          {{ loading ? 'Resetting...' : 'Reset Password' }}
        </button>

        <div v-if="error" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotificationStore } from '../stores/notification';
import { authService } from '../services/auth';

const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const isValid = computed(() => {
  return password.value && 
         confirmPassword.value && 
         password.value === confirmPassword.value &&
         password.value.length >= 8;
});

const handleSubmit = async () => {
  if (!isValid.value) {
    error.value = 'Please check your password inputs';
    return;
  }

  try {
    loading.value = true;
    error.value = '';
    
    // Get token from URL query parameter
    const token = route.query.token;
    
    if (!token) {
      throw new Error('Reset token is missing');
    }

    await authService.resetPassword(token, password.value);
    notificationStore.success('Password reset successful');
    router.push('/login');
  } catch (err) {
    console.error('Reset password error:', err);
    error.value = err.response?.data?.message || 'Failed to reset password';
    notificationStore.error(error.value);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.reset-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
}

.reset-password-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

.title-group {
  text-align: center;
  margin-bottom: 2rem;
}

.title-icon {
  font-size: 3rem;
  color: #42b983;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.input-group {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.5rem;
  border: 1.5px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66,185,131,0.1);
}

.submit-btn {
  width: 100%;
  padding: 0.875rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.submit-btn:hover:not(:disabled) {
  background-color: #3aa876;
  transform: translateY(-1px);
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

@media (max-width: 480px) {
  .reset-password-container {
    padding: 1rem;
  }

  .reset-password-card {
    padding: 1.5rem;
  }
}
</style> 