import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { authService } from '../services/auth'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const accessToken = ref('')
    const isAuthenticated = ref(false)

    const initializeAuth = async () => {
        try {
            const token = localStorage.getItem('token')
            const userData = JSON.parse(localStorage.getItem('user') || 'null')

            if (!token || !userData || !userData.role) {
                logout()
                return false
            }

            // Ensure token is properly formatted
            const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`
            
            // Update store state
            accessToken.value = formattedToken
            user.value = userData
            isAuthenticated.value = true
            
            // Update API headers
            api.defaults.headers.common['Authorization'] = formattedToken
            
            return {
                success: true,
                user: userData,
                token: formattedToken
            }
        } catch (error) {
            console.error('Auth initialization error:', error)
            logout()
            return false
        }
    }

    const login = async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            
            if (response.data?.success) {
                const { accessToken, user: userData } = response.data;
                
                // Store auth data
                localStorage.setItem('token', accessToken);
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Update store state
                isAuthenticated.value = true;
                user.value = userData;
                
                // Set axios default header
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                
                return response.data;
            }

            // If the response indicates email doesn't exist
            if (response.data?.error === 'email_not_found') {
                throw new Error('No account found with this email. Please register first.');
            }

            throw new Error(response.data?.message || 'Login failed');
        } catch (error) {
            console.error('Login error:', error);
            // Clear any existing auth data on error
            localStorage.removeItem('token');  
            localStorage.removeItem('user');
            isAuthenticated.value = false;
            user.value = null;
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            console.log('📝 Starting registration process...');
            
            // Ensure all required fields are present
            const registrationData = {
                username: userData.username,
                email: userData.email,
                password: userData.password
            };
            
            console.log('📤 Sending registration data:', registrationData);
            
            const response = await api.post('/auth/register', registrationData);
            
            if (response.data?.success) {
                console.log('✅ Registration successful:', response.data);
                localStorage.setItem('pendingVerificationEmail', userData.email);
                return response.data;
            } else {   
                console.error('❌ Registration failed:', response.data);
                throw new Error(response.data?.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                stack: error.stack
            });
            throw error;
        }
    };

    const resendVerificationCode = async (email) => {
        try {
            const response = await api.post('/auth/resend-verification', { email })
            if (response.data?.success) {
                localStorage.setItem('pendingVerificationEmail', email)
            }
            return response.data
        } catch (error) {
            console.error('Resend verification error:', error)
            throw error.response?.data || error
        }
    }

    const verifyEmail = async (email, code) => {
        try {
            const response = await api.post('/auth/verify-email', { email, code });
            
            if (response.data?.success) {
                console.log('✅ Email verification successful');
                localStorage.removeItem('pendingVerificationEmail');
                
                if (response.data.user) {
                    // Don't update user data yet - they need to login first
                    console.log('User data received:', response.data.user);
                }
                return response.data;
            } else {
                throw new Error(response.data?.message || 'Verification failed');
            }
        } catch (error) {
            console.error('❌ Email verification error:', error);
            throw error.response?.data || error;
        }
    };

    const logout = () => {
        // Clear auth state
        user.value = null
        accessToken.value = ''
        isAuthenticated.value = false
        
        // Clear localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('pendingVerificationEmail')
        
        // Clear API headers
        delete api.defaults.headers.common['Authorization']
    }

    const updateUser = (userData) => {
        if (!userData) return;
        
        // Only update specific fields to prevent loops
        const updatedUser = {
            ...user.value,
            username: userData.username,
            phone: userData.phone,
            location: userData.location,
            notifications: userData.notifications,
            emergency_contacts: userData.emergency_contacts,
            email_verified: userData.email_verified
        };
        
        user.value = updatedUser;
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const handleAuthError = () => {
        user.value = null
        accessToken.value = null
        isAuthenticated.value = false
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    const isAdmin = computed(() => user.value?.role === 'admin')

    const checkUsername = async (username) => {
        try {
            // Use a different endpoint that doesn't require authentication
            const response = await api.post('/auth/validate-username', { username }, {
                // Skip auth header for this request
                headers: {
                    'Content-Type': 'application/json',
                    // Remove Authorization header
                    'Authorization': undefined
                }
            });
            return {
                available: response.data.success,
                message: response.data.message
            };
        } catch (error) {
            if (error.response?.status === 400) {
                // Handle validation errors
                return {
                    available: false,
                    message: error.response.data.message || 'Username is not available'
                };
            }
            console.error('Username check error:', error);
            throw error;
        }
    };

    const checkEmail = async (email) => {
        try {
            const response = await api.post('/auth/validate-email', { email }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': undefined
                }
            });
            return {
                available: response.data.success,
                message: response.data.message
            };
        } catch (error) {
            // Handle 400 status (validation errors) gracefully
            if (error.response?.status === 400) {
                return {
                    available: false,
                    message: error.response.data.message || 'Email is not available'
                };
            }
            // For other errors, throw them to be handled by the component
            console.error('Email check error:', error);
            throw new Error('Unable to verify email availability');
        }
    };

    const handleAdminAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;

            const response = await api.get('/api/auth/verify', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.user?.role === 'admin') {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Admin auth error:', error);
            return false;
        }
    };

    return {
        user,
        accessToken,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        initializeAuth,
        updateUser,
        handleAuthError,
        resendVerificationCode,
        verifyEmail,
        checkUsername,
        checkEmail,
        handleAdminAuth,
    }
}) 