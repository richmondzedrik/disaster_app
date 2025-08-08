# PowerShell script to migrate from MySQL to Supabase

Write-Host "🚀 Supabase Migration Script" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

Write-Host ""
Write-Host "This script will help you migrate from MySQL to Supabase PostgreSQL" -ForegroundColor Cyan
Write-Host ""

# Check if required files exist
$requiredFiles = @(
    "supabase-migration/schema.sql",
    "supabase-migration/create-schema.js",
    "supabase-migration/migrate-data.js"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Required file missing: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ All required migration files found" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 1: Supabase Project Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Before proceeding, make sure you have:" -ForegroundColor Yellow
Write-Host "1. Created a Supabase project at https://supabase.com/" -ForegroundColor White
Write-Host "2. Noted down your project credentials" -ForegroundColor White
Write-Host "3. Updated your .env files with Supabase credentials" -ForegroundColor White
Write-Host ""

$setupConfirm = Read-Host "Have you completed the Supabase project setup? (y/N)"
if ($setupConfirm -ne 'y' -and $setupConfirm -ne 'Y') {
    Write-Host ""
    Write-Host "Please complete the setup first:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://supabase.com/" -ForegroundColor White
    Write-Host "2. Create a new project" -ForegroundColor White
    Write-Host "3. Get your credentials from Settings > Database and Settings > API" -ForegroundColor White
    Write-Host "4. Update your .env files" -ForegroundColor White
    Write-Host ""
    Write-Host "See supabase-migration/setup-supabase.md for detailed instructions" -ForegroundColor Cyan
    exit 0
}

Write-Host ""
Write-Host "STEP 2: Install Dependencies" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

$installDeps = Read-Host "Install Supabase dependencies? (y/N)"
if ($installDeps -eq 'y' -or $installDeps -eq 'Y') {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location "backend"
    npm install @supabase/supabase-js pg
    Set-Location ".."
    
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location "frontend"
    npm install @supabase/supabase-js
    Set-Location ".."
    
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "STEP 3: Environment Variables" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Check if .env files exist
if (-not (Test-Path "backend/.env")) {
    Write-Host "Creating backend/.env from template..." -ForegroundColor Yellow
    Copy-Item "backend/.env.example" "backend/.env"
}

if (-not (Test-Path "frontend/.env")) {
    Write-Host "Creating frontend/.env from template..." -ForegroundColor Yellow
    Copy-Item "frontend/.env.example" "frontend/.env"
}

Write-Host "Please update these files with your Supabase credentials:" -ForegroundColor Yellow
Write-Host "📝 backend/.env - Add Supabase database and API credentials" -ForegroundColor White
Write-Host "📝 frontend/.env - Add Supabase URL and anon key" -ForegroundColor White
Write-Host ""

$envConfirm = Read-Host "Have you updated the environment files? (y/N)"
if ($envConfirm -ne 'y' -and $envConfirm -ne 'Y') {
    Write-Host "Please update the environment files first" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "STEP 4: Create Database Schema" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

$createSchema = Read-Host "Create Supabase database schema? (y/N)"
if ($createSchema -eq 'y' -or $createSchema -eq 'Y') {
    Write-Host "Creating database schema..." -ForegroundColor Yellow
    
    node supabase-migration/create-schema.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Schema created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Schema creation failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "STEP 5: Data Migration" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

$migrateData = Read-Host "Migrate existing data from MySQL? (y/N)"
if ($migrateData -eq 'y' -or $migrateData -eq 'Y') {
    Write-Host "⚠️  WARNING: This will copy data from your MySQL database to Supabase" -ForegroundColor Yellow
    Write-Host "Make sure your MySQL credentials are in the .env file" -ForegroundColor Yellow
    
    $confirmMigration = Read-Host "Continue with data migration? (y/N)"
    if ($confirmMigration -eq 'y' -or $confirmMigration -eq 'Y') {
        Write-Host "Migrating data..." -ForegroundColor Yellow
        
        node supabase-migration/migrate-data.js
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Data migration completed" -ForegroundColor Green
        } else {
            Write-Host "❌ Data migration failed" -ForegroundColor Red
            Write-Host "You can continue without data migration and add data manually" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "STEP 6: Update Application Code" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

Write-Host "The following files have been created/updated:" -ForegroundColor Yellow
Write-Host "✅ backend/config/supabase.js - Supabase configuration" -ForegroundColor Green
Write-Host "✅ backend/db/supabase-connection.js - Database connection adapter" -ForegroundColor Green
Write-Host "✅ frontend/src/lib/supabase.js - Frontend Supabase client" -ForegroundColor Green
Write-Host "✅ package.json files updated with Supabase dependencies" -ForegroundColor Green
Write-Host ""

Write-Host "Next steps to complete the migration:" -ForegroundColor Cyan
Write-Host "1. Update your route handlers to use Supabase instead of MySQL" -ForegroundColor White
Write-Host "2. Update frontend services to use Supabase client" -ForegroundColor White
Write-Host "3. Test authentication with Supabase Auth" -ForegroundColor White
Write-Host "4. Update CORS settings for new database" -ForegroundColor White

Write-Host ""
Write-Host "STEP 7: Test Connection" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

$testConnection = Read-Host "Test Supabase connection? (y/N)"
if ($testConnection -eq 'y' -or $testConnection -eq 'Y') {
    Write-Host "Testing connection..." -ForegroundColor Yellow
    
    # Create a simple test script
    $testScript = @"
require('dotenv').config();
const { testConnection } = require('./backend/db/supabase-connection');

testConnection()
    .then((success) => {
        if (success) {
            console.log('✅ Supabase connection successful!');
            process.exit(0);
        } else {
            console.log('❌ Supabase connection failed');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('❌ Connection test failed:', error);
        process.exit(1);
    });
"@
    
    Set-Content "test-supabase-connection.js" $testScript
    node test-supabase-connection.js
    Remove-Item "test-supabase-connection.js"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Connection test passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Connection test failed" -ForegroundColor Red
        Write-Host "Please check your environment variables" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "STEP 8: Commit Changes" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

$commitChanges = Read-Host "Commit migration changes to git? (y/N)"
if ($commitChanges -eq 'y' -or $commitChanges -eq 'Y') {
    Write-Host "Committing changes..." -ForegroundColor Yellow
    
    git add .
    git commit -m "Migrate database from MySQL to Supabase PostgreSQL

- Add Supabase configuration and connection adapters
- Create database schema migration scripts
- Update package.json with Supabase dependencies
- Add frontend Supabase client library
- Create data migration scripts"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Changes committed" -ForegroundColor Green
        
        $pushChanges = Read-Host "Push to remote repository? (y/N)"
        if ($pushChanges -eq 'y' -or $pushChanges -eq 'Y') {
            git push
            Write-Host "✅ Changes pushed" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Commit failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 MIGRATION SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host ""
Write-Host "What's been done:" -ForegroundColor Cyan
Write-Host "✅ Supabase configuration files created" -ForegroundColor Green
Write-Host "✅ Database schema migration ready" -ForegroundColor Green
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host "✅ Connection adapters created" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your route handlers to use Supabase" -ForegroundColor White
Write-Host "2. Update frontend services" -ForegroundColor White
Write-Host "3. Test the application thoroughly" -ForegroundColor White
Write-Host "4. Update deployment configurations" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "📖 supabase-migration/setup-supabase.md - Setup guide" -ForegroundColor White
Write-Host "📖 Supabase docs: https://supabase.com/docs" -ForegroundColor White
