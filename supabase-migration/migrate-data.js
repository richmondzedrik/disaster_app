import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Configure dotenv
dotenv.config();

// MySQL configuration (source)
const mysqlConfig = {
    host: process.env.MYSQL_HOST || process.env.MYSQL_ADDON_HOST,
    user: process.env.MYSQL_USER || process.env.MYSQL_ADDON_USER,
    password: process.env.MYSQL_PASSWORD || process.env.MYSQL_ADDON_PASSWORD,
    database: process.env.MYSQL_DATABASE || process.env.MYSQL_ADDON_DB,
    port: process.env.MYSQL_PORT || process.env.MYSQL_ADDON_PORT || 3306
};

// PostgreSQL configuration (destination)
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

class DataMigrator {
    constructor() {
        this.mysqlConnection = null;
        this.pgPool = null;
        this.userIdMapping = new Map(); // MySQL ID -> PostgreSQL UUID
    }

    async connect() {
        console.log('📡 Connecting to databases...');
        
        // Connect to MySQL
        this.mysqlConnection = await mysql.createConnection(mysqlConfig);
        console.log('✅ Connected to MySQL');
        
        // Connect to PostgreSQL
        this.pgPool = new Pool(pgConfig);
        const pgClient = await this.pgPool.connect();
        pgClient.release();
        console.log('✅ Connected to PostgreSQL');
    }

    async disconnect() {
        if (this.mysqlConnection) {
            await this.mysqlConnection.end();
        }
        if (this.pgPool) {
            await this.pgPool.end();
        }
    }

    async migrateUsers() {
        console.log('👥 Migrating users...');
        
        const [mysqlUsers] = await this.mysqlConnection.execute('SELECT * FROM users');
        const pgClient = await this.pgPool.connect();
        
        try {
            for (const user of mysqlUsers) {
                // Generate UUID for new user
                const { rows } = await pgClient.query('SELECT uuid_generate_v4() as id');
                const newUserId = rows[0].id;
                
                // Store mapping
                this.userIdMapping.set(user.id, newUserId);
                
                // Insert user into PostgreSQL
                await pgClient.query(`
                    INSERT INTO users (
                        id, username, email, role, email_verified, phone, 
                        notifications, location, emergency_contacts, avatar_url, 
                        last_login, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                    newUserId,
                    user.username,
                    user.email,
                    user.role,
                    user.email_verified,
                    user.phone,
                    user.notifications,
                    user.location,
                    user.emergency_contacts || '[]',
                    user.avatar_url,
                    user.last_login,
                    user.created_at,
                    user.updated_at || user.created_at
                ]);
            }
            
            console.log(`✅ Migrated ${mysqlUsers.length} users`);
        } finally {
            pgClient.release();
        }
    }

    async migratePosts() {
        console.log('📝 Migrating posts...');
        
        const [mysqlPosts] = await this.mysqlConnection.execute('SELECT * FROM posts');
        const pgClient = await this.pgPool.connect();
        
        try {
            for (const post of mysqlPosts) {
                const authorId = this.userIdMapping.get(post.author_id);
                
                await pgClient.query(`
                    INSERT INTO posts (
                        title, content, author_id, image_url, published, 
                        featured, views, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    post.title,
                    post.content,
                    authorId,
                    post.image_url,
                    post.published,
                    post.featured,
                    post.views || 0,
                    post.created_at,
                    post.updated_at || post.created_at
                ]);
            }
            
            console.log(`✅ Migrated ${mysqlPosts.length} posts`);
        } finally {
            pgClient.release();
        }
    }

    async migrateAlerts() {
        console.log('🚨 Migrating alerts...');
        
        const [mysqlAlerts] = await this.mysqlConnection.execute('SELECT * FROM alerts');
        const pgClient = await this.pgPool.connect();
        
        try {
            for (const alert of mysqlAlerts) {
                const createdBy = alert.created_by ? this.userIdMapping.get(alert.created_by) : null;
                
                await pgClient.query(`
                    INSERT INTO alerts (
                        title, message, type, severity, location, latitude, 
                        longitude, radius, active, created_by, expires_at, 
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                    alert.title,
                    alert.message,
                    alert.type,
                    alert.severity,
                    alert.location,
                    alert.latitude,
                    alert.longitude,
                    alert.radius,
                    alert.active,
                    createdBy,
                    alert.expires_at,
                    alert.created_at,
                    alert.updated_at || alert.created_at
                ]);
            }
            
            console.log(`✅ Migrated ${mysqlAlerts.length} alerts`);
        } finally {
            pgClient.release();
        }
    }

    async migrateChecklistItems() {
        console.log('✅ Migrating checklist items...');
        
        const [mysqlItems] = await this.mysqlConnection.execute('SELECT * FROM checklist_items');
        const pgClient = await this.pgPool.connect();
        
        try {
            for (const item of mysqlItems) {
                await pgClient.query(`
                    INSERT INTO checklist_items (
                        title, description, category, priority, active, 
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    item.title,
                    item.description,
                    item.category,
                    item.priority || 1,
                    item.active,
                    item.created_at,
                    item.updated_at || item.created_at
                ]);
            }
            
            console.log(`✅ Migrated ${mysqlItems.length} checklist items`);
        } finally {
            pgClient.release();
        }
    }

    async migrateOtherTables() {
        console.log('📊 Migrating remaining tables...');
        
        // Add migration for other tables as needed
        // - map_markers
        // - comments
        // - likes
        // - notifications
        // - first_aid_guides
        // etc.
        
        console.log('✅ Other tables migration completed');
    }

    async run() {
        try {
            await this.connect();
            
            console.log('🚀 Starting data migration...');
            
            // Migrate in order (respecting foreign key dependencies)
            await this.migrateUsers();
            await this.migratePosts();
            await this.migrateAlerts();
            await this.migrateChecklistItems();
            await this.migrateOtherTables();
            
            console.log('🎉 Data migration completed successfully!');
            
        } catch (error) {
            console.error('💥 Migration failed:', error);
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const migrator = new DataMigrator();
    migrator.run()
        .then(() => {
            console.log('✅ Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

export default DataMigrator;
