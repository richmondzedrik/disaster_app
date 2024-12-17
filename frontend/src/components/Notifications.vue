<template>
    <div class="notifications">
        <TransitionGroup name="notification">
            <div
                v-for="notification in sortedNotifications"
                :key="notification.id"
                class="notification"
                :class="[notification.type, { paused: isPaused(notification.id) }]"
                @mouseenter="pauseTimer(notification.id)"
                @mouseleave="resumeTimer(notification.id)"
            >
                <div class="notification-content">
                    <div class="notification-icon">
                        <i :class="getIcon(notification.type)"></i>
                    </div>
                    <div class="notification-message">
                        <p class="message-text">{{ notification.message }}</p>
                        <div class="progress-bar" v-if="notification.duration !== 0">
                            <div 
                                class="progress" 
                                :style="{ 
                                    animationDuration: `${notification.duration}ms`,
                                    animationPlayState: isPaused(notification.id) ? 'paused' : 'running'
                                }"
                            ></div>
                        </div>
                    </div>
                    <button 
                        class="close-btn" 
                        @click="removeNotification(notification.id)"
                        aria-label="Close notification"
                    >
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useNotificationStore } from '../stores/notification';
import { storeToRefs } from 'pinia';

const notificationStore = useNotificationStore();
const { notifications } = storeToRefs(notificationStore);
const pausedNotifications = ref(new Set());

// Sort notifications by timestamp
const sortedNotifications = computed(() => {
    return [...notifications.value].sort((a, b) => b.timestamp - a.timestamp);
});

const getIcon = (type) => {
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
};

const removeNotification = (id) => {
    notificationStore.remove(id);
};

const pauseTimer = (id) => {
    pausedNotifications.value.add(id);
};

const resumeTimer = (id) => {
    pausedNotifications.value.delete(id);
};

const isPaused = (id) => {
    return pausedNotifications.value.has(id);
};
</script>

<style scoped>
.notifications {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 9999;
    pointer-events: none;
    max-width: 400px;
    width: 100%;
}

.notification {
    pointer-events: auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    width: 100%;
    min-width: 300px;
}

.notification-content {
    display: flex;
    align-items: center;
    padding: 1rem;
    gap: 1rem;
}

.notification-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.notification-message {
    flex-grow: 1;
    margin-right: 1rem;
}

.message-text {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.4;
}

.close-btn {
    background: none;
    border: none;
    color: #6c757d;
    cursor: pointer;
    padding: 0.5rem;
    font-size: 1rem;
    transition: color 0.2s ease;
    flex-shrink: 0;
}

.close-btn:hover {
    color: #343a40;
}

.progress-bar {
    width: 100%;
    height: 3px;
    background-color: rgba(0, 0, 0, 0.1);
    margin-top: 8px;
    border-radius: 1.5px;
    overflow: hidden;
}

.progress {
    width: 100%;
    height: 100%;
    background-color: #00D1D1;
    transform-origin: left center;
    animation: progress linear forwards;
}

/* Notification Types */
.success {
    border-left: 4px solid #00D1D1;
}

.success .notification-icon {
    color: #00D1D1;
}

.error {
    border-left: 4px solid #4052D6;
}

.error .notification-icon {
    color: #4052D6;
}

.warning {
    border-left: 4px solid #00ADAD;
}

.warning .notification-icon {
    color: #00ADAD;
}

.info {
    border-left: 4px solid #005C5C;
}

.info .notification-icon {
    color: #005C5C;
}

/* Animations */
.notification-enter-active,
.notification-leave-active {
    transition: all 0.3s ease;
}

.notification-enter-from {
    opacity: 0;
    transform: translateX(30px);
}

.notification-leave-to {
    opacity: 0;
    transform: translateX(30px);
}

@keyframes progress {
    from {
        transform: scaleX(1);
    }
    to {
        transform: scaleX(0);
    }
}

@media (max-width: 480px) {
    .notifications {
        top: 70px;
        right: 10px;
        left: 10px;
        max-width: none;
    }

    .notification {
        width: calc(100% - 2rem);
        min-width: unset;
    }
}
</style> 