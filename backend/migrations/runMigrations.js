const mysql = require('mysql2/promise');
const config = require('../config/database');
const initDatabase = require('./000_init_database');

async function runMigrations() {
    let connection;
    try {
        console.log('Starting migrations...');
        
        // Create initial connection without database to ensure it exists
        connection = await mysql.createConnection({
            ...config,
            database: undefined,
            ssl: process.env.NODE_ENV === 'production' ? {
                rejectUnauthorized: false
            } : false,
            connectTimeout: 10000, // 10 seconds timeout
            waitForConnections: true,
            connectionLimit: 10
        });

        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
        
        // Run the main migration
        await initDatabase.up();
        
        console.log('All migrations completed successfully');
        return true;
    } catch (error) {
        console.error('Migration failed:', error);
        return false;
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (err) {
                console.error('Error closing initial connection:', err);
            }
        }
    }
}

module.exports = runMigrations;