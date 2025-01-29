<template>
    <div class="profile-container">
        <!-- Initial Loading Skeleton -->
        <div v-if="initialLoading" class="profile-skeleton">
            <div class="skeleton-header">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-info">
                    <div class="skeleton-text"></div>
                    <div class="skeleton-badge"></div>
                </div>
            </div>
            <div class="skeleton-stats">
                <div class="skeleton-stat"></div>
                <div class="skeleton-stat"></div>
                <div class="skeleton-stat"></div>
            </div>
            <div class="skeleton-content">
                <div class="skeleton-section"></div>
                <div class="skeleton-section"></div>
                <div class="skeleton-section"></div>
            </div>
        </div>

        <!-- Loading Overlay -->
        <div v-if="saveLoading" class="loading-overlay">
            <div class="loading-spinner">
                <i class="fas fa-circle-notch fa-spin"></i>
                <span>Saving changes...</span>
            </div>
        </div>

        <!-- Main Content -->
        <div v-if="!initialLoading" class="profile-content" :class="{ 'blur-content': saveLoading }">
            <!-- Profile Header -->
            <div class="profile-header">
                <div class="profile-avatar">
                    <div class="avatar-container">
                        <div class="author-avatar">
                            <img v-if="!avatarError"
                                :src="getAvatarUrl(profileData.avatar_url)"
                                alt="Profile Avatar"
                                @error="handleAvatarError"
                                @load="handleAvatarLoad"
                                class="avatar-image"
                                ref="avatarImage" />
                            <div v-else class="avatar-placeholder">
                                <span>{{ getInitials(profileData.username || 'User') }}</span>
                            </div>
                        </div>
                        <div class="avatar-overlay" @click="openAvatarModal">
                            <i class="fas fa-camera"></i>
                            <span>Change Photo</span>
                        </div>
                    </div>
                    <input type="file" ref="fileInput" class="hidden-file-input" accept="image/*"
                        @change="handleAvatarUpload" />
                    <div class="profile-status">
                        <div class="username-container">
                            <h2>{{ profileData.username || 'User' }}</h2>
                            <span class="email-badge" :class="{ verified: user?.email_verified }">
                                <i :class="['fas', user?.email_verified ? 'fa-check-circle' : 'fa-exclamation-circle']"></i>
                                {{ user?.email_verified ? 'Verified' : 'Unverified' }}
                            </span>
                        </div>
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
                <div class="alert-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="alert-text">
                        <h3>Verify Your Email</h3>
                        <p>Please verify your email to access all features.</p>
                    </div>
                </div>
                <button @click="sendVerificationCode" :disabled="verificationLoading" class="verify-btn"
                    :class="{ 'loading': verificationLoading }">
                    <i :class="['fas', verificationLoading ? 'fa-spinner fa-spin' : 'fa-envelope']"></i>
                    <span>{{ verificationLoading ? 'Sending...' : 'Verify Now' }}</span>
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
                            <input type="text" id="username" v-model.trim="profileData.username" :disabled="loading"
                                placeholder="Enter username" />
                        </div>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" v-model="profileData.email" disabled class="readonly" />
                        </div>
                        <div class="form-group">
                            <label for="phone">Phone Number</label>
                            <div class="phone-input-container">
                                <div class="country-prefix">
                                    <span class="flag">🇵🇭</span>
                                    <span class="prefix">+63</span>
                                </div>
                                <input 
                                    type="tel" 
                                    id="phone" 
                                    v-model="localPhoneNumber"
                                    :disabled="loading"
                                    placeholder="9XXXXXXXXX"
                                    maxlength="10"
                                    @input="handlePhoneInput" 
                                />
                            </div>
                            <span class="input-hint" :class="{ error: phoneError }">
                                {{ phoneError || 'Format: 9XXXXXXXXX' }}
                            </span>
                        </div>
                        <div class="form-group">
                            <label for="location">Location</label>
                            <div class="location-input">
                                <input type="text" id="location" v-model="profileData.location" :disabled="loading"
                                    placeholder="Enter your location" />
                                <button @click="detectLocation" class="detect-location-btn" :disabled="loading">
                                    <i :class="['fas', loading ? 'fa-spinner fa-spin' : 'fa-map-marker-alt']"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Notification Preferences -->
                <!-- Add this inside the Notification Preferences section -->
                <section class="profile-section">
                    <h3><i class="fas fa-bell"></i> Notification Preferences</h3>
                    <div class="notification-settings">
                        <div class="notification-option">
                            <div class="option-info">
                                <h4>Email Notifications</h4>
                                <p>Receive updates about new posts and important announcements</p>
                            </div>
                            <button @click="toggleNotifications" :disabled="notificationLoading" :class="['toggle-btn', {
                                'subscribed': profileData.notifications,
                                'loading': notificationLoading
                            }]">
                                <i :class="['fas', notificationLoading ? 'fa-spinner fa-spin' :
                                    profileData.notifications ? 'fa-bell' : 'fa-bell-slash']"></i>
                                {{ profileData.notifications ? 'Subscribed' : 'Unsubscribed' }}
                            </button>
                        </div>
                    </div>
                </section>

                <!-- Security Settings -->
                <section class="profile-section security-section">
                    <h3><i class="fas fa-shield-alt"></i> Security Settings</h3>
                    <div class="security-options">
                        <div class="security-card">
                            <div class="security-info">
                                <i class="fas fa-key"></i>
                                <div class="security-text">
                                    <h4>Password</h4>
                                    <p>Update your password regularly to keep your account secure</p>
                                </div>
                            </div>
                            <button @click="changePassword" class="btn btn-secondary">
                                <i class="fas fa-key"></i>
                                Change Password
                            </button>
                        </div>

                        <div class="security-card danger-zone">
                            <div class="security-info">
                                <i class="fas fa-exclamation-triangle"></i>
                                <div class="security-text">
                                    <h4>Danger Zone</h4>
                                    <p>Permanently delete your account and all associated data</p>
                                </div>
                            </div>
                            <button @click="confirmDeleteAccount" class="btn btn-danger">
                                <i class="fas fa-trash-alt"></i>
                                Delete Account
                            </button>
                        </div>
                    </div>
                </section>

                <!-- Emergency Contacts -->
                <section class="profile-section">
                    <div class="emergency-contacts-header">
                        <h3>
                            <i class="fas fa-phone-alt"></i>
                            Emergency Contacts
                            <span class="contact-count">
                                {{ (profileData.emergencyContacts || []).length }}/3
                            </span>
                        </h3>
                    </div>
                    <div class="emergency-contacts-list">
                        <div v-if="!profileData.emergencyContacts || profileData.emergencyContacts.length === 0"
                            class="no-contacts">
                            <i class="fas fa-user-plus"></i>
                            <p>No emergency contacts added yet</p>
                        </div>
                        <div v-else v-for="(contact, index) in profileData.emergencyContacts" :key="index"
                            class="contact-card">
                            <div class="contact-info">
                                <div class="contact-header">
                                    <h4>{{ contact.name }}</h4>
                                    <span class="relation-badge">{{ contact.relation }}</span>
                                </div>
                                <p class="phone-number">
                                    <i class="fas fa-phone"></i>
                                    {{ contact.phone }}
                                </p>
                            </div>
                            <div class="contact-actions">
                                <button class="edit-btn" @click="editEmergencyContact(index)" :disabled="loading">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="delete-btn" @click="removeEmergencyContact(index)" :disabled="loading">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                        <button class="add-contact-btn" @click="openEmergencyContactModal"
                            :disabled="loading || profileData.emergencyContacts.length >= 3">
                            <i class="fas fa-plus"></i>
                            Add Emergency Contact
                        </button>
                    </div>
                </section>

                <!-- Save Changes Button -->
                <div class="save-changes-container">
                    <button @click="saveChanges" class="save-changes-btn" :class="{ 'loading': loading }"
                        :disabled="isSaveDisabled">
                        <i :class="['fas', loading ? 'fa-spinner fa-spin' : 'fa-save']"></i>
                        <span>
                            {{ loading ? 'Saving...' :
                                !hasChanges ? 'No Changes' :
                                    !isFormValid ? 'Invalid Form' :
                                        'Save Changes' }}
                        </span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Password Change Modal -->
        <div v-if="showPasswordModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-key"></i>
                        Change Password
                    </h3>
                    <button class="close-btn" @click="closePasswordModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="handlePasswordChange" class="password-form">
                        <div class="form-group">
                            <label for="currentPassword">Current Password</label>
                            <input 
                                type="password" 
                                id="currentPassword"
                                v-model="passwordForm.currentPassword"
                                required
                                :disabled="passwordLoading"
                                :maxlength="PASSWORD_MAX_LENGTH"
                            />
                        </div>

                        <div class="form-group">
                            <label for="newPassword">New Password</label>
                            <input 
                                type="password" 
                                id="newPassword"
                                v-model="passwordForm.newPassword"
                                required
                                :disabled="passwordLoading"
                                :minlength="PASSWORD_MIN_LENGTH"
                                :maxlength="PASSWORD_MAX_LENGTH"
                            />
                            <div class="password-requirements">
                                <div class="requirement" :class="{ valid: passwordValidation.length }">
                                    <i :class="['fas', passwordValidation.length ? 'fa-check' : 'fa-times']"></i>
                                    At least 6 characters
                                </div>
                                <div class="requirement" :class="{ valid: passwordValidation.uppercase }">
                                    <i :class="['fas', passwordValidation.uppercase ? 'fa-check' : 'fa-times']"></i>
                                    One uppercase letter
                                </div>
                                <div class="requirement" :class="{ valid: passwordValidation.lowercase }">
                                    <i :class="['fas', passwordValidation.lowercase ? 'fa-check' : 'fa-times']"></i>
                                    One lowercase letter
                                </div>
                                <div class="requirement" :class="{ valid: passwordValidation.number }">
                                    <i :class="['fas', passwordValidation.number ? 'fa-check' : 'fa-times']"></i>
                                    One number
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="confirmPassword">Confirm New Password</label>
                            <input 
                                type="password" 
                                id="confirmPassword"
                                v-model="passwordForm.confirmPassword"
                                required
                                :disabled="passwordLoading"
                                :maxlength="PASSWORD_MAX_LENGTH"
                            />
                            <div v-if="passwordForm.confirmPassword" class="confirm-message" 
                                 :class="{ error: passwordForm.newPassword !== passwordForm.confirmPassword }">
                                <i :class="['fas', passwordForm.newPassword === passwordForm.confirmPassword ? 'fa-check' : 'fa-times']"></i>
                                {{ passwordForm.newPassword === passwordForm.confirmPassword ? 'Passwords match' : 'Passwords do not match' }}
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closePasswordModal" :disabled="passwordLoading">
                        Cancel
                    </button>
                    <button 
                        class="btn btn-primary" 
                        @click="handlePasswordChange"
                        :disabled="passwordLoading || !isPasswordFormValid"
                    >
                        <i :class="['fas', passwordLoading ? 'fa-spinner fa-spin' : 'fa-save']"></i>
                        {{ passwordLoading ? 'Changing...' : 'Change Password' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Emergency Contact Modal -->
        <div v-if="showEmergencyContactModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-phone-alt"></i>
                        {{ editingContactIndex === -1 ? 'Add' : 'Edit' }} Emergency Contact
                    </h3>
                    <button class="close-btn" @click="closeEmergencyContactModal">
                        <i class="fas fa-times"></i>
                        <span class="tooltip">Close</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="contactName">Contact Name</label>
                        <input type="text" id="contactName" v-model="emergencyContactForm.name"
                            placeholder="Enter contact name" :class="{ 'error': emergencyContactErrors.name }" />
                        <span class="error-message" v-if="emergencyContactErrors.name">
                            {{ emergencyContactErrors.name }}
                        </span>
                    </div>
                    <div class="form-group">
                        <label for="contactPhone">Phone Number</label>
                        <div class="phone-input-container">
                            <div class="country-prefix">
                                <span class="flag">🇵🇭</span>
                                <span class="prefix">+63</span>
                            </div>
                            <input 
                                type="tel" 
                                id="contactPhone"
                                v-model="emergencyContactForm.localPhone"
                                placeholder="9XXXXXXXXX"
                                maxlength="10"
                                @input="handleEmergencyContactPhoneInput"
                                :class="{ 'error': emergencyContactErrors.phone }"
                            />
                        </div>
                        <span class="error-message" v-if="emergencyContactErrors.phone">
                            {{ emergencyContactErrors.phone }}
                        </span>
                    </div>
                    <div class="form-group">
                        <label for="contactRelation">Relationship</label>
                        <div class="select-wrapper">
                            <select 
                                id="contactRelation" 
                                v-model="emergencyContactForm.relation"
                                :class="{ 'error': emergencyContactErrors.relation }"
                            >
                                <option value="" disabled>Select relationship</option>
                                <option value="family">Family Member</option>
                                <option value="friend">Friend</option>
                                <option value="neighbor">Neighbor</option>
                                <option value="other">Other</option>
                            </select>
                            <i class="fas fa-chevron-down select-icon"></i>
                        </div>
                        <span class="error-message" v-if="emergencyContactErrors.relation">
                            {{ emergencyContactErrors.relation }}
                        </span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeEmergencyContactModal">
                        Cancel
                    </button>
                    <button class="btn btn-primary" @click="saveEmergencyContact"
                        :disabled="!isEmergencyContactFormValid">
                        {{ editingContactIndex === -1 ? 'Add' : 'Save' }} Contact
                    </button>
                </div>
            </div>
        </div>

        <!-- Avatar Change Modal -->
        <div v-if="showAvatarModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Update Profile Photo</h3>
                    <button class="close-btn" @click="closeAvatarModal" :disabled="avatarLoading">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="avatar-preview">
                        <img v-if="profileData.tempAvatarUrl" 
                            :src="profileData.tempAvatarUrl" 
                            class="preview-image" 
                            alt="Preview" />
                        <i v-else class="fas fa-user"></i>
                    </div>
                    <div class="avatar-upload-controls">
                        <button class="upload-btn" @click="triggerFileInput" :disabled="avatarLoading">
                            <i class="fas fa-upload"></i>
                            Choose Photo
                        </button>
                        <p class="upload-hint">Maximum file size: 5MB</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeAvatarModal" :disabled="avatarLoading">
                        Cancel
                    </button>
                    <button 
                        class="btn btn-primary" 
                        @click="saveAvatar" 
                        :disabled="!profileData.pendingAvatar || avatarLoading"
                    >
                        <i :class="['fas', avatarLoading ? 'fa-spinner fa-spin' : 'fa-save']"></i>
                        {{ avatarLoading ? 'Saving...' : 'Save Changes' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Delete Account Modal -->
        <div v-if="showDeleteModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-exclamation-triangle"></i>
                        Delete Account
                    </h3>
                    <button class="close-btn" @click="closeDeleteModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="delete-warning">
                        <p>Warning: This action cannot be undone!</p>
                        <ul>
                            <li>All your personal data will be permanently deleted</li>
                            <li>Your emergency contacts will be removed</li>
                            <li>You will lose access to all features</li>
                        </ul>
                    </div>
                    <div class="confirmation-input">
                        <label>Type "DELETE" to confirm:</label>
                        <input 
                            type="text" 
                            v-model="deleteConfirmation"
                            placeholder="Type DELETE"
                            :class="{ 'error': deleteError }"
                        />
                        <span class="error-message" v-if="deleteError">{{ deleteError }}</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeDeleteModal">Cancel</button>
                    <button 
                        class="btn btn-danger" 
                        @click="executeAccountDeletion"
                        :disabled="deleteConfirmation !== 'DELETE' || deleteLoading"
                    >
                        <i :class="['fas', deleteLoading ? 'fa-spinner fa-spin' : 'fa-trash-alt']"></i>
                        {{ deleteLoading ? 'Deleting...' : 'Delete Account' }}
                    </button>
                </div>
            </div>
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

/* Add this new specific selector */
.email-badge i {
    font-size: 0.875rem;
}

.profile-status {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
}

.username-container {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.username-container h2 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.email-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 999px;
    font-size: 0.75rem;
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
    justify-content: space-between;
    gap: 2rem;
    background: linear-gradient(to right, rgba(0, 209, 209, 0.05), rgba(64, 82, 214, 0.05));
    border-left: 4px solid #00D1D1;
    padding: 1.5rem 2rem;
    margin: 2rem;
    border-radius: 0 12px 12px 0;
    box-shadow: 0 2px 8px rgba(0, 209, 209, 0.05);
}

.alert-content {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex: 1;
}

.alert-text {
    flex: 1;
}

.alert-text h3 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
}

.alert-text p {
    margin: 0;
    color: #64748b;
}

.verify-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 140px;
}

.verify-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 209, 209, 0.2);
}

.verify-btn:disabled {
    background: linear-gradient(135deg, #a8d5d5 0%, #9ba3d6 100%);
    cursor: not-allowed;
    transform: none;
}

.verify-btn.loading {
    opacity: 0.8;
}

@media (max-width: 640px) {
    .verification-alert {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
        padding: 1.25rem;
        margin: 1rem;
    }

    .verify-btn {
        width: 100%;
        justify-content: center;
    }
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

.notification-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 1rem;
}

.option-info {
    flex: 1;
}

.option-info h4 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
}

.option-info p {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
}

.toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #e2e8f0;
    color: #64748b;
}

.toggle-btn.subscribed {
    background: #00D1D1;
    color: white;
}

.toggle-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 209, 209, 0.2);
}

.toggle-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
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
    background: linear-gradient(90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent);
    transition: 0.5s;
}

.save-changes-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
    box-shadow: none;
}

.save-changes-btn:disabled::before {
    display: none;
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
    0% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0% 50%;
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.7;
    }
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

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-body {
    padding: 1.5rem;
}

.modal-footer {
    padding: 1.5rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.contact-card {
    background: white;
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    border: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.relation-badge {
    background: #e2e8f0;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.875rem;
    color: #4a5568;
}


.contact-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
}

.phone-number {
    color: #4a5568;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.contact-actions {
    display: flex;
    gap: 0.5rem;
}

.edit-btn,
.delete-btn {
    padding: 0.5rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
}

.edit-btn {
    background: #ebf8ff;
    color: #3182ce;
}

.delete-btn {
    background: #fff5f5;
    color: #e53e3e;
}

.no-contacts {
    text-align: center;
    padding: 2rem;
    color: #718096;
}

.no-contacts i {
    font-size: 2rem;
    margin-bottom: 1rem;
}

.emergency-contacts-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.refresh-contacts-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #00D1D1;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.refresh-contacts-btn:hover {
    background: #00ADAD;
}

.refresh-contacts-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.profile-skeleton {
    background: white;
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(0, 92, 92, 0.08);
    overflow: hidden;
    border: 1px solid rgba(0, 173, 173, 0.1);
}

.skeleton-header {
    background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
    padding: 3rem 2.5rem;
    display: flex;
    align-items: center;
    gap: 2rem;
}

.skeleton-avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    animation: pulse 1.5s infinite;
}

.skeleton-info {
    flex: 1;
}

.skeleton-text {
    height: 24px;
    width: 200px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    margin-bottom: 12px;
    animation: pulse 1.5s infinite;
}

.skeleton-badge {
    height: 20px;
    width: 120px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    animation: pulse 1.5s infinite;
}

.skeleton-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    padding: 2rem;
}

.skeleton-stat {
    height: 80px;
    background: #f0f0f0;
    border-radius: 12px;
    animation: pulse 1.5s infinite;
}

.skeleton-content {
    padding: 2rem;
}

.skeleton-section {
    height: 200px;
    background: #f0f0f0;
    border-radius: 16px;
    margin-bottom: 2rem;
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

/* Add these styles for the improved verify button */
.verify-btn {
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 209, 209, 0.1);
}

.verify-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 209, 209, 0.2);
}

.verify-btn:disabled {
    background: linear-gradient(135deg, #a8d5d5 0%, #9ba3d6 100%);
    cursor: not-allowed;
    transform: none;
}

.verify-btn.loading {
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    opacity: 0.8;
}

.verify-btn i {
    font-size: 1rem;
    transition: transform 0.3s ease;
}

.verify-btn:hover:not(:disabled) i {
    transform: scale(1.1);
}

.avatar-container {
    width: 120px;
    height: 120px;
    position: relative;
    border-radius: 50%;
    overflow: hidden;
    background: #f8fafc;
    border: 3px solid rgba(255, 255, 255, 0.2);
}

.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.3s;
    cursor: pointer;
}

.avatar-overlay:hover {
    opacity: 1;
}

.avatar-overlay i {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.avatar-overlay span {
    font-size: 0.875rem;
    font-weight: 500;
}

.hidden-file-input {
    display: none;
}

.avatar-actions {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.avatar-preview {
    width: 200px;
    height: 200px;
    margin: 0 auto 1.5rem;
    border-radius: 50%;
    overflow: hidden;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid rgba(0, 209, 209, 0.2);
    position: relative;
}

.preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.avatar-preview i {
    font-size: 6rem;
    color: #cbd5e1;
    position: absolute;
}

.avatar-upload-controls {
    text-align: center;
}

.upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.upload-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 209, 209, 0.2);
}

.upload-hint {
    margin-top: 0.75rem;
    color: #64748b;
    font-size: 0.875rem;
}

.avatar-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #00D1D1, #4052D6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 2.5rem;
    font-weight: 600;
    text-transform: uppercase;
}

.avatar-placeholder span {
    opacity: 0.9;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    line-height: 1;
}
.btn-primary {
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background: linear-gradient(135deg, #a8d5d5 0%, #9ba3d6 100%);
}

.btn-secondary {
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-secondary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 209, 209, 0.2);
}

.delete-warning {
    background: #fff5f5;
    border: 1px solid #feb2b2;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.delete-warning p {
    color: #c53030;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.delete-warning ul {
    color: #742a2a;
    margin-left: 1.5rem;
}

.confirmation-input {
    margin-top: 1rem;
}

.confirmation-input label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #2d3748;
}

.confirmation-input input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 1rem;
}

.confirmation-input input.error {
    border-color: #fc8181;
}

.btn-danger {
    background-color: #f56565;
    color: white;
}

.btn-danger:hover:not(:disabled) {
    background-color: #c53030;
}

.btn-danger:disabled {
    background-color: #feb2b2;
    cursor: not-allowed;
}

.password-requirements {
    margin-top: 0.5rem;
    font-size: 0.9rem;
}

.requirement {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #dc3545;
    margin-bottom: 0.25rem;
}

.requirement.valid {
    color: #28a745;
}

.confirm-message {
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #28a745;
    font-size: 0.9rem;
}

.confirm-message.error {
    color: #dc3545;
}

.security-section {
    background: linear-gradient(to right, rgba(0, 209, 209, 0.02), rgba(64, 82, 214, 0.02));
    border: 1px solid rgba(0, 173, 173, 0.1);
    border-radius: 12px;
    margin: 1rem 0;
}

.security-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 0;
}

.security-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: white;
    border-radius: 10px;
    border: 1px solid rgba(0, 173, 173, 0.1);
    transition: all 0.3s ease;
}

.security-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 92, 92, 0.05);
}

.security-info {
    display: flex;
    align-items: center;
    gap: 1.25rem;
}

.security-info i {
    font-size: 1.5rem;
    color: #00D1D1;
    background: rgba(0, 209, 209, 0.1);
    padding: 1rem;
    border-radius: 12px;
}

.security-text h4 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
    font-size: 1.1rem;
}

.security-text p {
    margin: 0;
    color: #64748b;
    font-size: 0.95rem;
}

.security-card.danger-zone {
    border-color: rgba(220, 53, 69, 0.1);
}

.security-card.danger-zone .security-info i {
    color: #dc3545;
    background: rgba(220, 53, 69, 0.1);
}

.btn-secondary {
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-secondary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 209, 209, 0.2);
}

.btn-danger {
    background: #dc3545;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-danger:hover:not(:disabled) {
    background: #c82333;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
}

@media (max-width: 640px) {
    .security-card {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }

    .security-info {
        flex-direction: column;
        gap: 0.75rem;
    }

    .btn-secondary,
    .btn-danger {
        width: 100%;
        justify-content: center;
    }
}

.phone-input-container {
    display: flex;
    align-items: center;
    border: 2px solid rgba(0, 173, 173, 0.2);
    border-radius: 10px;
    overflow: hidden;
}

.country-prefix {
    display: flex;
    align-items: center;
    padding: 0.875rem 0.5rem;
    background: #f8fafc;
    border-right: 2px solid rgba(0, 173, 173, 0.2);
    gap: 0.5rem;
}

.flag {
    font-size: 1.2rem;
}

.prefix {
    color: #64748b;
    font-weight: 500;
}

.phone-input-container input {
    border: none;
    border-radius: 0;
    flex: 1;
}

.phone-input-container input:focus {
    box-shadow: none;
}

.author-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    position: relative;
}

.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    color: white;
    font-size: 2.5rem;
    font-weight: 600;
}

/* Add these styles */
.close-btn {
  position: relative;
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.close-btn i {
  font-size: 1.2rem;
  color: #64748b;
}

.close-btn .tooltip {
  position: absolute;
  background: #1e293b;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 8px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
}

.close-btn:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

.select-wrapper {
  position: relative;
  width: 100%;
}

.select-wrapper select {
  width: 100%;
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  appearance: none;
  background: white;
  font-size: 1rem;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-wrapper select:focus {
  border-color: #00D1D1;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 209, 209, 0.1);
}

.select-wrapper select.error {
  border-color: #ef4444;
}

.select-wrapper .select-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  pointer-events: none;
  transition: transform 0.2s ease;
}

.select-wrapper select:focus + .select-icon {
  transform: translateY(-50%) rotate(180deg);
}

select option[value=""] {
  color: #94a3b8;
}

select option:not([value=""]) {
  color: #1e293b;
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
import { checklistService } from '../services/checklistService';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// State management
const loading = ref(false);
const verificationLoading = ref(false);
const showPasswordModal = ref(false);
const passwordLoading = ref(false);
const passwordForm = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
});
const phoneError = ref('');
const notificationLoading = ref(false);
const avatarLoading = ref(false);    

// Add this new ref for save operation loading
const saveLoading = ref(false);

// User data management
const user = computed(() => authStore.user);
const profileData = ref({
    username: '',
    email: '',
    phone: '',
    location: '',
    notifications: false,
    emergencyContacts: []
});

// Additional state
const userStats = ref({
    securityScore: 0,
    completedTasks: 0,
    lastLogin: null
});

// Form validation
const isFormValid = ref(true);
const validateForm = () => {
    let isValid = true;
    const errors = [];

    // Validate username
    if (!profileData.value.username?.trim()) {
        errors.push('Username is required');
        isValid = false;
    }

    // Validate phone number
    const phoneRegex = /^\+63[0-9]{10}$/;
    if (profileData.value.phone && !phoneRegex.test(profileData.value.phone)) {
        errors.push('Invalid phone number format');
        isValid = false;
    }

    // Validate emergency contacts
    if (profileData.value.emergencyContacts?.length > 3) {
        errors.push('Maximum of 3 emergency contacts allowed');
        isValid = false;
    }

    profileData.value.emergencyContacts?.forEach((contact, index) => {
        if (contact.phone && !phoneRegex.test(contact.phone)) {
            errors.push(`Invalid phone number for emergency contact ${index + 1}`);
            isValid = false;
        }
    });

    if (!isValid) {
        errors.forEach(error => notificationStore.error(error));
    }

    isFormValid.value = isValid;
    return isValid;
};

// Load profile data
const originalData = ref(null);
const hasChanges = computed(() => {
    if (!originalData.value) return false;
    if (profileData.value.pendingAvatar) return true;

    const currentData = {
        username: profileData.value.username?.trim() || '',
        phone: profileData.value.phone?.trim() || '',
        location: profileData.value.location?.trim() || '',
        notifications: profileData.value.notifications || {},
        emergencyContacts: (profileData.value.emergencyContacts || [])
            .map(contact => ({
                name: contact.name?.trim() || '',
                phone: contact.phone?.trim() || '',
                relation: contact.relation?.trim() || ''
            }))
            .filter(contact => contact.name && contact.phone && contact.relation)
    };

    const original = {
        username: originalData.value.username || '',
        phone: originalData.value.phone || '',
        location: originalData.value.location || '',
        notifications: originalData.value.notifications || {},
        emergencyContacts: (originalData.value.emergencyContacts || [])
            .map(contact => ({
                name: contact.name || '',
                phone: contact.phone || '',
                relation: contact.relation || ''
            }))
            .filter(contact => contact.name && contact.phone && contact.relation)
    };

    return JSON.stringify(currentData) !== JSON.stringify(original);
});

const isSaveDisabled = computed(() => {
    return loading.value ||
        !isFormValid.value ||
        !hasChanges.value ||
        profileData.value.emergencyContacts.some(contact => contact.error);
});


const originalEmergencyContacts = ref([]);

const initialLoading = ref(true);

const loadProfileData = async () => {
    if (loading.value) return;

    try {
        initialLoading.value = true;
        const response = await userService.getProfile();

        if (response?.success && response.user) {
            const userData = response.user;

            // Load emergency contacts
            try {
                const contactsResponse = await userService.getEmergencyContacts();
                if (contactsResponse?.success) {
                    userData.emergencyContacts = contactsResponse.contacts;
                }
            } catch (error) {
                console.error('Error loading emergency contacts:', error);
            }

            // Store original emergency contacts
            originalEmergencyContacts.value = JSON.parse(JSON.stringify(userData.emergencyContacts || []));

            // Update profile data including avatar_url directly from database
            profileData.value = {
                ...profileData.value,
                username: userData.username || '',
                email: userData.email || '',
                phone: userData.phone || '',
                location: userData.location || '',
                notifications: userData.notifications || { email: true, push: true },
                emergencyContacts: userData.emergencyContacts || [],
                avatar_url: userData.avatar_url || null,
                pendingAvatar: null,
                tempAvatarUrl: null
            };

            // Store original data for change detection
            originalData.value = JSON.parse(JSON.stringify({
                ...profileData.value,
                avatar_url: profileData.value.avatar_url
            }));
        }
    } catch (error) {
        console.error('Load profile error:', error);
        notificationStore.error('Failed to load profile data');
    } finally {
        initialLoading.value = false;
    }
};

// Phone validation
const validatePhoneNumber = () => {
    const phoneRegex = /^\+639\d{9}$/;
    if (profileData.value.phone && !phoneRegex.test(profileData.value.phone)) {
        phoneError.value = 'Invalid Philippine mobile number format';
    } else {
        phoneError.value = '';
    }
};

// Add these constants at the top of the script section
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 16;

const passwordValidation = computed(() => ({
    length: passwordForm.value.newPassword.length >= PASSWORD_MIN_LENGTH,
    uppercase: /[A-Z]/.test(passwordForm.value.newPassword),
    lowercase: /[a-z]/.test(passwordForm.value.newPassword),
    number: /[0-9]/.test(passwordForm.value.newPassword)
}));

const isPasswordFormValid = computed(() => {
    return passwordForm.value.currentPassword &&
           passwordForm.value.newPassword &&
           passwordForm.value.confirmPassword &&
           passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
           passwordForm.value.newPassword.length >= PASSWORD_MIN_LENGTH &&
           passwordForm.value.newPassword.length <= PASSWORD_MAX_LENGTH &&
           passwordValidation.value.uppercase &&
           passwordValidation.value.lowercase &&
           passwordValidation.value.number;
});

const handlePasswordChange = async () => {
    if (!isPasswordFormValid.value) {
        notificationStore.error('Please check your password requirements');
        return;
    }

    try {
        passwordLoading.value = true;
        const response = await authService.changePassword(
            passwordForm.value.currentPassword,
            passwordForm.value.newPassword
        );
        
        if (response.success) {
            notificationStore.success('Password changed successfully');
            showPasswordModal.value = false;
            // Reset form
            passwordForm.value = {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            };
        } else {
            throw new Error(response.message || 'Failed to change password');
        }
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to change password';
        notificationStore.error(message);
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
    if (confirm('Are you sure you want to delete this emergency contact? This action cannot be undone.')) {
        profileData.value.emergencyContacts.splice(index, 1);
        notificationStore.warning('Emergency contact removed');
    }
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
    const maxScore = 100;

    // Email verification (30 points)
    if (user.value?.email_verified) score += 30;

    // Profile completeness (40 points)
    if (profileData.value.username) score += 10;
    if (profileData.value.phone) score += 10;
    if (profileData.value.location) score += 10;
    if (profileData.value.emergencyContacts?.length > 0) score += 10;

    // Security settings (30 points)
    if (profileData.value.notifications) score += 15; // Increased points for notifications
    if (profileData.value.emergencyContacts?.length >= 2) score += 15; // Additional points for multiple contacts

    // Ensure score doesn't exceed maximum
    userStats.value.securityScore = Math.min(Math.round(score), maxScore);
};

// Format date utility
const formatDate = (dateString) => {
    if (!dateString) return 'Never';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';

        // If date is today, show time only
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Otherwise show full date and time
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Never';
    }
};

onMounted(async () => {
    try {
        initialLoading.value = true;
        await Promise.all([
            loadProfileData(),
            loadEmergencyContactsFromDB() // Add this line
        ]);
    } catch (error) {
        console.error('Error loading profile data:', error);
        notificationStore.error('Failed to load profile data');
    } finally {
        initialLoading.value = false;
    }
});

// Save changes function
const saveChanges = async () => {
    if (saveLoading.value || !hasChanges.value) {
        return;
    }

    try {
        saveLoading.value = true;

        // Validate form first
        if (!validateForm()) {
            saveLoading.value = false;
            return;
        }

        // Format emergency contacts properly
        const formattedContacts = profileData.value.emergencyContacts
            ?.filter(contact => contact && contact.name && contact.phone && contact.relation)
            ?.map(contact => ({
                name: contact.name?.trim(),
                phone: contact.phone?.trim(),
                relation: contact.relation?.trim()
            })) || [];

        // Prepare update data
        const updateData = {
            username: profileData.value.username?.trim(),
            phone: profileData.value.phone?.trim(),
            location: profileData.value.location?.trim(),
            notifications: profileData.value.notifications || false,
            emergencyContacts: formattedContacts
        };

        // Update profile
        const response = await userService.updateProfile(updateData);

        if (response?.success) {
            // Update auth store
            if (response.user) {
                authStore.updateUser(response.user);
            }
            
            // Update original data with deep clone
            originalData.value = JSON.parse(JSON.stringify(updateData));
            
            // Update profile data
            profileData.value = {
                ...profileData.value,
                ...response.user,
                emergencyContacts: formattedContacts
            };
            
            notificationStore.success('Profile updated successfully');
        } else {
            throw new Error(response?.message || 'Failed to update profile');
        }

    } catch (error) {
        console.error('Save profile error:', error);
        notificationStore.error(error.message || 'Failed to update profile');
    } finally {
        saveLoading.value = false;
    }
};

const taskCompletionPercentage = computed(() => {
    // Define required tasks
    const requiredTasks = [
        !!profileData.value.username,
        !!profileData.value.phone,
        !!profileData.value.location,
        !!user.value?.email_verified,
        profileData.value.emergencyContacts?.length > 0,
        !!localStorage.getItem('checklistProgress')
    ];

    // Count completed tasks
    const completedTasks = requiredTasks.filter(task => task).length;

    // Calculate percentage
    const totalTasks = requiredTasks.length;

    // Return percentage without setting userStats
    return Math.round((completedTasks / totalTasks) * 100);
});

// Add this computed property for completed tasks count
const completedTasksCount = computed(() => {
    const requiredTasks = [
        !!profileData.value.username,
        !!profileData.value.phone,
        !!profileData.value.location,
        !!user.value?.email_verified,
        profileData.value.emergencyContacts?.length > 0,
        !!localStorage.getItem('checklistProgress')
    ];
    return requiredTasks.filter(task => task).length;
});

// Update the watcher to use the computed value
watch([profileData, () => user.value?.email_verified], () => {
    userStats.value.completedTasks = completedTasksCount.value;
    calculateSecurityScore();
}, { deep: true });

// Emergency contact management
const showEmergencyContactModal = ref(false);
const editingContactIndex = ref(-1);
const emergencyContactForm = ref({
    name: '',
    phone: '',
    localPhone: '', // Add this new field
    relation: ''
});
const emergencyContactErrors = ref({
    name: '',
    phone: '',
    relation: ''
});

const isEmergencyContactFormValid = computed(() => {
    const phoneRegex = /^\+63[0-9]{10}$/;
    return (
        emergencyContactForm.value.name?.trim() &&
        phoneRegex.test(emergencyContactForm.value.phone) &&
        emergencyContactForm.value.relation
    );
});

const validateEmergencyContactForm = () => {
    const errors = {
        name: '',
        phone: '',
        relation: ''
    };

    if (!emergencyContactForm.value.name?.trim()) {
        errors.name = 'Name is required';
    }

    const phoneRegex = /^\+63[0-9]{10}$/;
    if (!emergencyContactForm.value.phone) {
        errors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(emergencyContactForm.value.phone)) {
        errors.phone = 'Invalid Philippine phone number format';
    }

    if (!emergencyContactForm.value.relation) {
        errors.relation = 'Relationship is required';
    }

    emergencyContactErrors.value = errors;
    return !errors.name && !errors.phone && !errors.relation;
};

const openEmergencyContactModal = () => {
    editingContactIndex.value = -1;
    emergencyContactForm.value = {
        name: '',
        phone: '',
        localPhone: '',
        relation: ''
    };
    showEmergencyContactModal.value = true;
};

const editEmergencyContact = (index) => {
    editingContactIndex.value = index;
    const contact = profileData.value.emergencyContacts[index];
    emergencyContactForm.value = { 
        ...contact,
        localPhone: contact.phone.startsWith('+63') ? contact.phone.substring(3) : contact.phone
    };
    showEmergencyContactModal.value = true;
};

const closeEmergencyContactModal = () => {
    showEmergencyContactModal.value = false;
    editingContactIndex.value = -1;
    emergencyContactForm.value = {
        name: '',
        phone: '',
        localPhone: '',
        relation: ''
    };
    emergencyContactErrors.value = {
        name: '',
        phone: '',
        relation: ''
    };
};

const saveEmergencyContact = () => {
    // Reset any existing errors
    emergencyContactErrors.value = {
        name: '',
        phone: '',
        relation: ''
    };

    // Trim the name to remove whitespace
    const trimmedName = emergencyContactForm.value.name.trim();
    const normalizedPhone = emergencyContactForm.value.phone.replace(/\s+/g, '');

    // Check for duplicate name or phone number
    const isDuplicate = profileData.value.emergencyContacts.some((contact, index) => {
        // Skip checking against the contact being edited
        if (index === editingContactIndex.value) return false;
        
        const existingPhone = contact.phone.replace(/\s+/g, '');
        return contact.name.trim().toLowerCase() === trimmedName.toLowerCase() || 
               existingPhone === normalizedPhone;
    });

    if (isDuplicate) {
        notificationStore.error('A contact with this name or phone number already exists');
        return;
    }

    // If we're adding a new contact
    if (editingContactIndex.value === -1) {
        const newContact = {
            name: trimmedName,
            phone: normalizedPhone,
            relation: emergencyContactForm.value.relation
        };
        profileData.value.emergencyContacts.push(newContact);
    } else {
        // Updating existing contact
        const updatedContact = {
            name: trimmedName,
            phone: normalizedPhone,
            relation: emergencyContactForm.value.relation
        };
        profileData.value.emergencyContacts[editingContactIndex.value] = updatedContact;
    }

    closeEmergencyContactModal();
};

// Add this method
// Add after line 1416
const toggleNotifications = async () => {
    if (notificationLoading.value) return;

    try {
        notificationLoading.value = true;
        const newStatus = !profileData.value.notifications;

        const response = await userService.updateProfile({
            ...profileData.value,
            notifications: newStatus
        });

        if (response?.success) {
            profileData.value.notifications = newStatus;
            notificationStore.success(
                newStatus ? 'Successfully subscribed to notifications' :
                    'Successfully unsubscribed from notifications'
            );
        }
    } catch (error) {
        console.error('Toggle notifications error:', error);
        notificationStore.error('Failed to update notification preferences');
        // Revert the change on error
        profileData.value.notifications = !profileData.value.notifications;
    } finally {
        notificationLoading.value = false;
    }
};

// Add this to your existing watch effects for security score calculation
watch(
    () => profileData.value.notifications,
    () => calculateSecurityScore(),
    { immediate: true }
);

// Add this after your existing watchers
watch(() => profileData.value, (newData) => {
    console.log('Profile Data Updated:', {
        emergencyContacts: newData.emergencyContacts,
        rawData: newData
    });
}, { deep: true });

// Add this watch effect to debug emergency contacts loading
watch(() => profileData.value?.emergencyContacts, (newContacts) => {
    console.log('Emergency contacts updated:', {
        contacts: newContacts,
        length: newContacts?.length || 0,
        isArray: Array.isArray(newContacts),
        values: newContacts?.map(c => ({
            name: c.name,
            phone: c.phone,
            relation: c.relation
        }))
    });
}, { deep: true });

// Add this right before the emergency contacts section renders
console.log('Emergency Contacts in template:', profileData.value?.emergencyContacts);

// Add this after your existing setup code
watch(
    () => user.value,
    (newUser) => {
        if (newUser?.emergencyContacts) {
            profileData.value.emergencyContacts = [...newUser.emergencyContacts];
            console.log('Emergency contacts updated from user:', profileData.value.emergencyContacts);
        }
    },
    { immediate: true, deep: true }
);

// Add this function to update task completion
const updateTaskCompletion = async () => {
    try {
        const response = await checklistService.loadProgress();
        if (response?.success) {
            userStats.value.completedTasks = response.items?.filter(item => item.completed)?.length || 0;
        }
    } catch (error) {
        console.error('Error fetching task completion:', error);
        userStats.value.completedTasks = 0;
    }
};
// Add these watchers after your existing watchers
watch([
    () => profileData.value.username,
    () => profileData.value.phone,
    () => profileData.value.location,
    () => profileData.value.emergencyContacts,
    () => user.value?.email_verified
], () => {
    calculateSecurityScore();
}, { deep: true });

// Add this watcher to ensure emergency contacts persistence
watch(
    () => profileData.value.emergencyContacts,
    (newContacts) => {
        if (Array.isArray(newContacts)) {
            // Deep clone to prevent reference issues
            originalEmergencyContacts.value = JSON.parse(JSON.stringify(newContacts));
        }
    },
    { deep: true }
);

// Modify the saveProfile function to include emergency contacts validation
const saveProfile = async () => {
    if (loading.value) return;

    try {
        loading.value = true;

        // Handle avatar upload first if there's a pending avatar
        if (profileData.value.pendingAvatar) {
            const formData = new FormData();
            formData.append('avatar', profileData.value.pendingAvatar);

            const avatarResponse = await userService.updateAvatar(formData);
            if (avatarResponse.success) {
                profileData.value.avatar_url = avatarResponse.avatarUrl;
                // Clean up
                URL.revokeObjectURL(profileData.value.tempAvatarUrl);
                delete profileData.value.pendingAvatar;
                delete profileData.value.tempAvatarUrl;
            }
        }

        // Validate emergency contacts before saving
        const validContacts = profileData.value.emergencyContacts.filter(
            contact => contact && contact.name && contact.phone && contact.relation
        );

        const response = await userService.updateProfile({
            ...profileData.value,
            emergencyContacts: validContacts
        });

        if (response?.success) {
            // Update original data with all current values including avatar_url
            originalData.value = {
                ...originalData.value,
                ...profileData.value,
                emergencyContacts: JSON.parse(JSON.stringify(validContacts))
            };
            originalEmergencyContacts.value = JSON.parse(JSON.stringify(validContacts));
            notificationStore.success('Profile updated successfully');
        }
    } catch (error) {
        console.error('Save profile error:', error);
        notificationStore.error('Failed to update profile');
        // Restore emergency contacts from original data if save fails
        profileData.value.emergencyContacts = [...originalEmergencyContacts.value];
    } finally {
        loading.value = false;
    }
};

const loadEmergencyContactsFromDB = async () => {
    try {
        const response = await userService.getEmergencyContacts();

        if (response?.success) {
            const contacts = response.contacts || [];
            profileData.value.emergencyContacts = contacts;
            originalEmergencyContacts.value = JSON.parse(JSON.stringify(contacts));
            originalData.value = {
                ...originalData.value,
                emergencyContacts: JSON.parse(JSON.stringify(contacts))
            };
        }
    } catch (error) {
        console.error('Error loading emergency contacts:', error);
        throw error; // Propagate error to be handled by onMounted
    }
};

const fileInput = ref(null);

const triggerFileInput = () => {
    fileInput.value.click();
};

const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        notificationStore.error('Image size should be less than 5MB');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        notificationStore.error('Please upload an image file');
        return;
    }

    // Store the file temporarily
    profileData.value.pendingAvatar = file;
    // Create a temporary URL for preview
    profileData.value.tempAvatarUrl = URL.createObjectURL(file);
};

// Add this ref
const avatarError = ref(false);

// Modify the getAvatarUrl method (replace existing one)
const getAvatarUrl = (avatarUrl) => {
    const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'https://disaster-app-backend.onrender.com';
    
    try {
        // If no avatar URL is provided, return default avatar
        if (!avatarUrl) {
            return `${baseUrl}/uploads/avatars/default.png`;
        }

        // If it's already a full URL (including Cloudinary)
        if (avatarUrl.startsWith('http')) {
            return avatarUrl;
        }

        // For database-stored avatar URLs
        const cleanAvatarUrl = avatarUrl.replace(/^\/+/, '').replace(/\\/g, '/');
        return `${baseUrl}/uploads/avatars/${cleanAvatarUrl}`;
    } catch (error) {
        console.error('Error constructing avatar URL:', error);
        return `${baseUrl}/uploads/avatars/default.png`;
    }
};

// Modify the handleAvatarError method (replace existing one)
const handleAvatarError = async () => {
    // Try to get cached avatar from localStorage
    const cachedAvatar = localStorage.getItem(`userAvatar_${profileData.value?.id}`);
    
    // If we have a cached avatar and haven't tried it yet
    if (cachedAvatar && !profileData.value.retryCount) {
        profileData.value.retryCount = 1;
        profileData.value.avatar_url = cachedAvatar;
        return;
    }
    
    // If no cached avatar or cache failed, try with cache-busting
    if (!profileData.value.retryCount || profileData.value.retryCount === 1) {
        profileData.value.retryCount = 2;
        const currentUrl = getAvatarUrl(profileData.value.avatar_url);
        profileData.value.avatar_url = `${currentUrl}?t=${Date.now()}`;
        return;
    }
    
    // If all attempts fail, show fallback
    avatarError.value = true;
    profileData.value.avatar_url = '';
    delete profileData.value.retryCount;
};

// Modify the handleAvatarLoad method (replace existing one)
const handleAvatarLoad = () => {
    avatarError.value = false;
    
    // Cache the successful avatar URL
    if (profileData.value?.id && profileData.value.avatar_url) {
        localStorage.setItem(`userAvatar_${profileData.value.id}`, profileData.value.avatar_url);
    }
    
    delete profileData.value.retryCount;
};

const showAvatarModal = ref(false);

const openAvatarModal = () => {
    showAvatarModal.value = true;
};

const closeAvatarModal = () => {
    showAvatarModal.value = false;
    if (profileData.value.tempAvatarUrl) {
        URL.revokeObjectURL(profileData.value.tempAvatarUrl);
        profileData.value.tempAvatarUrl = null;
    }
    profileData.value.pendingAvatar = null;
};

const saveAvatar = async () => {
    if (!profileData.value.pendingAvatar || avatarLoading.value) return;

    try {
        avatarLoading.value = true;
        const formData = new FormData();
        formData.append('avatar', profileData.value.pendingAvatar);

        const response = await userService.updateAvatar(formData);
        if (response.success) {
            // Update the avatar URL immediately
            profileData.value.avatar_url = response.avatarUrl;
            
            // Update auth store
            authStore.updateUser({ ...authStore.user, avatar_url: response.avatarUrl });
            
            // Clean up
            URL.revokeObjectURL(profileData.value.tempAvatarUrl);
            delete profileData.value.pendingAvatar;
            delete profileData.value.tempAvatarUrl;
            delete profileData.value.retryCount;
            
            notificationStore.success('Profile photo updated successfully');
            closeAvatarModal();
        }
    } catch (error) {
        console.error('Avatar update error:', error);
        notificationStore.error('Failed to update profile photo');
    } finally {
        avatarLoading.value = false;
    }
};

const getInitials = (name) => {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2);
};

onMounted(async () => {
    try {
        // Load initial profile data
        const response = await userService.getProfile();
        if (response?.success && response?.user) {
            profileData.value = {
                ...response.user,
                emergencyContacts: response.user.emergencyContacts || [],
                avatar_url: response.user.avatar_url || ''
            };
            
            // Verify avatar URL is working
            if (profileData.value.avatar_url) {
                const img = new Image();
                img.onload = () => {
                    console.log('Avatar loaded successfully:', profileData.value.avatar_url);
                };
                img.onerror = () => {
                    console.error('Failed to load avatar:', profileData.value.avatar_url);
                    profileData.value.avatar_url = '';
                };
                img.src = getAvatarUrl(profileData.value.avatar_url);
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        notificationStore.error('Failed to load profile data');
    } finally {
        initialLoading.value = false;
    }
});

// Add these refs
const showDeleteModal = ref(false);
const deleteConfirmation = ref('');
const deleteError = ref('');
const deleteLoading = ref(false);

// Add these methods
const executeAccountDeletion = async () => {
    if (deleteConfirmation.value !== 'DELETE') {
        deleteError.value = 'Please type DELETE to confirm';
        return;
    }

    try {
        deleteLoading.value = true;
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/delete-account`, {
            method: 'DELETE',
            headers: {
                'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete account');
        }

        if (data.success) {
            // Clear all local storage data
            localStorage.clear();
            // Clear auth store
            authStore.logout();
            notificationStore.success('Account deleted successfully');
            // Redirect to home
            router.push('/');
        } else {
            throw new Error(data.message || 'Failed to delete account');
        }
    } catch (error) {
        console.error('Delete account error:', error);
        deleteError.value = error.message || 'Failed to delete account';
        notificationStore.error(error.message || 'Failed to delete account');
        
        if (error.message.includes('Authentication')) {
            authStore.logout();
            router.push('/login');
        }
    } finally {
        deleteLoading.value = false;
    }
};

const confirmDeleteAccount = () => {
    showDeleteModal.value = true;
    deleteConfirmation.value = '';
    deleteError.value = '';
};

const closeDeleteModal = () => {
    showDeleteModal.value = false;
    deleteConfirmation.value = '';
    deleteError.value = '';
};

const changePassword = () => {
    showPasswordModal.value = true;
};

const closePasswordModal = () => {
    showPasswordModal.value = false;
    passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    };
};

// Add this with your other refs
const localPhoneNumber = ref('');

// Add this to your mounted hook or where you load profile data
watch(() => profileData.value.phone, (newPhone) => {
    if (newPhone) {
        // Remove +63 prefix if it exists and set to localPhoneNumber
        localPhoneNumber.value = newPhone.startsWith('+63') ? 
            newPhone.substring(3) : newPhone;
    }
}, { immediate: true });

const handlePhoneInput = (event) => {
    // Remove any non-numeric characters
    let value = event.target.value.replace(/\D/g, '');
    
    // Ensure the first digit is 9
    if (value.length > 0 && value[0] !== '9') {
        value = '9' + value.substring(1);
    }
    
    // Limit to 10 digits
    value = value.substring(0, 10);
    
    // Update local phone number
    localPhoneNumber.value = value;
    
    // Update the main profile data with complete number
    profileData.value.phone = value ? `+63${value}` : '';
    
    // Validate the complete number
    validatePhoneNumber();
};

// Add this new method to handle emergency contact phone input
const handleEmergencyContactPhoneInput = (event) => {
  // Remove any non-numeric characters
  let value = event.target.value.replace(/\D/g, '');
  
  // Ensure the first digit is 9
  if (value.length > 0 && value[0] !== '9') {
    value = '9' + value.substring(1);
  }
  
  // Limit to 10 digits
  value = value.substring(0, 10);
  
  // Update local phone number
  emergencyContactForm.value.localPhone = value;
  
  // Update the main phone field with complete number
  emergencyContactForm.value.phone = value ? `+63${value}` : '';
  
  // Clear phone error if exists
  if (emergencyContactForm.value.phone) {
    emergencyContactErrors.value.phone = '';
  }
};
</script>