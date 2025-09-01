import axios from 'axios';

// Test configuration
const API_URL = 'https://disaster-app.onrender.com';
const TEST_USER = {
    username: 'testuser_' + Date.now(),
    email: 'test_' + Date.now() + '@example.com',
    password: 'TestPass123!'
};

console.log('🧪 Testing Authentication System Fix');
console.log('=====================================');

async function testAPI() {
    try {
        // Test 1: Check if backend is running
        console.log('\n1️⃣ Testing backend connection...');
        const healthCheck = await axios.get(`${API_URL}/api/test`);
        console.log('✅ Backend is running:', healthCheck.data.message);

        // Test 2: Check database connection
        console.log('\n2️⃣ Testing database connection...');
        const dbTest = await axios.get(`${API_URL}/api/db-test`);
        console.log('✅ Database connected:', dbTest.data.message);

        // Test 3: Test registration
        console.log('\n3️⃣ Testing user registration...');
        const registerResponse = await axios.post(`${API_URL}/api/auth/register`, TEST_USER);
        console.log('✅ Registration successful:', registerResponse.data.message);

        // Test 4: Test login (this is where the original error occurred)
        console.log('\n4️⃣ Testing user login...');
        const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });

        if (loginResponse.data.success) {
            console.log('✅ Login successful!');
            console.log('📋 User data:', {
                id: loginResponse.data.user?.id,
                username: loginResponse.data.user?.username,
                email: loginResponse.data.user?.email,
                role: loginResponse.data.user?.role
            });
            console.log('🔑 Token received:', loginResponse.data.accessToken ? 'Yes' : 'No');
            
            // Test 5: Test authenticated request
            console.log('\n5️⃣ Testing authenticated request...');
            const token = loginResponse.data.accessToken;
            const profileResponse = await axios.get(`${API_URL}/api/auth/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('✅ Authenticated request successful:', profileResponse.data.user?.username);
            
        } else {
            console.error('❌ Login failed:', loginResponse.data.message);
        }

        console.log('\n🎉 All tests passed! Authentication system is working correctly.');
        
    } catch (error) {
        console.error('\n❌ Test failed:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url
        });
        
        if (error.message.includes("can't assign to property")) {
            console.error('\n🔍 This is the original error we were trying to fix!');
            console.error('The issue is likely in the frontend auth store or API configuration.');
        }
    }
}

// Run the test
testAPI();
