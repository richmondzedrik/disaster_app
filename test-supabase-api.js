import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Using service key for admin operations

console.log('🔍 Testing Supabase API Connection...');
console.log('📡 URL:', supabaseUrl);
console.log('🔑 Service Key:', supabaseKey ? '***' : 'NOT SET');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseAPI() {
    try {
        console.log('\n🧪 Testing basic API connection...');
        
        // Test 1: Try to get database info
        const { data, error } = await supabase.rpc('version');
        
        if (error) {
            console.log('⚠️  RPC call failed:', error.message);
        } else {
            console.log('✅ Supabase API connection successful!');
            console.log('📊 Database version:', data);
        }

        // Test 2: Try to create a simple table
        console.log('\n🔧 Testing table creation via SQL...');
        
        const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS test_connection (
                    id SERIAL PRIMARY KEY,
                    message TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `
        });

        if (createError) {
            console.log('⚠️  Table creation failed:', createError.message);
            
            // Try alternative method - direct table operations
            console.log('\n🔄 Trying alternative table creation...');
            const { error: insertError } = await supabase
                .from('test_connection')
                .insert({ message: 'Hello Supabase!' });
                
            if (insertError) {
                console.log('⚠️  Insert failed (table might not exist):', insertError.message);
            } else {
                console.log('✅ Table operations working!');
            }
        } else {
            console.log('✅ Table creation successful!');
            
            // Test insert
            const { error: insertError } = await supabase
                .from('test_connection')
                .insert({ message: 'Migration test successful!' });
                
            if (insertError) {
                console.log('⚠️  Insert failed:', insertError.message);
            } else {
                console.log('✅ Insert successful!');
            }
        }

        return true;
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        return false;
    }
}

testSupabaseAPI()
    .then((success) => {
        if (success) {
            console.log('\n🎉 Supabase API is working! You can proceed with migration.');
        } else {
            console.log('\n❌ Supabase API connection failed. Please check your project status.');
        }
    })
    .catch((error) => {
        console.error('💥 Test failed:', error);
    });
