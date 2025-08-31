const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Key in .env file');
    console.error('Make sure you have SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAndCreateTables() {
    console.log('🚀 Setting up Supabase tables for Disaster Preparedness App...\n');
    console.log(`📡 Connecting to: ${supabaseUrl}\n`);

    try {
        // Test connection by trying to create a simple table
        console.log('🔧 Testing connection and creating tables...\n');

        // Test 1: Try to insert a test user (this will create the table if it doesn't exist)
        console.log('1. Testing users table...');
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                username: 'test_user_' + Date.now(),
                email: 'test_' + Date.now() + '@example.com',
                password: 'test_password',
                role: 'user'
            })
            .select();

        if (userError) {
            if (userError.message.includes('relation "users" does not exist')) {
                console.log('❌ Users table does not exist. You need to create it manually.');
                console.log('📋 Please run the SQL from supabase-schema.sql in your Supabase dashboard.');
            } else {
                console.log('⚠️  Users table exists but insert failed:', userError.message);
            }
        } else {
            console.log('✅ Users table working!');
            // Clean up test data
            await supabase.from('users').delete().eq('id', userData[0].id);
        }

        // Test 2: Try posts table
        console.log('2. Testing posts table...');
        const { data: postData, error: postError } = await supabase
            .from('posts')
            .select('id')
            .limit(1);

        if (postError) {
            if (postError.message.includes('relation "posts" does not exist')) {
                console.log('❌ Posts table does not exist');
            } else {
                console.log('⚠️  Posts table issue:', postError.message);
            }
        } else {
            console.log('✅ Posts table exists!');
        }

        // Test 3: Try alerts table
        console.log('3. Testing alerts table...');
        const { data: alertData, error: alertError } = await supabase
            .from('alerts')
            .select('id')
            .limit(1);

        if (alertError) {
            if (alertError.message.includes('relation "alerts" does not exist')) {
                console.log('❌ Alerts table does not exist');
            } else {
                console.log('⚠️  Alerts table issue:', alertError.message);
            }
        } else {
            console.log('✅ Alerts table exists!');
        }

        // Test 4: Try comments table
        console.log('4. Testing comments table...');
        const { data: commentData, error: commentError } = await supabase
            .from('comments')
            .select('id')
            .limit(1);

        if (commentError) {
            if (commentError.message.includes('relation "comments" does not exist')) {
                console.log('❌ Comments table does not exist');
            } else {
                console.log('⚠️  Comments table issue:', commentError.message);
            }
        } else {
            console.log('✅ Comments table exists!');
        }

        // Test 5: Try checklist_progress table
        console.log('5. Testing checklist_progress table...');
        const { data: checklistData, error: checklistError } = await supabase
            .from('checklist_progress')
            .select('id')
            .limit(1);

        if (checklistError) {
            if (checklistError.message.includes('relation "checklist_progress" does not exist')) {
                console.log('❌ Checklist_progress table does not exist');
            } else {
                console.log('⚠️  Checklist_progress table issue:', checklistError.message);
            }
        } else {
            console.log('✅ Checklist_progress table exists!');
        }

        console.log('\n📋 Setup Instructions:');
        console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Copy and paste the contents of "supabase-schema.sql"');
        console.log('5. Click "Run" to execute the SQL');
        console.log('6. Run this script again to verify tables are created');

        console.log('\n🔗 Quick link to SQL Editor:');
        const projectId = supabaseUrl.split('//')[1].split('.')[0];
        console.log(`https://supabase.com/dashboard/project/${projectId}/sql`);

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run the setup
testAndCreateTables();
