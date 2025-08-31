import dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

console.log('🔍 Environment Variables Check:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);

console.log('\n🧪 Testing DNS resolution...');

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key');
    process.exit(1);
}

console.log('📡 Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Key:', supabaseKey ? '***' : 'NOT SET');

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n🔗 Testing Supabase client connection...');

try {
    const { data, error } = await supabase
        .from('disasters')
        .select('count')
        .limit(1);
    
    if (error) {
        console.log('⚠️  Query error (this might be expected if table doesn\'t exist):', error.message);
    } else {
        console.log('✅ Supabase client connection successful!');
        console.log('📊 Query result:', data);
    }
} catch (err) {
    console.error('❌ Connection failed:', err.message);
}

console.log('\n✅ Test completed');
