# 🔥 Firebase Migration Guide for Disaster Management App

## 📋 Overview

This guide will help you migrate your disaster management application from Clever Cloud MySQL to Firebase. The migration includes:

- **Database**: MySQL → Firestore
- **Authentication**: Custom JWT → Firebase Auth
- **File Storage**: Cloudinary → Firebase Storage (optional)
- **Real-time Features**: WebSocket → Firebase Realtime Database

## 🚀 Quick Start

### 1. Prerequisites Setup

#### Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Firestore Database
4. Enable Authentication (Email/Password)
5. Generate service account key (Project Settings > Service Accounts)

#### Environment Setup
```bash
# Navigate to migration directory
cd firebase-migration

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

#### Configure Environment Variables
Edit `.env` file with your credentials:

```env
# MySQL (Clever Cloud) Configuration
MYSQL_HOST=your-clever-cloud-host
MYSQL_PORT=3306
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=your-database-name

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
# ... other Firebase config fields

# Migration Settings
BATCH_SIZE=100
DRY_RUN=true
```

### 2. Run Migration

#### Step 1: Setup Firebase
```bash
npm run setup-firebase
```

#### Step 2: Create Firestore Indexes
1. Go to Firebase Console > Firestore Database > Indexes
2. Create the composite indexes shown by setup script
3. Wait for indexes to build

#### Step 3: Test Migration (Dry Run)
```bash
npm run migrate
```

#### Step 4: Run Actual Migration
```bash
# Set DRY_RUN=false in .env
npm run migrate
```

#### Step 5: Verify Migration
```bash
npm run test-connection
```

## 📊 Data Migration Details

### Database Schema Conversion

| MySQL Table | Firestore Collection | Key Changes |
|-------------|---------------------|-------------|
| `users` | `users` | ID → Firebase Auth UID |
| `posts` | `posts` | Foreign keys → references |
| `alerts` | `alerts` | Coordinates as nested object |
| `map_markers` | `mapMarkers` | Geographic data restructured |
| `checklist_items` | `checklistItems` | User references updated |
| `emergency_contacts` | `emergencyContacts` | Minimal changes |
| `first_aid_guides` | `firstAidGuides` | JSON steps preserved |
| `hazard_zones` | `hazardZones` | Coordinate arrays |
| `comments` | `comments` | Denormalized user info |
| `likes` | `likes` | Simple structure |
| `notifications` | `notifications` | User references updated |

### Authentication Migration

#### Before (MySQL + JWT)
```javascript
// Custom JWT authentication
const token = jwt.sign({ userId: user.id }, secret);
```

#### After (Firebase Auth)
```javascript
// Firebase Authentication
const userRecord = await auth.createUser({
  uid: customUID,
  email: user.email,
  emailVerified: user.email_verified
});
```

## 🔧 Backend Code Updates

### 1. Install Firebase Admin SDK

```bash
cd backend
npm install firebase-admin
```

### 2. Update Environment Variables

Add to `backend/.env`:
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### 3. Database Configuration

The Firebase config is already created at `backend/config/firebase.js`. Update your controllers to use Firestore instead of MySQL.

#### Example: User Controller Migration

**Before (MySQL):**
```javascript
const mysql = require('../config/database');

const getUsers = async (req, res) => {
  const [rows] = await mysql.execute('SELECT * FROM users');
  res.json(rows);
};
```

**After (Firestore):**
```javascript
const { db } = require('../config/firebase');

const getUsers = async (req, res) => {
  const snapshot = await db.collection('users').get();
  const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(users);
};
```

### 4. Authentication Middleware Update

**Before (JWT):**
```javascript
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
};
```

**After (Firebase Auth):**
```javascript
const { auth } = require('../config/firebase');

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const decodedToken = await auth.verifyIdToken(token);
  req.user = decodedToken;
  next();
};
```

## 🌐 Frontend Code Updates

### 1. Install Firebase SDK

```bash
cd frontend
npm install firebase
```

### 2. Firebase Configuration

Create `frontend/src/config/firebase.js`:
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 3. Authentication Updates

**Before (Custom API):**
```javascript
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  localStorage.setItem('token', data.token);
};
```

**After (Firebase Auth):**
```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './config/firebase';

const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  // Token is automatically managed by Firebase
  return userCredential.user;
};
```

### 4. Data Fetching Updates

**Before (REST API):**
```javascript
const fetchPosts = async () => {
  const response = await fetch('/api/posts', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

**After (Firestore):**
```javascript
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './config/firebase';

const fetchPosts = async () => {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

## 🔒 Security Rules

Deploy the Firestore security rules:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

## ✅ Testing & Validation

### 1. Data Integrity Checks

```bash
# Run connection tests
cd firebase-migration
npm run test-connection

# Verify data counts
node -e "
const { db } = require('./firebase-config');
(async () => {
  const collections = ['users', 'posts', 'alerts'];
  for (const col of collections) {
    const snapshot = await db.collection(col).get();
    console.log(\`\${col}: \${snapshot.size} documents\`);
  }
})();
"
```

### 2. Application Testing

1. **Authentication Flow**
   - User registration
   - Login/logout
   - Password reset
   - Email verification

2. **Core Features**
   - Create/edit posts
   - Emergency alerts
   - Map markers
   - Comments and likes
   - Notifications

3. **Admin Functions**
   - User management
   - Content moderation
   - System alerts

## 🚨 Troubleshooting

### Common Issues

1. **Firebase Auth User Creation Fails**
   ```
   Error: The email address is already in use
   ```
   **Solution**: Check if users already exist in Firebase Auth

2. **Firestore Permission Denied**
   ```
   Error: Missing or insufficient permissions
   ```
   **Solution**: Deploy security rules and verify user authentication

3. **Index Creation Required**
   ```
   Error: The query requires an index
   ```
   **Solution**: Create composite indexes in Firebase Console

4. **Environment Variables Missing**
   ```
   Error: Firebase project ID not found
   ```
   **Solution**: Verify all required environment variables are set

### Performance Optimization

1. **Denormalize Data**: Store frequently accessed data together
2. **Use Indexes**: Create indexes for common query patterns
3. **Batch Operations**: Use batch writes for multiple operations
4. **Pagination**: Implement pagination for large datasets

## 📈 Post-Migration Checklist

- [ ] All data migrated successfully
- [ ] Authentication working
- [ ] Security rules deployed
- [ ] Indexes created and built
- [ ] Application tested thoroughly
- [ ] Performance optimized
- [ ] Backup created
- [ ] Old database archived
- [ ] Documentation updated
- [ ] Team trained on Firebase

## 🎯 Next Steps

1. **Monitor Usage**: Set up Firebase Analytics and Performance Monitoring
2. **Optimize Costs**: Review Firebase pricing and optimize queries
3. **Add Features**: Leverage Firebase features like Cloud Functions
4. **Scale**: Plan for growth with Firebase's auto-scaling capabilities

## 📞 Support

- **Firebase Documentation**: https://firebase.google.com/docs
- **Migration Scripts**: Check `firebase-migration/` directory
- **Issues**: Review troubleshooting section above

---

**⚠️ Important Notes:**
- Always backup your data before migration
- Test thoroughly in development environment
- Monitor Firebase usage and billing
- Keep service account keys secure
