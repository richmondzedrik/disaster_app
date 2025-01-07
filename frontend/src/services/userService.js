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

            console.log('Raw API Response:', response.data); // Debug log

            if (response.data?.user) {
                const userData = response.data.user;
                
                // Parse emergency contacts
                let emergencyContacts = [];
                
                if (userData.emergency_contacts) {
                    try {
                        emergencyContacts = typeof userData.emergency_contacts === 'string' 
                            ? JSON.parse(userData.emergency_contacts)
                            : userData.emergency_contacts;
                    } catch (e) {
                        console.error('Error parsing emergency contacts:', e);
                    }
                }

                console.log('Parsed Emergency Contacts:', emergencyContacts); // Debug log

                return {
                    success: true,
                    user: {
                        ...userData,
                        notifications: userData.notifications ? 
                            (typeof userData.notifications === 'string' ? 
                                JSON.parse(userData.notifications) : 
                                userData.notifications) : 
                            { email: true, push: true },
                        emergencyContacts: Array.isArray(emergencyContacts) ? emergencyContacts : []
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
    }, 500)
}; 