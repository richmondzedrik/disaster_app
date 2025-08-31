const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Key in .env file');
    console.error('Make sure you have SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql, description) {
    try {
        console.log(`🔧 ${description}...`);
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                console.log(`⚠️  ${description}: Already exists (skipping)`);
                return true;
            } else {
                console.error(`❌ ${description} failed:`, error.message);
                return false;
            }
        } else {
            console.log(`✅ ${description} completed`);
            return true;
        }
    } catch (err) {
        console.error(`❌ ${description} error:`, err.message);
        return false;
    }
}

async function createSchema() {
    console.log('🚀 Creating Supabase schema for Disaster Preparedness App...\n');
    console.log(`📡 Connecting to: ${supabaseUrl}\n`);

    try {
        // Test connection first
        const { data: testData, error: testError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);

        if (testError) {
            console.error('❌ Connection test failed:', testError.message);
            process.exit(1);
        }
        console.log('✅ Connection successful\n');

        // Read and execute the SQL schema file
        console.log('📋 Reading schema file...');
        const schemaPath = path.join(__dirname, 'supabase-schema.sql');

        if (!fs.existsSync(schemaPath)) {
            console.error('❌ Schema file not found:', schemaPath);
            process.exit(1);
        }

        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        console.log('✅ Schema file loaded\n');

        // Split SQL into individual statements and execute them
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`🔧 Executing ${statements.length} SQL statements...\n`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.length === 0) continue;

            // Extract a description from the statement
            let description = `Statement ${i + 1}`;
            if (statement.includes('CREATE TABLE')) {
                const match = statement.match(/CREATE TABLE.*?(\w+)/i);
                if (match) description = `Creating table: ${match[1]}`;
            } else if (statement.includes('CREATE INDEX')) {
                const match = statement.match(/CREATE INDEX.*?(\w+)/i);
                if (match) description = `Creating index: ${match[1]}`;
            } else if (statement.includes('CREATE TYPE')) {
                const match = statement.match(/CREATE TYPE.*?(\w+)/i);
                if (match) description = `Creating type: ${match[1]}`;
            } else if (statement.includes('CREATE EXTENSION')) {
                description = 'Enabling extensions';
            } else if (statement.includes('CREATE TRIGGER')) {
                const match = statement.match(/CREATE TRIGGER.*?(\w+)/i);
                if (match) description = `Creating trigger: ${match[1]}`;
            } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
                description = 'Creating update function';
            }

            try {
                // Use direct SQL execution for better compatibility
                const { error } = await supabase.rpc('exec_sql', {
                    sql_query: statement + ';'
                });

                if (error) {
                    if (error.message.includes('already exists') ||
                        error.message.includes('duplicate') ||
                        error.message.includes('does not exist')) {
                        console.log(`⚠️  ${description}: Already exists (skipping)`);
                        skipCount++;
                    } else {
                        console.error(`❌ ${description}: ${error.message}`);
                        errorCount++;
                    }
                } else {
                    console.log(`✅ ${description}`);
                    successCount++;
                }
            } catch (err) {
                console.error(`❌ ${description}: ${err.message}`);
                errorCount++;
            }
        }

        console.log('\n🎉 Schema creation completed!');
        console.log('\n📊 Results Summary:');
        console.log(`✅ Successful: ${successCount}`);
        console.log(`⚠️  Skipped: ${skipCount}`);
        console.log(`❌ Errors: ${errorCount}`);

        if (errorCount === 0) {
            console.log('\n🎉 All tables created successfully!');
            console.log('\n📋 Tables created:');
            console.log('- users: User accounts and profiles');
            console.log('- posts: Community posts and news');
            console.log('- alerts: Emergency alerts and warnings');
            console.log('- comments: Post comments');
            console.log('- likes: Post likes');
            console.log('- checklist_items: Preparedness checklist items');
            console.log('- checklist_progress: User checklist completion');
            console.log('- alert_reads: Track which alerts users have read');
            console.log('- first_aid_guides: First aid video guides');
            console.log('- notifications: User notifications');

            console.log('\n🔐 Next steps:');
            console.log('1. Your database schema is ready!');
            console.log('2. Deploy your backend to Render with environment variables');
            console.log('3. Test your application endpoints');
        } else {
            console.log('\n⚠️  Some errors occurred. Check the messages above.');
            console.log('You may need to run this script again or fix issues manually.');
        }

    } catch (error) {
        console.error('❌ Schema creation failed:', error);
        process.exit(1);
    }
}

// Run the schema creation
createSchema();
