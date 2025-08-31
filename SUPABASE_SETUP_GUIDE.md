# 🚀 Supabase Database Setup Guide

This guide will help you set up the complete database schema for your Disaster Preparedness App in Supabase.

## 📋 Prerequisites

1. ✅ Supabase project created
2. ✅ Environment variables set in your `.env` file:
   ```
   SUPABASE_URL=https://taqoegurvxaqzoejpmrp.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   ```

## 🛠️ Method 1: Automatic Setup (Recommended)

### Step 1: Test Current Setup
```bash
node setup-supabase-simple.js
```

This will test your connection and show you which tables are missing.

### Step 2: Create Tables via Supabase Dashboard

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `taqoegurvxaqzoejpmrp`
3. **Open SQL Editor**: Click on "SQL Editor" in the left sidebar
4. **Copy the schema**: Open `supabase-schema.sql` and copy all contents
5. **Paste and run**: Paste into SQL Editor and click "Run"

### Step 3: Verify Setup
```bash
node setup-supabase-simple.js
```

You should see all tables marked as ✅ existing.

## 🗄️ Database Tables Overview

Your app will have these tables:

### Core Tables
- **users**: User accounts, profiles, emergency contacts
- **posts**: Community posts and news articles
- **alerts**: Emergency alerts and warnings
- **comments**: Comments on posts
- **likes**: Post likes/reactions

### Feature Tables
- **checklist_items**: Custom preparedness checklist items
- **checklist_progress**: User progress on checklist items
- **alert_reads**: Track which alerts users have seen
- **first_aid_guides**: First aid video guides
- **notifications**: User notifications

## 🔐 Security Setup (Important!)

After creating tables, you need to set up Row Level Security (RLS):

### Step 1: Enable RLS
Go to Authentication > Policies in Supabase dashboard and enable RLS for all tables.

### Step 2: Create Basic Policies
Add these policies in the SQL Editor:

```sql
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid()::text = id::text);

-- Public posts are readable by all
CREATE POLICY "Public posts are viewable" ON posts
FOR SELECT USING (status = 'approved');

-- Users can create posts
CREATE POLICY "Users can create posts" ON posts
FOR INSERT WITH CHECK (auth.uid()::text = author_id::text);

-- Public alerts are readable by all
CREATE POLICY "Public alerts are viewable" ON alerts
FOR SELECT USING (is_public = true OR is_active = true);
```

## 🧪 Testing Your Setup

### Test 1: Run the verification script
```bash
node setup-supabase-simple.js
```

### Test 2: Test your backend connection
```bash
cd backend
node server.js
```

You should see:
```
✅ Supabase connected successfully
📊 Database: Supabase PostgreSQL
```

### Test 3: Test API endpoints
Try accessing: `http://localhost:3000/api/db-test`

Should return:
```json
{
  "success": true,
  "message": "Supabase connected successfully",
  "database": "Supabase PostgreSQL"
}
```

## 🚨 Troubleshooting

### Problem: "relation does not exist" errors
**Solution**: Run the SQL schema in Supabase dashboard

### Problem: "permission denied" errors
**Solution**: Check your service key and RLS policies

### Problem: Connection timeout
**Solution**: Verify your SUPABASE_URL and keys are correct

### Problem: "function does not exist" errors
**Solution**: Make sure you ran the complete schema including functions

## 🎯 Next Steps

1. ✅ **Database Schema**: Complete (you're here!)
2. 🔄 **Deploy Backend**: Set environment variables in Render
3. 🧪 **Test Endpoints**: Verify all API routes work
4. 🎨 **Frontend Integration**: Update frontend to use new backend
5. 🚀 **Go Live**: Your app is ready!

## 📞 Need Help?

If you encounter issues:
1. Check the console output for specific error messages
2. Verify all environment variables are set correctly
3. Make sure you're using the service key (not anon key) for backend operations
4. Check Supabase dashboard logs for detailed error information

---

**🎉 Once this is complete, your database will be fully set up and ready for production!**
