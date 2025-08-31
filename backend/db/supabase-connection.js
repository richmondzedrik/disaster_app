import dotenv from 'dotenv';
import { Pool } from 'pg';
import { supabaseAdmin, pgConfig } from '../config/supabase.js';

dotenv.config();

// Create PostgreSQL connection pool
const pool = new Pool({
    ...pgConfig,
    max: 10, // Maximum number of connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Track active connections
let activeConnections = 0;

pool.on('connect', () => {
    activeConnections++;
    console.log(`PostgreSQL connection acquired. Active connections: ${activeConnections}`);
});

pool.on('remove', () => {
    activeConnections--;
    console.log(`PostgreSQL connection released. Active connections: ${activeConnections}`);
});

pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
});

// Database helper functions
class SupabaseDB {
    constructor() {
        this.pool = pool;
        this.supabase = supabaseAdmin;
    }

    // Execute raw SQL query
    async query(text, params = []) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(text, params);
            return result;
        } finally {
            client.release();
        }
    }

    // Execute query and return rows
    async execute(text, params = []) {
        const result = await this.query(text, params);
        return result.rows;
    }

    // Get a connection from the pool
    async getConnection() {
        return await this.pool.connect();
    }

    // Close all connections
    async end() {
        await this.pool.end();
    }

    // Supabase helper methods
    async select(table, options = {}) {
        let query = this.supabase.from(table).select(options.select || '*');
        
        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }
        
        if (options.order) {
            query = query.order(options.order.column, { ascending: options.order.ascending !== false });
        }
        
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async insert(table, data) {
        const { data: result, error } = await this.supabase
            .from(table)
            .insert(data)
            .select();
        
        if (error) throw error;
        return result;
    }

    async update(table, data, where) {
        let query = this.supabase.from(table).update(data);
        
        Object.entries(where).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        
        const { data: result, error } = await query.select();
        if (error) throw error;
        return result;
    }

    async delete(table, where) {
        let query = this.supabase.from(table).delete();
        
        Object.entries(where).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        
        const { error } = await query;
        if (error) throw error;
        return true;
    }

    // Authentication helpers
    async createUser(email, password, userData = {}) {
        const { data, error } = await this.supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: userData
        });
        
        if (error) throw error;
        return data;
    }

    async getUserByEmail(email) {
        const { data, error } = await this.supabase.auth.admin.getUserByEmail(email);
        if (error) throw error;
        return data;
    }

    async updateUser(userId, updates) {
        const { data, error } = await this.supabase.auth.admin.updateUserById(userId, updates);
        if (error) throw error;
        return data;
    }

    async deleteUser(userId) {
        const { error } = await this.supabase.auth.admin.deleteUser(userId);
        if (error) throw error;
        return true;
    }

    // Real-time subscriptions
    subscribe(table, callback, filter = {}) {
        let subscription = this.supabase
            .channel(`${table}_changes`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: table,
                    ...filter 
                }, 
                callback
            )
            .subscribe();
        
        return subscription;
    }

    // File storage helpers
    async uploadFile(bucket, path, file) {
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .upload(path, file);
        
        if (error) throw error;
        return data;
    }

    async getFileUrl(bucket, path) {
        const { data } = this.supabase.storage
            .from(bucket)
            .getPublicUrl(path);
        
        return data.publicUrl;
    }

    async deleteFile(bucket, path) {
        const { error } = await this.supabase.storage
            .from(bucket)
            .remove([path]);
        
        if (error) throw error;
        return true;
    }
}

// Test connection function
async function testConnection() {
    try {
        const db = new SupabaseDB();
        
        // Test PostgreSQL connection
        const pgResult = await db.query('SELECT NOW() as current_time');
        console.log('PostgreSQL connected successfully:', pgResult.rows[0]);
        
        // Test Supabase connection
        const { data, error } = await db.supabase.from('users').select('count').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
            throw error;
        }
        console.log('Supabase connected successfully');
        
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

// Create singleton instance
const db = new SupabaseDB();

export {
    db,
    SupabaseDB,
    testConnection,
    pool
};
