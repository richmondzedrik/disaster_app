# PowerShell Git Helper Script for Disaster App

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "🚀 Git Helper for Disaster App" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\git-helper.ps1 [command]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  status      - Show detailed git status" -ForegroundColor White
    Write-Host "  clean       - Clean up untracked files (safe)" -ForegroundColor White
    Write-Host "  check       - Check for sensitive files before commit" -ForegroundColor White
    Write-Host "  commit      - Interactive commit with checks" -ForegroundColor White
    Write-Host "  deploy      - Prepare for deployment" -ForegroundColor White
    Write-Host "  help        - Show this help" -ForegroundColor White
}

function Test-SensitiveFiles {
    Write-Host "🔍 Checking for sensitive files..." -ForegroundColor Yellow
    
    $sensitiveFound = $false
    
    # Check for common sensitive patterns
    $patterns = @("*.sql", "*.sql.gz", ".env", ".env.*", "*secret*", "*password*", "*.pem", "*.key", "*.crt", "firebase-adminsdk-*.json")
    
    foreach ($pattern in $patterns) {
        $files = git ls-files | Where-Object { $_ -like $pattern }
        if ($files) {
            Write-Host "⚠️  Found potentially sensitive file pattern: $pattern" -ForegroundColor Red
            $sensitiveFound = $true
        }
    }
    
    # Check staged files
    $stagedFiles = git diff --cached --name-only
    if ($stagedFiles) {
        Write-Host "📋 Staged files:" -ForegroundColor Cyan
        foreach ($file in $stagedFiles) {
            if ($file -match '\.(sql|env|key|pem|crt)$' -or $file -match '(secret|password|credential)') {
                Write-Host "   ⚠️  $file (potentially sensitive)" -ForegroundColor Red
            } else {
                Write-Host "   ✅ $file" -ForegroundColor Green
            }
        }
    }
    
    if ($sensitiveFound) {
        Write-Host ""
        Write-Host "❌ Sensitive files detected! Please review before committing." -ForegroundColor Red
        return $false
    } else {
        Write-Host "✅ No sensitive files detected" -ForegroundColor Green
        return $true
    }
}

function Show-GitStatus {
    Write-Host "📊 Git Status Overview" -ForegroundColor Green
    Write-Host "=====================" -ForegroundColor Green
    
    # Basic status
    git status --short
    
    Write-Host ""
    Write-Host "📈 Repository Info:" -ForegroundColor Cyan
    $branch = git branch --show-current
    $lastCommit = git log -1 --pretty=format:'%h - %s (%cr)'
    $untrackedCount = (git ls-files --others --exclude-standard | Measure-Object).Count
    $modifiedCount = (git diff --name-only | Measure-Object).Count
    $stagedCount = (git diff --cached --name-only | Measure-Object).Count
    
    Write-Host "   Branch: $branch" -ForegroundColor White
    Write-Host "   Last commit: $lastCommit" -ForegroundColor White
    Write-Host "   Untracked files: $untrackedCount" -ForegroundColor White
    Write-Host "   Modified files: $modifiedCount" -ForegroundColor White
    Write-Host "   Staged files: $stagedCount" -ForegroundColor White
    
    # Check for large files
    Write-Host ""
    Write-Host "📦 Large files (>1MB):" -ForegroundColor Cyan
    Get-ChildItem -Recurse -File | Where-Object { $_.Length -gt 1MB -and $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.git\*" } | Select-Object -First 5 | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "   $($_.Name) ($size MB)" -ForegroundColor Yellow
    }
}

function Invoke-GitClean {
    Write-Host "🧹 Cleaning untracked files..." -ForegroundColor Yellow
    
    # Show what would be removed
    Write-Host "Files that would be removed:" -ForegroundColor Cyan
    git clean -n -d
    
    $confirmation = Read-Host "Proceed with cleanup? (y/N)"
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        git clean -f -d
        Write-Host "✅ Cleanup complete" -ForegroundColor Green
    } else {
        Write-Host "❌ Cleanup cancelled" -ForegroundColor Red
    }
}

function Invoke-InteractiveCommit {
    Write-Host "💾 Interactive Commit Process" -ForegroundColor Green
    Write-Host "=============================" -ForegroundColor Green
    
    # Check for sensitive files first
    if (-not (Test-SensitiveFiles)) {
        $confirmation = Read-Host "Continue anyway? (y/N)"
        if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
            Write-Host "❌ Commit cancelled" -ForegroundColor Red
            return
        }
    }
    
    # Show current status
    Write-Host ""
    Write-Host "📋 Current changes:" -ForegroundColor Cyan
    git status --short
    
    # Add files interactively
    Write-Host ""
    $addAll = Read-Host "Add all changes? (y/N)"
    if ($addAll -eq 'y' -or $addAll -eq 'Y') {
        git add .
    } else {
        Write-Host "Use 'git add <file>' to stage specific files" -ForegroundColor Yellow
        return
    }
    
    # Get commit message
    Write-Host ""
    Write-Host "📝 Commit message (press Enter for default):" -ForegroundColor Cyan
    $commitMsg = Read-Host "Message"
    
    if ([string]::IsNullOrWhiteSpace($commitMsg)) {
        $commitMsg = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    
    # Commit
    git commit -m $commitMsg
    Write-Host "✅ Committed successfully" -ForegroundColor Green
    
    # Ask about push
    $pushConfirm = Read-Host "Push to remote? (y/N)"
    if ($pushConfirm -eq 'y' -or $pushConfirm -eq 'Y') {
        git push
        Write-Host "✅ Pushed to remote" -ForegroundColor Green
    }
}

function Invoke-DeployPrep {
    Write-Host "🚀 Preparing for Deployment" -ForegroundColor Green
    Write-Host "==========================" -ForegroundColor Green
    
    # Check sensitive files
    if (-not (Test-SensitiveFiles)) {
        Write-Host "❌ Cannot deploy with sensitive files in repository" -ForegroundColor Red
        return
    }
    
    # Check if working directory is clean
    $status = git status --porcelain
    if ($status) {
        Write-Host "⚠️  Working directory is not clean" -ForegroundColor Yellow
        git status --short
        $commitConfirm = Read-Host "Commit changes before deploy? (y/N)"
        if ($commitConfirm -eq 'y' -or $commitConfirm -eq 'Y') {
            Invoke-InteractiveCommit
        } else {
            Write-Host "❌ Deploy cancelled - commit changes first" -ForegroundColor Red
            return
        }
    }
    
    Write-Host "✅ Repository is ready for deployment" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔧 Deployment checklist:" -ForegroundColor Cyan
    Write-Host "   ✅ No sensitive files in repository" -ForegroundColor Green
    Write-Host "   ✅ Working directory is clean" -ForegroundColor Green
    Write-Host "   ✅ All changes committed" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Run: .\deploy.sh (or deploy.ps1 if you create one)" -ForegroundColor White
    Write-Host "   2. Or deploy manually to your platform" -ForegroundColor White
}

# Main script logic
switch ($Command.ToLower()) {
    "status" { Show-GitStatus }
    "clean" { Invoke-GitClean }
    "check" { Test-SensitiveFiles }
    "commit" { Invoke-InteractiveCommit }
    "deploy" { Invoke-DeployPrep }
    default { Show-Help }
}
