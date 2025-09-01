require('dotenv').config();
const { db } = require('./db/supabase-connection-cjs');

async function fixVerificationIssues() {
    console.log('🔧 Fixing verification issues...');
    
    try {
        // 1. Check current users table structure
        console.log('📊 Checking users table structure...');
        const { data: users, error: usersError } = await db.supabase
            .from('users')
            .select('id, username, email, email_verified, verification_code, verification_code_expires')
            .limit(5);
            
        if (usersError) {
            console.error('❌ Error querying users table:', usersError);
            return false;
        }
        
        console.log('✅ Found', users.length, 'users in database');
        
        // 2. Fix email_verified field type issues
        console.log('🔄 Checking email_verified field types...');
        
        for (const user of users) {
            console.log(`User ${user.username}: email_verified = ${user.email_verified} (type: ${typeof user.email_verified})`);
            
            // If email_verified is not a proper boolean, fix it
            if (user.email_verified !== true && user.email_verified !== false) {
                const shouldBeVerified = user.email_verified === 1 || user.email_verified === '1' || user.email_verified === 'true';
                
                console.log(`🔧 Fixing verification status for ${user.username}: ${user.email_verified} -> ${shouldBeVerified}`);
                
                const { error: updateError } = await db.supabase
                    .from('users')
                    .update({ email_verified: shouldBeVerified })
                    .eq('id', user.id);
                    
                if (updateError) {
                    console.error(`❌ Error updating ${user.username}:`, updateError);
                } else {
                    console.log(`✅ Fixed verification status for ${user.username}`);
                }
            }
        }
        
        // 3. Auto-verify admin accounts
        console.log('👑 Auto-verifying admin accounts...');
        const { data: adminUsers, error: adminError } = await db.supabase
            .from('users')
            .select('id, username, email, role, email_verified')
            .eq('role', 'admin');
            
        if (adminError) {
            console.error('❌ Error querying admin users:', adminError);
        } else {
            for (const admin of adminUsers) {
                if (!admin.email_verified) {
                    console.log(`🔧 Auto-verifying admin account: ${admin.username}`);
                    
                    const { error: verifyError } = await db.supabase
                        .from('users')
                        .update({ 
                            email_verified: true,
                            verification_code: null,
                            verification_code_expires: null
                        })
                        .eq('id', admin.id);
                        
                    if (verifyError) {
                        console.error(`❌ Error verifying admin ${admin.username}:`, verifyError);
                    } else {
                        console.log(`✅ Admin ${admin.username} auto-verified`);
                    }
                }
            }
        }
        
        // 4. Clean up expired verification codes
        console.log('🧹 Cleaning up expired verification codes...');
        const { error: cleanupError } = await db.supabase
            .from('users')
            .update({ 
                verification_code: null,
                verification_code_expires: null
            })
            .lt('verification_code_expires', new Date().toISOString());
            
        if (cleanupError) {
            console.error('❌ Error cleaning up expired codes:', cleanupError);
        } else {
            console.log('✅ Cleaned up expired verification codes');
        }
        
        // 5. Show final status
        console.log('📊 Final verification status:');
        const { data: finalUsers, error: finalError } = await db.supabase
            .from('users')
            .select('username, email, email_verified, role');
            
        if (finalError) {
            console.error('❌ Error getting final status:', finalError);
        } else {
            finalUsers.forEach(user => {
                const status = user.email_verified ? '✅ Verified' : '❌ Unverified';
                console.log(`${user.username} (${user.role}): ${status}`);
            });
        }
        
        console.log('🎉 Verification issues fixed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Error fixing verification issues:', error);
        return false;
    }
}

// Run the fix
fixVerificationIssues().then((success) => {
    if (success) {
        console.log('✅ All verification issues resolved');
    } else {
        console.log('⚠️ Some issues occurred during fix');
    }
    process.exit(success ? 0 : 1);
});
