# Firestore Data Model Design

## Overview
This document outlines the conversion from MySQL relational database to Firestore document-based model for the disaster management application.

## Collection Structure

### 1. users
**Document ID**: Firebase Auth UID (replaces MySQL auto-increment ID)
```javascript
{
  id: string,              // Firebase Auth UID
  username: string,
  email: string,
  role: 'user' | 'admin',
  emailVerified: boolean,
  status: 'active' | 'inactive' | 'suspended',
  phone: string,
  notifications: {
    push: boolean,
    email: boolean
  },
  location: string,
  emergencyContacts: [
    {
      name: string,
      phone: string,
      relation: string
    }
  ],
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLogin: timestamp,
  avatarUrl: string
}
```

### 2. posts
**Document ID**: Auto-generated
```javascript
{
  id: string,
  title: string,
  content: string,
  authorId: string,        // Reference to users collection
  authorAvatar: string,
  status: 'pending' | 'approved' | 'rejected',
  likes: number,
  imageUrl: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  // Denormalized author info for performance
  authorUsername: string,
  authorRole: string
}
```

### 3. alerts
**Document ID**: Auto-generated
```javascript
{
  id: string,
  title: string,
  message: string,
  type: 'emergency' | 'warning' | 'info',
  severity: 'low' | 'medium' | 'high' | 'critical',
  location: string,
  coordinates: {
    latitude: number,
    longitude: number
  },
  createdBy: string,       // Reference to users collection
  isActive: boolean,
  expiresAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  // Denormalized creator info
  creatorUsername: string
}
```

### 4. mapMarkers
**Document ID**: Auto-generated
```javascript
{
  id: string,
  title: string,
  description: string,
  type: 'incident' | 'resource' | 'shelter' | 'hazard',
  coordinates: {
    latitude: number,
    longitude: number
  },
  address: string,
  createdBy: string,       // Reference to users collection
  isActive: boolean,
  severity: 'low' | 'medium' | 'high',
  createdAt: timestamp,
  updatedAt: timestamp,
  // Denormalized creator info
  creatorUsername: string
}
```

### 5. checklistItems
**Document ID**: Auto-generated
```javascript
{
  id: string,
  userId: string,          // Reference to users collection
  itemId: string,          // Reference to default checklist items
  title: string,
  description: string,
  category: string,
  isCompleted: boolean,
  priority: 'low' | 'medium' | 'high',
  dueDate: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 6. emergencyContacts
**Document ID**: Auto-generated
```javascript
{
  id: string,
  name: string,
  phone: string,
  email: string,
  organization: string,
  type: 'police' | 'fire' | 'medical' | 'rescue' | 'government',
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 7. firstAidGuides
**Document ID**: Auto-generated
```javascript
{
  id: string,
  guideIndex: number,
  title: string,
  description: string,
  steps: [
    {
      stepNumber: number,
      instruction: string,
      imageUrl: string
    }
  ],
  category: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  estimatedTime: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 8. hazardZones
**Document ID**: Auto-generated
```javascript
{
  id: string,
  name: string,
  description: string,
  type: 'flood' | 'earthquake' | 'landslide' | 'fire' | 'storm',
  severity: 'low' | 'medium' | 'high' | 'critical',
  coordinates: [
    {
      latitude: number,
      longitude: number
    }
  ],
  radius: number,          // in meters
  isActive: boolean,
  createdBy: string,       // Reference to users collection
  createdAt: timestamp,
  updatedAt: timestamp,
  // Denormalized creator info
  creatorUsername: string
}
```

### 9. comments
**Document ID**: Auto-generated
```javascript
{
  id: string,
  postId: string,          // Reference to posts collection
  userId: string,          // Reference to users collection
  content: string,
  isDeleted: boolean,
  deletedBy: string,       // Reference to users collection
  createdAt: timestamp,
  updatedAt: timestamp,
  // Denormalized user info
  username: string,
  userAvatar: string
}
```

### 10. likes
**Document ID**: Auto-generated (or composite: userId_postId)
```javascript
{
  id: string,
  postId: string,          // Reference to posts collection
  userId: string,          // Reference to users collection
  createdAt: timestamp
}
```

### 11. notifications
**Document ID**: Auto-generated
```javascript
{
  id: string,
  userId: string,          // Reference to users collection
  type: 'post' | 'like' | 'comment' | 'alert' | 'system',
  title: string,
  message: string,
  relatedId: string,       // ID of related post, alert, etc.
  isRead: boolean,
  createdAt: timestamp
}
```

## Migration Strategy

### 1. Data Transformation Rules

#### User ID Mapping
- MySQL `users.id` → Firebase Auth UID
- Create a mapping table during migration to track old ID to new UID relationships
- Update all foreign key references to use new UIDs

#### Timestamp Conversion
- MySQL TIMESTAMP → Firestore Timestamp
- Handle timezone conversions appropriately

#### JSON Fields
- MySQL JSON columns → Firestore nested objects/arrays
- Parse and validate JSON data during migration

#### Enum Values
- Convert MySQL ENUM values to string literals
- Ensure consistency across all documents

### 2. Denormalization Strategy

#### Posts Collection
- Include author username and role for efficient querying
- Avoid joins by storing frequently accessed user data

#### Comments Collection
- Include user avatar and username for display
- Store post title for notification purposes

#### Alerts Collection
- Include creator username for attribution
- Store location data as nested object

### 3. Index Requirements

#### Composite Indexes
```
posts: [status, createdAt] (descending)
posts: [authorId, createdAt] (descending)
alerts: [isActive, severity, createdAt] (descending)
mapMarkers: [type, isActive, createdAt] (descending)
checklistItems: [userId, isCompleted]
notifications: [userId, isRead, createdAt] (descending)
likes: [postId, userId]
comments: [postId, createdAt] (descending)
```

#### Single Field Indexes
```
users: email, username, role
posts: status, authorId
alerts: type, severity, isActive
mapMarkers: type, createdBy
```

### 4. Security Considerations

#### Authentication
- Migrate user passwords to Firebase Auth
- Handle email verification status
- Preserve user roles and permissions

#### Data Access Rules
- Implement Firestore security rules
- Ensure users can only access their own data
- Admin-only access for sensitive operations

### 5. Migration Challenges

#### Relational Data
- Handle foreign key relationships through references
- Implement data consistency checks
- Plan for eventual consistency

#### Large Datasets
- Implement batch processing for large tables
- Use pagination for memory efficiency
- Monitor Firestore write limits

#### Data Integrity
- Validate data during migration
- Implement rollback procedures
- Create data verification scripts
