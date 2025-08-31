#!/usr/bin/env node

/**
 * Deployment Script for AlertoAbra with Supabase
 * Handles both frontend (Netlify) and backend (Render) deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 AlertoAbra Deployment Script');
console.log('='.repeat(50));

function runCommand(command, description) {
    console.log(`\n🔧 ${description}...`);
    try {
        const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
        console.log(`✅ ${description} completed`);
        return true;
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        return false;
    }
}

function checkPrerequisites() {
    console.log('\n📋 Checking prerequisites...');
    
    const checks = [
        { name: 'Git', command: 'git --version' },
        { name: 'Node.js', command: 'node --version' },
        { name: 'NPM', command: 'npm --version' }
    ];
    
    let allGood = true;
    
    checks.forEach(check => {
        try {
            const version = execSync(check.command, { encoding: 'utf8' }).trim();
            console.log(`✅ ${check.name}: ${version}`);
        } catch (error) {
            console.log(`❌ ${check.name}: Not found`);
            allGood = false;
        }
    });
    
    return allGood;
}

function buildFrontend() {
    console.log('\n🎨 Building Frontend...');
    
    if (!fs.existsSync('frontend/package.json')) {
        console.error('❌ Frontend package.json not found');
        return false;
    }
    
    const commands = [
        'cd frontend && npm install',
        'cd frontend && npm run build'
    ];
    
    for (const command of commands) {
        if (!runCommand(command, `Running: ${command}`)) {
            return false;
        }
    }
    
    // Check if build was successful
    if (fs.existsSync('frontend/dist')) {
        console.log('✅ Frontend build successful - dist folder created');
        return true;
    } else {
        console.error('❌ Frontend build failed - no dist folder found');
        return false;
    }
}

function prepareBackend() {
    console.log('\n🔧 Preparing Backend...');
    
    if (!fs.existsSync('backend/package.json')) {
        console.error('❌ Backend package.json not found');
        return false;
    }
    
    // Check if all required files exist
    const requiredFiles = [
        'backend/server.js',
        'backend/db/supabase-connection-cjs.js',
        'backend/controllers/authController.js'
    ];
    
    let allFilesExist = true;
    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} exists`);
        } else {
            console.log(`❌ ${file} missing`);
            allFilesExist = false;
        }
    });
    
    return allFilesExist;
}

function commitAndPush() {
    console.log('\n📤 Committing and pushing changes...');
    
    const commands = [
        'git add .',
        'git commit -m "Deploy: Updated for Supabase migration"',
        'git push origin main'
    ];
    
    for (const command of commands) {
        if (!runCommand(command, `Git: ${command}`)) {
            if (command.includes('commit')) {
                console.log('ℹ️  No changes to commit (this is okay)');
                continue;
            }
            return false;
        }
    }
    
    return true;
}

function displayDeploymentInfo() {
    console.log('\n🎯 Deployment Information');
    console.log('='.repeat(30));
    
    console.log('\n📱 Frontend (Netlify):');
    console.log('   • Site: https://disasterapp.netlify.app');
    console.log('   • Auto-deploys from main branch');
    console.log('   • Build command: npm run build');
    console.log('   • Publish directory: dist');
    
    console.log('\n🔧 Backend (Render):');
    console.log('   • Service: disaster-app-backend');
    console.log('   • Auto-deploys from main branch');
    console.log('   • Root directory: backend');
    console.log('   • Start command: node server.js');
    
    console.log('\n🔑 Environment Variables to Set in Render:');
    console.log('   • SUPABASE_SERVICE_KEY (from Supabase dashboard)');
    console.log('   • JWT_SECRET (your JWT secret)');
    console.log('   • JWT_REFRESH_SECRET (your refresh secret)');
    console.log('   • DB_PASSWORD (Supabase database password)');
    console.log('   • SMTP_USER, SMTP_PASS, SMTP_FROM (email settings)');
    console.log('   • CLOUDINARY_* (if using Cloudinary)');
    console.log('   • ADMIN_CREATION_KEY (admin creation key)');
}

async function main() {
    console.log('🎯 Starting deployment preparation...\n');
    
    // Check prerequisites
    if (!checkPrerequisites()) {
        console.error('❌ Prerequisites check failed');
        process.exit(1);
    }
    
    // Build frontend
    if (!buildFrontend()) {
        console.error('❌ Frontend build failed');
        process.exit(1);
    }
    
    // Prepare backend
    if (!prepareBackend()) {
        console.error('❌ Backend preparation failed');
        process.exit(1);
    }
    
    // Commit and push
    if (!commitAndPush()) {
        console.error('❌ Git operations failed');
        process.exit(1);
    }
    
    console.log('\n🎉 Deployment preparation completed successfully!');
    
    displayDeploymentInfo();
    
    console.log('\n📝 Next Steps:');
    console.log('1. Go to Render dashboard and set environment variables');
    console.log('2. Netlify will auto-deploy your frontend');
    console.log('3. Render will auto-deploy your backend');
    console.log('4. Test your deployed application');
    
    console.log('\n🔗 Useful Links:');
    console.log('• Render Dashboard: https://dashboard.render.com');
    console.log('• Netlify Dashboard: https://app.netlify.com');
    console.log('• Supabase Dashboard: https://supabase.com/dashboard');
}

if (import.meta.url === `file://${__filename}`) {
    main().catch(console.error);
}

export { main };
