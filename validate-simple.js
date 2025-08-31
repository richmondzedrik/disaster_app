import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('🔍 Supabase Migration Validation');
console.log('='.repeat(50));

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log(`✅ SUPABASE_URL: ${supabaseUrl ? 'Set' : '❌ Missing'}`);
console.log(`✅ SUPABASE_SERVICE_KEY: ${supabaseServiceKey ? 'Set' : '❌ Missing'}`);
console.log(`✅ DB_HOST: ${process.env.DB_HOST ? 'Set' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('\n❌ Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateSchema() {
    console.log('\n🔍 Checking Database Schema...');
    
    const tables = ['users', 'posts', 'alerts', 'comments', 'checklist_progress'];
    let successCount = 0;
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
                
            if (error && error.code === 'PGRST116') {
                console.log(`❌ ${table}: Table does not exist`);
            } else if (error) {
                console.log(`⚠️  ${table}: ${error.message}`);
            } else {
                console.log(`✅ ${table}: Table exists and accessible`);
                successCount++;
            }
        } catch (err) {
            console.log(`❌ ${table}: ${err.message}`);
        }
    }
    
    console.log(`\n📊 Schema Status: ${successCount}/${tables.length} tables ready`);
    
    if (successCount === 0) {
        console.log('\n🚨 CRITICAL: No tables found!');
        console.log('📝 You need to create the database schema first:');
        console.log('   1. Go to: https://supabase.com/dashboard/project/taqoegurvxaqzoejpmrp');
        console.log('   2. Click "SQL Editor" → "New Query"');
        console.log('   3. Copy content from essential-schema.sql');
        console.log('   4. Paste and click "Run"');
        return false;
    } else if (successCount < tables.length) {
        console.log('\n⚠️  Some tables are missing - schema may be incomplete');
        return false;
    } else {
        console.log('\n🎉 All essential tables found!');
        return true;
    }
}

async function testBasicOperations() {
    console.log('\n🧪 Testing Basic Operations...');
    
    try {
        // Test insert
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
            console.log(`❌ Insert test failed: ${userError.message}`);
            return false;
        }
        
        console.log('✅ Insert operation successful');
        
        // Cleanup
        if (userData && userData[0]) {
            await supabase
                .from('users')
                .delete()
                .eq('id', userData[0].id);
            console.log('✅ Cleanup successful');
        }
        
        return true;
        
    } catch (error) {
        console.log(`❌ Operations test failed: ${error.message}`);
        return false;
    }
}

async function main() {
    const schemaValid = await validateSchema();
    
    if (schemaValid) {
        const operationsValid = await testBasicOperations();
        
        if (operationsValid) {
            console.log('\n🎉 MIGRATION READY!');
            console.log('✅ Database schema is properly set up');
            console.log('✅ Basic operations are working');
            console.log('\n🔄 Next Steps:');
            console.log('   1. cd backend && node switch-to-supabase.js');
            console.log('   2. npm start (test backend)');
            console.log('   3. Test your application');
        } else {
            console.log('\n⚠️  Schema exists but operations failed');
            console.log('📝 Check your Supabase project permissions');
        }
    } else {
        console.log('\n❌ MIGRATION NOT READY');
        console.log('📝 Create the database schema first');
    }
}

main().catch(console.error);
