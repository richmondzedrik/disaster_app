<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <i class="fas fa-shield-alt header-icon"></i>
        <h2>Create Account</h2>
        <p class="subtitle">Join SafeAlert to stay prepared and informed</p>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">
            <i class="fas fa-user"></i> Username
          </label>
          <div class="input-wrapper">
            <input
              type="text"
              id="username"
              v-model="formData.username"
              required
              placeholder="Choose a username"
              :class="{ 
                'error': errors.username,
                'success': usernameAvailable === true 
              }"
            />
            <span class="input-status" v-if="isCheckingUsername">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
          </div>
          <span class="error-message" v-if="errors.username">
            <i class="fas fa-exclamation-triangle"></i>
            {{ errors.username }}
          </span>
          <span class="success-message" v-else-if="usernameAvailable === true">
            <i class="fas fa-check-circle"></i>
            Username is available
          </span>
        </div>

        <div class="form-group">
          <label for="email">
            <i class="fas fa-envelope"></i> Email
          </label>
          <div class="input-wrapper">
            <input
              type="email"
              id="email"
              v-model="formData.email"
              required
              placeholder="Enter your email"
              :class="{ 
                'error': errors.email,
                'success': emailAvailable === true 
              }"
            />
            <span class="input-status" v-if="isCheckingEmail">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
          </div>
          <span class="error-message" v-if="errors.email">
            <i class="fas fa-exclamation-triangle"></i>
            {{ errors.email }}
          </span>
          <span class="success-message" v-else-if="emailAvailable === true">
            <i class="fas fa-check-circle"></i>
            Email is available
          </span>
        </div>

        <div class="form-group">
          <label for="password">
            <i class="fas fa-lock"></i> Password
          </label>
          <input
            type="password"
            id="password"
            v-model="formData.password"
            required
            placeholder="Create a password"
            :class="{ 'error': errors.password }"
          />
          <span class="error-message" v-if="errors.password">
            <i class="fas fa-exclamation-triangle"></i>
            {{ errors.password }}
          </span>
          <span class="password-hint" v-else>
            <i class="fas fa-info-circle"></i>
            Password must include: 8+ characters, uppercase & lowercase letters, and numbers
          </span>
        </div>

        <div class="password-strength" v-if="formData.password">
          <div class="strength-item" :class="{ valid: passwordStrength.length }">
            <i :class="['fas', passwordStrength.length ? 'fa-check' : 'fa-times']"></i>
            8+ characters
          </div>
          <div class="strength-item" :class="{ valid: passwordStrength.uppercase }">
            <i :class="['fas', passwordStrength.uppercase ? 'fa-check' : 'fa-times']"></i>
            Uppercase letter
          </div>
          <div class="strength-item" :class="{ valid: passwordStrength.lowercase }">
            <i :class="['fas', passwordStrength.lowercase ? 'fa-check' : 'fa-times']"></i>
            Lowercase letter
          </div>
          <div class="strength-item" :class="{ valid: passwordStrength.number }">
            <i :class="['fas', passwordStrength.number ? 'fa-check' : 'fa-times']"></i>
            Number
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">
            <i class="fas fa-lock"></i> Confirm Password
          </label>
          <div class="input-wrapper">
            <input
              type="password"
              id="confirmPassword"
              v-model="formData.confirmPassword"
              required
              placeholder="Confirm your password"
              :class="{ 
                'error': errors.confirmPassword,
                'success': formData.confirmPassword && formData.confirmPassword === formData.password 
              }"
            />
          </div>
          <span class="error-message" v-if="errors.confirmPassword">
            <i class="fas fa-exclamation-triangle"></i>
            {{ errors.confirmPassword }}
          </span>
          <span class="success-message" v-else-if="formData.confirmPassword && formData.confirmPassword === formData.password">
            <i class="fas fa-check-circle"></i>
            Passwords match
          </span>
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading">
          <i :class="['fas', isLoading ? 'fa-spinner fa-spin' : 'fa-user-plus']"></i>
          {{ isLoading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <div class="links">
        <router-link to="/login" class="login-link">
          <i class="fas fa-arrow-left"></i> Already have an account? Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notification';
import { debounce } from 'lodash';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const isLoading = ref(false);

const passwordStrength = ref({
  length: false,
  uppercase: false,
  lowercase: false,
  number: false
});

const isCheckingUsername = ref(false);
const usernameAvailable = ref(null);

const checkUsernameAvailability = debounce(async (username) => {
  if (!username) {
    usernameAvailable.value = null;
    errors.username = '';
    return;
  }

  if (username.length < 3) {
    usernameAvailable.value = null;
    errors.username = username.length > 0 ? 'Username must be at least 3 characters' : '';
    return;
  }

  try {
    isCheckingUsername.value = true;
    errors.username = '';
    const result = await authStore.checkUsername(username);
    usernameAvailable.value = result.available;
    if (!result.available) {
      errors.username = result.message;
    }
  } catch (error) {
    console.error('Username check error:', error);
    errors.username = 'Error checking username availability';
    usernameAvailable.value = null;
  } finally {
    isCheckingUsername.value = false;
  }
}, 500);

watch(() => formData.username, (newUsername) => {
  if (!newUsername) {
    errors.username = '';
    usernameAvailable.value = null;
    return;
  }
  
  errors.username = '';
  usernameAvailable.value = null;
  if (newUsername.length >= 3) {
    checkUsernameAvailability(newUsername);
  } else {
    // Only show error if user has started typing but username is too short
    errors.username = newUsername.length > 0 ? 'Username must be at least 3 characters' : '';
  }
});

watch(() => formData.password, (newPassword) => {
  passwordStrength.value = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword)
  };

  if (formData.confirmPassword) {
    if (formData.confirmPassword !== newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    } else {
      errors.confirmPassword = '';
    }
  }
}, { immediate: true });

const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email) && email.length <= 254;
};

const sanitizeInput = (input) => {
  return input.replace(/[<>"'&]/g, (char) => {
    const entities = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '&': '&amp;'
    };
    return entities[char];
  });
};

const isCheckingEmail = ref(false);
const emailAvailable = ref(null);

const checkEmailAvailability = debounce(async (email) => {
  if (!email || !isValidEmail(email)) {
    emailAvailable.value = null;
    return;
  }

  try {
    isCheckingEmail.value = true;
    errors.email = '';
    const result = await authStore.checkEmail(email);
    
    emailAvailable.value = result.available;
    
    if (!result.available) {
      errors.email = result.message;
    }
  } catch (error) {
    console.error('Email check error:', error);
    errors.email = error.message;
    emailAvailable.value = null;
  } finally {
    isCheckingEmail.value = false;
  }
}, 500);

watch(() => formData.email, (newEmail) => {
  if (newEmail) {
    errors.email = '';
    emailAvailable.value = null;
    if (isValidEmail(newEmail)) {
      checkEmailAvailability(newEmail);
    }
  }
});

const validateForm = () => {
  let isValid = true;
  Object.keys(errors).forEach(key => errors[key] = '');

  const sanitizedUsername = sanitizeInput(formData.username);
  formData.username = sanitizedUsername;

  if (!formData.username) {
    errors.username = 'Username is required';
    isValid = false;
  } else if (formData.username.length < 3 || formData.username.length > 20) {
    errors.username = 'Username must be between 3 and 20 characters';
    isValid = false;
  } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
    errors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
    isValid = false;
  } else if (usernameAvailable.value === false) {
    errors.username = 'This username is already taken';
    isValid = false;
  } else if (isCheckingUsername.value) {
    errors.username = 'Please wait while we check username availability';
    isValid = false;
  }

  const sanitizedEmail = sanitizeInput(formData.email);
  formData.email = sanitizedEmail;

  if (!formData.email) {
    errors.email = 'Email address is required';
    isValid = false;
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
    isValid = false;
  } else if (emailAvailable.value === false) {
    errors.email = 'This email is already registered';
    isValid = false;
  } else if (isCheckingEmail.value) {
    errors.email = 'Please wait while we verify your email';
    isValid = false;
  }

  if (!formData.password) {
    errors.password = 'Password is required';
    isValid = false;
  } else {
    const missingRequirements = [];
    if (!passwordStrength.value.length) missingRequirements.push('8+ characters');
    if (!passwordStrength.value.uppercase) missingRequirements.push('uppercase letter');
    if (!passwordStrength.value.lowercase) missingRequirements.push('lowercase letter');
    if (!passwordStrength.value.number) missingRequirements.push('number');

    if (missingRequirements.length > 0) {
      errors.password = `Password must include: ${missingRequirements.join(', ')}`;
      isValid = false;
    }
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
    isValid = false;
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
    isValid = false;
  }

  return isValid;
};

let submitTimeout;
const handleSubmit = async () => {
  if (isCheckingEmail.value || isCheckingUsername.value) {
    notificationStore.error('Please wait while we verify your information');
    return;
  }

  if (!validateForm() || isLoading.value) return;

  if (submitTimeout) clearTimeout(submitTimeout);

  isLoading.value = true;

  try {
    await new Promise((resolve) => {
      submitTimeout = setTimeout(resolve, 500);
    });

    const response = await authStore.register({
      username: sanitizeInput(formData.username),
      email: sanitizeInput(formData.email),
      password: formData.password
    });

    notificationStore.success('Account created successfully! Please verify your email.');
    localStorage.setItem('pendingVerificationEmail', formData.email);
    router.push({ 
      name: 'VerifyCode',
      query: { email: formData.email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    handleRegistrationError(error);
  } finally {
    isLoading.value = false;
  }
};

const handleRegistrationError = (error) => {
  const errorMessage = error.response?.data?.message || error.message;
  
  if (errorMessage.toLowerCase().includes('username')) {
    errors.username = 'This username is already taken';
  } else if (errorMessage.toLowerCase().includes('email')) {
    errors.email = 'This email is already registered';
  } else if (errorMessage.toLowerCase().includes('rate limit')) {
    notificationStore.error('Too many attempts. Please try again later.');
  } else {
    notificationStore.error('Registration failed. Please try again.');
  }
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.1) 0%, rgba(64, 82, 214, 0.1) 100%);
}

.register-card {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 92, 92, 0.08);
  width: 100%;
  max-width: 500px;
  border: 1px solid rgba(0, 173, 173, 0.1);
}

.register-header {
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

input.success {
  border-color: #00D1D1;
}

.password-strength {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.strength-item {
  font-size: 0.9rem;
  color: #005C5C;
  opacity: 0.6;
}

.strength-item.valid {
  color: #00D1D1;
  opacity: 1;
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
  margin-top: 1.5rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 209, 209, 0.3);
}

.submit-btn:disabled {
  background: linear-gradient(135deg, #a8d5d5 0%, #9ba3e6 100%);
  cursor: not-allowed;
}

.login-link {
  color: #4052D6;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.login-link:hover {
  color: #00D1D1;
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

.success-message {
  color: #198754;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 6px;
  background-color: rgba(25, 135, 84, 0.05);
}

.success-message i {
  color: #198754;
}
</style> 