# 🌐 Netlify Domain Change Guide: disasterapp → alertoabra

## 📋 Complete Checklist

### ✅ **Step 1: Netlify Dashboard Changes** (REQUIRED)

1. **Go to Netlify Dashboard**: https://app.netlify.com/
2. **Select your site**: Currently `disasterapp.netlify.app`
3. **Navigate to**: Site Settings → General → Site Details
4. **Change site name**: From `disasterapp` to `alertoabra`
5. **Save changes**
6. **Verify new URL**: https://alertoabra.netlify.app

### ✅ **Step 2: Code Updates** (COMPLETED)

The following files have been updated automatically:

- ✅ `frontend/vite.config.js` - Build configuration
- ✅ `frontend/src/services/api.js` - API service
- ✅ `frontend/src/services/adminService.js` - Admin service
- ✅ `frontend/src/services/checklistService.js` - Checklist service
- ✅ `.env.example` - Root environment template
- ✅ `frontend/.env.example` - Frontend environment template

### 🔧 **Step 3: Environment Variables** (ACTION REQUIRED)

#### Frontend Environment Variables
Update your `frontend/.env` file:
```bash
# Change from:
# VITE_API_URL=https://disaster-app-backend.onrender.com

# To (if needed):
VITE_API_URL=https://disaster-app-backend.onrender.com
```

#### Backend Environment Variables
Update these in your backend hosting platform (Render, Heroku, etc.):

```bash
# Update CORS and frontend URL
FRONTEND_URL=https://alertoabra.netlify.app
CORS_ORIGIN=https://alertoabra.netlify.app
```

**Where to update:**
- **Render**: Dashboard → Environment Variables
- **Heroku**: Dashboard → Settings → Config Vars
- **Railway**: Dashboard → Variables
- **Local development**: `backend/.env` file

### 🚀 **Step 4: Deployment**

#### Option A: Use the PowerShell Script
```powershell
.\update-netlify-domain.ps1
```

#### Option B: Manual Deployment
```bash
# Build frontend
cd frontend
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### 🧪 **Step 5: Testing & Verification**

#### Test Checklist:
- [ ] **Frontend loads**: https://alertoabra.netlify.app
- [ ] **User registration/login works**
- [ ] **API calls succeed** (check browser console)
- [ ] **Image uploads work** (if using Cloudinary)
- [ ] **All features function correctly**

#### Common Issues & Solutions:

**CORS Errors:**
```
Access to fetch at 'https://disaster-app-backend.onrender.com' from origin 'https://alertoabra.netlify.app' has been blocked by CORS policy
```
**Solution**: Update backend `CORS_ORIGIN` environment variable

**API Connection Errors:**
- Check `VITE_API_URL` in frontend environment
- Verify backend is running and accessible
- Check network tab in browser dev tools

### 📱 **Step 6: Update External References**

#### Update these locations:
- [ ] **Social media links**
- [ ] **Documentation/README files**
- [ ] **Email signatures**
- [ ] **Business cards/marketing materials**
- [ ] **Google Analytics/tracking codes**
- [ ] **SEO/search console settings**

### 🔄 **Step 7: DNS & Redirects** (Optional)

If you want to redirect the old URL:
1. **Keep old site active** for a transition period
2. **Set up redirects** in Netlify:
   ```toml
   # In netlify.toml
   [[redirects]]
     from = "https://disasterapp.netlify.app/*"
     to = "https://alertoabra.netlify.app/:splat"
     status = 301
     force = true
   ```

### 🛠️ **Troubleshooting**

#### If the new domain doesn't work:
1. **Check Netlify deployment status**
2. **Verify DNS propagation** (may take a few minutes)
3. **Clear browser cache**
4. **Check for typos in the site name**

#### If API calls fail:
1. **Update backend CORS settings**
2. **Check environment variables**
3. **Verify API endpoints are correct**
4. **Test backend independently**

### 📞 **Quick Commands Reference**

```bash
# Check Netlify status
netlify status

# Login to Netlify (if needed)
netlify login

# Deploy to production
netlify deploy --prod --dir=dist

# Check site info
netlify sites:list

# Open site in browser
netlify open
```

### 🎯 **Final Verification Steps**

1. **Visit new URL**: https://alertoabra.netlify.app
2. **Test user flows**: Registration, login, main features
3. **Check browser console**: No errors
4. **Test on mobile**: Responsive design works
5. **Verify analytics**: Tracking still works

### 📋 **Post-Change Checklist**

- [ ] Old URL redirects properly (if set up)
- [ ] All API endpoints work
- [ ] User authentication functions
- [ ] File uploads work
- [ ] Email notifications work
- [ ] All external integrations work
- [ ] Analytics/tracking updated
- [ ] Team members notified
- [ ] Documentation updated

## 🎉 **Success!**

Once all steps are complete, your AlertoAbra app will be available at:
**https://alertoabra.netlify.app**

The domain change is complete when:
- ✅ New URL loads correctly
- ✅ All features work as expected
- ✅ No CORS or API errors
- ✅ Backend accepts requests from new domain

---

**Need help?** Run the automated script: `.\update-netlify-domain.ps1`
