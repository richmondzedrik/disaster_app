import { db } from './backend/db/supabase-connection-cjs.js';
import bcrypt from 'bcryptjs';

async function createAdminUser(email, username, password) {
    try {
        console.log(`🔍 Creating admin user: ${email}`);
        
        // Check if user already exists
        const existingUser = await db.select('users', {
            select: 'id, email, username, role',
            where: { email: email },
            limit: 1
        });
        
        if (existingUser.data && existingUser.data.length > 0) {
            console.log('✅ User already exists, updating to admin...');
            const user = existingUser.data[0];
            
            if (user.role === 'admin') {
                console.log('✅ User is already an admin');
                return user;
            }
            
            // Update existing user to admin
            const updateResult = await db.update('users', user.id, {
                role: 'admin',
                updated_at: new Date().toISOString()
            });
            
            if (updateResult.error) {
                throw new Error(`Failed to update user: ${updateResult.error.message}`);
            }
            
            console.log('✅ Successfully updated existing user to admin');
            return { ...user, role: 'admin' };
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create new admin user
        const result = await db.insert('users', {
            email: email,
            password: hashedPassword,
            username: username,
            role: 'admin',
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        
        if (result.error) {
            throw new Error(`Failed to create user: ${result.error.message}`);
        }
        
        console.log('✅ Admin user created successfully');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('👤 Username:', username);
        console.log('🛡️ Role: admin');
        
        return result.data[0];
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        throw error;
    }
}

async function main() {
    try {
        console.log('🚀 Starting admin user creation...\n');
        
        const adminData = {
            email: 'richmondzedrik@gmail.com',
            username: 'richmondzedrik',
            password: 'AdminPassword123!' // You can change this
        };
        
        const adminUser = await createAdminUser(
            adminData.email,
            adminData.username,
            adminData.password
        );
        
        console.log('\n✅ Admin user setup completed');
        console.log('🔐 Login credentials:');
        console.log(`📧 Email: ${adminData.email}`);
        console.log(`🔑 Password: ${adminData.password}`);
        console.log('🌐 You can now access the admin panel');
        
        // List all admin users
        console.log('\n👥 All admin users:');
        const adminUsers = await db.select('users', {
            select: 'id, email, username, role, created_at',
            where: { role: 'admin' }
        });
        
        if (adminUsers.data) {
            adminUsers.data.forEach((user, index) => {
                console.log(`${index + 1}. ${user.email} (${user.username}) - Created: ${user.created_at}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

// Run if called directly
main().catch(console.error);

export { createAdminUser };
