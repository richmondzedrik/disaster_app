const { db } = require('./firebase-config');
require('dotenv').config();

// Firestore indexes that need to be created
const requiredIndexes = [
  {
    collection: 'posts',
    fields: [
      { field: 'status', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'posts',
    fields: [
      { field: 'authorId', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'alerts',
    fields: [
      { field: 'isActive', order: 'ASCENDING' },
      { field: 'severity', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'mapMarkers',
    fields: [
      { field: 'type', order: 'ASCENDING' },
      { field: 'isActive', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'checklistItems',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'isCompleted', order: 'ASCENDING' }
    ]
  },
  {
    collection: 'notifications',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'isRead', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'comments',
    fields: [
      { field: 'postId', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'likes',
    fields: [
      { field: 'postId', order: 'ASCENDING' },
      { field: 'userId', order: 'ASCENDING' }
    ]
  }
];

async function setupFirestore() {
  console.log('Setting up Firestore database...');

  try {
    // Test connection
    const testDoc = await db.collection('_test').doc('connection').set({
      timestamp: new Date(),
      message: 'Connection test successful'
    });

    console.log('✅ Firestore connection successful');

    // Clean up test document
    await db.collection('_test').doc('connection').delete();

    // Create initial collections with sample documents (required for indexes)
    await createInitialCollections();

    console.log('✅ Initial collections created');
    console.log('📋 Required indexes:');

    // Display required indexes (these need to be created manually in Firebase Console)
    requiredIndexes.forEach((index, i) => {
      console.log(`${i + 1}. Collection: ${index.collection}`);
      console.log(`   Fields: ${index.fields.map(f => `${f.field} (${f.order})`).join(', ')}`);
    });

    console.log('\n⚠️  IMPORTANT: You need to create these composite indexes manually in the Firebase Console:');
    console.log('   1. Go to Firebase Console > Firestore Database > Indexes');
    console.log('   2. Create composite indexes for the collections listed above');
    console.log('   3. Wait for all indexes to build before running the migration');

  } catch (error) {
    console.error('❌ Firestore setup failed:', error);
    throw error;
  }
}

async function createInitialCollections() {
  const collections = [
    'users',
    'posts',
    'alerts',
    'mapMarkers',
    'checklistItems',
    'emergencyContacts',
    'firstAidGuides',
    'hazardZones',
    'comments',
    'likes',
    'notifications'
  ];

  for (const collectionName of collections) {
    try {
      // Create a temporary document to initialize the collection
      const tempDoc = db.collection(collectionName).doc('_temp');
      await tempDoc.set({
        _temp: true,
        createdAt: new Date()
      });

      // Delete the temporary document
      await tempDoc.delete();

      console.log(`✅ Collection '${collectionName}' initialized`);
    } catch (error) {
      console.error(`❌ Failed to initialize collection '${collectionName}':`, error);
    }
  }
}

async function validateEnvironment() {
  console.log('Validating environment configuration...');

  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    throw new Error('Environment validation failed');
  }

  console.log('✅ Environment configuration valid');
}

async function main() {
  try {
    await validateEnvironment();
    await setupFirestore();

    console.log('\n🎉 Firebase setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Create the required composite indexes in Firebase Console');
    console.log('2. Copy .env.example to .env and fill in your configuration');
    console.log('3. Run the migration: npm run migrate');

  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupFirestore, createInitialCollections, validateEnvironment };
