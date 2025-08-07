# PowerShell script to update Netlify domain from disasterapp to alertoabra

Write-Host "Updating Netlify domain configuration..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if Netlify CLI is installed
$netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue
if (-not $netlifyInstalled) {
    Write-Host "Netlify CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g netlify-cli
}

Write-Host ""
Write-Host "STEP 1: Manual Netlify Dashboard Changes" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Please complete these steps in the Netlify dashboard:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to: https://app.netlify.com/" -ForegroundColor Yellow
Write-Host "2. Select your site (currently: disasterapp.netlify.app)" -ForegroundColor Yellow
Write-Host "3. Go to: Site Settings > General > Site Details" -ForegroundColor Yellow
Write-Host "4. Change site name from 'disasterapp' to 'alertoabra'" -ForegroundColor Yellow
Write-Host "5. Save changes" -ForegroundColor Yellow
Write-Host ""
Write-Host "Your new URL will be: https://alertoabra.netlify.app" -ForegroundColor Green
Write-Host ""

$confirmation = Read-Host "Have you completed the Netlify dashboard changes? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Please complete the dashboard changes first, then run this script again." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "STEP 2: Update Local Configuration" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "frontend")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit
}

# Update environment files if they exist
Write-Host "Updating environment files..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "Updating .env file..." -ForegroundColor White
    $envContent = Get-Content ".env" -Raw
    $envContent = $envContent -replace "https://disasterapp\.netlify\.app", "https://alertoabra.netlify.app"
    $envContent = $envContent -replace "disasterapp\.netlify\.app", "alertoabra.netlify.app"
    Set-Content ".env" $envContent
    Write-Host "  - Updated .env" -ForegroundColor Green
}

if (Test-Path "frontend/.env") {
    Write-Host "Updating frontend/.env file..." -ForegroundColor White
    $frontendEnvContent = Get-Content "frontend/.env" -Raw
    $frontendEnvContent = $frontendEnvContent -replace "https://disasterapp\.netlify\.app", "https://alertoabra.netlify.app"
    $frontendEnvContent = $frontendEnvContent -replace "disasterapp\.netlify\.app", "alertoabra.netlify.app"
    Set-Content "frontend/.env" $frontendEnvContent
    Write-Host "  - Updated frontend/.env" -ForegroundColor Green
}

Write-Host ""
Write-Host "STEP 3: Update Backend CORS Configuration" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host "You need to update your backend CORS settings to allow the new domain:" -ForegroundColor White
Write-Host ""
Write-Host "Backend Environment Variables to Update:" -ForegroundColor Yellow
Write-Host "  FRONTEND_URL=https://alertoabra.netlify.app" -ForegroundColor White
Write-Host "  CORS_ORIGIN=https://alertoabra.netlify.app" -ForegroundColor White
Write-Host ""
Write-Host "Update these in:" -ForegroundColor Yellow
Write-Host "  - Render dashboard (if using Render)" -ForegroundColor White
Write-Host "  - Your hosting platform's environment variables" -ForegroundColor White
Write-Host "  - Local backend .env file" -ForegroundColor White

Write-Host ""
Write-Host "STEP 4: Test the Changes" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

Write-Host "Testing Netlify connection..." -ForegroundColor Yellow
try {
    netlify status
    Write-Host "Netlify CLI connected successfully" -ForegroundColor Green
} catch {
    Write-Host "Netlify CLI connection failed. You may need to login:" -ForegroundColor Red
    Write-Host "  Run: netlify login" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "STEP 5: Deploy and Verify" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$deployConfirm = Read-Host "Deploy to the new domain now? (y/N)"
if ($deployConfirm -eq 'y' -or $deployConfirm -eq 'Y') {
    Write-Host "Building and deploying..." -ForegroundColor Yellow
    
    Set-Location "frontend"
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        netlify deploy --prod --dir=dist
        Write-Host ""
        Write-Host "Deployment complete!" -ForegroundColor Green
        Write-Host "Your site should now be available at: https://alertoabra.netlify.app" -ForegroundColor Green
    } else {
        Write-Host "Build failed. Please check for errors." -ForegroundColor Red
    }
    
    Set-Location ".."
}

Write-Host ""
Write-Host "SUMMARY OF CHANGES" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host "Code changes completed:" -ForegroundColor White
Write-Host "  - Updated environment templates" -ForegroundColor Green
Write-Host "  - Updated local .env files (if they exist)" -ForegroundColor Green
Write-Host ""
Write-Host "Manual steps completed:" -ForegroundColor White
Write-Host "  - Netlify site name changed to 'alertoabra'" -ForegroundColor Green
Write-Host "  - New URL: https://alertoabra.netlify.app" -ForegroundColor Green
Write-Host ""
Write-Host "Still needed:" -ForegroundColor Yellow
Write-Host "  - Update backend CORS settings" -ForegroundColor Yellow
Write-Host "  - Update backend FRONTEND_URL environment variable" -ForegroundColor Yellow
Write-Host "  - Test the application end-to-end" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update backend environment variables" -ForegroundColor White
Write-Host "  2. Test: https://alertoabra.netlify.app" -ForegroundColor White
Write-Host "  3. Verify API calls work correctly" -ForegroundColor White
Write-Host "  4. Update any external links or bookmarks" -ForegroundColor White
