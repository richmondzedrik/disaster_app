import api from './api';
import { debounce } from 'lodash';

export const userService = {
    getProfile: async function() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await api.get('/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data?.user) {
                const userData = response.data.user;
                return {
                    ...response.data,
                    user: {
                        ...userData,
                        notifications: userData.notifications ? 
                            (typeof userData.notifications === 'string' ? 
                                JSON.parse(userData.notifications) : 
                                userData.notifications) : 
                            { email: true, push: true },
                        emergencyContacts: userData.emergency_contacts || userData.emergencyContacts || []
                    }
                };
            }
            
            return response.data;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    },

    updateProfile: debounce(async function(data) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const formattedData = {
                ...data,
                notifications: data.notifications,
                emergency_contacts: data.emergencyContacts || []
            };

            const response = await api.put('/auth/profile', formattedData, {
                headers: {
                    'Content-Type': 'application/json',  
                    'Authorization': `Bearer ${token}`  
                }
            });
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update profile');
            }
            
            if (response.data?.user) {
                const userData = response.data.user;
                return {
                    ...response.data,
                    user: {
                        ...userData,
                        notifications: userData.notifications || { email: true, push: true },
                        emergencyContacts: userData.emergency_contacts || []
                    }
                };
            }
            
            return response.data;
        } catch (error) {
            console.error('Profile update error:', error);
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw error;
        }
    }, 500)
}; 