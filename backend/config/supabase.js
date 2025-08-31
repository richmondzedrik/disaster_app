import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with service role (for backend operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Create Supabase client with anon key (for frontend-like operations)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// PostgreSQL direct connection configuration (for complex queries)
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

export {
    supabaseAdmin,
    supabaseClient,
    pgConfig,
    supabaseUrl,
    supabaseAnonKey
};
