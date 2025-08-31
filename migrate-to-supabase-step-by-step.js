#!/usr/bin/env node

/**
 * Step-by-step migration script from MySQL to Supabase
 * This script helps you migrate your AlertoAbra app to Supabase
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function main() {
    console.log('🚀 AlertoAbra MySQL to Supabase Migration Tool');
    console.log('='.repeat(50));
    
    console.log('\n📋 Migration Checklist:');
    console.log('✅ 1. Supabase project created');
    console.log('✅ 2. Environment variables updated');
    console.log('❓ 3. Database schema created');
    console.log('❓ 4. Backend code updated');
    console.log('❓ 5. Frontend code updated');
    console.log('❓ 6. Testing completed');
    
    const step = await askQuestion('\n🤔 Which step would you like to perform? (3-6): ');
    
    switch(step) {
        case '3':
            await createDatabaseSchema();
            break;
        case '4':
            await updateBackendCode();
            break;
        case '5':
            await updateFrontendCode();
            break;
        case '6':
            await runTests();
            break;
        default:
            console.log('❌ Invalid step. Please choose 3, 4, 5, or 6.');
    }
    
    rl.close();
}

async function createDatabaseSchema() {
    console.log('\n📊 Step 3: Creating Database Schema');
    console.log('-'.repeat(30));
    
    console.log('🔗 Please go to your Supabase dashboard:');
    console.log('   https://supabase.com/dashboard/project/taqoegurvxaqzoejpmrp');
    console.log('\n📝 Steps:');
    console.log('   1. Click on "SQL Editor" in the left sidebar');
    console.log('   2. Click "New Query"');
    console.log('   3. Copy the content from "essential-schema.sql"');
    console.log('   4. Paste it in the SQL editor');
    console.log('   5. Click "Run" to execute');
    
    const completed = await askQuestion('\n✅ Have you created the schema? (y/n): ');
    
    if (completed.toLowerCase() === 'y') {
        console.log('✅ Great! Schema creation completed.');
        console.log('🔄 Next: Run step 4 to update backend code');
    } else {
        console.log('❌ Please complete the schema creation first.');
    }
}

async function updateBackendCode() {
    console.log('\n🔧 Step 4: Updating Backend Code');
    console.log('-'.repeat(30));
    
    console.log('📁 Files to update:');
    console.log('   ✅ server-supabase.js (created)');
    console.log('   ✅ authController-supabase.js (created)');
    console.log('   ❓ Other controllers');
    console.log('   ❓ Route files');
    
    const proceed = await askQuestion('\n🤔 Update remaining controllers? (y/n): ');
    
    if (proceed.toLowerCase() === 'y') {
        await updateControllers();
        await updateRoutes();
        await updatePackageJson();
        
        console.log('\n✅ Backend code updated!');
        console.log('🔄 Next steps:');
        console.log('   1. Test the backend: npm run start:supabase');
        console.log('   2. Run step 5 to update frontend');
    } else {
        console.log('❌ Backend update skipped.');
    }
}

async function updateControllers() {
    console.log('\n🎯 Updating Controllers...');
    
    // List of controllers to update
    const controllers = [
        'alertController.js',
        'userController.js',
        'checklistController.js',
        'commentController.js'
    ];
    
    for (const controller of controllers) {
        const filePath = path.join(__dirname, 'backend', 'controllers', controller);
        if (fs.existsSync(filePath)) {
            console.log(`   📝 Found: ${controller}`);
            // Here you would implement the actual controller updates
            // For now, just log what needs to be done
            console.log(`   ⚠️  Manual update needed: Replace MySQL queries with Supabase calls`);
        }
    }
}

async function updateRoutes() {
    console.log('\n🛣️  Updating Routes...');
    
    const routes = [
        'auth.js',
        'alerts.js',
        'users.js',
        'checklist.js'
    ];
    
    for (const route of routes) {
        const filePath = path.join(__dirname, 'backend', 'routes', route);
        if (fs.existsSync(filePath)) {
            console.log(`   📝 Found: ${route}`);
            console.log(`   ⚠️  Manual update needed: Update database imports`);
        }
    }
}

async function updatePackageJson() {
    console.log('\n📦 Updating package.json...');
    
    const packagePath = path.join(__dirname, 'backend', 'package.json');
    
    if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Add Supabase start script
        if (!packageJson.scripts) packageJson.scripts = {};
        packageJson.scripts['start:supabase'] = 'node server-supabase.js';
        packageJson.scripts['dev:supabase'] = 'nodemon server-supabase.js';
        
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
        console.log('   ✅ Added Supabase scripts to package.json');
    }
}

async function updateFrontendCode() {
    console.log('\n🎨 Step 5: Updating Frontend Code');
    console.log('-'.repeat(30));
    
    console.log('📁 Frontend files to check:');
    console.log('   ✅ src/lib/supabase.js (already exists)');
    console.log('   ❓ API service files');
    console.log('   ❓ Component files');
    
    const frontendPath = path.join(__dirname, 'frontend', 'src');
    
    if (fs.existsSync(frontendPath)) {
        console.log('✅ Frontend directory found');
        console.log('🔄 Manual updates needed:');
        console.log('   1. Update API calls to use Supabase client');
        console.log('   2. Replace axios calls with Supabase methods');
        console.log('   3. Update authentication flow');
    } else {
        console.log('❌ Frontend directory not found');
    }
}

async function runTests() {
    console.log('\n🧪 Step 6: Running Tests');
    console.log('-'.repeat(30));
    
    console.log('🔍 Test checklist:');
    console.log('   □ Database connection');
    console.log('   □ User registration');
    console.log('   □ User login');
    console.log('   □ CRUD operations');
    console.log('   □ Frontend integration');
    
    console.log('\n🚀 To test your migration:');
    console.log('   1. Start backend: npm run start:supabase');
    console.log('   2. Start frontend: npm run dev');
    console.log('   3. Test all major features');
    console.log('   4. Check browser console for errors');
}

// Run the migration tool
main().catch(console.error);
