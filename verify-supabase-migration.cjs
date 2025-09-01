const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 VERIFYING SUPABASE MIGRATION STATUS\n');
console.log('=' .repeat(50));

// Check environment variables
console.log('📋 ENVIRONMENT VARIABLES CHECK:');
console.log('--------------------------------');

const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_KEY',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'DB_PORT'
];

let envIssues = 0;

requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        if (varName.includes('KEY') || varName.includes('PASSWORD')) {
            console.log(`✅ ${varName}: Set (${value.substring(0, 20)}...)`);
        } else {
            console.log(`✅ ${varName}: ${value}`);
        }
    } else {
        console.log(`❌ ${varName}: Missing`);
        envIssues++;
    }
});

// Check if DB settings point to Supabase
console.log('\n🗄️  DATABASE CONFIGURATION CHECK:');
console.log('----------------------------------');

const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;

if (dbHost && dbHost.includes('supabase.co')) {
    console.log('✅ DB_HOST points to Supabase');
} else {
    console.log('❌ DB_HOST does not point to Supabase:', dbHost);
    envIssues++;
}

if (dbPort === '5432') {
    console.log('✅ DB_PORT is PostgreSQL (5432)');
} else {
    console.log('❌ DB_PORT is not PostgreSQL:', dbPort);
    envIssues++;
}

if (dbName === 'postgres') {
    console.log('✅ DB_NAME is correct for Supabase');
} else {
    console.log('⚠️  DB_NAME is not standard Supabase name:', dbName);
}

// Test Supabase connection
console.log('\n🔌 SUPABASE CONNECTION TEST:');
console.log('-----------------------------');

async function testSupabaseConnection() {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.log('❌ Cannot test connection - missing Supabase credentials');
            return false;
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Test 1: Basic connection
        console.log('🧪 Testing basic connection...');
        const { data: testData, error: testError } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (testError) {
            if (testError.message.includes('relation "users" does not exist')) {
                console.log('⚠️  Connection works but users table missing');
                return 'partial';
            } else {
                console.log('❌ Connection failed:', testError.message);
                return false;
            }
        } else {
            console.log('✅ Connection successful - users table accessible');
        }

        // Test 2: Check other tables
        const tables = ['posts', 'alerts', 'comments', 'checklist_progress'];
        let tableCount = 0;

        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('id')
                .limit(1);

            if (!error) {
                console.log(`✅ ${table} table: Accessible`);
                tableCount++;
            } else if (error.message.includes('does not exist')) {
                console.log(`❌ ${table} table: Missing`);
            } else {
                console.log(`⚠️  ${table} table: ${error.message}`);
            }
        }

        console.log(`\n📊 Tables found: ${tableCount + 1}/${tables.length + 1}`);
        return tableCount >= 3; // At least 3 tables should exist

    } catch (error) {
        console.log('❌ Connection test failed:', error.message);
        return false;
    }
}

// Test backend server configuration
console.log('\n🖥️  BACKEND SERVER CHECK:');
console.log('-------------------------');

async function checkBackendConfig() {
    try {
        // Check if server.js uses Supabase
        const fs = require('fs');
        const serverContent = fs.readFileSync('./backend/server.js', 'utf8');
        
        if (serverContent.includes('supabase-connection')) {
            console.log('✅ server.js imports Supabase connection');
        } else {
            console.log('❌ server.js does not import Supabase connection');
        }

        if (serverContent.includes('testSupabaseConnection')) {
            console.log('✅ server.js tests Supabase connection');
        } else {
            console.log('❌ server.js does not test Supabase connection');
        }

        // Check auth middleware
        const authContent = fs.readFileSync('./backend/middleware/auth.js', 'utf8');
        if (authContent.includes('supabase-connection')) {
            console.log('✅ auth middleware uses Supabase');
        } else {
            console.log('❌ auth middleware does not use Supabase');
        }

        return true;
    } catch (error) {
        console.log('❌ Backend config check failed:', error.message);
        return false;
    }
}

// Main verification function
async function runVerification() {
    console.log('\n🚀 RUNNING COMPREHENSIVE VERIFICATION...\n');

    const connectionResult = await testSupabaseConnection();
    const backendResult = await checkBackendConfig();

    console.log('\n' + '='.repeat(50));
    console.log('📋 VERIFICATION SUMMARY:');
    console.log('='.repeat(50));

    if (envIssues === 0) {
        console.log('✅ Environment Variables: All set correctly');
    } else {
        console.log(`❌ Environment Variables: ${envIssues} issues found`);
    }

    if (connectionResult === true) {
        console.log('✅ Supabase Connection: Working perfectly');
    } else if (connectionResult === 'partial') {
        console.log('⚠️  Supabase Connection: Works but tables missing');
    } else {
        console.log('❌ Supabase Connection: Failed');
    }

    if (backendResult) {
        console.log('✅ Backend Configuration: Using Supabase');
    } else {
        console.log('❌ Backend Configuration: Issues found');
    }

    console.log('\n🎯 NEXT STEPS:');
    console.log('-'.repeat(20));

    if (envIssues === 0 && connectionResult && backendResult) {
        console.log('🎉 MIGRATION COMPLETE! You are 100% using Supabase.');
        console.log('\n📋 For Render deployment:');
        console.log('1. Set these environment variables in Render dashboard:');
        console.log(`   SUPABASE_URL=${process.env.SUPABASE_URL}`);
        console.log(`   SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY}`);
        console.log(`   SUPABASE_SERVICE_KEY=${process.env.SUPABASE_SERVICE_KEY}`);
        console.log('2. Redeploy your service');
        console.log('3. Test your endpoints');
    } else {
        console.log('⚠️  Migration not complete. Fix the issues above first.');
        
        if (connectionResult === 'partial') {
            console.log('\n📋 To create missing tables:');
            console.log('1. Go to Supabase dashboard SQL editor');
            console.log('2. Run the SQL from supabase-schema.sql');
        }
    }
}

// Run the verification
runVerification().catch(console.error);
