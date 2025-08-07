# 🔒 Git Security & Management Guide

## 🚨 IMMEDIATE SECURITY ACTIONS REQUIRED

### 1. Clean Up Existing Sensitive Files
Your repository currently contains sensitive files that should be removed:

```bash
# Check what sensitive files are tracked
git ls-files | grep -E '\.(sql|sql\.gz)$'

# Run the cleanup script
.\cleanup-sensitive-files.ps1
```

**Files to remove immediately:**
- `*.sql` files (database dumps)
- `*.sql.gz` files (compressed database dumps)
- Any `.env` files (if committed)

### 2. Rotate Compromised Secrets
If any of these were in your repository, **change them immediately**:
- Database passwords
- JWT secrets
- API keys (Cloudinary, etc.)
- SMTP passwords
- Any other credentials

## 📁 New .gitignore Structure

### Root `.gitignore`
- **Comprehensive security patterns** - Blocks all sensitive file types
- **Build artifacts** - Prevents committing compiled/generated files
- **OS-specific files** - Handles Windows, Mac, Linux system files
- **Development tools** - IDE configs, logs, cache files

### Frontend `.gitignore` (`frontend/.gitignore`)
- **Vue.js/Vite specific** - Build outputs, cache, dev files
- **Testing artifacts** - Coverage reports, test outputs
- **Deployment files** - Platform-specific build artifacts

### Backend `.gitignore` (`backend/.gitignore`)
- **Node.js/Express specific** - Server logs, uploads, sessions
- **Database files** - Local DB files, backups, migrations
- **SSL certificates** - Development certificates and keys

## 🛠️ New Tools & Scripts

### Git Helper Script
```powershell
# Check repository status and security
.\git-helper.ps1 status

# Check for sensitive files before commit
.\git-helper.ps1 check

# Interactive commit with security checks
.\git-helper.ps1 commit

# Prepare for deployment
.\git-helper.ps1 deploy

# Clean untracked files safely
.\git-helper.ps1 clean
```

### Environment Templates
- `.env.example` - Root environment template
- `frontend/.env.example` - Frontend-specific variables

## 🔧 Setup Instructions

### 1. Initial Cleanup
```powershell
# Remove sensitive files from git tracking
.\cleanup-sensitive-files.ps1

# Commit the cleanup
git add .gitignore
git commit -m "Security: Remove sensitive files and improve .gitignore"
git push
```

### 2. Set Up Environment Variables
```powershell
# Copy templates and fill in your values
cp .env.example .env
cp frontend/.env.example frontend/.env

# Edit the files with your actual values
# NEVER commit the .env files!
```

### 3. Configure Git Hooks (Optional)
```powershell
# Set up pre-commit hooks to prevent sensitive file commits
.\git-helper.ps1 setup
```

## 🚀 Daily Workflow

### Before Each Commit
```powershell
# Check for sensitive files
.\git-helper.ps1 check

# Review changes
.\git-helper.ps1 status

# Commit with security checks
.\git-helper.ps1 commit
```

### Before Deployment
```powershell
# Ensure repository is deployment-ready
.\git-helper.ps1 deploy

# Run deployment script
.\deploy.sh
```

## 🔒 Security Best Practices

### ✅ DO
- Use `.env.example` templates for documentation
- Keep `.gitkeep` files for empty directories
- Regularly audit repository for sensitive data
- Use the git helper scripts for commits
- Rotate secrets if they were ever committed

### ❌ DON'T
- Commit `.env` files
- Commit database dumps or backups
- Commit API keys or passwords
- Commit SSL certificates or private keys
- Commit large binary files

## 📋 File Structure Overview

```
disaster_app1/
├── .gitignore                 # Comprehensive root gitignore
├── .env.example              # Environment template
├── git-helper.ps1            # Git management script
├── cleanup-sensitive-files.ps1  # Security cleanup script
├── deploy.sh                 # Deployment script
├── frontend/
│   ├── .gitignore           # Frontend-specific ignores
│   └── .env.example         # Frontend environment template
└── backend/
    ├── .gitignore           # Backend-specific ignores
    ├── uploads/.gitkeep     # Keep upload directory structure
    └── public/uploads/.gitkeep
```

## 🚨 Emergency Procedures

### If Sensitive Data Was Committed
1. **Immediately rotate all exposed secrets**
2. **Remove files from git tracking:**
   ```powershell
   git rm --cached sensitive-file.sql
   git commit -m "Remove sensitive file"
   git push
   ```
3. **For complete history cleanup:**
   ```bash
   # Use BFG Repo-Cleaner or git filter-branch
   # This rewrites git history - coordinate with team!
   ```

### If .env File Was Committed
1. **Change all values in the .env file**
2. **Remove from git:**
   ```powershell
   git rm --cached .env
   git commit -m "Remove .env file"
   git push
   ```
3. **Notify team members to update their secrets**

## 📞 Support

If you need help with any of these security measures:
1. Run `.\git-helper.ps1 help` for command help
2. Check this guide for best practices
3. Review the `.env.example` files for required variables

## 🔄 Regular Maintenance

### Weekly
- Run `.\git-helper.ps1 check` before major commits
- Review repository for any new sensitive files
- Update `.gitignore` if new file types appear

### Monthly
- Audit git history for sensitive data
- Review and rotate API keys
- Update environment templates if new variables added

---

**Remember: Security is everyone's responsibility. When in doubt, don't commit it!**
