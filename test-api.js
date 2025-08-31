const https = require('http');

console.log('🧪 Testing API endpoints...');

function testEndpoint(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: jsonData
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function runTests() {
    const tests = [
        { name: 'Health Check', path: '/health' },
        { name: 'Auth Test', path: '/api/auth/test' },
        { name: 'Database Test', path: '/api/db-test' }
    ];

    for (const test of tests) {
        try {
            console.log(`\n🔍 Testing: ${test.name}`);
            console.log(`📡 URL: http://localhost:3000${test.path}`);
            
            const result = await testEndpoint(test.path);
            
            if (result.status === 200) {
                console.log(`✅ ${test.name}: SUCCESS`);
                console.log(`📊 Response:`, result.data);
            } else {
                console.log(`⚠️  ${test.name}: Status ${result.status}`);
                console.log(`📊 Response:`, result.data);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: FAILED`);
            console.log(`💥 Error:`, error.message);
        }
    }
    
    console.log('\n🎉 API testing completed!');
    console.log('\n📝 Next steps:');
    console.log('1. If tests pass, your backend is working correctly');
    console.log('2. You can now test your frontend');
    console.log('3. Try registering a new user or logging in');
}

runTests().catch(console.error);
