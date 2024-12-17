import api from './api';
import { debounce } from 'lodash';

export const userService = {
    async getProfile() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await api.get('/auth/profile', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (response.data?.success && response.data?.user) {
                const userData = response.data.user;
                
                // Parse notifications and emergency_contacts if they're strings
                const parsedData = {
                    ...userData,
                    notifications: userData.notifications ? 
                        (typeof userData.notifications === 'string' ? 
                            JSON.parse(userData.notifications) : 
                            userData.notifications) : 
                        { email: true, push: true },
                    // Ensure emergency_contacts is properly parsed and transformed
                    emergencyContacts: userData.emergency_contacts ? 
                        (typeof userData.emergency_contacts === 'string' ? 
                            JSON.parse(userData.emergency_contacts) : 
                            userData.emergency_contacts) : 
                        []
                };

                return {
                    success: true,
                    user: parsedData
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
                notifications: typeof data.notifications === 'string' ? 
                    JSON.parse(data.notifications) : 
                    data.notifications,
                emergency_contacts: data.emergencyContacts || []
            };

            const response = await api.put('/auth/profile', formattedData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('Profile update response:', response.data);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update profile');
            }
            
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
                        emergencyContacts: userData.emergency_contacts ? 
                            (typeof userData.emergency_contacts === 'string' ? 
                                JSON.parse(userData.emergency_contacts) : 
                                userData.emergency_contacts) : 
                            []
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