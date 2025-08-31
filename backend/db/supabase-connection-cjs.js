require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Key');
    process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple database wrapper for common operations
class SupabaseDB {
    constructor() {
        this.supabase = supabase;
    }

    // Generic select
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
        return { data, error };
    }

    // Insert
    async insert(table, data) {
        const { data: result, error } = await this.supabase
            .from(table)
            .insert(data)
            .select();
        
        return { data: result, error };
    }

    // Update
    async update(table, id, data) {
        const { data: result, error } = await this.supabase
            .from(table)
            .update(data)
            .eq('id', id)
            .select();
        
        return { data: result, error };
    }

    // Delete
    async delete(table, conditions) {
        let query = this.supabase.from(table).delete();

        if (typeof conditions === 'string') {
            // If conditions is a string, treat it as an ID
            query = query.eq('id', conditions);
        } else if (typeof conditions === 'object') {
            // If conditions is an object, apply each condition
            Object.entries(conditions).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }

        const { data, error } = await query;
        return { data, error };
    }

    // Raw query (for complex operations)
    async query(sql, params = []) {
        // Note: Supabase doesn't support raw SQL queries directly
        // This is a placeholder for compatibility
        throw new Error('Raw SQL queries not supported in Supabase client mode');
    }

    // Execute method for MySQL compatibility
    async execute(sql, params = []) {
        // Convert common MySQL queries to Supabase operations
        const sqlLower = sql.toLowerCase().trim();

        if (sqlLower.startsWith('select')) {
            // Handle SELECT queries
            if (sqlLower.includes('count(*)')) {
                // Handle COUNT queries
                const tableMatch = sql.match(/from\s+(\w+)/i);
                if (tableMatch) {
                    const table = tableMatch[1];
                    const { count, error } = await this.supabase
                        .from(table)
                        .select('*', { count: 'exact', head: true });

                    if (error) throw error;
                    return [[{ count: count || 0 }]];
                }
            } else {
                // Handle regular SELECT queries
                const tableMatch = sql.match(/from\s+(\w+)/i);
                if (tableMatch) {
                    const table = tableMatch[1];
                    let query = this.supabase.from(table).select('*');

                    // Handle WHERE conditions with parameters
                    if (params && params.length > 0 && sql.includes('?')) {
                        // This is a simplified parameter replacement
                        // In a real implementation, you'd need proper SQL parsing
                        console.warn('Parameter binding in execute() is simplified. Consider using specific methods.');
                    }

                    const { data, error } = await query;
                    if (error) throw error;
                    return [data || []];
                }
            }
        } else if (sqlLower.startsWith('insert')) {
            // Handle INSERT queries
            const tableMatch = sql.match(/into\s+(\w+)/i);
            if (tableMatch) {
                const table = tableMatch[1];
                // This is a simplified implementation
                // You'd need to parse the INSERT statement properly
                throw new Error('INSERT via execute() not fully implemented. Use insert() method instead.');
            }
        } else if (sqlLower.startsWith('update')) {
            // Handle UPDATE queries
            const tableMatch = sql.match(/update\s+(\w+)/i);
            if (tableMatch) {
                const table = tableMatch[1];
                throw new Error('UPDATE via execute() not fully implemented. Use update() method instead.');
            }
        } else if (sqlLower.startsWith('delete')) {
            // Handle DELETE queries
            const tableMatch = sql.match(/from\s+(\w+)/i);
            if (tableMatch) {
                const table = tableMatch[1];
                throw new Error('DELETE via execute() not fully implemented. Use delete() method instead.');
            }
        }

        throw new Error(`Unsupported SQL query in execute(): ${sql}`);
    }
}

// Test connection function
async function testConnection() {
    try {
        console.log('🧪 Testing Supabase connection...');
        
        // Test basic connection
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (error && error.code === 'PGRST116') {
            console.log('⚠️  Users table does not exist - but connection works');
            return true;
        } else if (error) {
            console.error('❌ Supabase connection error:', error.message);
            return false;
        } else {
            console.log('✅ Supabase connection successful');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        return false;
    }
}

// Create singleton instance
const db = new SupabaseDB();

module.exports = {
    db,
    SupabaseDB,
    testConnection,
    supabase
};
