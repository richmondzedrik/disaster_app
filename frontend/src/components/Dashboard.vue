<template>
    <div class="dashboard-container">
        <div class="dashboard-header">
            <h1>Welcome, {{ getUserName }}</h1>
            <div class="quick-actions">
                <button @click="viewAlerts" class="action-btn alert-btn">
                    <i class="fas fa-bell"></i>
                    View Alerts
                    <span v-if="alerts.length" class="alert-badge">{{ alerts.length }}</span>
                </button>
                <button @click="router.push('/hazard-map')" class="action-btn map-btn">
                    <i class="fas fa-map-marked-alt"></i>
                    Hazard Map
                </button>
            </div>
        </div>

        <div class="dashboard-grid">
            <!-- Alert Status Card -->
            <div class="dashboard-card alert-status" :class="{ active: hasActiveAlerts }">
                <div class="card-header">
                    <i class="fas fa-exclamation-circle"></i>
                    <h2>Alert Status</h2>
                </div>
                <div class="card-content">
                    <p>{{ alertMessage }}</p>
                    <div v-if="hasActiveAlerts" class="alert-actions">
                        <button @click="viewAlerts" class="view-details-btn">
                            View Details
                        </button>
                    </div>
                </div>
            </div>

            <!-- Preparation Progress Card -->
            <div class="dashboard-card prep-progress">
                <div class="card-header">
                    <i class="fas fa-tasks"></i>
                    <h2>Preparation Progress</h2>
                </div>
                <div class="card-content">
                    <div class="progress-item">
                        <div class="progress-label">
                            <span>Emergency Plan</span>
                            <span>{{ planProgress }}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: `${planProgress}%` }"></div>
                        </div>
                    </div>
                    <div class="progress-item">
                        <div class="progress-label">
                            <span>Supply Checklist</span>
                            <span>{{ supplyProgress }}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: `${supplyProgress}%` }"></div>
                        </div>
                    </div>
                    <button @click="router.push('/checklist')" class="update-btn">
                        Update Checklist
                    </button>
                </div>
            </div>

            <!-- Quick Access Card -->
            <div class="dashboard-card quick-access">
                <div class="card-header">
                    <i class="fas fa-bolt"></i>
                    <h2>Quick Access</h2>
                </div>
                <div class="card-content">
                    <div class="quick-access-grid">
                        <button @click="router.push('/emergency-contacts')" class="quick-access-btn">
                            <i class="fas fa-phone-alt"></i>
                            Emergency Contacts
                        </button>
                        <button @click="router.push('/evacuation-route')" class="quick-access-btn">
                            <i class="fas fa-route"></i>
                            Evacuation Routes
                        </button>
                        <button @click="router.push('/first-aid')" class="quick-access-btn">
                            <i class="fas fa-first-aid"></i>
                            First Aid Guide
                        </button>
                        <button @click="router.push('/resources')" class="quick-access-btn">
                            <i class="fas fa-book"></i>
                            Resources
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    background: linear-gradient(to bottom, #f8fafc, #ffffff);
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
}

.dashboard-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.quick-actions {
    display: flex;
    gap: 1rem;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    color: white;
}

.action-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: 0.5s;
}

.action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 209, 209, 0.3);
}

.action-btn:hover::after {
    left: 100%;
}

.alert-btn {
    background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
    color: white;
}

.map-btn {
    background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
    color: white;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
}

.dashboard-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition: all 0.3s ease;
    border: 1px solid rgba(226, 232, 240, 0.8);
}

.dashboard-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.75rem;
    background: linear-gradient(to right, #f8fafc, #ffffff);
    border-bottom: 1px solid #e2e8f0;
}

.card-header i {
    font-size: 1.75rem;
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.card-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a365d;
}

.card-content {
    padding: 1.5rem;
}

.progress-item {
    margin-bottom: 1.5rem;
}

.progress-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.progress-bar {
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(to right, #42b983, #34d399);
    transition: width 0.3s ease;
}

.progress-fill.progress-high {
    background: #2563eb;
}

.progress-fill.progress-medium {
    background: #3b82f6;
}

.progress-fill.progress-low {
    background: #60a5fa;
}

.quick-access-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.quick-access-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    background: linear-gradient(to bottom, #ffffff, #f8fafc);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.quick-access-btn:hover {
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    border-color: transparent;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 209, 209, 0.3);
}

.quick-access-btn:hover i {
    color: white;
    transform: scale(1.1) rotate(5deg);
}

.quick-access-btn i {
    font-size: 1.5rem;
    color: #2563eb;
}

.update-btn {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 500;
    position: relative;
    overflow: hidden;
}

.update-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 209, 209, 0.3);
}

.alert-status {
    border: 2px solid transparent;
}

.alert-status.active {
    border: 2px solid transparent;
    border-image: linear-gradient(135deg, #dc2626, #ef4444) 1;
}

.view-details-btn {
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.view-details-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 209, 209, 0.3);
}

.alert-badge {
    background: #ef4444;
    color: white;
    border-radius: 999px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
}

@media (max-width: 768px) {
    .dashboard-container {
        padding: 1rem;
    }

    .dashboard-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }

    .quick-actions {
        width: 100%;
        justify-content: center;
    }

    .dashboard-grid {
        grid-template-columns: 1fr;
    }

    .dashboard-header h1 {
        font-size: 2rem;
    }
    
    .dashboard-grid {
        gap: 1.5rem;
    }
}
</style>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { alertService } from '../services/alertService';
import { useNotificationStore } from '../stores/notification';

const authStore = useAuthStore();
const router = useRouter();
const notificationStore = useNotificationStore();

const user = computed(() => authStore.user);
const isAdmin = computed(() => authStore.user?.role === 'admin');

// Add computed property for username with fallback
const getUserName = computed(() => {
    const username = user.value?.username;
    console.log('Current user:', user.value); // Debug log
    return username || 'User';
});

// Replace mock data with reactive refs
const hasActiveAlerts = ref(false);
const alertMessage = ref('No active alerts');
const alerts = ref([]);
const loading = ref(false);

// Add function to load alerts
const loadAlerts = async () => {
    try {
        loading.value = true;
        const { alerts: fetchedAlerts, success } = await alertService.getActiveAlerts();
        
        if (success) {
            // Filter out inactive alerts and sort by priority
            alerts.value = fetchedAlerts.filter(alert => alert.is_active)
                .sort((a, b) => (b.priority || 0) - (a.priority || 0));
            
            hasActiveAlerts.value = alerts.value.length > 0;
            
            // Set alert message based on highest priority active alert
            alertMessage.value = hasActiveAlerts.value 
                ? `${alerts.value[0].type.toUpperCase()}: ${alerts.value[0].message}`
                : 'No active alerts';
                
            // Force reactive update
            alerts.value = [...alerts.value];
        } else {
            throw new Error('Failed to load alerts');
        }
    } catch (error) {
        console.error('Error loading alerts:', error);
        notificationStore.error('Failed to load alerts. Please try again.');
        alerts.value = [];
        hasActiveAlerts.value = false;
        alertMessage.value = 'No active alerts';
    } finally {
        loading.value = false;
    }
};

// Load alerts on component mount
onMounted(async () => {
    try {
        await authStore.initializeAuth();
        
        // Check if user is authenticated
        if (!authStore.isAuthenticated) {
            router.push('/login');
            return;
        }

        // Check if user is verified or admin
        if (!authStore.user?.email_verified && !authStore.isAdmin) {
            notificationStore.warning('Please verify your email to access the dashboard');
            router.push('/profile');
            return;
        }

        // Continue with existing dashboard initialization
        await Promise.all([loadAlerts()]);
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        notificationStore.error('Failed to initialize dashboard');
    }
});

const planProgress = ref(65);
const supplyProgress = computed(() => {
    try {
        const progress = localStorage.getItem('checklistProgress');
        return progress ? parseInt(progress) : 0;
    } catch (error) {
        console.error('Error reading checklist progress:', error);
        return 0;
    }
});

const logout = async () => {
    await authStore.logout();
    router.push('/login');
};

const viewAlerts = () => {
    router.push('/alerts');
};

const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Add navigation method for hazard map
const viewHazardMap = () => {
    router.push('/hazard-map');
};
</script> 