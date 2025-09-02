import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

async function testAlertCreation() {
    try {
        console.log('🔍 Testing alert creation...');
        
        // Login as admin first
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'richmondzedrik@gmail.com',
            password: 'AdminPassword123!'
        });
        
        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }
        
        let adminToken = loginResponse.data.accessToken;
        if (adminToken && adminToken.startsWith('Bearer ')) {
            adminToken = adminToken.substring(7);
        }
        
        console.log('✅ Admin login successful');
        
        // Test alert creation
        const alertData = {
            message: 'Test Alert Creation',
            type: 'info',
            priority: 1,
            isPublic: true
        };
        
        const createResponse = await axios.post(`${BASE_URL}/api/admin/alerts`, alertData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        console.log('✅ Alert creation response:', createResponse.status);
        console.log('📄 Response data:', createResponse.data);
        
        return true;
        
    } catch (error) {
        console.log('❌ Alert creation failed:', error.response?.data?.message || error.message);
        console.log('📄 Error details:', error.response?.data);
        return false;
    }
}

testAlertCreation().catch(console.error);
