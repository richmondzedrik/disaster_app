import { db } from './backend/db/supabase-connection-cjs.js';

async function checkAlertsTableStructure() {
    try {
        console.log('🔍 Checking actual alerts table structure...');
        
        // Try to insert a minimal record to see what columns exist
        const minimalAlert = {
            message: 'Test Structure Check'
        };
        
        console.log('Testing with minimal data:', minimalAlert);
        
        const { data, error } = await db.supabase
            .from('alerts')
            .insert(minimalAlert)
            .select();
            
        if (error) {
            console.log('❌ Minimal insert failed:', error.message);
            
            // Try with different column combinations
            const variations = [
                { message: 'Test', type: 'info' },
                { message: 'Test', created_at: new Date().toISOString() },
                { message: 'Test', type: 'info', created_at: new Date().toISOString() }
            ];
            
            for (let i = 0; i < variations.length; i++) {
                console.log(`\nTrying variation ${i + 1}:`, variations[i]);
                
                const { data: varData, error: varError } = await db.supabase
                    .from('alerts')
                    .insert(variations[i])
                    .select();
                    
                if (varError) {
                    console.log(`❌ Variation ${i + 1} failed:`, varError.message);
                } else {
                    console.log(`✅ Variation ${i + 1} succeeded!`);
                    console.log('Working structure:', variations[i]);
                    console.log('Returned data:', varData[0]);
                    
                    // Clean up
                    if (varData && varData[0]) {
                        await db.supabase
                            .from('alerts')
                            .delete()
                            .eq('id', varData[0].id);
                    }
                    
                    return variations[i];
                }
            }
            
            return null;
        } else {
            console.log('✅ Minimal insert succeeded!');
            console.log('Working structure:', minimalAlert);
            console.log('Returned data:', data[0]);
            
            // Clean up
            if (data && data[0]) {
                await db.supabase
                    .from('alerts')
                    .delete()
                    .eq('id', data[0].id);
            }
            
            return minimalAlert;
        }
        
    } catch (error) {
        console.error('❌ Error checking table structure:', error);
        return null;
    }
}

async function main() {
    try {
        console.log('🚀 Starting alerts table structure check...\n');
        
        const workingStructure = await checkAlertsTableStructure();
        
        if (workingStructure) {
            console.log('\n✅ Found working structure for alerts table');
            console.log('📋 Use this structure for alert creation:', workingStructure);
        } else {
            console.log('\n❌ Could not find a working structure for alerts table');
            console.log('🔧 The alerts table may need to be recreated or have columns added');
        }
        
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

// Run if called directly
main().catch(console.error);

export { checkAlertsTableStructure };
