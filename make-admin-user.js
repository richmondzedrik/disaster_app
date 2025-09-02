import { db } from './backend/db/supabase-connection-cjs.js';

async function makeUserAdmin(email) {
    try {
        console.log(`🔍 Looking for user with email: ${email}`);
        
        // Find user by email
        const userResult = await db.select('users', {
            select: 'id, email, username, role',
            where: { email: email },
            limit: 1
        });
        
        if (userResult.error) {
            throw new Error(`Database error: ${userResult.error.message}`);
        }
        
        if (!userResult.data || userResult.data.length === 0) {
            console.log('❌ User not found with that email');
            console.log('📋 Available users:');
            
            // Show available users
            const allUsers = await db.select('users', {
                select: 'id, email, username, role',
                limit: 10
            });
            
            if (allUsers.data) {
                allUsers.data.forEach((user, index) => {
                    console.log(`${index + 1}. ${user.email} (${user.username}) - ${user.role}`);
                });
            }
            
            return false;
        }
        
        const user = userResult.data[0];
        console.log('✅ Found user:', user);
        
        if (user.role === 'admin') {
            console.log('✅ User is already an admin');
            return true;
        }
        
        // Update user role to admin
        const updateResult = await db.update('users', user.id, {
            role: 'admin',
            updated_at: new Date().toISOString()
        });
        
        if (updateResult.error) {
            throw new Error(`Failed to update user: ${updateResult.error.message}`);
        }
        
        console.log('✅ Successfully updated user to admin');
        console.log('👤 User details:', {
            id: user.id,
            email: user.email,
            username: user.username,
            role: 'admin'
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Error making user admin:', error);
        return false;
    }
}

async function listAdminUsers() {
    try {
        console.log('👥 Current admin users:');
        
        const adminUsers = await db.select('users', {
            select: 'id, email, username, role, created_at',
            where: { role: 'admin' }
        });
        
        if (adminUsers.error) {
            throw new Error(`Database error: ${adminUsers.error.message}`);
        }
        
        if (adminUsers.data && adminUsers.data.length > 0) {
            adminUsers.data.forEach((user, index) => {
                console.log(`${index + 1}. ${user.email} (${user.username}) - Created: ${user.created_at}`);
            });
        } else {
            console.log('📭 No admin users found');
        }
        
        return adminUsers.data || [];
        
    } catch (error) {
        console.error('❌ Error listing admin users:', error);
        return [];
    }
}

async function main() {
    try {
        console.log('🚀 Starting admin user management...\n');
        
        const targetEmail = 'richmondzedrik@gmail.com';
        
        // List current admin users
        await listAdminUsers();
        console.log('');
        
        // Make the specified user admin
        const success = await makeUserAdmin(targetEmail);
        
        if (success) {
            console.log('\n✅ Admin user management completed successfully');
            console.log('🔑 User can now access admin panel');
        } else {
            console.log('\n❌ Failed to make user admin');
        }
        
        // List admin users again to confirm
        console.log('\n📋 Updated admin users:');
        await listAdminUsers();
        
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

// Run if called directly
main().catch(console.error);

export { makeUserAdmin, listAdminUsers };
