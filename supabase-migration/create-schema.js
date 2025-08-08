require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// PostgreSQL connection configuration
const pgConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
};

async function createSchema() {
    const pool = new Pool(pgConfig);
    
    try {
        console.log('🚀 Starting Supabase schema creation...');
        console.log('📡 Connecting to PostgreSQL...');
        
        // Test connection
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL successfully');
        
        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('📄 Executing schema SQL...');
        
        // Execute schema creation
        await client.query(schemaSql);
        
        console.log('✅ Schema created successfully!');
        
        // Verify tables were created
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);
        
        console.log('📋 Created tables:');
        tablesResult.rows.forEach(row => {
            console.log(`   ✅ ${row.table_name}`);
        });
        
        client.release();
        
    } catch (error) {
        console.error('❌ Schema creation failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    createSchema()
        .then(() => {
            console.log('🎉 Schema creation completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Schema creation failed:', error);
            process.exit(1);
        });
}

module.exports = createSchema;
