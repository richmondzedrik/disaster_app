# PowerShell script to clean up sensitive files from git tracking

Write-Host "🧹 Cleaning up sensitive files from git history..." -ForegroundColor Yellow
Write-Host "⚠️  WARNING: This will remove files from git tracking!" -ForegroundColor Red
Write-Host "📋 Files to be removed:" -ForegroundColor Cyan

# List files that should be removed
Write-Host "   - *.sql files (database dumps)" -ForegroundColor White
Write-Host "   - *.sql.gz files (compressed database dumps)" -ForegroundColor White
Write-Host "   - .env files (if any)" -ForegroundColor White
Write-Host "   - Any credential files" -ForegroundColor White

$confirmation = Read-Host "Do you want to continue? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Cleanup cancelled" -ForegroundColor Red
    exit
}

Write-Host "🔍 Scanning for sensitive files..." -ForegroundColor Yellow

# Remove database files from git tracking
$sqlFiles = Get-ChildItem -Name "*.sql" -ErrorAction SilentlyContinue
if ($sqlFiles) {
    Write-Host "📁 Removing .sql files from git..." -ForegroundColor Cyan
    foreach ($file in $sqlFiles) {
        git rm --cached $file
    }
}

$sqlGzFiles = Get-ChildItem -Name "*.sql.gz" -ErrorAction SilentlyContinue
if ($sqlGzFiles) {
    Write-Host "📁 Removing .sql.gz files from git..." -ForegroundColor Cyan
    foreach ($file in $sqlGzFiles) {
        git rm --cached $file
    }
}

# Remove any .env files that might be tracked
$envFiles = Get-ChildItem -Name ".env*" -ErrorAction SilentlyContinue
if ($envFiles) {
    Write-Host "📁 Checking for .env files..." -ForegroundColor Cyan
    foreach ($file in $envFiles) {
        if ($file -ne ".env.example" -and $file -ne ".env.template") {
            $isTracked = git ls-files --error-unmatch $file 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   Removing $file from git..." -ForegroundColor Yellow
                git rm --cached $file
            }
        }
    }
}

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Review the changes: git status" -ForegroundColor White
Write-Host "   2. Commit the cleanup: git commit -m 'Remove sensitive files from tracking'" -ForegroundColor White
Write-Host "   3. Push changes: git push" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Security recommendations:" -ForegroundColor Cyan
Write-Host "   1. Change any exposed passwords/secrets" -ForegroundColor White
Write-Host "   2. Rotate API keys that were in the repository" -ForegroundColor White
Write-Host "   3. Review git history for any other sensitive data" -ForegroundColor White
Write-Host "   4. Consider using git-filter-branch or BFG Repo-Cleaner for complete history cleanup" -ForegroundColor White
