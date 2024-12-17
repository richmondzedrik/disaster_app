<template>
    <div class="change-password-container">
        <div class="change-password-content">
            <div class="change-password-header">
                <i class="fas fa-key header-icon"></i>
                <h1>Change Password</h1>
            </div>

            <form @submit.prevent="handleSubmit" class="change-password-form" autocomplete="off">
                <div class="form-group">
                    <label for="currentPassword">Current Password</label>
                    <input 
                        type="password" 
                        id="currentPassword"
                        v-model="formData.currentPassword"
                        required
                        :disabled="loading"
                        autocomplete="new-password"
                    />
                </div>

                <div class="form-group">
                    <label for="newPassword">New Password</label>
                    <input 
                        type="password" 
                        id="newPassword"
                        v-model="formData.newPassword"
                        required
                        :disabled="loading"
                        minlength="8"
                        autocomplete="new-password"
                    />
                </div>

                <div class="form-group">
                    <label for="confirmPassword">Confirm New Password</label>
                    <input 
                        type="password" 
                        id="confirmPassword"
                        v-model="formData.confirmPassword"
                        required
                        :disabled="loading"
                        autocomplete="new-password"
                    />
                </div>

                <div class="form-actions">
                    <button type="submit" class="submit-btn" :disabled="loading || !isValid">
                        <i class="fas fa-save" v-if="!loading"></i>
                        <i class="fas fa-spinner fa-spin" v-else></i>
                        {{ loading ? 'Changing Password...' : 'Change Password' }}
                    </button>
                    <router-link to="/profile" class="cancel-btn">
                        <i class="fas fa-times"></i>
                        Cancel
                    </router-link>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notification';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const loading = ref(false);

const formData = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const isValid = computed(() => {
    return formData.value.newPassword === formData.value.confirmPassword &&
           formData.value.newPassword.length >= 8;
});

const handleSubmit = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
        notificationStore.error('All fields are required');
        return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
        notificationStore.error('New passwords do not match');
        return;
    }

    if (formData.newPassword.length < 8) {
        notificationStore.error('New password must be at least 8 characters');
        return;
    }

    try {
        loading.value = true;
        await authStore.changePassword(formData.currentPassword, formData.newPassword);
        notificationStore.success('Password changed successfully');
        closeModal();
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to change password';
        notificationStore.error(message);
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
/* Reuse similar styles from Profile.vue */
</style> 