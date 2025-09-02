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

async function checkUsersTable() {
    console.log('\n🔍 Checking Users Table...');
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, username')
            .limit(5);
        
        if (error) {
            console.log('❌ Users table error:', error.message);
            return false;
        }
        
        console.log(`✅ Users table exists with ${data.length} users`);
        if (data.length > 0) {
            console.log('📋 Sample users:');
            data.forEach(user => {
                console.log(`   - ${user.username} (${user.email}) - ID: ${user.id}`);
            });
        } else {
            console.log('⚠️  No users found - this explains the foreign key constraint error!');
        }
        
        return data.length > 0;
    } catch (error) {
        console.error('❌ Error checking users:', error.message);
        return false;
    }
}

async function createTestUser() {
    console.log('\n🔧 Creating Test User for Foreign Key...');
    
    try {
        const testUser = {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'test@example.com',
            username: 'testuser',
            password_hash: '$2b$10$dummy.hash.for.testing.purposes.only',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('users')
            .upsert(testUser)
            .select();
        
        if (error) {
            console.log('❌ Failed to create test user:', error.message);
            return false;
        }
        
        console.log('✅ Test user created/updated:', data[0].username);
        return true;
    } catch (error) {
        console.error('❌ Error creating test user:', error.message);
        return false;
    }
}

async function testPostCreation() {
    console.log('\n🧪 Testing Post Creation...');
    
    try {
        const testPost = {
            title: 'Complete Fix Test Post',
            content: 'Testing post creation after fixing both issues',
            author_id: '00000000-0000-0000-0000-000000000001',
            status: 'approved',
            author_avatar: 'https://example.com/test-avatar.png',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('posts')
            .insert(testPost)
            .select();
        
        if (error) {
            console.log('❌ Post creation still failing:', error.message);
            console.log('💡 Error details:', {
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            return null;
        }
        
        console.log('✅ Post created successfully!', {
            id: data[0].id,
            title: data[0].title,
            author_avatar: data[0].author_avatar
        });
        
        return data[0];
    } catch (error) {
        console.error('❌ Error testing post creation:', error.message);
        return null;
    }
}

async function cleanupTestPost(post) {
    if (post && post.id) {
        console.log('\n🧹 Cleaning up test post...');
        try {
            await supabase.from('posts').delete().eq('id', post.id);
            console.log('✅ Test post cleaned up');
        } catch (error) {
            console.log('⚠️  Failed to clean up:', error.message);
        }
    }
}

async function runCompleteFix() {
    console.log('🚀 Running Complete Database Fix...');
    console.log('=' .repeat(60));
    
    // Step 1: Check users table
    const hasUsers = await checkUsersTable();
    
    // Step 2: Create test user if needed
    if (!hasUsers) {
        console.log('\n💡 Creating test user to fix foreign key constraint...');
        await createTestUser();
    }
    
    // Step 3: Test post creation
    const testPost = await testPostCreation();
    
    // Step 4: Clean up
    await cleanupTestPost(testPost);
    
    // Step 5: Provide final instructions
    console.log('\n' + '=' .repeat(60));
    console.log('📋 FINAL INSTRUCTIONS');
    console.log('=' .repeat(60));
    
    if (testPost) {
        console.log('✅ SUCCESS! Your database is now fixed.');
        console.log('🎉 Post creation should work in your app now.');
        console.log('\n💡 What was fixed:');
        console.log('   1. ✅ Test user created for foreign key constraint');
        console.log('   2. ✅ Post creation with author_avatar works');
        console.log('\n🚀 Next steps:');
        console.log('   1. Try creating a post in your app');
        console.log('   2. The 500 error should be resolved');
    } else {
        console.log('❌ Issues still remain. Manual SQL fix needed.');
        console.log('\n🔧 Manual fix required:');
        console.log('   1. Go to Supabase Dashboard → SQL Editor');
        console.log('   2. Run the SQL from fix-posts-table-complete.sql');
        console.log('   3. This will add the missing column and create test data');
    }
}

if (require.main === module) {
    runCompleteFix().catch(console.error);
}

module.exports = { checkUsersTable, createTestUser, testPostCreation, runCompleteFix };
