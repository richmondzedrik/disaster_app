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
    }
};

export default authService; 