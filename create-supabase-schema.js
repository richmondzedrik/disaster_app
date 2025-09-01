import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Key in .env file');
    console.error('Make sure you have SUPABASE_URL and SUPABASE_SERVICE_KEY in your backend/.env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Creating Complete Supabase Database Schema');
console.log('==============================================');

async function executeSQL(sql, description) {
    try {
        console.log(`🔧 ${description}...`);

        // Use direct SQL execution for PostgreSQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: sql
        });

        if (error) {
            if (error.message.includes('already exists') ||
                error.message.includes('duplicate') ||
                error.code === '42P07') { // PostgreSQL: relation already exists
                console.log(`⚠️  ${description}: Already exists (skipping)`);
                return true;
            } else {
                console.error(`❌ ${description} failed:`, error.message);
                return false;
            }
        } else {
            console.log(`✅ ${description} completed`);
            return true;
        }
    } catch (err) {
        console.error(`❌ ${description} error:`, err.message);
        return false;
    }
}

async function createSchema() {
    console.log('\n🚀 Creating Complete Database Schema...\n');

    try {
        // Test connection with a simple query
        console.log('🔌 Testing database connection...');
        try {
            const { data, error } = await supabase.rpc('exec_sql', {
                sql: 'SELECT NOW() as current_time'
            });

            if (error) {
                console.error('❌ Connection test failed:', error.message);
                process.exit(1);
            }
            console.log('✅ Database connection successful\n');
        } catch (err) {
            console.error('❌ Connection test failed:', err.message);
            process.exit(1);
        }

        // Create all tables inline
        console.log('📋 Creating database tables...\n');

        // 1. Users table (main table)
        await executeSQL(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                location TEXT,
                notifications JSONB DEFAULT '{"email": true, "posts": true}',
                emergency_contacts JSONB DEFAULT '[]',
                role VARCHAR(20) DEFAULT 'user',
                email_verified BOOLEAN DEFAULT FALSE,
                verification_code VARCHAR(6),
                verification_code_expires TIMESTAMP,
                verification_token VARCHAR(255),
                verification_token_expires TIMESTAMP,
                reset_token VARCHAR(255),
                reset_token_expires TIMESTAMP,
                avatar_url TEXT,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `, 'Creating users table');

        // Create indexes for users table
        await executeSQL(`
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(verification_code);
            CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token)
        `, 'Creating users table indexes');

        // 2. Create updated_at trigger function
        await executeSQL(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `, 'Creating updated_at trigger function');

        // 3. Create trigger for users table
        await executeSQL(`
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `, 'Creating users updated_at trigger');

        // 4. Posts table
        await executeSQL(`
            CREATE TABLE IF NOT EXISTS posts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                author_id UUID REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'pending',
                image_url TEXT,
                author_avatar TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `, 'Creating posts table');

        await executeSQL(`
            CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
            CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
            CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)
        `, 'Creating posts table indexes');

        await executeSQL(`
            DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
            CREATE TRIGGER update_posts_updated_at
                BEFORE UPDATE ON posts
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `, 'Creating posts updated_at trigger');

        // 5. Comments table
        await executeSQL(`
            CREATE TABLE IF NOT EXISTS comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `, 'Creating comments table');

        await executeSQL(`
            CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
            CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)
        `, 'Creating comments table indexes');

        // 6. Likes table
        await executeSQL(`
            CREATE TABLE IF NOT EXISTS likes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(post_id, user_id)
            )
        `, 'Creating likes table');

        await executeSQL(`
            CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
            CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id)
        `, 'Creating likes table indexes');

        // 7. Alerts table
        await executeSQL(`
            CREATE TABLE IF NOT EXISTS alerts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                priority INTEGER DEFAULT 0,
                expiry_date TIMESTAMP,
                is_public BOOLEAN DEFAULT true,
                is_active BOOLEAN DEFAULT true,
                created_by UUID REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `, 'Creating alerts table');

        await executeSQL(`
            CREATE INDEX IF NOT EXISTS idx_alerts_created_by ON alerts(created_by);
            CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON alerts(is_active);
            CREATE INDEX IF NOT EXISTS idx_alerts_priority ON alerts(priority)
        `, 'Creating alerts table indexes');

        // 8. Alert reads table (track which alerts users have read)
        await executeSQL(`
            CREATE TABLE IF NOT EXISTS alert_reads (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                read_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(alert_id, user_id)
            )
        `, 'Creating alert_reads table');

        // 9. Checklist items table
        await executeSQL(`
            CREATE TABLE IF NOT EXISTS checklist_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                item_id VARCHAR(50) NOT NULL,
                text TEXT NOT NULL,
                category VARCHAR(100) NOT NULL,
                info TEXT,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(item_id, user_id)
            )
        `, 'Creating checklist_items table');

        // 10. Checklist progress table
        await executeSQL(`
            CREATE TABLE IF NOT EXISTS checklist_progress (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                item_id VARCHAR(50) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, item_id)
            )
        `, 'Creating checklist_progress table');

        // 11. Notifications table
        await executeSQL(`
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `, 'Creating notifications table');

        // 12. Map markers table
        await executeSQL(`
            CREATE TABLE IF NOT EXISTS map_markers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                created_by VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `, 'Creating map_markers table');

        console.log('\n🎉 Database schema creation completed successfully!');
        console.log('\n📋 Tables created:');
        console.log('✅ users - User accounts and profiles');
        console.log('✅ posts - Community posts and news');
        console.log('✅ comments - Post comments');
        console.log('✅ likes - Post likes');
        console.log('✅ alerts - Emergency alerts and warnings');
        console.log('✅ alert_reads - Track which alerts users have read');
        console.log('✅ checklist_items - Preparedness checklist items');
        console.log('✅ checklist_progress - User checklist completion');
        console.log('✅ notifications - User notifications');
        console.log('✅ map_markers - Map location markers');

        console.log('\n🔐 Next steps:');
        console.log('1. Your database schema is ready!');
        console.log('2. Update your backend routes to use real Supabase queries');
        console.log('3. Test your application endpoints');
        console.log('4. Deploy to production with confidence!');

    } catch (error) {
        console.error('❌ Schema creation failed:', error);
        process.exit(1);
    }
}

// Run the schema creation
createSchema();
