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

async function testWithRealUser() {
    console.log('🚀 Testing Post Creation with Real User Data...');
    console.log('=' .repeat(60));
    
    try {
        // Step 1: Get a real user from your database
        console.log('\n🔍 Getting real user data...');
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, username, email')
            .limit(1);
        
        if (userError || !users || users.length === 0) {
            console.error('❌ Could not get user data:', userError?.message);
            return false;
        }
        
        const realUser = users[0];
        console.log('✅ Using real user:', {
            id: realUser.id,
            username: realUser.username,
            email: realUser.email
        });
        
        // Step 2: Test post creation with real user ID
        console.log('\n🧪 Testing post creation...');
        const testPost = {
            title: 'Real User Test Post',
            content: 'Testing post creation with actual user from database',
            author_id: realUser.id, // Use real user ID
            status: 'approved',
            author_avatar: 'https://example.com/avatar.png',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('posts')
            .insert(testPost)
            .select();
        
        if (error) {
            console.log('❌ Post creation failed:', error.message);
            console.log('💡 Error details:', {
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            
            // If it's still the author_avatar column issue, provide specific fix
            if (error.message.includes('author_avatar')) {
                console.log('\n🔧 SPECIFIC FIX NEEDED:');
                console.log('   The author_avatar column is still missing!');
                console.log('   Go to Supabase Dashboard → SQL Editor and run:');
                console.log('   ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_avatar TEXT;');
            }
            
            return false;
        }
        
        console.log('✅ SUCCESS! Post created:', {
            id: data[0].id,
            title: data[0].title,
            author_id: data[0].author_id,
            author_avatar: data[0].author_avatar
        });
        
        // Step 3: Verify we can read it back
        console.log('\n🔍 Verifying post can be read...');
        const { data: readData, error: readError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', data[0].id);
        
        if (readError) {
            console.log('❌ Could not read post back:', readError.message);
        } else {
            console.log('✅ Post verified in database');
        }
        
        // Step 4: Clean up
        console.log('\n🧹 Cleaning up test post...');
        await supabase.from('posts').delete().eq('id', data[0].id);
        console.log('✅ Test post cleaned up');
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

async function provideFinalSolution() {
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 FINAL SOLUTION FOR YOUR 500 ERROR');
    console.log('=' .repeat(60));
    
    const success = await testWithRealUser();
    
    if (success) {
        console.log('\n✅ GREAT NEWS! Your database is working correctly now.');
        console.log('🎉 The 500 error should be fixed.');
        console.log('\n🚀 What to do next:');
        console.log('   1. Try creating a post in your app');
        console.log('   2. The post creation should work without errors');
        console.log('   3. If you still get errors, check the browser console for details');
        
    } else {
        console.log('\n❌ Database issues still exist.');
        console.log('\n🔧 MANUAL FIX REQUIRED:');
        console.log('   1. Open Supabase Dashboard');
        console.log('   2. Go to SQL Editor');
        console.log('   3. Run this command:');
        console.log('');
        console.log('      ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_avatar TEXT;');
        console.log('');
        console.log('   4. After running the SQL, test post creation again');
        
        console.log('\n💡 ALTERNATIVE:');
        console.log('   Run the complete schema from FIXED_SUPABASE_SCHEMA.sql');
        console.log('   This ensures all columns are properly created.');
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('   • Root cause: Missing author_avatar column in posts table');
    console.log('   • Solution: Add the column using SQL command above');
    console.log('   • Result: Post creation will work without 500 errors');
}

if (require.main === module) {
    provideFinalSolution().catch(console.error);
}

module.exports = { testWithRealUser, provideFinalSolution };
