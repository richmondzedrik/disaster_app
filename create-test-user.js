import { db } from './backend/db/supabase-connection-cjs.js';
import bcrypt from 'bcryptjs';

async function createTestUser() {
    try {
        console.log('🔍 Creating test user...');
        
        const testUser = {
            email: 'test@example.com',
            password: 'TestPassword123!',
            username: 'testuser',
            role: 'user'
        };
        
        // Check if user already exists
        const existingUser = await db.select('users', {
            select: 'id, email, username',
            where: { email: testUser.email },
            limit: 1
        });
        
        if (existingUser.data && existingUser.data.length > 0) {
            console.log('✅ Test user already exists:', existingUser.data[0]);
            return existingUser.data[0];
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(testUser.password, 12);
        
        // Create user
        const result = await db.insert('users', {
            email: testUser.email,
            password: hashedPassword,
            username: testUser.username,
            role: testUser.role,
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        
        if (result.error) {
            throw new Error(`Failed to create user: ${result.error.message}`);
        }
        
        console.log('✅ Test user created successfully');
        console.log('📧 Email:', testUser.email);
        console.log('🔑 Password:', testUser.password);
        console.log('👤 Username:', testUser.username);
        
        return result.data;
        
    } catch (error) {
        console.error('❌ Error creating test user:', error);
        throw error;
    }
}

async function listExistingUsers() {
    try {
        console.log('🔍 Listing existing users...');
        
        const result = await db.select('users', {
            select: 'id, email, username, role, email_verified, created_at',
            limit: 10
        });
        
        if (result.error) {
            throw new Error(`Failed to fetch users: ${result.error.message}`);
        }
        
        if (result.data && result.data.length > 0) {
            console.log('👥 Existing users:');
            result.data.forEach((user, index) => {
                console.log(`${index + 1}. ${user.email} (${user.username}) - ${user.role} - Verified: ${user.email_verified}`);
            });
        } else {
            console.log('📭 No users found in database');
        }
        
        return result.data || [];
        
    } catch (error) {
        console.error('❌ Error listing users:', error);
        return [];
    }
}

async function main() {
    try {
        console.log('🚀 Starting user management script...\n');
        
        // List existing users first
        const existingUsers = await listExistingUsers();
        
        // Create test user if needed
        await createTestUser();
        
        console.log('\n✅ User management completed');
        
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

// Run if called directly
main().catch(console.error);

export { createTestUser, listExistingUsers };
