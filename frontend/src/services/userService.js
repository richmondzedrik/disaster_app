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

    updateProfile: debounce(async function(data) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const formattedData = {
                ...data,
                notifications: data.notifications,
                emergency_contacts: Array.isArray(data.emergencyContacts) 
                    ? data.emergencyContacts.map(contact => ({
                        name: contact.name?.trim(),
                        phone: contact.phone?.trim(),
                        relation: contact.relation?.trim()
                    }))
                    : []
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
                const emergencyContacts = userData.emergency_contacts || userData.emergencyContacts || [];
                const parsedContacts = typeof emergencyContacts === 'string' 
                    ? JSON.parse(emergencyContacts) 
                    : emergencyContacts;  

                return {
                    ...response.data,
                    user: {
                        ...userData,
                        notifications: userData.notifications || { email: true, push: true },
                        emergencyContacts: parsedContacts
                    }
                };
            }
             
            return response.data;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }, 500),

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
    }
}; 