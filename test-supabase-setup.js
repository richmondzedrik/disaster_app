import dotenv from 'dotenv';
import { Pool } from 'pg';

// Configure dotenv
dotenv.config();

// Test PostgreSQL connection
async function testConnection() {
    console.log('🧪 Testing Supabase PostgreSQL connection...');
    
    // Check environment variables
    const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Missing environment variables:', missingVars.join(', '));
        console.log('📝 Please update your .env file with Supabase credentials');
        console.log('');
        console.log('Required variables:');
        console.log('DB_HOST=db.your-project.supabase.co');
        console.log('DB_USER=postgres');
        console.log('DB_PASSWORD=your-database-password');
        console.log('DB_NAME=postgres');
        console.log('DB_PORT=5432');
        return false;
    }
    
    // PostgreSQL configuration
    const pgConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 5432,
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000
    };
    
    console.log('📡 Connecting to:', {
        host: pgConfig.host,
        database: pgConfig.database,
        port: pgConfig.port,
        user: pgConfig.user
    });
    
    const pool = new Pool(pgConfig);
    
    try {
        // Test connection
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL successfully');
        
        // Test query
        const result = await client.query('SELECT NOW() as current_time, version() as version');
        console.log('✅ Query test successful');
        console.log('📅 Current time:', result.rows[0].current_time);
        console.log('🗄️  Database version:', result.rows[0].version.split(' ')[0]);
        
        client.release();
        
        return true;
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        
        if (error.code === 'ENOTFOUND') {
            console.log('💡 Check your DB_HOST - make sure it\'s correct');
        } else if (error.code === '28P01') {
            console.log('💡 Authentication failed - check your DB_USER and DB_PASSWORD');
        } else if (error.code === '3D000') {
            console.log('💡 Database not found - check your DB_NAME');
        }
        
        return false;
    } finally {
        await pool.end();
    }
}

// Run test
testConnection()
    .then((success) => {
        if (success) {
            console.log('');
            console.log('🎉 Supabase connection test passed!');
            console.log('✅ You can now run: node supabase-migration/create-schema.js');
            process.exit(0);
        } else {
            console.log('');
            console.log('❌ Connection test failed');
            console.log('📝 Please check your environment variables and try again');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
