require('dotenv').config();
const db = require('../db/connection');

async function deleteUser(email) {
    try {
        const [result] = await db.execute(
            'DELETE FROM users WHERE email = ?',
            [email]
        );
        
        if (result.affectedRows > 0) {
            console.log(`User with email ${email} deleted successfully`);
        } else {
            console.log(`No user found with email ${email}`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error deleting user:', error);
        process.exit(1);
    }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
    console.error('Please provide an email address');
    process.exit(1);
}

deleteUser(email); 