import axios from 'axios';
import { db } from './backend/db/supabase-connection-cjs.js';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://disaster-app-backend.onrender.com'
  : 'http://localhost:3000';

// Admin credentials from create-admin-user.js
const ADMIN_CREDENTIALS = {
  email: 'richmondzedrik@gmail.com',
  password: 'AdminPassword123!'
};

let adminToken = null;

async function loginAsAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password
    }, {
      timeout: 10000,
      withCredentials: true
    });

    if (response.data.success && (response.data.accessToken || response.data.token)) {
      adminToken = response.data.accessToken || response.data.token;
      console.log('✅ Admin login successful');
      console.log('👤 User role:', response.data.user?.role);
      console.log('🔑 Token received:', adminToken ? 'Yes' : 'No');
      console.log('📝 Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      throw new Error('Login failed: ' + (response.data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testAdminEndpoints() {
  const headers = {
    'Authorization': adminToken.startsWith('Bearer ') ? adminToken : `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };

  const endpoints = [
    { name: 'Dashboard Stats', url: '/api/admin/dashboard/stats', method: 'GET' },
    { name: 'Dashboard', url: '/api/admin/dashboard', method: 'GET' },
    { name: 'Users List', url: '/api/admin/users', method: 'GET' },
    { name: 'Alerts List', url: '/api/admin/alerts', method: 'GET' },
    { name: 'Analytics', url: '/api/admin/analytics', method: 'GET' }
  ];

  console.log('\n🧪 Testing admin endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name} (${endpoint.method} ${endpoint.url})...`);
      
      const response = await axios({
        method: endpoint.method,
        url: `${API_URL}${endpoint.url}`,
        headers,
        timeout: 10000,
        withCredentials: true
      });

      if (response.data.success) {
        console.log(`✅ ${endpoint.name}: SUCCESS`);
        if (endpoint.name === 'Dashboard Stats' && response.data.stats) {
          console.log(`   📊 Stats: Users: ${response.data.stats.users}, Posts: ${response.data.stats.posts}, Alerts: ${response.data.stats.alerts}`);
        }
        if (endpoint.name === 'Users List' && response.data.data) {
          console.log(`   👥 Found ${response.data.data.length} users`);
        }
      } else {
        console.log(`⚠️  ${endpoint.name}: Response not successful - ${response.data.message}`);
      }
    } catch (error) {
      console.error(`❌ ${endpoint.name}: FAILED`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Message: ${error.response.data?.message || 'Unknown error'}`);
      } else {
        console.error(`   Error: ${error.message}`);
      }
    }
  }
}

async function testDatabaseTables() {
  console.log('\n🗄️  Testing database tables...\n');

  const tables = ['users', 'alerts', 'posts'];

  for (const table of tables) {
    try {
      console.log(`Testing ${table} table...`);
      
      const result = await db.select(table, {
        select: '*',
        limit: 1
      });

      if (result.error) {
        console.error(`❌ ${table}: Database error - ${result.error.message}`);
      } else {
        const count = result.data ? result.data.length : 0;
        console.log(`✅ ${table}: Table exists, sample query returned ${count} records`);
      }
    } catch (error) {
      console.error(`❌ ${table}: ${error.message}`);
    }
  }
}

async function testAdminUser() {
  console.log('\n👤 Testing admin user...\n');

  try {
    const result = await db.select('users', {
      select: 'id, email, username, role, email_verified, created_at',
      where: { email: ADMIN_CREDENTIALS.email },
      limit: 1
    });

    if (result.error) {
      console.error('❌ Failed to fetch admin user:', result.error.message);
      return;
    }

    if (!result.data || result.data.length === 0) {
      console.error('❌ Admin user not found in database');
      return;
    }

    const user = result.data[0];
    console.log('✅ Admin user found:');
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   👤 Username: ${user.username}`);
    console.log(`   🛡️  Role: ${user.role}`);
    console.log(`   ✉️  Email verified: ${user.email_verified}`);
    console.log(`   📅 Created: ${user.created_at}`);

    if (user.role !== 'admin') {
      console.error('❌ User role is not admin!');
    }
  } catch (error) {
    console.error('❌ Error testing admin user:', error.message);
  }
}

async function checkServerStatus() {
  console.log('\n🌐 Checking server status...\n');

  try {
    const response = await axios.get(`${API_URL}/health`, {
      timeout: 5000
    });
    console.log('✅ Server is running');
    console.log(`   Status: ${response.status}`);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server is not running or not accessible');
    } else {
      console.error('❌ Server health check failed:', error.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting Admin Dashboard Test Suite\n');
  console.log(`🔗 API URL: ${API_URL}\n`);

  try {
    // Check server status
    await checkServerStatus();

    // Test database tables
    await testDatabaseTables();

    // Test admin user
    await testAdminUser();

    // Login as admin
    await loginAsAdmin();

    // Test admin endpoints
    await testAdminEndpoints();

    console.log('\n✅ Admin dashboard test completed');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);
