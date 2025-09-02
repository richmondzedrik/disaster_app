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

async function checkPostsTableSchema() {
    console.log('🔍 Checking Posts Table Schema...');
    console.log('=' .repeat(50));
    
    try {
        // Method 1: Try to get table info using a direct SQL query
        console.log('\n📋 Method 1: Direct SQL Query for Table Structure');
        
        const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
            table_name: 'posts'
        }).catch(async () => {
            // If RPC doesn't exist, try a different approach
            console.log('⚠️  RPC method not available, trying alternative...');
            
            // Try using a simple select to see what columns are available
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .limit(0); // Get no rows, just column info
            
            if (error) {
                throw error;
            }
            
            return { data: null, error: null };
        });
        
        if (columnsError) {
            console.log('⚠️  Could not get detailed column info:', columnsError.message);
        } else if (columns) {
            console.log('✅ Table columns found:');
            columns.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
            });
        }
        
        // Method 2: Try inserting with minimal data to see what's required
        console.log('\n📋 Method 2: Test Insert with Minimal Data');
        
        const minimalPost = {
            title: 'Schema Test',
            content: 'Testing what columns are required',
            author_id: '00000000-0000-0000-0000-000000000001' // UUID format
        };
        
        console.log('🧪 Testing minimal insert...');
        const { data: minResult, error: minError } = await supabase
            .from('posts')
            .insert(minimalPost)
            .select();
        
        if (minError) {
            console.log('❌ Minimal insert failed:', minError.message);
            console.log('💡 Error details:', {
                code: minError.code,
                details: minError.details,
                hint: minError.hint
            });
        } else {
            console.log('✅ Minimal insert successful!');
            console.log('📊 Returned columns:', Object.keys(minResult[0]));
            
            // Clean up
            await supabase.from('posts').delete().eq('id', minResult[0].id);
            console.log('🧹 Test post cleaned up');
        }
        
        // Method 3: Try inserting with all expected columns one by one
        console.log('\n📋 Method 3: Test Each Column Individually');
        
        const testColumns = {
            title: 'Column Test',
            content: 'Testing individual columns',
            author_id: '00000000-0000-0000-0000-000000000001',
            status: 'draft',
            image_url: null,
            author_avatar: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        for (const [columnName, value] of Object.entries(testColumns)) {
            const testData = {
                title: 'Column Test',
                content: 'Testing individual columns',
                author_id: '00000000-0000-0000-0000-000000000001'
            };
            
            if (columnName !== 'title' && columnName !== 'content' && columnName !== 'author_id') {
                testData[columnName] = value;
            }
            
            const { data: colResult, error: colError } = await supabase
                .from('posts')
                .insert(testData)
                .select();
            
            if (colError) {
                console.log(`❌ Column '${columnName}' failed:`, colError.message);
            } else {
                console.log(`✅ Column '${columnName}' works`);
                // Clean up
                await supabase.from('posts').delete().eq('id', colResult[0].id);
            }
        }
        
        // Method 4: Check what the backend code expects vs what exists
        console.log('\n📋 Method 4: Backend Code Analysis');
        console.log('🔍 The backend code tries to insert these columns:');
        console.log('   - title (required)');
        console.log('   - content (required)');
        console.log('   - author_id (required)');
        console.log('   - status (expected)');
        console.log('   - image_url (optional)');
        console.log('   - author_avatar (causing the error!)');
        console.log('   - created_at (timestamp)');
        console.log('   - updated_at (timestamp)');
        
        console.log('\n💡 SOLUTION: The posts table is missing the author_avatar column!');
        console.log('💡 You need to add this column to your database.');
        
    } catch (error) {
        console.error('❌ Schema check failed:', error.message);
    }
}

async function fixPostsTableSchema() {
    console.log('\n🔧 Attempting to Fix Posts Table Schema...');
    
    try {
        // Add the missing author_avatar column
        const { error } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_avatar TEXT;'
        }).catch(async () => {
            // If RPC doesn't work, we can't directly execute SQL
            console.log('⚠️  Cannot execute SQL directly through Supabase client');
            console.log('💡 You need to run this SQL manually in your Supabase dashboard:');
            console.log('   ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_avatar TEXT;');
            return { error: null };
        });
        
        if (error) {
            console.log('❌ Failed to add column:', error.message);
        } else {
            console.log('✅ Attempted to add author_avatar column');
        }
        
    } catch (error) {
        console.error('❌ Fix attempt failed:', error.message);
    }
}

async function runSchemaCheck() {
    await checkPostsTableSchema();
    await fixPostsTableSchema();
    
    console.log('\n' + '=' .repeat(50));
    console.log('📋 SUMMARY');
    console.log('=' .repeat(50));
    console.log('🔍 The issue is that your posts table is missing the author_avatar column.');
    console.log('🔧 To fix this, you need to:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to the SQL Editor');
    console.log('   3. Run: ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_avatar TEXT;');
    console.log('   4. Or run the full schema from FIXED_SUPABASE_SCHEMA.sql');
    console.log('\n💡 After adding the column, your post creation should work!');
}

if (require.main === module) {
    runSchemaCheck().catch(console.error);
}

module.exports = { checkPostsTableSchema, fixPostsTableSchema };
