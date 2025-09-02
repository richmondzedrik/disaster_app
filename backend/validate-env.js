// Environment validation script
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET'
];

const optionalEnvVars = [
    'PORT',
    'NODE_ENV',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS'
];

function validateEnvironment() {
    console.log('🔍 Validating environment variables...');
    
    const missing = [];
    const present = [];
    
    // Check required variables
    requiredEnvVars.forEach(varName => {
        if (process.env[varName]) {
            present.push(varName);
            console.log(`✅ ${varName}: Present`);
        } else {
            missing.push(varName);
            console.log(`❌ ${varName}: Missing`);
        }
    });
    
    // Check optional variables
    console.log('\n📋 Optional variables:');
    optionalEnvVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`✅ ${varName}: Present`);
        } else {
            console.log(`⚠️  ${varName}: Not set (optional)`);
        }
    });
    
    console.log('\n📊 Summary:');
    console.log(`✅ Required variables present: ${present.length}/${requiredEnvVars.length}`);
    
    if (missing.length > 0) {
        console.log(`❌ Missing required variables: ${missing.join(', ')}`);
        console.log('\n🚨 Application may not function correctly without these variables!');
        return false;
    } else {
        console.log('🎉 All required environment variables are present!');
        return true;
    }
}

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        console.log('\n🧪 Testing Supabase connection...');
        
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
        
        // Test connection with a simple query
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1);
            
        if (error) {
            console.log('❌ Supabase connection failed:', error.message);
            return false;
        } else {
            console.log('✅ Supabase connection successful');
            return true;
        }
    } catch (error) {
        console.log('❌ Supabase connection error:', error.message);
        return false;
    }
}

module.exports = {
    validateEnvironment,
    testSupabaseConnection
};

// Run validation if this file is executed directly
if (require.main === module) {
    require('dotenv').config();
    
    const envValid = validateEnvironment();
    
    if (envValid) {
        testSupabaseConnection().then(dbValid => {
            if (dbValid) {
                console.log('\n🎉 Environment validation passed!');
                process.exit(0);
            } else {
                console.log('\n❌ Database connection failed!');
                process.exit(1);
            }
        });
    } else {
        process.exit(1);
    }
}
