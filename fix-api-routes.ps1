# PowerShell script to fix API routing issues

Write-Host "API Route Fix - Resolving Double /api/api/ Issue" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

Write-Host ""
Write-Host "PROBLEM IDENTIFIED:" -ForegroundColor Red
Write-Host "- API route: GET /api/api/admin/alerts" -ForegroundColor Red
Write-Host "- Double /api/ in the path" -ForegroundColor Red
Write-Host ""

Write-Host "FIXES APPLIED:" -ForegroundColor Green
Write-Host "✅ Updated frontend/src/services/api.js - Removed /api from base URL" -ForegroundColor Green
Write-Host "✅ Updated frontend/src/services/adminService.js - Removed /api from base URL" -ForegroundColor Green
Write-Host "✅ Updated frontend/src/services/auth.js - Removed /api from base URL" -ForegroundColor Green
Write-Host "✅ Updated frontend/vite.config.js - Fixed proxy configuration" -ForegroundColor Green
Write-Host "✅ Updated environment templates" -ForegroundColor Green

Write-Host ""
Write-Host "STEP 1: Update Environment Variables" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check if .env file exists
if (Test-Path "frontend/.env") {
    Write-Host "Updating frontend/.env file..." -ForegroundColor Yellow
    $envContent = Get-Content "frontend/.env" -Raw
    $envContent = $envContent -replace "VITE_API_URL=.*", "VITE_API_URL=https://disaster-app-backend.onrender.com"
    Set-Content "frontend/.env" $envContent
    Write-Host "✅ Updated frontend/.env" -ForegroundColor Green
} else {
    Write-Host "Creating frontend/.env file..." -ForegroundColor Yellow
    Set-Content "frontend/.env" "VITE_API_URL=https://disaster-app-backend.onrender.com"
    Write-Host "✅ Created frontend/.env" -ForegroundColor Green
}

Write-Host ""
Write-Host "STEP 2: Test the Fix Locally" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

$testLocal = Read-Host "Test the fix locally first? (y/N)"
if ($testLocal -eq 'y' -or $testLocal -eq 'Y') {
    Write-Host "Starting local development server..." -ForegroundColor Yellow
    
    Set-Location "frontend"
    Start-Process powershell -ArgumentList "-Command", "npm run dev" -WindowStyle Normal
    Set-Location ".."
    
    Write-Host ""
    Write-Host "Local server starting..." -ForegroundColor Green
    Write-Host "1. Wait for server to start (usually 10-15 seconds)" -ForegroundColor White
    Write-Host "2. Open: http://localhost:5173" -ForegroundColor White
    Write-Host "3. Test admin login and alerts" -ForegroundColor White
    Write-Host "4. Check browser console for errors" -ForegroundColor White
    Write-Host ""
    
    $continueLocal = Read-Host "Press Enter when ready to continue with deployment..."
}

Write-Host ""
Write-Host "STEP 3: Build and Deploy" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$deploy = Read-Host "Build and deploy to production? (y/N)"
if ($deploy -eq 'y' -or $deploy -eq 'Y') {
    Write-Host "Building frontend..." -ForegroundColor Yellow
    
    Set-Location "frontend"
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful" -ForegroundColor Green
        
        Write-Host "Deploying to Netlify..." -ForegroundColor Yellow
        netlify deploy --prod --dir=dist
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deployment successful" -ForegroundColor Green
        } else {
            Write-Host "❌ Deployment failed" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Build failed" -ForegroundColor Red
    }
    
    Set-Location ".."
}

Write-Host ""
Write-Host "STEP 4: Test Production" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

Write-Host "Testing instructions:" -ForegroundColor Yellow
Write-Host "1. Open: https://alertoabra.netlify.app" -ForegroundColor White
Write-Host "2. Open Developer Tools (F12)" -ForegroundColor White
Write-Host "3. Go to Console tab" -ForegroundColor White
Write-Host "4. Try admin login" -ForegroundColor White
Write-Host "5. Navigate to admin alerts" -ForegroundColor White
Write-Host ""

Write-Host "Expected Results:" -ForegroundColor Green
Write-Host "✅ No double /api/api/ in network requests" -ForegroundColor Green
Write-Host "✅ API calls show: GET /api/admin/alerts (single /api/)" -ForegroundColor Green
Write-Host "✅ No 404 'API route not found' errors" -ForegroundColor Green
Write-Host "✅ Admin alerts load successfully" -ForegroundColor Green
Write-Host ""

$openSite = Read-Host "Open the site for testing? (y/N)"
if ($openSite -eq 'y' -or $openSite -eq 'Y') {
    Start-Process "https://alertoabra.netlify.app"
}

Write-Host ""
Write-Host "STEP 5: Commit Changes" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

$commit = Read-Host "Commit the API route fixes? (y/N)"
if ($commit -eq 'y' -or $commit -eq 'Y') {
    Write-Host "Committing changes..." -ForegroundColor Yellow
    
    git add .
    git commit -m "Fix API routing: Remove double /api paths, standardize base URLs"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Changes committed" -ForegroundColor Green
        
        $push = Read-Host "Push to remote repository? (y/N)"
        if ($push -eq 'y' -or $push -eq 'Y') {
            git push
            Write-Host "✅ Changes pushed" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Commit failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "SUMMARY OF CHANGES" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host "✅ Fixed double /api/api/ routing issue" -ForegroundColor Green
Write-Host "✅ Standardized all API base URLs" -ForegroundColor Green
Write-Host "✅ Updated Vite proxy configuration" -ForegroundColor Green
Write-Host "✅ Updated environment variables" -ForegroundColor Green
Write-Host ""

Write-Host "API Routes Now Work As:" -ForegroundColor Cyan
Write-Host "- GET /api/admin/alerts (instead of /api/api/admin/alerts)" -ForegroundColor White
Write-Host "- POST /api/admin/alerts" -ForegroundColor White
Write-Host "- GET /api/alerts/active" -ForegroundColor White
Write-Host "- All other API endpoints" -ForegroundColor White
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test the application thoroughly" -ForegroundColor White
Write-Host "2. Verify all API calls work correctly" -ForegroundColor White
Write-Host "3. Check admin functionality" -ForegroundColor White
Write-Host "4. Monitor for any remaining routing issues" -ForegroundColor White
