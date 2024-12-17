<template>
    <div class="verification-container">
        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Verifying your email...</p>
        </div>
        <div v-else class="result">
            <div class="status-icon">
                <i :class="[
                    'fas',
                    verified ? 'fa-check-circle success' : 'fa-exclamation-circle error'
                ]"></i>
            </div>
            <h2 :class="{ success: verified, error: !verified }">
                {{ message }}
            </h2>
            <p class="sub-message">
                {{ verified ? 'You can now access all features of your account.' : 'Please try again or contact support if the problem persists.' }}
            </p>
            <button v-if="canRetry && !verified" 
                    @click="verifyEmail" 
                    class="retry-button">
                <i class="fas fa-redo"></i> Try Again
            </button>
            <div v-if="verified" class="redirect-message">
                <i class="fas fa-spinner fa-spin"></i>
                Redirecting to login page...
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '../services/auth';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const verified = ref(false);
const message = ref('');
const canRetry = ref(true);

const verifyEmail = async () => {
    loading.value = true;
    try {
        const token = route.query.token;
        if (!token) {
            throw new Error('Verification token is missing');
        }

        const response = await authService.verifyEmail(token);
        
        if (response.data && response.data.success) {
            verified.value = true;
            message.value = response.data.message || 'Email verified successfully! You can now login.';
            canRetry.value = false;
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } else {
            throw new Error(response.data?.message || 'Verification failed');
        }
    } catch (error) {
        console.error('Verification error:', error.response || error);
        message.value = error.response?.data?.message || 'Verification failed. Please try again.';
        verified.value = false;
        canRetry.value = error.response?.status !== 400;
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    if (!route.query.token) {
        message.value = 'Invalid verification link';
        loading.value = false;
        canRetry.value = false;
        return;
    }
    verifyEmail();
});
</script>

<style scoped>
.verification-container {
    max-width: 600px;
    margin: 4rem auto;
    padding: 2rem;
    text-align: center;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: #666;
    font-size: 1.2rem;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #42b983;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.status-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.success {
    color: #42b983;
}

.error {
    color: #dc3545;
}

.result h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
}

.sub-message {
    color: #666;
    margin-bottom: 2rem;
    font-size: 1.1rem;
}

.retry-button {
    background-color: #42b983;
    color: white;
    border: none;
    padding: 0.8rem 2rem;
    border-radius: 8px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.retry-button:hover {
    background-color: #3aa876;
    transform: translateY(-1px);
}

.redirect-message {
    margin-top: 2rem;
    color: #666;
    font-style: italic;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
    .verification-container {
        margin: 2rem 1rem;
        padding: 1.5rem;
    }

    .result h2 {
        font-size: 1.5rem;
    }

    .status-icon {
        font-size: 3rem;
    }
}
</style> 