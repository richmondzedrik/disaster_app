import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSchemaCreation() {
    console.log('🧪 Testing Supabase Schema Creation...');
    console.log('=' .repeat(40));
    
    const tables = [
        'users',
        'posts', 
        'alerts',
        'comments',
        'likes',
        'checklist_progress',
        'alert_reads',
        'notifications',
        'first_aid_guides',
        'verification_attempts'
    ];
    
    let successCount = 0;
    let failCount = 0;
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
                
            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
                failCount++;
            } else {
                console.log(`✅ ${table}: Table exists and accessible`);
                successCount++;
            }
        } catch (err) {
            console.log(`❌ ${table}: ${err.message}`);
            failCount++;
        }
    }
    
    console.log('\n📊 Schema Test Results:');
    console.log(`✅ Success: ${successCount}/${tables.length} tables`);
    console.log(`❌ Failed: ${failCount}/${tables.length} tables`);
    
    if (successCount === tables.length) {
        console.log('\n🎉 All tables created successfully!');
        console.log('✅ Ready to proceed with backend migration');
        return true;
    } else {
        console.log('\n⚠️  Some tables are missing.');
        console.log('📝 Please run the essential-schema.sql in Supabase SQL Editor');
        return false;
    }
}

async function testBasicOperations() {
    console.log('\n🔧 Testing Basic Database Operations...');
    console.log('-'.repeat(40));
    
    try {
        // Test 1: Insert a test user
        console.log('🧪 Test 1: Creating test user...');
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                username: 'test_migration_user',
                email: 'test_migration@example.com',
                password: 'hashed_password_here',
                role: 'user'
            })
            .select();
            
        if (userError) {
            console.log(`❌ User creation failed: ${userError.message}`);
            return false;
        } else {
            console.log('✅ User created successfully');
            const testUserId = userData[0].id;
            
            // Test 2: Create a test post
            console.log('🧪 Test 2: Creating test post...');
            const { data: postData, error: postError } = await supabase
                .from('posts')
                .insert({
                    title: 'Test Migration Post',
                    content: 'This is a test post for migration',
                    author_id: testUserId,
                    published: true
                })
                .select();
                
            if (postError) {
                console.log(`❌ Post creation failed: ${postError.message}`);
            } else {
                console.log('✅ Post created successfully');
                
                // Test 3: Create a comment
                console.log('🧪 Test 3: Creating test comment...');
                const { error: commentError } = await supabase
                    .from('comments')
                    .insert({
                        content: 'Test comment for migration',
                        post_id: postData[0].id,
                        user_id: testUserId
                    });
                    
                if (commentError) {
                    console.log(`❌ Comment creation failed: ${commentError.message}`);
                } else {
                    console.log('✅ Comment created successfully');
                }
            }
            
            // Cleanup: Remove test data
            console.log('🧹 Cleaning up test data...');
            await supabase.from('comments').delete().eq('user_id', testUserId);
            await supabase.from('posts').delete().eq('author_id', testUserId);
            await supabase.from('users').delete().eq('id', testUserId);
            console.log('✅ Test data cleaned up');
            
            return true;
        }
        
    } catch (error) {
        console.error('❌ Basic operations test failed:', error);
        return false;
    }
}

async function main() {
    console.log('🎯 Supabase Schema Validation Tool');
    console.log('🔗 Project: taqoegurvxaqzoejpmrp');
    console.log('📅 ' + new Date().toLocaleString());
    console.log('\n');
    
    // Test schema creation
    const schemaReady = await testSchemaCreation();
    
    if (schemaReady) {
        // Test basic operations
        const operationsReady = await testBasicOperations();
        
        if (operationsReady) {
            console.log('\n🎉 MIGRATION READY!');
            console.log('✅ Database schema is properly set up');
            console.log('✅ Basic operations are working');
            console.log('\n🔄 Next Steps:');
            console.log('   1. Update your backend to use Supabase');
            console.log('   2. Test your application thoroughly');
            console.log('   3. Update your frontend if needed');
        }
    } else {
        console.log('\n❌ MIGRATION NOT READY');
        console.log('📝 Please create the database schema first');
        console.log('🔗 Go to: https://supabase.com/dashboard/project/taqoegurvxaqzoejpmrp');
        console.log('📄 Run the SQL from: essential-schema.sql');
    }
}

main().catch(console.error);
