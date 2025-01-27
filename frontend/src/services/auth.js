import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const authService = {
    async login(credentials) {
        const response = await axios.post(`${API_URL}/auth/login`, credentials);
        return response.data;
    },

    async getProfile() {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found');
        }

        const response = await axios.get(`${API_URL}/auth/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    },

    async forgotPassword(email) {
        const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
        return response.data;
    },

    async resetPassword(token, newPassword) {
        const response = await axios.post(`${API_URL}/auth/reset-password`, {
            token,
            newPassword
        });
        return response.data;
    },

    async resendVerificationCode(email) {
        try {
            const response = await axios.post(`${API_URL}/auth/resend-code`, { email });
            return response.data;
        } catch (error) {
            console.error('Resend verification code error:', error);
            throw error.response?.data || error;
        }
    },

    async verifyCode(email, code) {
        try {
            const response = await axios.post(`${API_URL}/auth/verify-code`, {
                email,
                code
            });
            return response.data;
        } catch (error) {
            console.error('Verify code error:', error);
            if (error.response?.data) {
                throw error.response.data;
            }
            throw error;
        }
    },

    async changePassword(currentPassword, newPassword) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Verify token format
            if (!token.startsWith('Bearer ')) {
                // Add Bearer prefix if missing
                localStorage.setItem('token', `Bearer ${token}`);
            }

            const response = await axios.post(
                `${API_URL}/auth/change-password`,
                {
                    currentPassword,
                    newPassword
                },
                {
                    headers: {
                        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data) {
                throw new Error('Invalid response from server');
            }

            return response.data;
        } catch (error) {
            console.error('Change password error:', error);
            
            // Handle specific error cases
            if (error.response?.status === 401) {
                // Clear invalid token
                localStorage.removeItem('token');
                throw new Error('Your session has expired. Please login again.');
            }
            
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            
            throw error;
        }
    }
};

export default authService; 