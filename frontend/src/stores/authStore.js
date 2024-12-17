const updateUser = (userData) => {
    // Update only specific fields without triggering unnecessary reactivity
    user.value = {
        ...user.value,
        username: userData.username,
        phone: userData.phone,
        location: userData.location,
        notifications: userData.notifications,
        emergencyContacts: userData.emergencyContacts || userData.emergency_contacts || [],
        // Keep other existing fields
        email: user.value.email,
        email_verified: user.value.email_verified,
        role: user.value.role,
        id: user.value.id
    };
}; 