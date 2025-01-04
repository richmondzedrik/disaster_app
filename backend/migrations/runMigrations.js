const mysql = require('mysql2/promise');
const config = require('../config/database');
const initDatabase = require('./000_init_database');

async function runMigrations() {
    let initialConnection;
    try {
        console.log('Starting migrations...');
        
        // Create initial connection without database
        initialConnection = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password,
            ssl: process.env.NODE_ENV === 'production' ? {
                rejectUnauthorized: false
            } : false,
            connectTimeout: 10000
        });

        // Create database if it doesn't exist
        await initialConnection.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
        await initialConnection.end();
        
        // Run the main migration
        await initDatabase.up();
        
        console.log('All migrations completed successfully');
        return true;
    } catch (error) {
        console.error('Migration failed:', error);
        return false;
    } finally {
        if (initialConnection) {
            try {
                await initialConnection.end();
            } catch (err) {
                console.error('Error closing initial connection:', err);
            }
        }
    }
}

module.exports = runMigrations;