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
                
                // Parse emergency contacts with better error handling
                let emergencyContacts = [];
                
                try {
                    if (userData.emergencyContacts || userData.emergency_contacts) {
                        const rawContacts = userData.emergencyContacts || userData.emergency_contacts;
                        console.log('Raw contacts from API:', rawContacts);
                        
                        emergencyContacts = typeof rawContacts === 'string' 
                            ? JSON.parse(rawContacts)
                            : rawContacts;
                            
                        // Ensure proper structure
                        emergencyContacts = Array.isArray(emergencyContacts) 
                            ? emergencyContacts.map(contact => ({
                                name: contact.name || '',
                                phone: contact.phone || '',
                                relation: contact.relation || ''
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
                        notifications: userData.notifications || { email: true, push: true },
                        emergencyContacts: emergencyContacts
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