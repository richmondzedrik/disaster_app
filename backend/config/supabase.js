import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to look for .env file in the backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Debug logging for environment variables (remove in production)
console.log('Environment check:');
console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables:');
    console.error('SUPABASE_URL:', supabaseUrl);
    console.error('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '[HIDDEN]' : 'undefined');
    throw new Error('Missing Supabase environment variables. Please check your environment configuration.');
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
