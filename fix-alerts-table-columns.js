import { db } from './backend/db/supabase-connection-cjs.js';

async function addMissingAlertsColumns() {
    try {
        console.log('🔧 Adding missing columns to alerts table...');
        
        // Test current table structure by trying to insert a record
        const testAlert = {
            message: 'Test Alert Structure',
            type: 'info',
            is_active: true,
            created_at: new Date().toISOString()
        };
        
        console.log('🔍 Testing current alerts table structure...');
        
        // Try to insert without created_by first
        const { data: testData, error: testError } = await db.supabase
            .from('alerts')
            .insert(testAlert)
            .select();
            
        if (testData && testData[0]) {
            console.log('✅ Basic alerts table structure works');
            // Clean up test record
            await db.supabase
                .from('alerts')
                .delete()
                .eq('id', testData[0].id);
        }
        
        // Now try with created_by column
        const testAlertWithCreatedBy = {
            ...testAlert,
            message: 'Test Alert with Created By',
            created_by: '78e44a7e-1ef2-43d7-a38e-6a88707a4249' // Admin user ID
        };
        
        console.log('🔍 Testing created_by column...');
        
        const { data: testData2, error: testError2 } = await db.supabase
            .from('alerts')
            .insert(testAlertWithCreatedBy)
            .select();
            
        if (testError2) {
            console.log('❌ created_by column missing:', testError2.message);
            console.log('🔧 Need to add created_by column manually in Supabase dashboard');
            console.log('');
            console.log('Please run this SQL in your Supabase SQL Editor:');
            console.log('');
            console.log('ALTER TABLE alerts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);');
            console.log('ALTER TABLE alerts ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;');
            console.log('ALTER TABLE alerts ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;');
            console.log('');
            return false;
        } else {
            console.log('✅ created_by column exists');
            // Clean up test record
            if (testData2 && testData2[0]) {
                await db.supabase
                    .from('alerts')
                    .delete()
                    .eq('id', testData2[0].id);
            }
            return true;
        }
        
    } catch (error) {
        console.error('❌ Error testing alerts table:', error);
        return false;
    }
}

async function createCompleteAlertsTable() {
    try {
        console.log('🔧 Creating complete alerts table structure...');
        
        // Since we can't run DDL directly, let's create a comprehensive test
        const completeTestAlert = {
            message: 'Complete Test Alert',
            type: 'warning',
            priority: 1,
            expiry_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            is_public: true,
            created_by: '78e44a7e-1ef2-43d7-a38e-6a88707a4249',
            is_active: true,
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await db.supabase
            .from('alerts')
            .insert(completeTestAlert)
            .select();
            
        if (error) {
            console.log('❌ Complete table structure test failed:', error.message);
            
            // Identify missing columns
            const missingColumns = [];
            if (error.message.includes('created_by')) missingColumns.push('created_by UUID REFERENCES users(id)');
            if (error.message.includes('expiry_date')) missingColumns.push('expiry_date TIMESTAMP WITH TIME ZONE');
            if (error.message.includes('is_public')) missingColumns.push('is_public BOOLEAN DEFAULT false');
            if (error.message.includes('priority')) missingColumns.push('priority INTEGER DEFAULT 0');
            
            if (missingColumns.length > 0) {
                console.log('🔧 Missing columns detected. Please run this SQL in Supabase:');
                console.log('');
                missingColumns.forEach(col => {
                    console.log(`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS ${col};`);
                });
                console.log('');
            }
            
            return false;
        } else {
            console.log('✅ Complete alerts table structure is working');
            // Clean up test record
            if (data && data[0]) {
                await db.supabase
                    .from('alerts')
                    .delete()
                    .eq('id', data[0].id);
            }
            return true;
        }
        
    } catch (error) {
        console.error('❌ Error creating complete alerts table:', error);
        return false;
    }
}

async function main() {
    try {
        console.log('🚀 Starting alerts table column fix...\n');
        
        const basicStructure = await addMissingAlertsColumns();
        
        if (!basicStructure) {
            console.log('\n⚠️  Manual intervention required');
            console.log('Please add the missing columns in Supabase dashboard and run this script again');
            return;
        }
        
        const completeStructure = await createCompleteAlertsTable();
        
        if (completeStructure) {
            console.log('\n✅ Alerts table structure is complete and ready');
        } else {
            console.log('\n⚠️  Some columns may still be missing');
        }
        
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

// Run if called directly
main().catch(console.error);

export { addMissingAlertsColumns, createCompleteAlertsTable };
