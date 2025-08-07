# Disaster App: MySQL to Firebase Migration

This directory contains scripts and documentation for migrating the disaster management application from Clever Cloud MySQL to Firebase Firestore.

## Overview

The migration process involves:
1. Converting relational MySQL data to document-based Firestore structure
2. Migrating user authentication to Firebase Auth
3. Setting up proper security rules and indexes
4. Updating application code to use Firebase SDK

## Prerequisites

### 1. Firebase Project Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Authentication with Email/Password provider
4. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely

### 2. Node.js Environment
- Node.js 16+ installed
- npm or yarn package manager

### 3. MySQL Access
- Access to your current Clever Cloud MySQL database
- Database credentials and connection details

## Installation

1. Navigate to the migration directory:
```bash
cd firebase-migration
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment configuration:
```bash
cp .env.example .env
```

4. Edit `.env` file with your configuration:
```env
# MySQL Database Configuration
MYSQL_HOST=your-clever-cloud-host
MYSQL_PORT=3306
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=your-database-name

# Firebase Configuration (from service account JSON)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
# ... other Firebase config fields

# Migration Settings
BATCH_SIZE=100
DRY_RUN=true
```

## Migration Process

### Step 1: Setup Firebase
```bash
npm run setup-firebase
```

This will:
- Test Firebase connection
- Initialize Firestore collections
- Display required composite indexes

### Step 2: Create Firestore Indexes
1. Go to [Firebase Console](https://console.firebase.google.com) > Firestore Database > Indexes
2. Create the composite indexes shown by the setup script
3. Wait for all indexes to build (this can take several minutes)

### Step 3: Test Migration (Dry Run)
```bash
# Ensure DRY_RUN=true in .env
npm run migrate
```

This will:
- Connect to MySQL and Firebase
- Process all data without writing to Firestore
- Show migration statistics and any errors

### Step 4: Run Actual Migration
```bash
# Set DRY_RUN=false in .env
npm run migrate
```

### Step 5: Verify Migration
```bash
npm run test-connection
```

## Data Mapping

### Users Table → users Collection
- `id` → Firebase Auth UID
- `password` → Migrated to Firebase Auth
- `email_verified` → Firebase Auth emailVerified
- JSON fields parsed and stored as nested objects

### Posts Table → posts Collection
- Foreign key `author_id` → `authorId` (Firebase UID)
- Denormalized author info for performance

### Alerts Table → alerts Collection
- Geographic coordinates stored as nested object
- Creator info denormalized

### Other Tables
See `firestore-data-model.md` for complete mapping details.

## Security Rules

The migration includes Firestore security rules in `firestore.rules`. Deploy them using:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

## Troubleshooting

### Common Issues

1. **Firebase Auth User Creation Fails**
   - Check if email already exists in Firebase Auth
   - Verify service account permissions

2. **Firestore Write Limits**
   - Reduce BATCH_SIZE in .env
   - Add delays between batches if needed

3. **Index Creation Required**
   - Some queries may fail until composite indexes are built
   - Check Firebase Console for index status

4. **Data Type Conversion Errors**
   - Check MySQL data for invalid JSON
   - Verify timestamp formats

### Logs and Debugging

- Migration logs are displayed in console
- Error details are captured and summarized
- Use DRY_RUN mode to test without writing data

## Post-Migration Tasks

### 1. Update Application Code
- Replace MySQL queries with Firestore SDK calls
- Update authentication to use Firebase Auth
- Modify data access patterns for NoSQL

### 2. Test Application
- Verify all features work with new database
- Test user authentication and authorization
- Check data consistency and relationships

### 3. Performance Optimization
- Monitor query performance
- Add additional indexes if needed
- Optimize denormalized data structure

### 4. Backup and Cleanup
- Export Firestore data as backup
- Clean up old MySQL database (after thorough testing)
- Update deployment configurations

## File Structure

```
firebase-migration/
├── README.md                 # This file
├── package.json             # Node.js dependencies
├── .env.example            # Environment configuration template
├── firebase-config.js      # Firebase initialization
├── firestore.rules         # Security rules
├── firestore-data-model.md # Data structure documentation
├── migrate.js              # Main migration script
├── setup-firebase.js       # Firebase setup script
└── test-connection.js      # Connection testing script
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Firebase documentation
3. Check migration logs for specific error details

## Important Notes

⚠️ **Always run a dry run first and backup your data**
⚠️ **Test thoroughly in a development environment**
⚠️ **Monitor Firebase usage and billing**
⚠️ **Keep your service account key secure**
