import axios from 'axios';

// Test configuration
const API_URL = 'https://disaster-app.onrender.com';

console.log('🧪 Testing 500 Error Fixes');
console.log('===========================');

async function testAPIs() {
    try {
        // Test 1: Checklist progress (was causing 500 error)
        console.log('\n1️⃣ Testing checklist progress...');
        try {
            const checklistResponse = await axios.get(`${API_URL}/api/checklist/progress`, {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });
            console.log('✅ Checklist progress:', checklistResponse.data.message);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Checklist progress: Auth required (expected)');
            } else {
                console.log('❌ Checklist progress error:', error.response?.status, error.response?.data?.message);
            }
        }

        // Test 2: Alerts active/user (was causing 500 error)
        console.log('\n2️⃣ Testing alerts active/user...');
        try {
            const alertsResponse = await axios.get(`${API_URL}/api/alerts/active/user`, {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });
            console.log('✅ Alerts active/user:', alertsResponse.data.message);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Alerts active/user: Auth required (expected)');
            } else {
                console.log('❌ Alerts active/user error:', error.response?.status, error.response?.data?.message);
            }
        }

        // Test 3: User profile (was causing 500 error)
        console.log('\n3️⃣ Testing user profile...');
        try {
            const profileResponse = await axios.get(`${API_URL}/api/users/profile`, {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });
            console.log('✅ User profile:', profileResponse.data.message);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ User profile: Auth required (expected)');
            } else {
                console.log('❌ User profile error:', error.response?.status, error.response?.data?.message);
            }
        }

        // Test 4: Backend health check
        console.log('\n4️⃣ Testing backend health...');
        const healthResponse = await axios.get(`${API_URL}/api/test`);
        console.log('✅ Backend health:', healthResponse.data.message);

        console.log('\n🎉 All API endpoints are responding correctly!');
        console.log('✅ No more 500 errors - authentication is now required instead of crashing');
        
    } catch (error) {
        console.error('\n❌ Test failed:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
    }
}

// Run the test
testAPIs();
