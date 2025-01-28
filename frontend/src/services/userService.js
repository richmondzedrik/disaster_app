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
                
                // Handle emergency contacts parsing
                let emergencyContacts = [];
                try {
                    if (userData.emergencyContacts || userData.emergency_contacts) {
                        const rawContacts = userData.emergencyContacts || userData.emergency_contacts;
                        
                        // Parse if string, otherwise use directly
                        emergencyContacts = typeof rawContacts === 'string' 
                            ? JSON.parse(rawContacts)
                            : rawContacts;
                        
                        // Validate structure
                        emergencyContacts = Array.isArray(emergencyContacts)
                            ? emergencyContacts
                                .filter(contact => contact && contact.name && contact.phone && contact.relation)
                                .map(contact => ({
                                    name: contact.name.trim(),
                                    phone: contact.phone.trim(),
                                    relation: contact.relation.trim()
                                }))
                            : [];
                    }
                } catch (e) {
                    console.error('Error parsing emergency contacts:', e);
                    emergencyContacts = [];
                }

                return {
                    success: true,
                    user: {
                        ...userData,
                        emergencyContacts
                    }
                };  
            }
            
            return response.data;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    },

    updateProfile: async function(data) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Ensure notifications is an object
            const notifications = typeof data.notifications === 'boolean' 
                ? { email: data.notifications, push: data.notifications }
                : data.notifications || { email: true, push: true };

            // Format emergency contacts
            const emergencyContacts = Array.isArray(data.emergencyContacts) 
                ? data.emergencyContacts
                    .filter(contact => contact && contact.name && contact.phone && contact.relation)
                    .map(contact => ({
                        name: contact.name?.trim(),
                        phone: contact.phone?.trim(),
                        relation: contact.relation?.trim()
                    }))
                : [];

            const formattedData = {
                username: data.username?.trim() || '',
                phone: data.phone?.trim() || '',
                location: data.location?.trim() || '',
                notifications,
                emergencyContacts
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
                        emergencyContacts: Array.isArray(userData.emergencyContacts) 
                            ? userData.emergencyContacts 
                            : []
                    }
                };
            }
             
            return response.data;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    },

    getEmergencyContacts: async function() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await api.get('/auth/emergency-contacts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return {
                success: response.data?.success || false,
                contacts: Array.isArray(response.data?.contacts) ? 
                    response.data.contacts.map(contact => ({
                        name: contact.name?.trim() || '',
                        phone: contact.phone?.trim() || '',
                        relation: contact.relation?.trim() || ''
                    })) : [],
                message: response.data?.message
            };
        } catch (error) {
            console.error('Get emergency contacts error:', error);
            throw new Error(error.response?.data?.message || 'Failed to load emergency contacts');
        }
    },

    updateNotificationPreferences: async (preferences) => {
        try {
            const response = await api.put('/users/notifications', preferences);
            return response.data;
        } catch (error) {
            console.error('Update notification preferences error:', error);
            throw error;
        }
    },

    updateAvatar: async function(formData) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
    
            const response = await api.post('/auth/avatar', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
    
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update avatar');
            }
    
            return response.data;
        } catch (error) {
            console.error('Avatar update error:', error);
            if (error.response?.status === 404) {
                throw new Error('Avatar upload service not found. Please check API configuration.');
            }
            throw error;
        }
    }
}; 