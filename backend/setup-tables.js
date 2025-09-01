require('dotenv').config();
const { db } = require('./db/supabase-connection-cjs');

async function setupTables() {
    console.log('🔧 Setting up database tables...');
    
    try {
        // Create alerts table if it doesn't exist
        const { error: alertsError } = await db.supabase.rpc('create_alerts_table_if_not_exists');
        
        if (alertsError && !alertsError.message.includes('already exists')) {
            console.log('Creating alerts table manually...');
            
            // Try to create a test alert to see if table exists
            const testResult = await db.insert('alerts', {
                type: 'info',
                message: 'Test Alert - System Check',
                priority: 1,
                is_active: true,
                is_public: true,
                created_at: new Date().toISOString()
            });
            
            if (testResult.error) {
                console.error('❌ Alerts table does not exist or has issues:', testResult.error);
                console.log('📝 Please create the alerts table in your Supabase dashboard with these columns:');
                console.log(`
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    expiry_date TIMESTAMP NULL,
    created_by INTEGER NULL
);
                `);
                return false;
            } else {
                console.log('✅ Test alert created successfully');
                // Clean up test alert
                await db.supabase.from('alerts').delete().eq('message', 'Test Alert - System Check');
            }
        }
        
        // Create some sample alerts for testing
        console.log('📝 Creating sample alerts...');
        const sampleAlerts = [
            {
                type: 'emergency',
                message: 'Emergency Alert: System is now operational',
                priority: 3,
                is_active: true,
                is_public: true,
                created_at: new Date().toISOString()
            },
            {
                type: 'warning',
                message: 'Warning: Please check your emergency supplies',
                priority: 2,
                is_active: true,
                is_public: true,
                created_at: new Date().toISOString()
            },
            {
                type: 'info',
                message: 'Info: System maintenance completed successfully',
                priority: 1,
                is_active: true,
                is_public: true,
                created_at: new Date().toISOString()
            }
        ];
        
        for (const alert of sampleAlerts) {
            const result = await db.insert('alerts', alert);
            if (result.error) {
                console.error('Error creating sample alert:', result.error);
            } else {
                console.log(`✅ Created ${alert.type} alert`);
            }
        }
        
        console.log('🎉 Database setup completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Error setting up tables:', error);
        return false;
    }
}

// Run setup
setupTables().then((success) => {
    if (success) {
        console.log('✅ All tables set up successfully');
    } else {
        console.log('⚠️ Some issues occurred during setup');
    }
    process.exit(success ? 0 : 1);
});
