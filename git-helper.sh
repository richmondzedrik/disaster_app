#!/bin/bash

# Git Helper Script for Disaster App
# Makes git operations easier and safer

show_help() {
    echo "🚀 Git Helper for Disaster App"
    echo ""
    echo "Usage: ./git-helper.sh [command]"
    echo ""
    echo "Commands:"
    echo "  status      - Show detailed git status"
    echo "  clean       - Clean up untracked files (safe)"
    echo "  check       - Check for sensitive files before commit"
    echo "  commit      - Interactive commit with checks"
    echo "  deploy      - Prepare for deployment"
    echo "  setup       - Initial git setup"
    echo "  help        - Show this help"
    echo ""
}

check_sensitive_files() {
    echo "🔍 Checking for sensitive files..."
    
    sensitive_found=false
    
    # Check for common sensitive patterns
    patterns=(
        "*.sql"
        "*.sql.gz"
        ".env"
        ".env.*"
        "*secret*"
        "*password*"
        "*.pem"
        "*.key"
        "*.crt"
        "firebase-adminsdk-*.json"
    )
    
    for pattern in "${patterns[@]}"; do
        if git ls-files | grep -q "$pattern"; then
            echo "⚠️  Found potentially sensitive file: $pattern"
            sensitive_found=true
        fi
    done
    
    # Check staged files
    staged_files=$(git diff --cached --name-only)
    if [[ -n "$staged_files" ]]; then
        echo "📋 Staged files:"
        echo "$staged_files" | while read file; do
            if [[ "$file" =~ \.(sql|env|key|pem|crt)$ ]] || [[ "$file" =~ (secret|password|credential) ]]; then
                echo "   ⚠️  $file (potentially sensitive)"
            else
                echo "   ✅ $file"
            fi
        done
    fi
    
    if [[ "$sensitive_found" == true ]]; then
        echo ""
        echo "❌ Sensitive files detected! Please review before committing."
        return 1
    else
        echo "✅ No sensitive files detected"
        return 0
    fi
}

git_status() {
    echo "📊 Git Status Overview"
    echo "====================="
    
    # Basic status
    git status --short
    
    echo ""
    echo "📈 Repository Info:"
    echo "   Branch: $(git branch --show-current)"
    echo "   Last commit: $(git log -1 --pretty=format:'%h - %s (%cr)')"
    echo "   Untracked files: $(git ls-files --others --exclude-standard | wc -l)"
    echo "   Modified files: $(git diff --name-only | wc -l)"
    echo "   Staged files: $(git diff --cached --name-only | wc -l)"
    
    # Check for large files
    echo ""
    echo "📦 Large files (>1MB):"
    find . -type f -size +1M -not -path "./node_modules/*" -not -path "./.git/*" | head -5
}

git_clean() {
    echo "🧹 Cleaning untracked files..."
    
    # Show what would be removed
    echo "Files that would be removed:"
    git clean -n -d
    
    read -p "Proceed with cleanup? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git clean -f -d
        echo "✅ Cleanup complete"
    else
        echo "❌ Cleanup cancelled"
    fi
}

interactive_commit() {
    echo "💾 Interactive Commit Process"
    echo "============================="
    
    # Check for sensitive files first
    if ! check_sensitive_files; then
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Commit cancelled"
            exit 1
        fi
    fi
    
    # Show current status
    echo ""
    echo "📋 Current changes:"
    git status --short
    
    # Add files interactively
    echo ""
    read -p "Add all changes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
    else
        echo "Use 'git add <file>' to stage specific files"
        exit 0
    fi
    
    # Get commit message
    echo ""
    echo "📝 Commit message (press Enter for default):"
    read -p "Message: " commit_msg
    
    if [[ -z "$commit_msg" ]]; then
        commit_msg="Update: $(date '+%Y-%m-%d %H:%M')"
    fi
    
    # Commit
    git commit -m "$commit_msg"
    echo "✅ Committed successfully"
    
    # Ask about push
    read -p "Push to remote? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push
        echo "✅ Pushed to remote"
    fi
}

prepare_deploy() {
    echo "🚀 Preparing for Deployment"
    echo "=========================="
    
    # Check sensitive files
    if ! check_sensitive_files; then
        echo "❌ Cannot deploy with sensitive files in repository"
        exit 1
    fi
    
    # Check if working directory is clean
    if [[ -n $(git status --porcelain) ]]; then
        echo "⚠️  Working directory is not clean"
        git status --short
        read -p "Commit changes before deploy? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            interactive_commit
        else
            echo "❌ Deploy cancelled - commit changes first"
            exit 1
        fi
    fi
    
    echo "✅ Repository is ready for deployment"
    echo ""
    echo "🔧 Deployment checklist:"
    echo "   ✅ No sensitive files in repository"
    echo "   ✅ Working directory is clean"
    echo "   ✅ All changes committed"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Run: ./deploy.sh"
    echo "   2. Or deploy manually to your platform"
}

git_setup() {
    echo "⚙️  Git Repository Setup"
    echo "======================="
    
    # Set up git hooks
    echo "Setting up git hooks..."
    
    # Pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook to check for sensitive files

echo "🔍 Pre-commit check..."

# Check for sensitive files
if git diff --cached --name-only | grep -E '\.(sql|env|key|pem|crt)$|secret|password|credential'; then
    echo "❌ Sensitive files detected in commit!"
    echo "Please review and remove sensitive files before committing."
    exit 1
fi

echo "✅ Pre-commit check passed"
EOF
    
    chmod +x .git/hooks/pre-commit
    
    echo "✅ Git hooks installed"
    echo "✅ Git setup complete"
}

# Main script logic
case "${1:-help}" in
    "status")
        git_status
        ;;
    "clean")
        git_clean
        ;;
    "check")
        check_sensitive_files
        ;;
    "commit")
        interactive_commit
        ;;
    "deploy")
        prepare_deploy
        ;;
    "setup")
        git_setup
        ;;
    "help"|*)
        show_help
        ;;
esac
