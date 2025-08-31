import dotenv from 'dotenv';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSchemaViaAPI() {
    try {
        console.log('🚀 Creating Supabase schema via API...');
        
        // Read the schema file
        const schemaContent = fs.readFileSync('../supabase-migration/schema.sql', 'utf8');
        
        // Split the schema into individual statements
        const statements = schemaContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📄 Found ${statements.length} SQL statements to execute`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            if (statement.length === 0) continue;
            
            try {
                console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
                
                // Use the SQL editor endpoint
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'apikey': supabaseServiceKey
                    },
                    body: JSON.stringify({
                        sql: statement + ';'
                    })
                });
                
                if (response.ok) {
                    successCount++;
                    console.log(`   ✅ Success`);
                } else {
                    const errorText = await response.text();
                    console.log(`   ⚠️  Warning: ${errorText}`);
                    errorCount++;
                }
                
            } catch (error) {
                console.log(`   ⚠️  Error: ${error.message}`);
                errorCount++;
            }
        }
        
        console.log(`\n📊 Schema creation completed:`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ⚠️  Errors/Warnings: ${errorCount}`);
        
        // Test if we can query the users table
        console.log('\n🧪 Testing table creation...');
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
            
        if (error) {
            console.log('⚠️  Users table test:', error.message);
        } else {
            console.log('✅ Users table is accessible!');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Schema creation failed:', error);
        return false;
    }
}

// Alternative method using direct SQL execution
async function createSchemaDirectSQL() {
    try {
        console.log('🔄 Trying alternative method: Direct SQL execution...');
        
        // Create basic tables one by one
        const basicTables = [
            `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
            `CREATE TYPE user_role AS ENUM ('user', 'admin')`,
            `CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                role TEXT DEFAULT 'user',
                email_verified BOOLEAN DEFAULT false,
                phone VARCHAR(20),
                notifications BOOLEAN DEFAULT true,
                location VARCHAR(255),
                emergency_contacts JSONB DEFAULT '[]'::jsonb,
                avatar_url VARCHAR(255),
                last_login TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS posts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                author_id UUID REFERENCES users(id) ON DELETE CASCADE,
                image_url VARCHAR(255),
                published BOOLEAN DEFAULT false,
                featured BOOLEAN DEFAULT false,
                views INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS alerts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                alert_type TEXT DEFAULT 'other',
                severity TEXT DEFAULT 'medium',
                location VARCHAR(255),
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )`
        ];
        
        for (const sql of basicTables) {
            try {
                const { error } = await supabase.rpc('exec_sql', { sql });
                if (error) {
                    console.log(`⚠️  ${error.message}`);
                } else {
                    console.log(`✅ Table created successfully`);
                }
            } catch (err) {
                console.log(`⚠️  ${err.message}`);
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Alternative method failed:', error);
        return false;
    }
}

// Run the schema creation
async function main() {
    console.log('🎯 Starting schema creation process...\n');
    
    let success = await createSchemaViaAPI();
    
    if (!success) {
        console.log('\n🔄 First method failed, trying alternative...\n');
        success = await createSchemaDirectSQL();
    }
    
    if (success) {
        console.log('\n🎉 Schema creation process completed!');
        console.log('📝 Next step: Update your backend to use Supabase instead of MySQL');
    } else {
        console.log('\n❌ Schema creation failed. Please check your Supabase project manually.');
    }
}

main().catch(console.error);
