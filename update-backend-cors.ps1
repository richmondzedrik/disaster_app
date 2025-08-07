# PowerShell script to help update backend CORS configuration

Write-Host "Backend CORS Configuration Update" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

Write-Host ""
Write-Host "STEP 1: Code Updates" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host "✅ Updated backend/app.js CORS configuration" -ForegroundColor Green
Write-Host "✅ Updated backend/routes/admin.js CORS headers" -ForegroundColor Green
Write-Host "✅ Updated backend/routes/markers.js CORS origins" -ForegroundColor Green
Write-Host "✅ Created backend/.env.example template" -ForegroundColor Green

Write-Host ""
Write-Host "STEP 2: Environment Variables Update" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

Write-Host "You need to update these environment variables in your hosting platform:" -ForegroundColor White
Write-Host ""
Write-Host "Required Environment Variables:" -ForegroundColor Yellow
Write-Host "  FRONTEND_URL=https://alertoabra.netlify.app" -ForegroundColor White
Write-Host "  CORS_ORIGIN=https://alertoabra.netlify.app" -ForegroundColor White
Write-Host ""

Write-Host "Platform-specific instructions:" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔧 RENDER (if using Render):" -ForegroundColor Cyan
Write-Host "  1. Go to: https://dashboard.render.com/" -ForegroundColor White
Write-Host "  2. Select your backend service" -ForegroundColor White
Write-Host "  3. Go to: Environment" -ForegroundColor White
Write-Host "  4. Update or add:" -ForegroundColor White
Write-Host "     FRONTEND_URL = https://alertoabra.netlify.app" -ForegroundColor Yellow
Write-Host "     CORS_ORIGIN = https://alertoabra.netlify.app" -ForegroundColor Yellow
Write-Host "  5. Click 'Save Changes'" -ForegroundColor White
Write-Host "  6. Service will automatically redeploy" -ForegroundColor White
Write-Host ""

Write-Host "🔧 HEROKU (if using Heroku):" -ForegroundColor Cyan
Write-Host "  1. Go to: https://dashboard.heroku.com/" -ForegroundColor White
Write-Host "  2. Select your app" -ForegroundColor White
Write-Host "  3. Go to: Settings > Config Vars" -ForegroundColor White
Write-Host "  4. Update or add:" -ForegroundColor White
Write-Host "     FRONTEND_URL = https://alertoabra.netlify.app" -ForegroundColor Yellow
Write-Host "     CORS_ORIGIN = https://alertoabra.netlify.app" -ForegroundColor Yellow
Write-Host "  5. Changes take effect immediately" -ForegroundColor White
Write-Host ""

Write-Host "🔧 RAILWAY (if using Railway):" -ForegroundColor Cyan
Write-Host "  1. Go to: https://railway.app/" -ForegroundColor White
Write-Host "  2. Select your project" -ForegroundColor White
Write-Host "  3. Go to: Variables" -ForegroundColor White
Write-Host "  4. Update or add:" -ForegroundColor White
Write-Host "     FRONTEND_URL = https://alertoabra.netlify.app" -ForegroundColor Yellow
Write-Host "     CORS_ORIGIN = https://alertoabra.netlify.app" -ForegroundColor Yellow
Write-Host "  5. Service will redeploy automatically" -ForegroundColor White
Write-Host ""

Write-Host "🔧 LOCAL DEVELOPMENT:" -ForegroundColor Cyan
Write-Host "  1. Update backend/.env file:" -ForegroundColor White
Write-Host "     FRONTEND_URL=https://alertoabra.netlify.app" -ForegroundColor Yellow
Write-Host "  2. Restart your backend server" -ForegroundColor White
Write-Host ""

Write-Host "STEP 3: Test the Configuration" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

$testConfirm = Read-Host "Have you updated the environment variables? (y/N)"
if ($testConfirm -eq 'y' -or $testConfirm -eq 'Y') {
    Write-Host ""
    Write-Host "Testing CORS configuration..." -ForegroundColor Yellow
    
    Write-Host "1. Open your browser to: https://alertoabra.netlify.app" -ForegroundColor White
    Write-Host "2. Open Developer Tools (F12)" -ForegroundColor White
    Write-Host "3. Go to Console tab" -ForegroundColor White
    Write-Host "4. Try to login or perform an action that calls the API" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Expected Results:" -ForegroundColor Green
    Write-Host "✅ No CORS errors in console" -ForegroundColor Green
    Write-Host "✅ API calls succeed" -ForegroundColor Green
    Write-Host "✅ Login/registration works" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "If you see CORS errors:" -ForegroundColor Red
    Write-Host "❌ 'Access to fetch at ... has been blocked by CORS policy'" -ForegroundColor Red
    Write-Host "   → Double-check environment variables" -ForegroundColor Yellow
    Write-Host "   → Ensure backend service redeployed" -ForegroundColor Yellow
    Write-Host "   → Check backend logs for errors" -ForegroundColor Yellow
    Write-Host ""
    
    $openSite = Read-Host "Open the site for testing? (y/N)"
    if ($openSite -eq 'y' -or $openSite -eq 'Y') {
        Start-Process "https://alertoabra.netlify.app"
    }
} else {
    Write-Host ""
    Write-Host "Please update the environment variables first, then run this script again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "STEP 4: Commit Code Changes" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

$commitConfirm = Read-Host "Commit the CORS code changes? (y/N)"
if ($commitConfirm -eq 'y' -or $commitConfirm -eq 'Y') {
    Write-Host "Committing changes..." -ForegroundColor Yellow
    
    git add .
    git commit -m "Update CORS configuration for alertoabra.netlify.app domain"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Changes committed successfully" -ForegroundColor Green
        
        $pushConfirm = Read-Host "Push to remote repository? (y/N)"
        if ($pushConfirm -eq 'y' -or $pushConfirm -eq 'Y') {
            git push
            Write-Host "✅ Changes pushed to remote" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Commit failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "SUMMARY" -ForegroundColor Green
Write-Host "=======" -ForegroundColor Green
Write-Host "✅ Backend CORS code updated for alertoabra.netlify.app" -ForegroundColor Green
Write-Host "✅ Environment variable templates created" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update environment variables in your hosting platform" -ForegroundColor White
Write-Host "2. Wait for backend service to redeploy" -ForegroundColor White
Write-Host "3. Test the application: https://alertoabra.netlify.app" -ForegroundColor White
Write-Host "4. Verify no CORS errors in browser console" -ForegroundColor White
Write-Host ""
Write-Host "Need help? Check the platform-specific instructions above." -ForegroundColor Yellow
