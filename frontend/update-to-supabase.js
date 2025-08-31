#!/usr/bin/env node

/**
 * Frontend Migration Helper - Update to use Supabase
 * This script helps update your frontend to work with Supabase backend
 */

const fs = require('fs');
const path = require('path');

function updateEnvFile() {
    console.log('🔧 Updating frontend .env file...');
    
    const envPath = path.join(__dirname, '.env');
    const envLocalPath = path.join(__dirname, '.env.local');
    
    // Check if .env or .env.local exists
    const targetEnvFile = fs.existsSync(envLocalPath) ? envLocalPath : envPath;
    
    let envContent = '';
    if (fs.existsSync(targetEnvFile)) {
        envContent = fs.readFileSync(targetEnvFile, 'utf8');
    }
    
    // Add Supabase environment variables if not present
    const supabaseVars = `
# Supabase Configuration
VITE_SUPABASE_URL=https://taqoegurvxaqzoejpmrp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcW9lZ3VydnhhcXpvZWpwbXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTc2NTcsImV4cCI6MjA3MDE5MzY1N30.AOtaN86DsqQq1vy9Uw4sqtwXRfByr5NSsDfWryrmMSk

# API Configuration (if still using backend API)
VITE_API_URL=https://disaster-app-backend.onrender.com
`;
    
    if (!envContent.includes('VITE_SUPABASE_URL')) {
        envContent += supabaseVars;
        fs.writeFileSync(targetEnvFile, envContent);
        console.log(`✅ Updated: ${path.basename(targetEnvFile)}`);
    } else {
        console.log('✅ Supabase variables already present in .env');
    }
}

function checkSupabaseClient() {
    console.log('🔍 Checking Supabase client setup...');
    
    const supabaseLibPath = path.join(__dirname, 'src', 'lib', 'supabase.js');
    
    if (fs.existsSync(supabaseLibPath)) {
        console.log('✅ Supabase client already exists');
        
        // Read and validate the client
        const content = fs.readFileSync(supabaseLibPath, 'utf8');
        if (content.includes('createClient') && content.includes('VITE_SUPABASE_URL')) {
            console.log('✅ Supabase client is properly configured');
        } else {
            console.log('⚠️  Supabase client may need updates');
        }
    } else {
        console.log('❌ Supabase client not found');
        console.log('📝 You may need to create src/lib/supabase.js');
    }
}

function findApiCalls() {
    console.log('🔍 Scanning for API calls that need updating...');
    
    const srcDir = path.join(__dirname, 'src');
    if (!fs.existsSync(srcDir)) {
        console.log('❌ src directory not found');
        return;
    }
    
    const filesToCheck = [];
    
    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                scanDirectory(filePath);
            } else if (file.endsWith('.js') || file.endsWith('.vue') || file.endsWith('.ts')) {
                filesToCheck.push(filePath);
            }
        });
    }
    
    scanDirectory(srcDir);
    
    const apiCallPatterns = [
        /axios\./g,
        /fetch\(/g,
        /\/api\//g,
        /\.get\(/g,
        /\.post\(/g,
        /\.put\(/g,
        /\.delete\(/g
    ];
    
    const filesWithApiCalls = [];
    
    filesToCheck.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasApiCalls = apiCallPatterns.some(pattern => pattern.test(content));
        
        if (hasApiCalls) {
            filesWithApiCalls.push(path.relative(__dirname, filePath));
        }
    });
    
    if (filesWithApiCalls.length > 0) {
        console.log('📝 Files with API calls that may need updating:');
        filesWithApiCalls.forEach(file => {
            console.log(`   • ${file}`);
        });
    } else {
        console.log('✅ No obvious API calls found');
    }
}

function createMigrationGuide() {
    console.log('📝 Creating frontend migration guide...');
    
    const guide = `# Frontend Migration Guide - Supabase

## Overview
This guide helps you update your frontend to work with the new Supabase backend.

## Changes Made
✅ Environment variables updated
✅ Supabase client checked

## Manual Updates Needed

### 1. Replace API Calls
Replace axios/fetch calls with Supabase client calls:

**Before (Axios):**
\`\`\`javascript
import axios from 'axios';
const response = await axios.get('/api/users');
\`\`\`

**After (Supabase):**
\`\`\`javascript
import { db } from '@/lib/supabase';
const { data: users } = await db.select('users');
\`\`\`

### 2. Update Authentication
Replace custom auth with Supabase auth:

**Before:**
\`\`\`javascript
const response = await axios.post('/api/auth/login', { email, password });
\`\`\`

**After:**
\`\`\`javascript
import { supabase } from '@/lib/supabase';
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
\`\`\`

### 3. Real-time Features
Add real-time subscriptions:

\`\`\`javascript
// Subscribe to alerts
const subscription = supabase
  .channel('alerts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, 
    (payload) => {
      console.log('Alert updated:', payload);
    }
  )
  .subscribe();
\`\`\`

## Testing Checklist
- [ ] User registration works
- [ ] User login works
- [ ] Data loading works
- [ ] CRUD operations work
- [ ] Real-time updates work (if implemented)

## Rollback
If you need to rollback, restore the original .env file and revert API calls.
`;

    fs.writeFileSync(path.join(__dirname, 'FRONTEND_MIGRATION_GUIDE.md'), guide);
    console.log('✅ Created FRONTEND_MIGRATION_GUIDE.md');
}

function main() {
    console.log('🎨 Frontend Migration to Supabase');
    console.log('='.repeat(40));
    
    console.log('\n📋 Migration Steps:');
    console.log('1. Update environment variables');
    console.log('2. Check Supabase client setup');
    console.log('3. Scan for API calls');
    console.log('4. Create migration guide');
    
    console.log('\n🔧 Starting frontend analysis...\n');
    
    try {
        updateEnvFile();
        checkSupabaseClient();
        findApiCalls();
        createMigrationGuide();
        
        console.log('\n🎉 Frontend analysis completed!');
        console.log('\n📝 Next steps:');
        console.log('1. Review FRONTEND_MIGRATION_GUIDE.md');
        console.log('2. Update API calls to use Supabase');
        console.log('3. Test all frontend functionality');
        console.log('4. Consider adding real-time features');
        
    } catch (error) {
        console.error('❌ Frontend analysis failed:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
