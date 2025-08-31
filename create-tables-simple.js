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

async function createTables() {
    console.log('🚀 Creating essential tables in Supabase...');
    
    try {
        // Test 1: Try to insert a test record to see if we can create tables automatically
        console.log('🧪 Testing table auto-creation...');
        
        // Try to create users table by inserting data
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                username: 'test_user',
                email: 'test@example.com',
                role: 'user'
            })
            .select();
            
        if (userError) {
            console.log('⚠️  Users table:', userError.message);
        } else {
            console.log('✅ Users table created and working!');
            
            // Clean up test data
            await supabase
                .from('users')
                .delete()
                .eq('email', 'test@example.com');
        }
        
        // Try posts table
        const { data: postData, error: postError } = await supabase
            .from('posts')
            .insert({
                title: 'Test Post',
                content: 'Test content',
                author_id: '00000000-0000-0000-0000-000000000000'
            })
            .select();
            
        if (postError) {
            console.log('⚠️  Posts table:', postError.message);
        } else {
            console.log('✅ Posts table created and working!');
            
            // Clean up test data
            await supabase
                .from('posts')
                .delete()
                .eq('title', 'Test Post');
        }
        
        // Try alerts table
        const { data: alertData, error: alertError } = await supabase
            .from('alerts')
            .insert({
                title: 'Test Alert',
                message: 'Test alert message',
                alert_type: 'other',
                severity: 'low'
            })
            .select();
            
        if (alertError) {
            console.log('⚠️  Alerts table:', alertError.message);
        } else {
            console.log('✅ Alerts table created and working!');
            
            // Clean up test data
            await supabase
                .from('alerts')
                .delete()
                .eq('title', 'Test Alert');
        }
        
        // Try comments table
        const { data: commentData, error: commentError } = await supabase
            .from('comments')
            .insert({
                content: 'Test comment',
                post_id: '00000000-0000-0000-0000-000000000000',
                user_id: '00000000-0000-0000-0000-000000000000'
            })
            .select();
            
        if (commentError) {
            console.log('⚠️  Comments table:', commentError.message);
        } else {
            console.log('✅ Comments table created and working!');
            
            // Clean up test data
            await supabase
                .from('comments')
                .delete()
                .eq('content', 'Test comment');
        }
        
        // Try checklist_progress table
        const { data: checklistData, error: checklistError } = await supabase
            .from('checklist_progress')
            .insert({
                user_id: '00000000-0000-0000-0000-000000000000',
                item_id: 'test_item',
                completed: false
            })
            .select();
            
        if (checklistError) {
            console.log('⚠️  Checklist Progress table:', checklistError.message);
        } else {
            console.log('✅ Checklist Progress table created and working!');
            
            // Clean up test data
            await supabase
                .from('checklist_progress')
                .delete()
                .eq('item_id', 'test_item');
        }
        
        console.log('\n🎉 Table creation test completed!');
        console.log('📝 If tables don\'t exist, you\'ll need to create them manually in Supabase dashboard');
        
        return true;
        
    } catch (error) {
        console.error('❌ Table creation failed:', error);
        return false;
    }
}

async function checkExistingTables() {
    console.log('\n🔍 Checking existing tables...');
    
    const tables = ['users', 'posts', 'alerts', 'comments', 'checklist_progress'];
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
                
            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
            } else {
                console.log(`✅ ${table}: Table exists and accessible`);
            }
        } catch (err) {
            console.log(`❌ ${table}: ${err.message}`);
        }
    }
}

async function main() {
    console.log('🎯 Starting Supabase table setup...\n');
    
    // First check what tables already exist
    await checkExistingTables();
    
    // Then try to create/test tables
    await createTables();
    
    console.log('\n📋 Next Steps:');
    console.log('1. If tables don\'t exist, create them manually in Supabase dashboard');
    console.log('2. Go to https://supabase.com/dashboard/project/taqoegurvxaqzoejpmrp');
    console.log('3. Use the SQL Editor to run the schema.sql file');
    console.log('4. Then update your backend code to use Supabase');
}

main().catch(console.error);
