#!/usr/bin/env node

/**
 * Backend Migration Script - Switch from MySQL to Supabase
 * This script updates your backend files to use Supabase instead of MySQL
 */

const fs = require('fs');
const path = require('path');

function backupFile(filePath) {
    const backupPath = filePath + '.mysql-backup';
    if (fs.existsSync(filePath) && !fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
        console.log(`📋 Backed up: ${path.basename(filePath)}`);
    }
}

function updateServerFile() {
    console.log('🔧 Updating server.js...');
    
    const serverPath = path.join(__dirname, 'server.js');
    const supabaseServerPath = path.join(__dirname, 'server-supabase.js');
    
    if (fs.existsSync(supabaseServerPath)) {
        // Backup original server.js
        backupFile(serverPath);
        
        // Replace server.js with Supabase version
        fs.copyFileSync(supabaseServerPath, serverPath);
        console.log('✅ server.js updated to use Supabase');
    } else {
        console.log('❌ server-supabase.js not found');
    }
}

function updateAuthController() {
    console.log('🔧 Updating authController.js...');
    
    const authPath = path.join(__dirname, 'controllers', 'authController.js');
    const supabaseAuthPath = path.join(__dirname, 'controllers', 'authController-supabase.js');
    
    if (fs.existsSync(supabaseAuthPath)) {
        // Backup original authController.js
        backupFile(authPath);
        
        // Replace authController.js with Supabase version
        fs.copyFileSync(supabaseAuthPath, authPath);
        console.log('✅ authController.js updated to use Supabase');
    } else {
        console.log('❌ authController-supabase.js not found');
    }
}

function updateRouteFiles() {
    console.log('🔧 Updating route files...');
    
    const routesDir = path.join(__dirname, 'routes');
    const routeFiles = ['auth.js', 'users.js', 'alerts.js', 'checklist.js'];
    
    routeFiles.forEach(file => {
        const filePath = path.join(routesDir, file);
        if (fs.existsSync(filePath)) {
            backupFile(filePath);
            
            // Read file content
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Replace MySQL imports with Supabase
            content = content.replace(
                "const db = require('../db/connection');",
                "const { db } = require('../db/supabase-connection');"
            );
            
            // Write updated content
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated: ${file}`);
        }
    });
}

function updatePackageJson() {
    console.log('🔧 Updating package.json...');
    
    const packagePath = path.join(__dirname, 'package.json');
    
    if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Add Supabase scripts
        if (!packageJson.scripts) packageJson.scripts = {};
        packageJson.scripts['start:supabase'] = 'node server.js';
        packageJson.scripts['dev:supabase'] = 'nodemon server.js';
        packageJson.scripts['start:mysql'] = 'node server.js.mysql-backup';
        
        // Update main start script to use Supabase
        packageJson.scripts['start'] = 'node server.js';
        
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
        console.log('✅ package.json updated with Supabase scripts');
    }
}

function createRollbackScript() {
    console.log('🔄 Creating rollback script...');
    
    const rollbackScript = `#!/usr/bin/env node

/**
 * Rollback Script - Switch back to MySQL
 */

const fs = require('fs');
const path = require('path');

function rollbackFile(filePath) {
    const backupPath = filePath + '.mysql-backup';
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, filePath);
        console.log(\`✅ Restored: \${path.basename(filePath)}\`);
    }
}

console.log('🔄 Rolling back to MySQL...');

// Rollback server.js
rollbackFile(path.join(__dirname, 'server.js'));

// Rollback authController.js
rollbackFile(path.join(__dirname, 'controllers', 'authController.js'));

// Rollback route files
const routeFiles = ['auth.js', 'users.js', 'alerts.js', 'checklist.js'];
routeFiles.forEach(file => {
    rollbackFile(path.join(__dirname, 'routes', file));
});

console.log('✅ Rollback completed - now using MySQL');
console.log('🔄 Restart your server to apply changes');
`;

    fs.writeFileSync(path.join(__dirname, 'rollback-to-mysql.js'), rollbackScript);
    console.log('✅ Created rollback-to-mysql.js');
}

function main() {
    console.log('🚀 Backend Migration to Supabase');
    console.log('='.repeat(40));
    
    console.log('\n📋 Migration Steps:');
    console.log('1. Backup original files');
    console.log('2. Update server.js');
    console.log('3. Update authController.js');
    console.log('4. Update route files');
    console.log('5. Update package.json');
    console.log('6. Create rollback script');
    
    console.log('\n🔧 Starting migration...\n');
    
    try {
        updateServerFile();
        updateAuthController();
        updateRouteFiles();
        updatePackageJson();
        createRollbackScript();
        
        console.log('\n🎉 Backend migration completed!');
        console.log('\n📝 Next steps:');
        console.log('1. Make sure your Supabase schema is created');
        console.log('2. Test the backend: npm start');
        console.log('3. Check all endpoints work correctly');
        console.log('4. If issues occur, run: node rollback-to-mysql.js');
        
        console.log('\n⚠️  Important Notes:');
        console.log('• Original files are backed up with .mysql-backup extension');
        console.log('• You can rollback anytime using rollback-to-mysql.js');
        console.log('• Test thoroughly before deploying to production');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.log('🔄 You may need to manually restore backup files');
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };`;

    fs.writeFileSync(path.join(__dirname, 'rollback-to-mysql.js'), rollbackScript);
    console.log('✅ Created rollback-to-mysql.js');
}

if (require.main === module) {
    main();
}
