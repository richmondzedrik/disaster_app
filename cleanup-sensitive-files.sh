#!/bin/bash

echo "🧹 Cleaning up sensitive files from git history..."
echo "⚠️  WARNING: This will remove files from git tracking!"
echo "📋 Files to be removed:"

# List files that should be removed
echo "   - *.sql files (database dumps)"
echo "   - *.sql.gz files (compressed database dumps)"
echo "   - .env files (if any)"
echo "   - Any credential files"

read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

echo "🔍 Scanning for sensitive files..."

# Remove database files from git tracking
if ls *.sql >/dev/null 2>&1; then
    echo "📁 Removing .sql files from git..."
    git rm --cached *.sql
fi

if ls *.sql.gz >/dev/null 2>&1; then
    echo "📁 Removing .sql.gz files from git..."
    git rm --cached *.sql.gz
fi

# Remove any .env files that might be tracked
if ls .env* >/dev/null 2>&1; then
    echo "📁 Checking for .env files..."
    for file in .env*; do
        if [[ "$file" != ".env.example" && "$file" != ".env.template" ]]; then
            if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
                echo "   Removing $file from git..."
                git rm --cached "$file"
            fi
        fi
    done
fi

# Remove any potential credential files
credential_patterns=(
    "*secret*"
    "*key*"
    "*credential*"
    "*password*"
    "*.pem"
    "*.key"
    "*.crt"
    "firebase-adminsdk-*.json"
    "service-account*.json"
)

for pattern in "${credential_patterns[@]}"; do
    if ls $pattern >/dev/null 2>&1; then
        for file in $pattern; do
            if [[ -f "$file" ]] && git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
                echo "   Removing credential file: $file"
                git rm --cached "$file"
            fi
        done
    fi
done

echo "🔄 Updating .gitignore to prevent future commits..."

# Ensure .gitignore is properly set up
if [[ ! -f .gitignore ]]; then
    echo "❌ .gitignore not found! Please run this script after setting up .gitignore"
    exit 1
fi

echo "✅ Cleanup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Review the changes: git status"
echo "   2. Commit the cleanup: git commit -m 'Remove sensitive files from tracking'"
echo "   3. Push changes: git push"
echo ""
echo "🔒 Security recommendations:"
echo "   1. Change any exposed passwords/secrets"
echo "   2. Rotate API keys that were in the repository"
echo "   3. Review git history for any other sensitive data"
echo "   4. Consider using git-filter-branch or BFG Repo-Cleaner for complete history cleanup"
echo ""
echo "⚠️  Remember: Files are only removed from git tracking, not from your local filesystem"
