require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Key');
    console.log('Please check your .env file in the backend directory');
    console.log('Current env vars:', {
        SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
        SUPABASE_SERVICE_KEY: supabaseServiceKey ? 'SET' : 'MISSING'
    });
    process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testSupabaseConnection() {
    console.log('\n🔍 Testing Supabase Connection...');
    
    try {
        // Test basic connection
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
            throw error;
        }
        
        console.log('✅ Supabase connection successful');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return false;
    }
}

async function testPostsTableStructure() {
    console.log('\n🔍 Testing Posts Table Structure...');
    
    try {
        // Try to select from posts table to check if it exists
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('❌ Posts table error:', error.message);
            console.log('💡 Error details:', error);
            return false;
        }
        
        console.log('✅ Posts table exists and accessible');
        console.log('📊 Sample data count:', data ? data.length : 0);
        
        return true;
    } catch (error) {
        console.error('❌ Posts table test failed:', error.message);
        return false;
    }
}

async function testDirectPostInsertion() {
    console.log('\n🔍 Testing Direct Post Insertion to Supabase...');
    
    try {
        const testPost = {
            title: 'Direct Supabase Test Post',
            content: 'This is a test post created directly via Supabase client to verify database connectivity.',
            author_id: 'test-author-123',
            status: 'approved',
            image_url: null,
            author_avatar: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        console.log('📝 Inserting test post:', {
            title: testPost.title,
            author_id: testPost.author_id,
            status: testPost.status
        });
        
        const { data, error } = await supabase
            .from('posts')
            .insert(testPost)
            .select();
        
        if (error) {
            console.error('❌ Direct insertion failed:', error);
            console.log('💡 Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return null;
        }
        
        if (!data || data.length === 0) {
            console.error('❌ No data returned from insertion');
            return null;
        }
        
        const insertedPost = data[0];
        console.log('✅ Post inserted successfully:', {
            id: insertedPost.id,
            title: insertedPost.title,
            created_at: insertedPost.created_at
        });
        
        // Verify the post exists by reading it back
        const { data: readData, error: readError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', insertedPost.id);
        
        if (readError) {
            console.error('❌ Failed to read back inserted post:', readError);
            return insertedPost;
        }
        
        if (readData && readData.length > 0) {
            console.log('✅ Post verified in database:', {
                id: readData[0].id,
                title: readData[0].title,
                status: readData[0].status
            });
        }
        
        return insertedPost;
    } catch (error) {
        console.error('❌ Direct insertion test failed:', error.message);
        return null;
    }
}

async function testAPIEndpoint() {
    console.log('\n🔍 Testing API Endpoint...');
    
    try {
        // Test the posts endpoint without authentication first
        try {
            const response = await axios.get(`${API_URL}/news/public`, {
                timeout: 10000
            });
            
            console.log('✅ Public posts endpoint accessible:', {
                status: response.status,
                postsCount: response.data?.posts?.length || 0,
                success: response.data?.success
            });
            
            return true;
            
        } catch (apiError) {
            console.error('❌ API endpoint test failed:', {
                status: apiError.response?.status,
                message: apiError.response?.data?.message || apiError.message,
                url: `${API_URL}/news/public`
            });
            
            if (apiError.response?.status === 500) {
                console.log('💡 This is the same 500 error you\'re experiencing!');
                console.log('💡 The issue is likely in the backend database connection or query execution');
                
                // Try to get more details from the error response
                if (apiError.response?.data) {
                    console.log('🔍 Server error details:', apiError.response.data);
                }
            }
            
            return false;
        }
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        return false;
    }
}

async function cleanupTestData(testPost) {
    if (testPost && testPost.id) {
        console.log('\n🧹 Cleaning up test data...');
        try {
            await supabase.from('posts').delete().eq('id', testPost.id);
            console.log('✅ Test post cleaned up');
        } catch (error) {
            console.log('⚠️  Failed to clean up test post:', error.message);
        }
    }
}

async function runAllTests() {
    console.log('🚀 Starting Supabase Post Creation Tests...');
    console.log('=' .repeat(50));
    
    const results = {
        supabaseConnection: false,
        postsTableStructure: false,
        directInsertion: false,
        apiEndpoint: false
    };
    
    let testPost = null;
    
    try {
        // Test 1: Supabase Connection
        results.supabaseConnection = await testSupabaseConnection();
        
        // Test 2: Posts Table Structure
        if (results.supabaseConnection) {
            results.postsTableStructure = await testPostsTableStructure();
        }
        
        // Test 3: Direct Post Insertion
        if (results.postsTableStructure) {
            testPost = await testDirectPostInsertion();
            results.directInsertion = testPost !== null;
        }
        
        // Test 4: API Endpoint
        results.apiEndpoint = await testAPIEndpoint();
        
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    } finally {
        // Cleanup
        await cleanupTestData(testPost);
    }
    
    return results;
}

// Run the tests
if (require.main === module) {
    runAllTests().then(results => {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('=' .repeat(50));
        
        Object.entries(results).forEach(([test, passed]) => {
            const status = passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${test}`);
        });
        
        console.log('\n🔍 DIAGNOSIS:');
        
        if (!results.supabaseConnection) {
            console.log('❌ Supabase connection is failing - check your environment variables');
            console.log('💡 Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in backend/.env');
        } else if (!results.postsTableStructure) {
            console.log('❌ Posts table has structural issues - check your database schema');
            console.log('💡 Run: node backend/setup-tables.js or check FIXED_SUPABASE_SCHEMA.sql');
        } else if (!results.directInsertion) {
            console.log('❌ Direct insertion fails - there might be database constraints or permissions issues');
        } else if (!results.apiEndpoint) {
            console.log('❌ API endpoint is failing - this is likely the source of your 500 error');
            console.log('💡 Check backend server logs and make sure the server is running');
        } else {
            console.log('✅ All tests passed - the issue might be intermittent or authentication-related');
        }
        
        console.log('\n💡 NEXT STEPS:');
        if (!results.supabaseConnection) {
            console.log('1. Check your SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/.env');
            console.log('2. Verify your Supabase project is active');
        }
        if (!results.postsTableStructure) {
            console.log('1. Run the database migration script');
            console.log('2. Check if all required columns exist in the posts table');
        }
        if (!results.apiEndpoint) {
            console.log('1. Start your backend server: cd backend && npm start');
            console.log('2. Check backend server logs for detailed error messages');
        }
    }).catch(console.error);
}

module.exports = {
    testSupabaseConnection,
    testPostsTableStructure,
    testDirectPostInsertion,
    testAPIEndpoint,
    runAllTests
};
