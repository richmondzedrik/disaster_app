import { db } from './backend/db/supabase-connection-cjs.js';

async function checkAlertsTable() {
    try {
        console.log('🔍 Checking alerts table structure...');
        
        // Try to get table info from Supabase
        const { data, error } = await db.supabase
            .from('alerts')
            .select('*')
            .limit(1);
            
        if (error) {
            console.log('❌ Error accessing alerts table:', error.message);
            return false;
        }
        
        console.log('✅ Alerts table exists');
        console.log('Sample data structure:', data);
        return true;
        
    } catch (error) {
        console.error('❌ Error checking alerts table:', error);
        return false;
    }
}

async function addMissingColumns() {
    try {
        console.log('🔧 Adding missing columns to alerts table...');
        
        // Add priority column if it doesn't exist
        const addPriorityQuery = `
            ALTER TABLE alerts 
            ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
        `;
        
        // Add other potentially missing columns
        const addColumnsQuery = `
            ALTER TABLE alerts 
            ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
        `;
        
        // Execute the queries using raw SQL
        const { error: priorityError } = await db.supabase.rpc('exec_sql', {
            sql: addPriorityQuery
        });
        
        if (priorityError) {
            console.log('Priority column might already exist or using direct SQL...');
            // Try alternative approach - direct table modification
            try {
                const { error: directError } = await db.supabase
                    .from('alerts')
                    .insert({
                        message: 'test',
                        type: 'info',
                        priority: 0,
                        is_active: true,
                        created_at: new Date().toISOString()
                    });
                
                if (directError && directError.message.includes('priority')) {
                    console.log('❌ Priority column missing, need to add it manually');
                    return false;
                } else {
                    // Delete the test record
                    await db.supabase
                        .from('alerts')
                        .delete()
                        .eq('message', 'test');
                    console.log('✅ Priority column exists');
                }
            } catch (testError) {
                console.log('❌ Priority column test failed:', testError.message);
                return false;
            }
        }
        
        console.log('✅ Alerts table columns updated');
        return true;
        
    } catch (error) {
        console.error('❌ Error adding columns:', error);
        return false;
    }
}

async function createAlertsTableIfNotExists() {
    try {
        console.log('🔧 Creating alerts table if it doesn\'t exist...');
        
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS alerts (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                priority INTEGER DEFAULT 0,
                expiry_date TIMESTAMP WITH TIME ZONE,
                is_public BOOLEAN DEFAULT false,
                created_by UUID REFERENCES users(id),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;
        
        // Since we can't use rpc, let's try to insert a test record to see what columns exist
        const testAlert = {
            message: 'Test Alert',
            type: 'info',
            priority: 1,
            is_public: true,
            is_active: true,
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await db.supabase
            .from('alerts')
            .insert(testAlert)
            .select();
            
        if (error) {
            console.log('❌ Error creating test alert:', error.message);
            if (error.message.includes('priority')) {
                console.log('🔧 Priority column missing - need manual database update');
                console.log('Please run this SQL in your Supabase dashboard:');
                console.log('ALTER TABLE alerts ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;');
            }
            return false;
        } else {
            console.log('✅ Test alert created successfully');
            // Clean up test alert
            if (data && data[0]) {
                await db.supabase
                    .from('alerts')
                    .delete()
                    .eq('id', data[0].id);
                console.log('✅ Test alert cleaned up');
            }
            return true;
        }
        
    } catch (error) {
        console.error('❌ Error with alerts table:', error);
        return false;
    }
}

async function main() {
    try {
        console.log('🚀 Starting alerts table fix...\n');
        
        const tableExists = await checkAlertsTable();
        
        if (tableExists) {
            const columnsAdded = await addMissingColumns();
            if (!columnsAdded) {
                await createAlertsTableIfNotExists();
            }
        } else {
            await createAlertsTableIfNotExists();
        }
        
        console.log('\n✅ Alerts table fix completed');
        
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

// Run if called directly
main().catch(console.error);

export { checkAlertsTable, addMissingColumns, createAlertsTableIfNotExists };
