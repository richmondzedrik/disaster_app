import { defineStore } from 'pinia';
import { authService } from '../services/auth';
import { useNotificationStore } from './notification';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        accessToken: null,
        isAuthenticated: false
    }),

    actions: {
        async login(emailOrData, password) {
            try {
                // Input validation
                if (typeof emailOrData === 'object') {
                    if (!emailOrData.email || !emailOrData.password) {
                        throw new Error('Email and password are required');
                    }
                } else {
                    if (!emailOrData || !password) {
                        throw new Error('Email and password are required');
                    }
                }

                let response;
                if (typeof emailOrData === 'object') {
                    // Admin login case
                    response = await authService.login(emailOrData);
                } else {
                    // Regular login case
                    response = await authService.login({
                        email: emailOrData,
                        password: password,
                        isAdmin: false
                    });
                }
                
                // Check if response has nested data structure
                const loginData = response.data || response;
                
                if (loginData.success) {
                    this.setAuthData(loginData);
                    return loginData;
                } else {
                    throw new Error(loginData.message || 'Login failed');
                }
            } catch (error) {
                const notificationStore = useNotificationStore();
                const errorMessage = error.response?.data?.message || error.message;
                notificationStore.error(errorMessage);
                throw error;
            }
        },

        async register(userData) {
            try {
                const response = await authService.register(userData)
                return response
            } catch (error) {
                const notificationStore = useNotificationStore()
                notificationStore.error(error.message)
                throw error
            }
        },

        async logout() {
            try {
                await authService.logout()
            } finally {
                this.clearAuthData()
            }
        },

        setAuthData(data) {
            this.user = data.user
            this.accessToken = data.token
            this.isAuthenticated = true
            localStorage.setItem('token', data.token)
        },

        clearAuthData() {
            this.user = null
            this.accessToken = null
            this.isAuthenticated = false
            localStorage.removeItem('token')
        },

        initializeAuth() {
            const token = localStorage.getItem('token')
            if (token) {
                this.accessToken = token
                this.isAuthenticated = true
                // Optionally fetch user data here
            }
        },

        async fetchUser() {
            try {
                const response = await authService.getCurrentUser();
                if (response.success) {
                    this.user = response.user;
                    this.isAuthenticated = true;
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                this.clearAuthData();
            }
        }
    }
}) 