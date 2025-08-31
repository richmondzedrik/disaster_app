const fs = require('fs');
const path = require('path');

console.log('🚀 Backend Migration to Supabase');
console.log('='.repeat(40));

function backupFile(filePath) {
    const backupPath = filePath + '.mysql-backup';
    if (fs.existsSync(filePath) && !fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
        console.log(`📋 Backed up: ${path.basename(filePath)}`);
        return true;
    }
    return false;
}

function updateServerFile() {
    console.log('\n🔧 Updating server.js...');
    
    const serverPath = path.join(__dirname, 'server.js');
    const supabaseServerPath = path.join(__dirname, 'server-supabase.js');
    
    if (fs.existsSync(supabaseServerPath)) {
        backupFile(serverPath);
        fs.copyFileSync(supabaseServerPath, serverPath);
        console.log('✅ server.js updated to use Supabase');
        return true;
    } else {
        console.log('❌ server-supabase.js not found');
        return false;
    }
}

function updateAuthController() {
    console.log('\n🔧 Updating authController.js...');
    
    const authPath = path.join(__dirname, 'controllers', 'authController.js');
    const supabaseAuthPath = path.join(__dirname, 'controllers', 'authController-supabase.js');
    
    if (fs.existsSync(supabaseAuthPath)) {
        backupFile(authPath);
        fs.copyFileSync(supabaseAuthPath, authPath);
        console.log('✅ authController.js updated to use Supabase');
        return true;
    } else {
        console.log('❌ authController-supabase.js not found');
        return false;
    }
}

function updateRouteFiles() {
    console.log('\n🔧 Updating route files...');
    
    const routesDir = path.join(__dirname, 'routes');
    const routeFiles = ['auth.js', 'users.js', 'alerts.js'];
    let updated = 0;
    
    routeFiles.forEach(file => {
        const filePath = path.join(routesDir, file);
        if (fs.existsSync(filePath)) {
            backupFile(filePath);
            
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Replace MySQL imports with Supabase
            const originalContent = content;
            content = content.replace(
                /const db = require\('\.\.\/db\/connection'\);/g,
                "const { db } = require('../db/supabase-connection');"
            );
            
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content);
                console.log(`✅ Updated: ${file}`);
                updated++;
            } else {
                console.log(`ℹ️  No changes needed: ${file}`);
            }
        } else {
            console.log(`⚠️  File not found: ${file}`);
        }
    });
    
    return updated;
}

function updatePackageJson() {
    console.log('\n🔧 Updating package.json...');
    
    const packagePath = path.join(__dirname, 'package.json');
    
    if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        if (!packageJson.scripts) packageJson.scripts = {};
        
        // Add Supabase scripts
        packageJson.scripts['start:supabase'] = 'node server.js';
        packageJson.scripts['dev:supabase'] = 'nodemon server.js';
        packageJson.scripts['start:mysql'] = 'node server.js.mysql-backup';
        
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
        console.log('✅ package.json updated with Supabase scripts');
        return true;
    } else {
        console.log('❌ package.json not found');
        return false;
    }
}

function createRollbackScript() {
    console.log('\n🔄 Creating rollback script...');
    
    const rollbackScript = `const fs = require('fs');
const path = require('path');

console.log('🔄 Rolling back to MySQL...');

function rollbackFile(filePath) {
    const backupPath = filePath + '.mysql-backup';
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, filePath);
        console.log(\`✅ Restored: \${path.basename(filePath)}\`);
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
`;

    fs.writeFileSync(path.join(__dirname, 'rollback-to-mysql.js'), rollbackScript);
    console.log('✅ Created rollback-to-mysql.js');
}

function main() {
    console.log('\n📋 Starting backend migration...\n');
    
    try {
        const serverUpdated = updateServerFile();
        const authUpdated = updateAuthController();
        const routesUpdated = updateRouteFiles();
        const packageUpdated = updatePackageJson();
        
        createRollbackScript();
        
        console.log('\n📊 Migration Summary:');
        console.log(`✅ Server file: ${serverUpdated ? 'Updated' : 'Failed'}`);
        console.log(`✅ Auth controller: ${authUpdated ? 'Updated' : 'Failed'}`);
        console.log(`✅ Route files: ${routesUpdated} updated`);
        console.log(`✅ Package.json: ${packageUpdated ? 'Updated' : 'Failed'}`);
        
        if (serverUpdated && authUpdated) {
            console.log('\n🎉 Backend migration completed successfully!');
            console.log('\n📝 Next steps:');
            console.log('1. Test the backend: npm start');
            console.log('2. Check all endpoints work correctly');
            console.log('3. If issues occur, run: node rollback-to-mysql.js');
            
            console.log('\n⚠️  Important Notes:');
            console.log('• Original files are backed up with .mysql-backup extension');
            console.log('• Test thoroughly before deploying to production');
        } else {
            console.log('\n❌ Migration incomplete - some files failed to update');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.log('🔄 You may need to manually restore backup files');
    }
}

main();
