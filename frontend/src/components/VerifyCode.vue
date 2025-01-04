<template>
  <div class="verify-container">
    <div class="verify-card">
      <div class="verify-header">
        <i class="fas fa-envelope-open-text"></i>
        <h2>Verify Your Email</h2>
        <p class="info-text">
          We've sent a verification code to:<br/>
          <strong>{{ email }}</strong>
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="verify-form">
        <div class="code-input-group">
          <label for="code">Enter 6-digit Verification Code</label>
          <input 
            type="text" 
            id="code"
            v-model="code"
            required
            maxlength="6"
            pattern="[0-9]{6}"
            placeholder="000000"
            class="code-input"
          />
        </div>

        <button type="submit" :disabled="loading" class="verify-btn">
          <i class="fas fa-check-circle" v-if="!loading"></i>
          <i class="fas fa-spinner fa-spin" v-else></i>
          {{ loading ? 'Verifying...' : 'Verify Code' }}
        </button>

        <div v-if="error" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          {{ error }}
        </div>
      </form>

      <div class="actions">
        <button 
          @click="resendCode" 
          :disabled="loading || resendLoading" 
          class="resend-btn"
        >
          <i class="fas fa-redo" v-if="!resendLoading"></i>
          <i class="fas fa-spinner fa-spin" v-else></i>
          {{ resendLoading ? 'Sending...' : 'Resend Code' }}
        </button>

        <router-link to="/login" class="login-link">
          <i class="fas fa-arrow-left"></i>
          Back to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useNotificationStore } from '../stores/notification';
import { authService } from '../services/auth';

const code = ref('');
const loading = ref(false);
const resendLoading = ref(false);
const error = ref('');
const router = useRouter();
const route = useRoute();
const notificationStore = useNotificationStore();
const email = ref(route.query.email || localStorage.getItem('pendingVerificationEmail'));

const validateForm = () => {
  if (!code.value || code.value.length !== 6) {
    error.value = 'Please enter a valid 6-digit code';
    return false;
  }
  return true;
};

onMounted(() => {
  if (!email.value) {
    notificationStore.error('No email found for verification');
    router.push('/register');
    return;
  }

  // Check if user is already verified or admin
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    if (userData.is_admin) {
      notificationStore.info('Admin accounts do not require verification.');
      router.push('/dashboard');
      return;
    }
    if (userData.email_verified) {
      notificationStore.info('Your email is already verified.');
      router.push('/dashboard');
      return;
    }
  }
});

const handleSubmit = async () => {
    if (!email.value || !code.value) {
        error.value = 'Both email and code are required';
        return;
    }

    loading.value = true;
    error.value = '';

    try {
        // Add Content-Type header to ensure proper parsing
        const response = await authService.verifyCode(email.value, code.value);
        
        if (response.success) {
            localStorage.removeItem('pendingVerificationEmail');
            router.push({
                path: '/login',
                query: { verified: 'true', email: email.value }
            });
        } else {
            throw new Error(response.message || 'Verification failed');
        }
    } catch (err) {
        console.error('Verification error:', err);
        error.value = err.message || 'Verification failed. Please try again.';
        notificationStore.error(error.value);
    } finally {
        loading.value = false;
    }
};

const resendCode = async () => {
  if (!email.value) {
    notificationStore.error('Email address is required');
    return;
  }

  resendLoading.value = true;
  error.value = '';
  
  try {
    const response = await authService.resendVerificationCode(email.value);
    notificationStore.success(response.message);
  } catch (err) {
    console.error('Resend code error:', err);
    error.value = err.message;
    notificationStore.error(err.message);
  } finally {
    resendLoading.value = false;
  }
};
</script>

<style scoped>
.verify-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
  padding: 1rem;
}

.verify-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 450px;
  padding: 2rem;
}

.verify-header {
  text-align: center;
  margin-bottom: 2rem;
}

.verify-header i {
  font-size: 3rem;
  color: #42b983;
  margin-bottom: 1rem;
}

.verify-header h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.info-text {
  color: #666;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.info-text strong {
  color: #2c3e50;
  font-weight: 600;
}

.code-input-group {
  margin-bottom: 1.5rem;
}

.code-input-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

.code-input {
  width: 100%;
  padding: 1rem;
  font-size: 1.2rem;
  text-align: center;
  letter-spacing: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.3s ease;
}

.code-input:focus {
  border-color: #42b983;
  outline: none;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.verify-btn {
  width: 100%;
  padding: 1rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.verify-btn:hover:not(:disabled) {
  background-color: #3aa876;
}

.verify-btn:disabled {
  background-color: #a8d5c2;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 6px;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.actions {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.resend-btn {
  background-color: transparent;
  color: #42b983;
  border: 2px solid #42b983;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.resend-btn:hover:not(:disabled) {
  background-color: #42b983;
  color: white;
}

.resend-btn:disabled {
  border-color: #a8d5c2;
  color: #a8d5c2;
  cursor: not-allowed;
}

.login-link {
  color: #666;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: color 0.3s ease;
}

.login-link:hover {
  color: #42b983;
}

@media (max-width: 480px) {
  .verify-card {
    padding: 1.5rem;
  }

  .verify-header i {
    font-size: 2.5rem;
  }

  .verify-header h2 {
    font-size: 1.5rem;
  }
}
</style> 