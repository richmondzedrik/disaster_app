<template>
    <div class="profile-container">
        <!-- Loading Overlay -->
        <div v-if="loading" class="loading-overlay">
            <div class="loading-spinner">
                <i class="fas fa-circle-notch fa-spin"></i>
                <span>Saving changes...</span>
            </div>
        </div>
        
        <div class="profile-content" :class="{ 'blur-content': loading }">
            <!-- Profile Header -->
            <div class="profile-header">
                <div class="profile-avatar">
                    <i class="fas fa-user-circle"></i>
                    <div class="profile-status">
                        <h2>{{ profileData.username || 'User' }}</h2>
                        <span class="email-badge" :class="{ verified: user?.email_verified }">
                            <i :class="['fas', user?.email_verified ? 'fa-check-circle' : 'fa-exclamation-circle']"></i>
                            {{ user?.email_verified ? 'Verified' : 'Unverified' }}
                        </span>
                    </div>
                </div>
                <div class="profile-stats">
                    <div class="stat-item">
                        <i class="fas fa-shield-alt"></i>
                        <div class="stat-info">
                            <span class="stat-value">{{ userStats.securityScore }}%</span>
                            <span class="stat-label">Security Score</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-check-circle"></i>
                        <div class="stat-info">
                            <span class="stat-value">{{ userStats.completedTasks }}</span>
                            <span class="stat-label">Tasks Completed</span>
                            <div class="progress-bar">
                                <div class="progress" :style="{ width: `${taskCompletionPercentage}%` }"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-calendar-check"></i>
                        <div class="stat-info">
                            <span class="stat-value">{{ formatDate(userStats.lastLogin) }}</span>
                            <span class="stat-label">Last Login</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Verification Alert -->
            <div v-if="!user?.email_verified" class="verification-alert">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <h3>Verify Your Email</h3>
                    <p>Please verify your email to access all features.</p>
                </div>
                <button @click="sendVerificationCode" :disabled="verificationLoading" class="verify-btn">
                    <i :class="['fas', verificationLoading ? 'fa-spinner fa-spin' : 'fa-envelope']"></i>
                    {{ verificationLoading ? 'Sending...' : 'Verify Now' }}
                </button>
            </div>

            <!-- Profile Sections -->
            <div class="profile-sections">
                <!-- Personal Information -->
                <section class="profile-section">
                    <h3><i class="fas fa-user"></i> Personal Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="username">Username</label>
                            <input 
                                type="text" 
                                id="username"
                                v-model.trim="profileData.username"
                                :disabled="loading"
                                placeholder="Enter username"
                            />
                        </div>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input 
                                type="email" 
                                id="email"
                                v-model="profileData.email"
                                disabled
                                class="readonly"
                            />
                        </div>
                        <div class="form-group">
                            <label for="phone">Phone Number</label>
                            <input 
                                type="tel" 
                                id="phone"
                                v-model="profileData.phone"
                                :disabled="loading"
                                placeholder="+63XXXXXXXXXX"
                                @input="validatePhoneNumber"
                            />
                            <span class="input-hint" :class="{ error: phoneError }">
                                {{ phoneError || 'Format: +63XXXXXXXXXX' }}
                            </span>
                        </div>
                        <div class="form-group">
                            <label for="location">Location</label>
                            <div class="location-input">
                                <input 
                                    type="text" 
                                    id="location"
                                    v-model="profileData.location"
                                    :disabled="loading"
                                    placeholder="Enter your location"
                                />
                                <button @click="detectLocation" class="detect-location-btn" :disabled="loading">
                                    <i :class="['fas', loading ? 'fa-spinner fa-spin' : 'fa-map-marker-alt']"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Notification Preferences -->
                <section class="profile-section">
                    <h3><i class="fas fa-bell"></i> Notification Preferences</h3>
                    <div class="notification-options">
                        <label class="toggle-switch">
                            <input 
                                type="checkbox" 
                                v-model="profileData.notifications.email"
                                :disabled="loading"
                            />
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Email Notifications</span>
                        </label>
                        <label class="toggle-switch">
                            <input 
                                type="checkbox" 
                                v-model="profileData.notifications.push"
                                :disabled="loading"
                            />
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Push Notifications</span>
                        </label>
                    </div>
                </section>

                <!-- Security Settings -->
                <section class="profile-section">
                    <h3><i class="fas fa-shield-alt"></i> Security Settings</h3>
                    <div class="security-options">
                        <button @click="changePassword" class="btn btn-secondary">
                            <i class="fas fa-key"></i>
                            Change Password
                        </button>
                        <button @click="confirmDeleteAccount" class="btn btn-danger">
                            <i class="fas fa-trash-alt"></i>
                            Delete Account
                        </button>
                    </div>
                </section>

                <!-- Emergency Contacts -->
                <section class="profile-section">
                    <h3><i class="fas fa-bell"></i> Emergency Contacts</h3>
                    <div class="emergency-contacts">
                        <div v-for="(contact, index) in profileData.emergencyContacts" 
                             :key="index" 
                             class="emergency-contact-item">
                            <div class="contact-info">
                                <input 
                                    type="text" 
                                    v-model="contact.name"
                                    placeholder="Contact Name"
                                    :disabled="loading"
                                />
                                <input 
                                    type="tel" 
                                    v-model="contact.phone"
                                    placeholder="+63XXXXXXXXXX"
                                    :disabled="loading"
                                    @input="validateEmergencyContact(index)"
                                />
                            </div>
                            <button @click="removeEmergencyContact(index)" 
                                    class="remove-contact-btn"
                                    :disabled="loading">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                        <button @click="addEmergencyContact" 
                                class="add-contact-btn"
                                :disabled="loading || profileData.emergencyContacts.length >= 3">
                            <i class="fas fa-plus"></i>
                            Add Emergency Contact
                        </button>
                    </div>
                </section>

                <!-- Save Changes Button -->
                <div class="save-changes-container">
                    <button 
                        @click="saveChanges" 
                        class="save-changes-btn" 
                        :class="{ 'loading': loading }"
                        :disabled="loading || !isFormValid || !hasChanges"
                    >
                        <i :class="['fas', loading ? 'fa-spinner fa-spin' : 'fa-save']"></i>
                        <span>{{ loading ? 'Saving...' : 'Save Changes' }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Password Change Modal -->
        <div v-if="showPasswordModal" class="modal">
            <!-- Modal content here (unchanged) -->
        </div>
    </div>
</template>

<style scoped>
.profile-container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 2rem;
    background: #f8fafc;
}

.profile-content {
    background: white;
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(0, 92, 92, 0.08);
    overflow: hidden;
    border: 1px solid rgba(0, 173, 173, 0.1);
}

.profile-header {
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    padding: 3rem 2.5rem;
    color: white;
}

.profile-avatar {
    display: flex;
    align-items: center;
    gap: 2rem;
}

.profile-avatar i {
    font-size: 4.5rem;
    color: rgba(255, 255, 255, 0.9);
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.profile-status h2 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.email-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 999px;
    font-size: 0.875rem;
    margin-top: 0.75rem;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.email-badge.verified {
    background: rgba(0, 209, 209, 0.2);
    border-color: rgba(0, 209, 209, 0.3);
}

.verification-alert {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    background: linear-gradient(to right, rgba(0, 209, 209, 0.05), rgba(64, 82, 214, 0.05));
    border-left: 4px solid #00D1D1;
    padding: 1.25rem 1.75rem;
    margin: 2rem;
    border-radius: 0 12px 12px 0;
}

.profile-sections {
    padding: 1.5rem;
}

.profile-section {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
    border: 1px solid rgba(0, 173, 173, 0.1);
    transition: all 0.3s ease;
}

.profile-section:hover {
    box-shadow: 0 4px 12px rgba(0, 92, 92, 0.06);
}

.profile-section h3 {
    color: #005C5C;
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 2rem;
}

.profile-section h3 i {
    color: #00ADAD;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #4a5568;
}

.form-group input {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 2px solid rgba(0, 173, 173, 0.2);
    border-radius: 10px;
    font-size: 1rem;
    transition: all 0.3s ease;
    color: #005C5C;
}

.form-group input:focus {
    border-color: #00D1D1;
    box-shadow: 0 0 0 4px rgba(0, 209, 209, 0.1);
    outline: none;
}

.form-group input.readonly {
    background: #f8f9fa;
    border-color: #e2e8f0;
    cursor: not-allowed;
}

.notification-options {
    display: grid;
    gap: 1rem;
}

.toggle-switch {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
}

/* Add styles for toggle switch, buttons, and other elements */

.profile-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    margin-top: 2rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    transition: transform 0.3s ease;
}

.stat-item:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.15);
}

.stat-item i {
    font-size: 2rem;
    color: rgba(255, 255, 255, 0.9);
}

.stat-info {
    display: flex;
    flex-direction: column;
}

.stat-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
}

.stat-label {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
}

/* Location Input */
.location-input {
    position: relative;
    display: flex;
    gap: 0.5rem;
}

.detect-location-btn {
    background: #42b983;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.detect-location-btn:hover {
    background: #3aa876;
}

/* Emergency Contacts */
.emergency-contacts {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.emergency-contact-item {
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.contact-info {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.remove-contact-btn {
    background: #fee2e2;
    color: #dc2626;
    border: none;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.remove-contact-btn:hover {
    background: #fecaca;
}

.add-contact-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #f3f4f6;
    border: 2px dashed #e5e7eb;
    border-radius: 8px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.3s ease;
}

.add-contact-btn:hover {
    background: #e5e7eb;
    color: #4b5563;
}

.add-contact-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@media (max-width: 768px) {
    .profile-stats {
        grid-template-columns: 1fr;
    }
    
    .contact-info {
        grid-template-columns: 1fr;
    }
}

.save-changes-container {
    padding: 1.5rem;
    display: flex;
    justify-content: flex-end;
    background: #f8f9fa;
    border-top: 1px solid #e2e8f0;
}

.save-changes-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    min-width: 160px;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    background-size: 200% 200%;
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 209, 209, 0.2);
    position: relative;
    overflow: hidden;
}

.save-changes-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
    );
    transition: 0.5s;
}

.save-changes-btn.loading {
    background-size: 200% 200%;
    animation: gradientMove 2s ease infinite;
    pointer-events: none;
}

.save-changes-btn.loading::before {
    animation: shimmer 1.5s infinite;
}

.save-changes-btn.loading i {
    animation: spin 1s linear infinite;
}

.save-changes-btn.loading span {
    animation: pulse 1.5s ease infinite;
}

@keyframes shimmer {
    100% {
        left: 100%;
    }
}

@keyframes gradientMove {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.notification {
    position: fixed;
    top: 1rem;
    right: 1rem;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.notification.success {
    background: #00D1D1;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.notification.error {
    background: #4052D6;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.notification.warning {
    background: #00ADAD;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.notification.info {
    background: #005C5C;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.notification.fade-out {
    animation: slideOut 0.3s ease forwards;
}

.progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    margin-top: 4px;
    overflow: hidden;
}

.progress {
    height: 100%;
    background: #00D1D1;
    border-radius: 2px;
    transition: width 0.3s ease;
}

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 92, 92, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
}

.loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 92, 92, 0.15);
}

.loading-spinner i {
    font-size: 2.5rem;
    color: #00D1D1;
    animation: spin 1s linear infinite;
}

.loading-spinner span {
    color: #4052D6;
    font-weight: 500;
}

.blur-content {
    filter: blur(2px);
    pointer-events: none;
    user-select: none;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notification';
import { userService } from '../services/userService';
import { authService } from '../services/auth';
import { debounce } from 'lodash';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// State management
const loading = ref(false);
const verificationLoading = ref(false);
const showPasswordModal = ref(false);
const passwordLoading = ref(false);
const phoneError = ref('');

// User data management
const user = computed(() => authStore.user);
const profileData = ref({
    username: '',
    email: '',
    phone: '',
    notifications: {
        email: true,
        push: true
    }
});

// Additional state
const userStats = ref({
    securityScore: 0,
    completedTasks: 0
});

// Extend profileData
profileData.value = {
    ...profileData.value,
    location: '',
    emergencyContacts: []
};

// Form validation
const isFormValid = ref(true);
const validateForm = () => {
    const phoneRegex = /^\+63[0-9]{10}$/;
    let valid = true;

    if (profileData.value.phone && !phoneRegex.test(profileData.value.phone)) {
        valid = false;
    }

    // Validate emergency contacts
    if (profileData.value.emergencyContacts) {
        profileData.value.emergencyContacts.forEach(contact => {
            if (contact.phone && !phoneRegex.test(contact.phone)) {
                valid = false;
            }
        });
    }

    isFormValid.value = valid;
};

// Load profile data
const originalData = ref(null);
const hasChanges = ref(false);
watch(
    () => profileData.value,
    (newVal) => {
        if (originalData.value) {
            hasChanges.value = JSON.stringify(newVal) !== JSON.stringify(originalData.value);
            validateForm();
        }
    },
    { deep: true }
);

const loadProfileData = async () => {
    if (loading.value) return;
    
    try {
        loading.value = true;
        const response = await userService.getProfile();
        
        if (response?.success && response.user) {
            const userData = response.user;
            
            // Update userStats with actual values
            userStats.value = {
                securityScore: 0,
                completedTasks: userData.completedTasks || 0,
                lastLogin: userData.lastLogin || new Date().toISOString() // Add lastLogin
            };
            
            // Rest of your existing code...
            const newProfileData = {
                username: userData.username || '',
                email: userData.email || '',
                phone: userData.phone || '',
                location: userData.location || '',
                notifications: {
                    email: userData.notifications?.email ?? true,
                    push: userData.notifications?.push ?? true
                },
                emergencyContacts: userData.emergencyContacts || []
            };

            profileData.value = newProfileData;
            originalData.value = JSON.parse(JSON.stringify(newProfileData));
            calculateSecurityScore();
        }
    } catch (error) {
        console.error('Load profile error:', error);
        notificationStore.error('Failed to load profile data');
    } finally {
        loading.value = false;
    }
};

// Phone validation
const validatePhoneNumber = () => {
    const phoneRegex = /^\+63[0-9]{10}$/;
    phoneError.value = profileData.value.phone && !phoneRegex.test(profileData.value.phone)
        ? 'Invalid Philippine phone number format'
        : '';
};

// Password management
const passwordData = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const isPasswordFormValid = computed(() => {
    return passwordData.value.newPassword.length >= 8 &&
           passwordData.value.newPassword === passwordData.value.confirmPassword;
});

const handlePasswordChange = async () => {
    if (!isPasswordFormValid.value || passwordLoading.value) return;

    try {
        passwordLoading.value = true;
        await authService.changePassword(
            passwordData.value.currentPassword,
            passwordData.value.newPassword
        );
        notificationStore.success('Password changed successfully');
        showPasswordModal.value = false;
        passwordData.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
    } catch (error) {
        notificationStore.error('Failed to change password');
    } finally {
        passwordLoading.value = false;
    }
};

// Email verification
const sendVerificationCode = async () => {
    if (!user.value?.email || verificationLoading.value) return;

    try {
        verificationLoading.value = true;
        const response = await authService.resendVerificationCode(user.value.email);
        if (response?.success) {
            localStorage.setItem('pendingVerificationEmail', user.value.email);
            router.push({ name: 'VerifyCode', query: { email: user.value.email } });
        }
    } catch (error) {
        notificationStore.error('Failed to send verification code');
    } finally {
        verificationLoading.value = false;
    }
};

// Location detection
const detectLocation = async () => {
    if (!navigator.geolocation) {
        notificationStore.error('Geolocation is not supported by your browser');
        return;
    }

    try {
        loading.value = true;
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        const data = await response.json();
        
        profileData.value.location = data.display_name;
        notificationStore.success('Location detected successfully');
    } catch (error) {
        notificationStore.error('Failed to detect location');
    } finally {
        loading.value = false;
    }
};

// Emergency contacts management
const addEmergencyContact = () => {
    if (profileData.value.emergencyContacts.length < 3) {
        profileData.value.emergencyContacts.push({
            name: '',
            phone: ''
        });
    }
};

const removeEmergencyContact = (index) => {
    profileData.value.emergencyContacts.splice(index, 1);
};

const validateEmergencyContact = (index) => {
    const contact = profileData.value.emergencyContacts[index];
    const phoneRegex = /^\+63[0-9]{10}$/;
    if (contact.phone && !phoneRegex.test(contact.phone)) {
        contact.error = 'Invalid Philippine phone number format';
    } else {
        contact.error = '';
    }
};

// Calculate security score
const calculateSecurityScore = () => {
    let score = 0;
    
    // Basic profile completion
    if (profileData.value.username) score += 20;
    if (profileData.value.phone) score += 20;
    if (profileData.value.location) score += 20;
    
    // Emergency contacts
    score += (profileData.value.emergencyContacts.length * 10);
    
    // Email verification
    if (user.value?.email_verified) score += 20;
    
    userStats.value.securityScore = Math.min(score, 100);
};

// Format date utility
const formatDate = (date) => {
    if (!date) return 'Never';
    try {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Invalid date';
    }
};

// Initialize component
onMounted(() => {
    if (!authStore.isAuthenticated) {
        router.push('/login');
        return;
    }
    loadProfileData();
});

// Save changes function
const saveChanges = async () => {
    if (loading.value || !isFormValid.value || !hasChanges.value) return;

    try {
        loading.value = true;
        const updateData = {
            username: profileData.value.username?.trim(),
            phone: profileData.value.phone?.trim(),
            location: profileData.value.location?.trim(),
            notifications: profileData.value.notifications || {},
            emergencyContacts: profileData.value.emergencyContacts?.map(contact => ({
                name: contact.name?.trim(),
                phone: contact.phone?.trim()
            })).filter(contact => contact.name && contact.phone) || []
        };

        console.log('Sending update:', updateData);
        const response = await userService.updateProfile(updateData);
        console.log('Update response:', response);

        if (response?.success) {
            // Update original data to prevent further changes until next load
            originalData.value = JSON.parse(JSON.stringify(profileData.value));
            
            // Update auth store user data
            if (response.user) {
                authStore.updateUser(response.user);
            }

            notificationStore.success('Profile updated successfully');
            calculateSecurityScore();
        }
    } catch (error) {
        console.error('Save profile error:', error);
        notificationStore.error(error.message || 'Failed to update profile');
    } finally {
        loading.value = false;
    }
};

const taskCompletionPercentage = computed(() => {
    const totalTasks = 10; // You can adjust this based on your total tasks
    return Math.round((userStats.value.completedTasks / totalTasks) * 100);
});
</script> 