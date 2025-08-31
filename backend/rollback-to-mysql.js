const fs = require('fs');
const path = require('path');

console.log('🔄 Rolling back to MySQL...');

function rollbackFile(filePath) {
    const backupPath = filePath + '.mysql-backup';
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, filePath);
        console.log(`✅ Restored: ${path.basename(filePath)}`);
        return true;
    }
    return false;
}

// Rollback files
rollbackFile(path.join(__dirname, 'server.js'));
rollbackFile(path.join(__dirname, 'controllers', 'authController.js'));
rollbackFile(path.join(__dirname, 'routes', 'auth.js'));
rollbackFile(path.join(__dirname, 'routes', 'users.js'));
rollbackFile(path.join(__dirname, 'routes', 'alerts.js'));

console.log('✅ Rollback completed - now using MySQL');
console.log('🔄 Restart your server to apply changes');
