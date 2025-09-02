require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Key');
    process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCurrentSchema() {
    console.log('🔍 Testing Current Posts Table Schema...');
    
    // Test 1: Try inserting without author_avatar
    console.log('\n📝 Test 1: Insert without author_avatar column');
    try {
        const testPost1 = {
            title: 'Test Without Avatar',
            content: 'Testing without author_avatar column',
            author_id: '00000000-0000-0000-0000-000000000001',
            status: 'draft'
        };
        
        const { data, error } = await supabase
            .from('posts')
            .insert(testPost1)
            .select();
        
        if (error) {
            console.log('❌ Failed:', error.message);
        } else {
            console.log('✅ Success! Post created:', data[0].id);
            // Clean up
            await supabase.from('posts').delete().eq('id', data[0].id);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    // Test 2: Try inserting with author_avatar
    console.log('\n📝 Test 2: Insert with author_avatar column');
    try {
        const testPost2 = {
            title: 'Test With Avatar',
            content: 'Testing with author_avatar column',
            author_id: '00000000-0000-0000-0000-000000000001',
            status: 'draft',
            author_avatar: 'https://example.com/avatar.png'
        };
        
        const { data, error } = await supabase
            .from('posts')
            .insert(testPost2)
            .select();
        
        if (error) {
            console.log('❌ Failed:', error.message);
            console.log('💡 This confirms the author_avatar column is missing!');
        } else {
            console.log('✅ Success! Post created:', data[0].id);
            // Clean up
            await supabase.from('posts').delete().eq('id', data[0].id);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

async function showSolution() {
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 SOLUTION TO FIX YOUR 500 ERROR');
    console.log('=' .repeat(60));
    
    console.log('\n🔍 PROBLEM IDENTIFIED:');
    console.log('   Your posts table is missing the "author_avatar" column.');
    console.log('   The backend code tries to insert this column, causing a 500 error.');
    
    console.log('\n🔧 HOW TO FIX:');
    console.log('   1. Open your Supabase dashboard');
    console.log('   2. Go to the SQL Editor');
    console.log('   3. Run this SQL command:');
    console.log('');
    console.log('   ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_avatar TEXT;');
    console.log('');
    
    console.log('💡 ALTERNATIVE SOLUTION:');
    console.log('   Run the complete schema from FIXED_SUPABASE_SCHEMA.sql');
    console.log('   This will ensure all columns are properly created.');
    
    console.log('\n🚀 AFTER FIXING:');
    console.log('   1. Your post creation should work without 500 errors');
    console.log('   2. The author_avatar field will store user avatar URLs');
    console.log('   3. Test by creating a new post in your app');
    
    console.log('\n📋 QUICK VERIFICATION:');
    console.log('   Run this test again after adding the column to confirm the fix.');
}

async function runDiagnosis() {
    console.log('🚀 Diagnosing Posts Table Schema Issue...');
    console.log('=' .repeat(60));
    
    await testCurrentSchema();
    await showSolution();
}

if (require.main === module) {
    runDiagnosis().catch(console.error);
}

module.exports = { testCurrentSchema, showSolution };
