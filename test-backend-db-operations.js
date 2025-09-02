require('dotenv').config({ path: './backend/.env' });
const path = require('path');

async function testBackendDatabaseOperations() {
    console.log('🚀 Testing Backend Database Operations...');
    console.log('=' .repeat(50));
    
    try {
        // Import the backend database connection
        const { db } = await import('./backend/db/supabase-connection.js');
        
        console.log('\n🔍 Testing PostgreSQL Connection...');
        
        // Test 1: Basic PostgreSQL connection
        try {
            const result = await db.query('SELECT NOW() as current_time, version() as pg_version');
            console.log('✅ PostgreSQL connection successful:', {
                time: result.rows[0].current_time,
                version: result.rows[0].pg_version.split(' ')[0]
            });
        } catch (error) {
            console.error('❌ PostgreSQL connection failed:', error.message);
            return false;
        }
        
        console.log('\n🔍 Testing Posts Table...');
        
        // Test 2: Check if posts table exists and get its structure
        try {
            const tableInfo = await db.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'posts' 
                ORDER BY ordinal_position
            `);
            
            if (tableInfo.rows.length === 0) {
                console.error('❌ Posts table does not exist');
                return false;
            }
            
            console.log('✅ Posts table exists with columns:');
            tableInfo.rows.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
            });
            
        } catch (error) {
            console.error('❌ Failed to check posts table structure:', error.message);
            return false;
        }
        
        console.log('\n🔍 Testing Supabase Insert Operation...');
        
        // Test 3: Test the exact insert operation used in the backend
        try {
            const testPostData = {
                title: 'Backend Test Post',
                content: 'This is a test post to verify the backend database insert operation.',
                author_id: 'test-backend-user-123',
                status: 'approved',
                image_url: null,
                author_avatar: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            console.log('📝 Attempting to insert test post...');
            
            // Use the same method as in the backend
            const result = await db.insert('posts', testPostData);
            
            if (!result || result.length === 0) {
                console.error('❌ Insert operation returned no data');
                return false;
            }
            
            const insertedPost = result[0];
            console.log('✅ Post inserted successfully:', {
                id: insertedPost.id,
                title: insertedPost.title,
                status: insertedPost.status,
                created_at: insertedPost.created_at
            });
            
            // Test 4: Verify the post can be read back
            console.log('\n🔍 Verifying inserted post...');
            
            const readResult = await db.select('posts', {
                where: { id: insertedPost.id }
            });
            
            if (!readResult || readResult.length === 0) {
                console.error('❌ Failed to read back inserted post');
                return false;
            }
            
            console.log('✅ Post verified in database:', {
                id: readResult[0].id,
                title: readResult[0].title,
                author_id: readResult[0].author_id
            });
            
            // Test 5: Clean up test post
            console.log('\n🧹 Cleaning up test post...');
            
            await db.delete('posts', { id: insertedPost.id });
            console.log('✅ Test post cleaned up');
            
            return true;
            
        } catch (insertError) {
            console.error('❌ Insert operation failed:', insertError);
            console.log('💡 Error details:', {
                message: insertError.message,
                code: insertError.code,
                details: insertError.details,
                hint: insertError.hint
            });
            return false;
        }
        
    } catch (error) {
        console.error('❌ Backend database test failed:', error.message);
        return false;
    }
}

async function testSpecificPostCreationFlow() {
    console.log('\n🔍 Testing Specific Post Creation Flow...');
    
    try {
        const { db } = await import('./backend/db/supabase-connection.js');
        
        // Simulate the exact data structure from the backend route
        const postData = {
            title: 'Flow Test Post',
            content: 'Testing the exact post creation flow from the backend route.',
            author_id: 'flow-test-user-456',
            status: 'approved',
            image_url: null,
            author_avatar: 'https://example.com/avatar.png',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        console.log('📝 Creating post with exact backend flow data:', {
            title: postData.title.substring(0, 30) + '...',
            author_id: postData.author_id,
            status: postData.status,
            hasAvatar: !!postData.author_avatar
        });
        
        // Step 1: Insert the post
        const result = await db.insert('posts', postData);
        
        if (!result || result.length === 0) {
            throw new Error('No result returned from insert operation');
        }
        
        const newPost = result[0];
        console.log('✅ Post created successfully:', {
            id: newPost.id,
            title: newPost.title,
            created_at: newPost.created_at
        });
        
        // Step 2: Test fetching the post (like the frontend would)
        const fetchedPosts = await db.select('posts', {
            where: { status: 'approved' },
            order: { column: 'created_at', ascending: false },
            limit: 10
        });
        
        const ourPost = fetchedPosts.find(p => p.id === newPost.id);
        
        if (!ourPost) {
            throw new Error('Post not found in approved posts query');
        }
        
        console.log('✅ Post found in approved posts list');
        
        // Step 3: Clean up
        await db.delete('posts', { id: newPost.id });
        console.log('✅ Test post cleaned up');
        
        return true;
        
    } catch (error) {
        console.error('❌ Post creation flow test failed:', error.message);
        return false;
    }
}

async function runBackendTests() {
    console.log('🔧 Backend Database Operations Test Suite');
    console.log('=' .repeat(50));
    
    const results = {
        basicOperations: false,
        postCreationFlow: false
    };
    
    // Test 1: Basic database operations
    results.basicOperations = await testBackendDatabaseOperations();
    
    // Test 2: Specific post creation flow
    if (results.basicOperations) {
        results.postCreationFlow = await testSpecificPostCreationFlow();
    }
    
    // Results summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 BACKEND TEST RESULTS');
    console.log('=' .repeat(50));
    
    Object.entries(results).forEach(([test, passed]) => {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${test}`);
    });
    
    if (results.basicOperations && results.postCreationFlow) {
        console.log('\n✅ Backend database operations are working correctly!');
        console.log('💡 The 500 error might be caused by:');
        console.log('   - Authentication middleware issues');
        console.log('   - File upload processing problems');
        console.log('   - Environment variable mismatches between frontend and backend');
        console.log('   - CORS configuration issues');
    } else {
        console.log('\n❌ Backend database operations are failing!');
        console.log('💡 This is likely the root cause of your 500 error.');
    }
    
    return results;
}

// Run the tests
if (require.main === module) {
    runBackendTests().catch(console.error);
}

module.exports = {
    testBackendDatabaseOperations,
    testSpecificPostCreationFlow,
    runBackendTests
};
