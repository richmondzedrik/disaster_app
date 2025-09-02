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

// Admin user credentials
const adminUser = {
    email: 'richmondzedrik@gmail.com',
    password: 'AdminPassword123!'
};

let adminToken = null;

// Helper function to make authenticated requests
const makeAuthRequest = (method, url, data = null) => {
    const config = {
        method,
        url: `${BASE_URL}${url}`,
        headers: {
            ...testConfig.headers,
            ...(adminToken && { 'Authorization': `Bearer ${adminToken}` })
        },
        timeout: testConfig.timeout
    };
    
    if (data) {
        config.data = data;
    }
    
    return axios(config);
};

// Test functions
async function testAdminLogin() {
    console.log('\n🔍 Testing admin login...');
    try {
        const loginResponse = await makeAuthRequest('post', '/api/auth/login', {
            email: adminUser.email,
            password: adminUser.password
        });
        
        if (loginResponse.data.success) {
            adminToken = loginResponse.data.accessToken;
            if (adminToken && adminToken.startsWith('Bearer ')) {
                adminToken = adminToken.substring(7);
            }
            
            const user = loginResponse.data.user;
            console.log('✅ Admin login successful');
            console.log('👤 User:', user.username, '- Role:', user.role);
            
            if (user.role !== 'admin') {
                throw new Error('User is not an admin');
            }
            
            return true;
        } else {
            throw new Error(loginResponse.data.message || 'Login failed');
        }
    } catch (error) {
        console.log('❌ Admin login failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testAdminEndpoints() {
    console.log('\n🔍 Testing admin endpoints...');
    try {
        const endpoints = [
            { method: 'get', url: '/api/admin/test', name: 'Admin Test' },
            { method: 'get', url: '/api/admin/users', name: 'Get Users' },
            { method: 'get', url: '/api/admin/alerts', name: 'Get Admin Alerts' },
            { method: 'get', url: '/api/admin/news', name: 'Get Admin News' },
            { method: 'get', url: '/api/admin/dashboard', name: 'Admin Dashboard' }
        ];
        
        const results = {};
        
        for (const endpoint of endpoints) {
            try {
                const response = await makeAuthRequest(endpoint.method, endpoint.url);
                console.log(`✅ ${endpoint.name}: ${response.status} - ${response.data?.message || 'Success'}`);
                results[endpoint.name] = true;
            } catch (error) {
                console.log(`❌ ${endpoint.name}: ${error.response?.status || 'Error'} - ${error.response?.data?.message || error.message}`);
                results[endpoint.name] = false;
            }
        }
        
        return results;
    } catch (error) {
        console.log('❌ Admin endpoints test failed:', error.message);
        return {};
    }
}

async function testAlertManagement() {
    console.log('\n🔍 Testing alert management...');
    try {
        // Test creating an alert
        const createAlertData = {
            message: 'Test Admin Alert',
            type: 'warning',
            priority: 1,
            isPublic: true,
            expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
        };
        
        const createResponse = await makeAuthRequest('post', '/api/admin/alerts', createAlertData);
        console.log('✅ Create Alert:', createResponse.status, '-', createResponse.data?.message || 'Success');
        
        // Test getting alerts
        const getAlertsResponse = await makeAuthRequest('get', '/api/admin/alerts');
        console.log('✅ Get Alerts:', getAlertsResponse.status, '- Found', getAlertsResponse.data?.alerts?.length || 0, 'alerts');
        
        return true;
    } catch (error) {
        console.log('❌ Alert management test failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testNewsManagement() {
    console.log('\n🔍 Testing news management...');
    try {
        // Test creating news
        const createNewsData = {
            title: 'Test Admin News',
            content: 'This is a test news article created by admin',
            category: 'announcement',
            isPublished: true
        };
        
        const createResponse = await makeAuthRequest('post', '/api/admin/news', createNewsData);
        console.log('✅ Create News:', createResponse.status, '-', createResponse.data?.message || 'Success');
        
        // Test getting news
        const getNewsResponse = await makeAuthRequest('get', '/api/admin/news');
        console.log('✅ Get News:', getNewsResponse.status, '- Found', getNewsResponse.data?.news?.length || 0, 'articles');
        
        return true;
    } catch (error) {
        console.log('❌ News management test failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testUserManagement() {
    console.log('\n🔍 Testing user management...');
    try {
        // Test getting users
        const getUsersResponse = await makeAuthRequest('get', '/api/admin/users');
        console.log('✅ Get Users:', getUsersResponse.status, '- Found', getUsersResponse.data?.users?.length || 0, 'users');
        
        // Test getting user stats
        const getStatsResponse = await makeAuthRequest('get', '/api/admin/stats');
        console.log('✅ Get Stats:', getStatsResponse.status, '-', getStatsResponse.data?.message || 'Success');
        
        return true;
    } catch (error) {
        console.log('❌ User management test failed:', error.response?.data?.message || error.message);
        return false;
    }
}

// Main test runner
async function runAdminTests() {
    console.log('🚀 Starting Admin Panel Tests\n');
    
    const results = {
        adminLogin: await testAdminLogin()
    };
    
    if (results.adminLogin) {
        results.adminEndpoints = await testAdminEndpoints();
        results.alertManagement = await testAlertManagement();
        results.newsManagement = await testNewsManagement();
        results.userManagement = await testUserManagement();
    }
    
    console.log('\n📊 Admin Panel Test Results:');
    console.log('===============================');
    Object.entries(results).forEach(([test, passed]) => {
        if (typeof passed === 'object') {
            console.log(`📂 ${test}:`);
            Object.entries(passed).forEach(([subtest, subpassed]) => {
                console.log(`  ${subpassed ? '✅' : '❌'} ${subtest}: ${subpassed ? 'PASSED' : 'FAILED'}`);
            });
        } else {
            console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
        }
    });
    
    return results;
}

// Run tests if called directly
runAdminTests().catch(console.error);

export { runAdminTests };
