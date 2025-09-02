import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Test configuration
const testConfig = {
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
};

// Test user credentials
const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    username: 'testuser'
};

let authToken = null;

// Helper function to make authenticated requests
const makeAuthRequest = (method, url, data = null) => {
    const config = {
        method,
        url: `${BASE_URL}${url}`,
        headers: {
            ...testConfig.headers,
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        timeout: testConfig.timeout
    };
    
    if (data) {
        config.data = data;
    }
    
    return axios(config);
};

// Test functions
async function testServerConnection() {
    console.log('\n🔍 Testing server connection...');
    try {
        const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
        console.log('✅ Server is running:', response.data);
        return true;
    } catch (error) {
        console.log('❌ Server connection failed:', error.message);
        return false;
    }
}

async function testDatabaseConnection() {
    console.log('\n🔍 Testing database connection...');
    try {
        const response = await axios.get(`${BASE_URL}/db-test`, { timeout: 5000 });
        console.log('✅ Database connection:', response.data);
        return true;
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        return false;
    }
}

async function testUserAuthentication() {
    console.log('\n🔍 Testing user authentication...');
    try {
        // Try to login with test user
        const loginResponse = await makeAuthRequest('post', '/api/auth/login', {
            email: testUser.email,
            password: testUser.password
        });
        
        if (loginResponse.data.success) {
            // Handle token format - remove Bearer prefix if present since we'll add it in makeAuthRequest
            authToken = loginResponse.data.accessToken;
            if (authToken && authToken.startsWith('Bearer ')) {
                authToken = authToken.substring(7); // Remove "Bearer " prefix
            }
            console.log('✅ User authentication successful');
            console.log('🔑 Token received:', authToken ? 'Yes' : 'No');
            return true;
        } else {
            console.log('❌ Login failed:', loginResponse.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Authentication error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testProfileLoading() {
    console.log('\n🔍 Testing profile loading...');
    try {
        // Test auth/profile endpoint
        const authProfileResponse = await makeAuthRequest('get', '/api/auth/profile');
        console.log('Auth profile response:', authProfileResponse.data);
        
        // Test users/profile endpoint
        const usersProfileResponse = await makeAuthRequest('get', '/api/users/profile');
        console.log('Users profile response:', usersProfileResponse.data);
        
        if (authProfileResponse.data.success || usersProfileResponse.data.success) {
            console.log('✅ Profile loading works');
            return true;
        } else {
            console.log('❌ Profile loading failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Profile loading error:', error.response?.data?.message || error.message);
        console.log('Error details:', error.response?.data);
        return false;
    }
}

async function testProfileSaving() {
    console.log('\n🔍 Testing profile saving...');
    try {
        const updateData = {
            username: 'testuser_updated',
            phone: '+639123456789',
            location: 'Test Location',
            notifications: { email: true, push: true },
            emergencyContacts: [
                {
                    name: 'Test Contact',
                    phone: '+639987654321',
                    relation: 'Friend'
                }
            ]
        };
        
        // Test auth/profile update
        const authUpdateResponse = await makeAuthRequest('put', '/api/auth/profile', updateData);
        console.log('Auth profile update response:', authUpdateResponse.data);
        
        if (authUpdateResponse.data.success) {
            console.log('✅ Profile saving works');
            return true;
        } else {
            console.log('❌ Profile saving failed:', authUpdateResponse.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Profile saving error:', error.response?.data?.message || error.message);
        console.log('Error details:', error.response?.data);
        return false;
    }
}

async function testAlertsLoading() {
    console.log('\n🔍 Testing alerts loading...');
    try {
        // Test active alerts endpoint
        const activeAlertsResponse = await makeAuthRequest('get', '/api/alerts/active');
        console.log('Active alerts response:', activeAlertsResponse.data);
        
        // Test user-specific alerts endpoint
        const userAlertsResponse = await makeAuthRequest('get', '/api/alerts/active/user');
        console.log('User alerts response:', userAlertsResponse.data);
        
        // Test alert count endpoint
        const alertCountResponse = await makeAuthRequest('get', '/api/alerts/count');
        console.log('Alert count response:', alertCountResponse.data);
        
        if (activeAlertsResponse.data.success) {
            console.log('✅ Alerts loading works');
            return true;
        } else {
            console.log('❌ Alerts loading failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Alerts loading error:', error.response?.data?.message || error.message);
        console.log('Error details:', error.response?.data);
        return false;
    }
}

async function testAuthMiddleware() {
    console.log('\n🔍 Testing authentication middleware...');
    try {
        // Test without token
        const noTokenResponse = await axios.get(`${BASE_URL}/api/auth/profile`, { 
            timeout: 5000,
            validateStatus: () => true 
        });
        console.log('No token response:', noTokenResponse.status, noTokenResponse.data);
        
        // Test with invalid token
        const invalidTokenResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
            headers: { 'Authorization': 'Bearer invalid_token' },
            timeout: 5000,
            validateStatus: () => true
        });
        console.log('Invalid token response:', invalidTokenResponse.status, invalidTokenResponse.data);
        
        // Test with valid token
        if (authToken) {
            const validTokenResponse = await makeAuthRequest('get', '/api/auth/profile');
            console.log('Valid token response:', validTokenResponse.status, validTokenResponse.data);
        }
        
        console.log('✅ Auth middleware test completed');
        return true;
    } catch (error) {
        console.log('❌ Auth middleware test error:', error.message);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Profile and Alerts Issue Tests\n');
    
    const results = {
        serverConnection: await testServerConnection(),
        databaseConnection: await testDatabaseConnection(),
        userAuthentication: await testUserAuthentication(),
        authMiddleware: await testAuthMiddleware(),
        profileLoading: await testProfileLoading(),
        profileSaving: await testProfileSaving(),
        alertsLoading: await testAlertsLoading()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const failedTests = Object.entries(results).filter(([, passed]) => !passed);
    if (failedTests.length > 0) {
        console.log('\n🔧 Issues found in:');
        failedTests.forEach(([test]) => console.log(`- ${test}`));
    } else {
        console.log('\n🎉 All tests passed!');
    }
    
    return results;
}

// Run tests if called directly
runTests().catch(console.error);

export { runTests, testConfig, testUser };
