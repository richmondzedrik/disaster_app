import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useNotificationStore } from './notification';
import { useAuthStore } from './auth';
import adminService from '@/services/adminService';
import { useRouter } from 'vue-router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const useAdminStore = defineStore('admin', () => {
    const stats = ref({ users: 0, posts: 0, alerts: 0 });
    const recentActivity = ref([]);
    const isLoading = ref(false);
    const notificationStore = useNotificationStore();
    const authStore = useAuthStore();
    const router = useRouter();

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    const fetchDashboardStats = async () => {
      try {
        if (!authStore.isAuthenticated) {
          throw new Error('Not authenticated');
        }
    
        isLoading.value = true;
        const response = await adminService.getDashboardStats();
        
        if (response.success) {
          stats.value = response.stats;
          recentActivity.value = response.recentActivity;
          return true;
        } else {
          // Handle fallback data
          stats.value = response.stats;
          recentActivity.value = response.recentActivity;
          notificationStore.warning('Using cached dashboard data');
          return false;
        }
    
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        stats.value = { users: 0, posts: 0, alerts: 0 };
        recentActivity.value = [];
        
        if (error.message.includes('Authentication failed')) {
          await authStore.logout();
          router.push('/login');
        } else {
          notificationStore.error('Failed to load dashboard statistics');
        }
        return false;
      } finally {
        isLoading.value = false;
      }
    };
    
    return {
        stats,
        recentActivity,
        isLoading,
        fetchDashboardStats
    };
});