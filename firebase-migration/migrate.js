const mysql = require('mysql2/promise');
const { db, auth } = require('./firebase-config');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MySQL connection configuration
const mysqlConfig = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
};

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 100;
const DRY_RUN = process.env.DRY_RUN === 'true';

// User ID mapping for foreign key relationships
const userIdMapping = new Map();

class MigrationLogger {
  constructor() {
    this.logs = [];
    this.errors = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    this.logs.push(logMessage);
  }

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ERROR: ${message}`;
    if (error) {
      console.error(errorMessage, error);
      this.errors.push({ message: errorMessage, error: error.toString() });
    } else {
      console.error(errorMessage);
      this.errors.push({ message: errorMessage });
    }
  }

  summary() {
    console.log('\n=== MIGRATION SUMMARY ===');
    console.log(`Total logs: ${this.logs.length}`);
    console.log(`Total errors: ${this.errors.length}`);
    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach(err => console.log(err.message));
    }
  }
}

const logger = new MigrationLogger();

// Utility functions
function convertTimestamp(mysqlTimestamp) {
  if (!mysqlTimestamp) return null;
  return new Date(mysqlTimestamp);
}

function parseJsonField(jsonString) {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logger.error(`Failed to parse JSON: ${jsonString}`, error);
    return null;
  }
}

async function createFirebaseUser(userData) {
  try {
    const userRecord = await auth.createUser({
      uid: userData.firebaseUid,
      email: userData.email,
      emailVerified: userData.email_verified,
      disabled: userData.status !== 'active',
      displayName: userData.username
    });

    logger.log(`Created Firebase Auth user: ${userRecord.uid}`);
    return userRecord;
  } catch (error) {
    logger.error(`Failed to create Firebase Auth user for ${userData.email}`, error);
    throw error;
  }
}

// Migration functions for each table
async function migrateUsers(connection) {
  logger.log('Starting users migration...');

  const [rows] = await connection.execute('SELECT * FROM users ORDER BY id');
  logger.log(`Found ${rows.length} users to migrate`);

  const batch = db.batch();
  let batchCount = 0;

  for (const user of rows) {
    try {
      // Generate Firebase UID (you might want to use a more sophisticated mapping)
      const firebaseUid = `user_${user.id}_${Date.now()}`;
      userIdMapping.set(user.id, firebaseUid);

      // Create Firebase Auth user
      if (!DRY_RUN) {
        await createFirebaseUser({
          firebaseUid,
          email: user.email,
          email_verified: user.email_verified,
          status: user.status,
          username: user.username
        });
      }

      // Prepare Firestore document
      const userData = {
        id: firebaseUid,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: Boolean(user.email_verified),
        status: user.status,
        phone: user.phone || '',
        notifications: parseJsonField(user.notifications) || { push: true, email: true },
        location: user.location || '',
        emergencyContacts: parseJsonField(user.emergency_contacts) || [],
        createdAt: convertTimestamp(user.created_at),
        updatedAt: convertTimestamp(user.updated_at),
        lastLogin: convertTimestamp(user.last_login),
        avatarUrl: user.avatar_url || ''
      };

      if (!DRY_RUN) {
        const userRef = db.collection('users').doc(firebaseUid);
        batch.set(userRef, userData);
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          logger.log(`Committed batch of ${batchCount} users`);
          batchCount = 0;
        }
      }

      logger.log(`Processed user: ${user.username} (${user.id} -> ${firebaseUid})`);
    } catch (error) {
      logger.error(`Failed to migrate user ${user.id}`, error);
    }
  }

  // Commit remaining batch
  if (batchCount > 0 && !DRY_RUN) {
    await batch.commit();
    logger.log(`Committed final batch of ${batchCount} users`);
  }

  logger.log(`Users migration completed. Migrated ${rows.length} users`);
}

async function migratePosts(connection) {
  logger.log('Starting posts migration...');

  const [rows] = await connection.execute(`
    SELECT p.*, u.username, u.role
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    ORDER BY p.id
  `);
  logger.log(`Found ${rows.length} posts to migrate`);

  const batch = db.batch();
  let batchCount = 0;

  for (const post of rows) {
    try {
      const authorFirebaseUid = userIdMapping.get(post.author_id);
      if (!authorFirebaseUid) {
        logger.error(`No Firebase UID found for author_id ${post.author_id}`);
        continue;
      }

      const postData = {
        id: `post_${post.id}`,
        title: post.title,
        content: post.content,
        authorId: authorFirebaseUid,
        authorAvatar: post.author_avatar || '',
        status: post.status,
        likes: post.likes || 0,
        imageUrl: post.image_url || '',
        createdAt: convertTimestamp(post.created_at),
        updatedAt: convertTimestamp(post.updated_at),
        // Denormalized author info
        authorUsername: post.username,
        authorRole: post.role
      };

      if (!DRY_RUN) {
        const postRef = db.collection('posts').doc(`post_${post.id}`);
        batch.set(postRef, postData);
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          logger.log(`Committed batch of ${batchCount} posts`);
          batchCount = 0;
        }
      }

      logger.log(`Processed post: ${post.title} (${post.id})`);
    } catch (error) {
      logger.error(`Failed to migrate post ${post.id}`, error);
    }
  }

  if (batchCount > 0 && !DRY_RUN) {
    await batch.commit();
    logger.log(`Committed final batch of ${batchCount} posts`);
  }

  logger.log(`Posts migration completed. Migrated ${rows.length} posts`);
}

async function migrateAlerts(connection) {
  logger.log('Starting alerts migration...');

  const [rows] = await connection.execute(`
    SELECT a.*, u.username
    FROM alerts a
    LEFT JOIN users u ON a.created_by = u.id
    ORDER BY a.id
  `);
  logger.log(`Found ${rows.length} alerts to migrate`);

  const batch = db.batch();
  let batchCount = 0;

  for (const alert of rows) {
    try {
      const creatorFirebaseUid = userIdMapping.get(alert.created_by);

      const alertData = {
        id: `alert_${alert.id}`,
        title: alert.title,
        message: alert.message,
        type: alert.type,
        severity: alert.severity,
        location: alert.location || '',
        coordinates: {
          latitude: alert.latitude || 0,
          longitude: alert.longitude || 0
        },
        createdBy: creatorFirebaseUid || '',
        isActive: Boolean(alert.is_active),
        expiresAt: convertTimestamp(alert.expires_at),
        createdAt: convertTimestamp(alert.created_at),
        updatedAt: convertTimestamp(alert.updated_at),
        creatorUsername: alert.username || 'Unknown'
      };

      if (!DRY_RUN) {
        const alertRef = db.collection('alerts').doc(`alert_${alert.id}`);
        batch.set(alertRef, alertData);
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          logger.log(`Committed batch of ${batchCount} alerts`);
          batchCount = 0;
        }
      }

      logger.log(`Processed alert: ${alert.title} (${alert.id})`);
    } catch (error) {
      logger.error(`Failed to migrate alert ${alert.id}`, error);
    }
  }

  if (batchCount > 0 && !DRY_RUN) {
    await batch.commit();
    logger.log(`Committed final batch of ${batchCount} alerts`);
  }

  logger.log(`Alerts migration completed. Migrated ${rows.length} alerts`);
}

async function migrateMapMarkers(connection) {
  logger.log('Starting map markers migration...');

  const [rows] = await connection.execute(`
    SELECT m.*, u.username
    FROM map_markers m
    LEFT JOIN users u ON m.created_by = u.id
    ORDER BY m.id
  `);
  logger.log(`Found ${rows.length} map markers to migrate`);

  const batch = db.batch();
  let batchCount = 0;

  for (const marker of rows) {
    try {
      const creatorFirebaseUid = userIdMapping.get(marker.created_by);

      const markerData = {
        id: `marker_${marker.id}`,
        title: marker.title,
        description: marker.description || '',
        type: marker.type,
        coordinates: {
          latitude: marker.latitude || 0,
          longitude: marker.longitude || 0
        },
        address: marker.address || '',
        createdBy: creatorFirebaseUid || '',
        isActive: Boolean(marker.is_active),
        severity: marker.severity || 'low',
        createdAt: convertTimestamp(marker.created_at),
        updatedAt: convertTimestamp(marker.updated_at),
        creatorUsername: marker.username || 'Unknown'
      };

      if (!DRY_RUN) {
        const markerRef = db.collection('mapMarkers').doc(`marker_${marker.id}`);
        batch.set(markerRef, markerData);
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          logger.log(`Committed batch of ${batchCount} map markers`);
          batchCount = 0;
        }
      }

      logger.log(`Processed map marker: ${marker.title} (${marker.id})`);
    } catch (error) {
      logger.error(`Failed to migrate map marker ${marker.id}`, error);
    }
  }

  if (batchCount > 0 && !DRY_RUN) {
    await batch.commit();
    logger.log(`Committed final batch of ${batchCount} map markers`);
  }

  logger.log(`Map markers migration completed. Migrated ${rows.length} markers`);
}

async function migrateChecklistItems(connection) {
  logger.log('Starting checklist items migration...');

  const [rows] = await connection.execute('SELECT * FROM checklist_items ORDER BY id');
  logger.log(`Found ${rows.length} checklist items to migrate`);

  const batch = db.batch();
  let batchCount = 0;

  for (const item of rows) {
    try {
      const userFirebaseUid = userIdMapping.get(item.user_id);
      if (!userFirebaseUid) {
        logger.error(`No Firebase UID found for user_id ${item.user_id}`);
        continue;
      }

      const itemData = {
        id: `checklist_${item.id}`,
        userId: userFirebaseUid,
        itemId: item.item_id || '',
        title: item.title,
        description: item.description || '',
        category: item.category || '',
        isCompleted: Boolean(item.is_completed),
        priority: item.priority || 'medium',
        dueDate: convertTimestamp(item.due_date),
        createdAt: convertTimestamp(item.created_at),
        updatedAt: convertTimestamp(item.updated_at)
      };

      if (!DRY_RUN) {
        const itemRef = db.collection('checklistItems').doc(`checklist_${item.id}`);
        batch.set(itemRef, itemData);
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          logger.log(`Committed batch of ${batchCount} checklist items`);
          batchCount = 0;
        }
      }

      logger.log(`Processed checklist item: ${item.title} (${item.id})`);
    } catch (error) {
      logger.error(`Failed to migrate checklist item ${item.id}`, error);
    }
  }

  if (batchCount > 0 && !DRY_RUN) {
    await batch.commit();
    logger.log(`Committed final batch of ${batchCount} checklist items`);
  }

  logger.log(`Checklist items migration completed. Migrated ${rows.length} items`);
}

async function migrateEmergencyContacts(connection) {
  logger.log('Starting emergency contacts migration...');

  const [rows] = await connection.execute('SELECT * FROM emergency_contacts ORDER BY id');
  logger.log(`Found ${rows.length} emergency contacts to migrate`);

  const batch = db.batch();
  let batchCount = 0;

  for (const contact of rows) {
    try {
      const contactData = {
        id: `contact_${contact.id}`,
        name: contact.name,
        phone: contact.phone,
        email: contact.email || '',
        organization: contact.organization || '',
        type: contact.type || 'general',
        isActive: Boolean(contact.is_active),
        createdAt: convertTimestamp(contact.created_at),
        updatedAt: convertTimestamp(contact.updated_at)
      };

      if (!DRY_RUN) {
        const contactRef = db.collection('emergencyContacts').doc(`contact_${contact.id}`);
        batch.set(contactRef, contactData);
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          logger.log(`Committed batch of ${batchCount} emergency contacts`);
          batchCount = 0;
        }
      }

      logger.log(`Processed emergency contact: ${contact.name} (${contact.id})`);
    } catch (error) {
      logger.error(`Failed to migrate emergency contact ${contact.id}`, error);
    }
  }

  if (batchCount > 0 && !DRY_RUN) {
    await batch.commit();
    logger.log(`Committed final batch of ${batchCount} emergency contacts`);
  }

  logger.log(`Emergency contacts migration completed. Migrated ${rows.length} contacts`);
}

async function migrateFirstAidGuides(connection) {
  logger.log('Starting first aid guides migration...');

  const [rows] = await connection.execute('SELECT * FROM first_aid_guides ORDER BY guide_index');
  logger.log(`Found ${rows.length} first aid guides to migrate`);

  const batch = db.batch();
  let batchCount = 0;

  for (const guide of rows) {
    try {
      const guideData = {
        id: `guide_${guide.id}`,
        guideIndex: guide.guide_index,
        title: guide.title,
        description: guide.description || '',
        steps: parseJsonField(guide.steps) || [],
        category: guide.category || '',
        difficulty: guide.difficulty || 'beginner',
        estimatedTime: guide.estimated_time || '',
        createdAt: convertTimestamp(guide.created_at),
        updatedAt: convertTimestamp(guide.updated_at)
      };

      if (!DRY_RUN) {
        const guideRef = db.collection('firstAidGuides').doc(`guide_${guide.id}`);
        batch.set(guideRef, guideData);
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          logger.log(`Committed batch of ${batchCount} first aid guides`);
          batchCount = 0;
        }
      }

      logger.log(`Processed first aid guide: ${guide.title} (${guide.id})`);
    } catch (error) {
      logger.error(`Failed to migrate first aid guide ${guide.id}`, error);
    }
  }

  if (batchCount > 0 && !DRY_RUN) {
    await batch.commit();
    logger.log(`Committed final batch of ${batchCount} first aid guides`);
  }

  logger.log(`First aid guides migration completed. Migrated ${rows.length} guides`);
}

async function migrateHazardZones(connection) {
  logger.log('Starting hazard zones migration...');

  const [rows] = await connection.execute(`
    SELECT h.*, u.username
    FROM hazard_zones h
    LEFT JOIN users u ON h.created_by = u.id
    ORDER BY h.id
  `);
  logger.log(`Found ${rows.length} hazard zones to migrate`);

  const batch = db.batch();
  let batchCount = 0;

  for (const zone of rows) {
    try {
      const creatorFirebaseUid = userIdMapping.get(zone.created_by);

      const zoneData = {
        id: `zone_${zone.id}`,
        name: zone.name,
        description: zone.description || '',
        type: zone.type || 'general',
        severity: zone.severity || 'low',
        coordinates: parseJsonField(zone.coordinates) || [],
        radius: zone.radius || 0,
        isActive: Boolean(zone.is_active),
        createdBy: creatorFirebaseUid || '',
        createdAt: convertTimestamp(zone.created_at),
        updatedAt: convertTimestamp(zone.updated_at),
        creatorUsername: zone.username || 'Unknown'
      };

      if (!DRY_RUN) {
        const zoneRef = db.collection('hazardZones').doc(`zone_${zone.id}`);
        batch.set(zoneRef, zoneData);
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          logger.log(`Committed batch of ${batchCount} hazard zones`);
          batchCount = 0;
        }
      }

      logger.log(`Processed hazard zone: ${zone.name} (${zone.id})`);
    } catch (error) {
      logger.error(`Failed to migrate hazard zone ${zone.id}`, error);
    }
  }

  if (batchCount > 0 && !DRY_RUN) {
    await batch.commit();
    logger.log(`Committed final batch of ${batchCount} hazard zones`);
  }

  logger.log(`Hazard zones migration completed. Migrated ${rows.length} zones`);
}

async function migrateComments(connection) {
  logger.log('Starting comments migration...');

  const [rows] = await connection.execute(`
    SELECT c.*, u.username, u.avatar_url
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    ORDER BY c.id
  `);
  logger.log(`Found ${rows.length} comments to migrate`);

  const batch = db.batch();
  let batchCount = 0;

  for (const comment of rows) {
    try {
      const userFirebaseUid = userIdMapping.get(comment.user_id);
      if (!userFirebaseUid) {
        logger.error(`No Firebase UID found for user_id ${comment.user_id}`);
        continue;
      }

      const commentData = {
        id: `comment_${comment.id}`,
        postId: `post_${comment.post_id}`,
        userId: userFirebaseUid,
        content: comment.content,
        isDeleted: Boolean(comment.is_deleted),
        deletedBy: comment.deleted_by ? userIdMapping.get(comment.deleted_by) || '' : '',
        createdAt: convertTimestamp(comment.created_at),
        updatedAt: convertTimestamp(comment.updated_at),
        username: comment.username || 'Unknown',
        userAvatar: comment.avatar_url || ''
      };

      if (!DRY_RUN) {
        const commentRef = db.collection('comments').doc(`comment_${comment.id}`);
        batch.set(commentRef, commentData);
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          logger.log(`Committed batch of ${batchCount} comments`);
          batchCount = 0;
        }
      }

      logger.log(`Processed comment: ${comment.id}`);
    } catch (error) {
      logger.error(`Failed to migrate comment ${comment.id}`, error);
    }
  }

  if (batchCount > 0 && !DRY_RUN) {
    await batch.commit();
    logger.log(`Committed final batch of ${batchCount} comments`);
  }

  logger.log(`Comments migration completed. Migrated ${rows.length} comments`);
}

async function migrateLikes(connection) {
  logger.log('Starting likes migration...');

  const [rows] = await connection.execute('SELECT * FROM likes ORDER BY id');
  logger.log(`Found ${rows.length} likes to migrate`);

  const batch = db.batch();
  let batchCount = 0;

  for (const like of rows) {
    try {
      const userFirebaseUid = userIdMapping.get(like.user_id);
      if (!userFirebaseUid) {
        logger.error(`No Firebase UID found for user_id ${like.user_id}`);
        continue;
      }

      const likeData = {
        id: `like_${like.id}`,
        postId: `post_${like.post_id}`,
        userId: userFirebaseUid,
        createdAt: convertTimestamp(like.created_at)
      };

      if (!DRY_RUN) {
        const likeRef = db.collection('likes').doc(`like_${like.id}`);
        batch.set(likeRef, likeData);
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          logger.log(`Committed batch of ${batchCount} likes`);
          batchCount = 0;
        }
      }

      logger.log(`Processed like: ${like.id}`);
    } catch (error) {
      logger.error(`Failed to migrate like ${like.id}`, error);
    }
  }

  if (batchCount > 0 && !DRY_RUN) {
    await batch.commit();
    logger.log(`Committed final batch of ${batchCount} likes`);
  }

  logger.log(`Likes migration completed. Migrated ${rows.length} likes`);
}

async function migrateNotifications(connection) {
  logger.log('Starting notifications migration...');

  const [rows] = await connection.execute('SELECT * FROM notifications ORDER BY id');
  logger.log(`Found ${rows.length} notifications to migrate`);

  const batch = db.batch();
  let batchCount = 0;

  for (const notification of rows) {
    try {
      const userFirebaseUid = userIdMapping.get(notification.user_id);
      if (!userFirebaseUid) {
        logger.error(`No Firebase UID found for user_id ${notification.user_id}`);
        continue;
      }

      const notificationData = {
        id: `notification_${notification.id}`,
        userId: userFirebaseUid,
        type: notification.type || 'system',
        title: notification.title,
        message: notification.message,
        relatedId: notification.related_id || '',
        isRead: Boolean(notification.is_read),
        createdAt: convertTimestamp(notification.created_at)
      };

      if (!DRY_RUN) {
        const notificationRef = db.collection('notifications').doc(`notification_${notification.id}`);
        batch.set(notificationRef, notificationData);
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          logger.log(`Committed batch of ${batchCount} notifications`);
          batchCount = 0;
        }
      }

      logger.log(`Processed notification: ${notification.title} (${notification.id})`);
    } catch (error) {
      logger.error(`Failed to migrate notification ${notification.id}`, error);
    }
  }

  if (batchCount > 0 && !DRY_RUN) {
    await batch.commit();
    logger.log(`Committed final batch of ${batchCount} notifications`);
  }

  logger.log(`Notifications migration completed. Migrated ${rows.length} notifications`);
}

// Main migration function
async function runMigration() {
  logger.log('Starting database migration from MySQL to Firebase...');

  if (DRY_RUN) {
    logger.log('Running in DRY RUN mode - no data will be written to Firebase');
  }

  let connection;

  try {
    // Connect to MySQL
    connection = await mysql.createConnection(mysqlConfig);
    logger.log('Connected to MySQL database');

    // Run migrations in order (users first due to foreign key dependencies)
    await migrateUsers(connection);
    await migratePosts(connection);
    await migrateAlerts(connection);
    await migrateMapMarkers(connection);

    // Migrate remaining tables
    await migrateChecklistItems(connection);
    await migrateEmergencyContacts(connection);
    await migrateFirstAidGuides(connection);
    await migrateHazardZones(connection);
    await migrateComments(connection);
    await migrateLikes(connection);
    await migrateNotifications(connection);

    logger.log('Migration completed successfully!');

  } catch (error) {
    logger.error('Migration failed', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      logger.log('MySQL connection closed');
    }
    logger.summary();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runMigration,
  migrateUsers,
  migratePosts,
  migrateAlerts,
  migrateMapMarkers,
  migrateChecklistItems,
  migrateEmergencyContacts,
  migrateFirstAidGuides,
  migrateHazardZones,
  migrateComments,
  migrateLikes,
  migrateNotifications
};
