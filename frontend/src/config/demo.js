export const DEMO_CONFIG = {
    defaultLocation: {
        lat: 40.7128,
        lng: -74.0060,
        zoom: 10
    },
    demoUser: {
        username: 'demo_user',
        email: 'demo@example.com',
        password: 'demo123'
    },
    apiBaseUrl: process.env.NODE_ENV === 'production' 
        ? 'https://api.yourdomain.com'
        : 'http://localhost:3000'
}; 