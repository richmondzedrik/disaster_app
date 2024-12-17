<template>
  <div class="forgot-password-container">
    <div class="forgot-password-card">
      <div class="title-group">
        <i class="fas fa-lock-open title-icon"></i>
        <h2>Forgot Password</h2>
        <p class="subtitle">Enter your email to reset your password</p>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email Address</label>
          <div class="input-group">
            <i class="fas fa-envelope input-icon"></i>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              placeholder="Enter your email"
              required 
              :disabled="loading"
            />
          </div>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <i :class="['fas', loading ? 'fa-spinner fa-spin' : 'fa-paper-plane']"></i>
          {{ loading ? 'Sending...' : 'Send Reset Link' }}
        </button>

        <div v-if="message" :class="['message', messageType]">
          <i :class="['fas', messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle']"></i>
          {{ message }}
        </div>
      </form>

      <div class="links">
        <router-link to="/login" class="back-link">
          <i class="fas fa-arrow-left"></i>
          Back to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '../stores/notification';
import { authService } from '../services/auth';

const email = ref('');
const loading = ref(false);
const message = ref('');
const messageType = ref('');
const router = useRouter();
const notificationStore = useNotificationStore();

const handleSubmit = async () => {
  if (!email.value) {
    notificationStore.error('Email is required');
    return;
  }

  try {
    loading.value = true;
    const response = await authService.forgotPassword(email.value);
    if (response.success) {
      message.value = 'Password reset instructions sent to your email';
      messageType.value = 'success';
      notificationStore.success(message.value);
    }
  } catch (err) {
    message.value = err.response?.data?.message || 'Failed to process request';
    messageType.value = 'error';
    notificationStore.error(message.value);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
}

.forgot-password-card {
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

h2 {
  color: #2c3e50;
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6c757d;
  font-size: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
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

input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
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

.submit-btn:hover:not(:disabled) {
  background-color: #3aa876;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
}

.links {
  margin-top: 1.5rem;
  text-align: center;
}

.back-link {
  color: #42b983;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: #3aa876;
}

@media (max-width: 480px) {
  .forgot-password-container {
    padding: 1rem;
  }

  .forgot-password-card {
    padding: 1.5rem;
  }

  h2 {
    font-size: 1.5rem;
  }
}
</style> 