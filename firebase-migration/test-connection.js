const mysql = require('mysql2/promise');
const { db, auth } = require('./firebase-config');
require('dotenv').config();

// MySQL connection configuration
const mysqlConfig = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
};

async function testMySQLConnection() {
  console.log('Testing MySQL connection...');

  try {
    const connection = await mysql.createConnection(mysqlConfig);
    console.log('✅ MySQL connection successful');

    // Test query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Found ${rows[0].count} users in MySQL database`);

    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    return false;
  }
}

async function testFirebaseConnection() {
  console.log('Testing Firebase connection...');

  try {
    // Test Firestore
    const testDoc = await db.collection('_test').doc('connection').set({
      timestamp: new Date(),
      message: 'Connection test successful'
    });
    console.log('✅ Firestore connection successful');

    // Clean up test document
    await db.collection('_test').doc('connection').delete();

    // Test Firebase Auth
    const listUsersResult = await auth.listUsers(1);
    console.log('✅ Firebase Auth connection successful');

    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    return false;
  }
}

async function testMigrationData() {
  console.log('Testing migration data...');

  try {
    // Check if users collection exists and has data
    const usersSnapshot = await db.collection('users').limit(1).get();
    if (usersSnapshot.empty) {
      console.log('⚠️  No users found in Firestore - migration may not have run yet');
    } else {
      console.log('✅ Users collection found in Firestore');
    }

    // Check posts collection
    const postsSnapshot = await db.collection('posts').limit(1).get();
    if (postsSnapshot.empty) {
      console.log('⚠️  No posts found in Firestore');
    } else {
      console.log('✅ Posts collection found in Firestore');
    }

    // Check alerts collection
    const alertsSnapshot = await db.collection('alerts').limit(1).get();
    if (alertsSnapshot.empty) {
      console.log('⚠️  No alerts found in Firestore');
    } else {
      console.log('✅ Alerts collection found in Firestore');
    }

    return true;
  } catch (error) {
    console.error('❌ Migration data test failed:', error.message);
    return false;
  }
}

async function validateEnvironment() {
  console.log('Validating environment configuration...');

  const requiredEnvVars = [
    'MYSQL_HOST',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_DATABASE',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    return false;
  }

  console.log('✅ Environment configuration valid');
  return true;
}

async function main() {
  console.log('=== Connection Test ===\n');

  let allTestsPassed = true;

  // Test environment
  const envValid = await validateEnvironment();
  allTestsPassed = allTestsPassed && envValid;

  console.log('');

  // Test MySQL connection
  const mysqlConnected = await testMySQLConnection();
  allTestsPassed = allTestsPassed && mysqlConnected;

  console.log('');

  // Test Firebase connection
  const firebaseConnected = await testFirebaseConnection();
  allTestsPassed = allTestsPassed && firebaseConnected;

  console.log('');

  // Test migration data (if connections work)
  if (firebaseConnected) {
    await testMigrationData();
  }

  console.log('\n=== Test Summary ===');
  if (allTestsPassed) {
    console.log('🎉 All connection tests passed!');
    console.log('You can proceed with the migration.');
  } else {
    console.log('💥 Some tests failed. Please fix the issues before proceeding.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testMySQLConnection,
  testFirebaseConnection,
  testMigrationData,
  validateEnvironment
};
