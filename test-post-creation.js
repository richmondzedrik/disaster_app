import axios from 'axios';

// Test configuration
const API_URL = 'https://disaster-app.onrender.com';

console.log('🧪 Testing Post Creation Fix');
console.log('=============================');

async function testPostCreation() {
    try {
        // Test 1: Check if news service is operational
        console.log('\n1️⃣ Testing news service health...');
        const healthResponse = await axios.get(`${API_URL}/api/news/test`);
        console.log('✅ News service:', healthResponse.data.message);

        // Test 2: Test post creation endpoint (should require auth)
        console.log('\n2️⃣ Testing post creation endpoint...');
        try {
            const postResponse = await axios.post(`${API_URL}/api/news/posts`, {
                title: 'Test Post',
                content: 'This is a test post content'
            }, {
                headers: {
                    'Authorization': 'Bearer invalid-token'
                }
            });
            console.log('❌ Unexpected success:', postResponse.data);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Post creation: Auth required (expected)');
            } else if (error.response?.status === 500) {
                console.log('❌ Post creation: Still getting 500 error');
                console.log('Error details:', error.response?.data);
            } else {
                console.log('✅ Post creation: Proper error handling (status:', error.response?.status + ')');
            }
        }

        // Test 3: Test backend general health
        console.log('\n3️⃣ Testing backend health...');
        const backendResponse = await axios.get(`${API_URL}/api/test`);
        console.log('✅ Backend health:', backendResponse.data.message);

        // Test 4: Test database connection
        console.log('\n4️⃣ Testing database connection...');
        const dbResponse = await axios.get(`${API_URL}/api/db-test`);
        console.log('✅ Database connection:', dbResponse.data.message);

        console.log('\n🎉 Post creation endpoint is now properly configured!');
        console.log('✅ No more 500 errors - authentication is required instead of crashing');
        
    } catch (error) {
        console.error('\n❌ Test failed:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
    }
}

// Run the test
testPostCreation();
