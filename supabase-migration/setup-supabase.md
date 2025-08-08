# 🚀 Supabase Migration Guide

## Step 1: Create Supabase Project

1. **Go to Supabase**: https://supabase.com/
2. **Sign up/Login** with your account
3. **Create New Project**:
   - Project Name: `AlertoAbra` or `disaster-app`
   - Database Password: Choose a strong password
   - Region: Choose closest to your users
4. **Wait for setup** (usually 2-3 minutes)

## Step 2: Get Connection Details

Once your project is ready:

1. **Go to Settings** → **Database**
2. **Copy these values**:
   - Host: `db.xxx.supabase.co`
   - Database name: `postgres`
   - Port: `5432`
   - User: `postgres`
   - Password: (the one you set during creation)

3. **Go to Settings** → **API**
4. **Copy these values**:
   - Project URL: `https://xxx.supabase.co`
   - Anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Service role key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 3: Environment Variables

Update your `.env` files with Supabase credentials:

### Backend `.env`:
```bash
# Supabase Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# PostgreSQL Direct Connection (for migrations)
DB_HOST=db.your-project.supabase.co
DB_USER=postgres
DB_PASSWORD=your-database-password
DB_NAME=postgres
DB_PORT=5432

# Keep old MySQL config for migration
MYSQL_HOST=your-old-mysql-host
MYSQL_USER=your-old-mysql-user
MYSQL_PASSWORD=your-old-mysql-password
MYSQL_DATABASE=your-old-mysql-database
```

### Frontend `.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Install Dependencies

```bash
# Backend
npm install @supabase/supabase-js pg

# Frontend  
npm install @supabase/supabase-js
```

## Step 5: Run Migration Scripts

```bash
# Create tables
node supabase-migration/create-schema.js

# Migrate data (if you have existing data)
node supabase-migration/migrate-data.js

# Test connection
node supabase-migration/test-connection.js
```

## Benefits of Supabase

✅ **Built-in Authentication** - No need for custom JWT
✅ **Real-time subscriptions** - Live updates
✅ **Auto-generated APIs** - REST and GraphQL
✅ **Row Level Security** - Built-in security
✅ **Storage** - File uploads built-in
✅ **Edge Functions** - Serverless functions
✅ **Dashboard** - Visual database management
✅ **Backups** - Automatic backups
✅ **Scaling** - Auto-scaling PostgreSQL
