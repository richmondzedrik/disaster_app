-- Check if columns exist
SET @exist_phone = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'phone'
);

SET @exist_notifications_email = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'notifications_email'
);

SET @exist_notifications_push = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'notifications_push'
);

SET @exist_updated_at = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'updated_at'
);

-- Add columns only if they don't exist
SET @add_phone = IF(@exist_phone = 0,
    'ALTER TABLE users ADD COLUMN phone VARCHAR(20)',
    'SELECT "phone column already exists"'
);

SET @add_notifications_email = IF(@exist_notifications_email = 0,
    'ALTER TABLE users ADD COLUMN notifications_email BOOLEAN DEFAULT true',
    'SELECT "notifications_email column already exists"'
);

SET @add_notifications_push = IF(@exist_notifications_push = 0,
    'ALTER TABLE users ADD COLUMN notifications_push BOOLEAN DEFAULT true',
    'SELECT "notifications_push column already exists"'
);

SET @add_updated_at = IF(@exist_updated_at = 0,
    'ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    'SELECT "updated_at column already exists"'
);

PREPARE stmt1 FROM @add_phone;
PREPARE stmt2 FROM @add_notifications_email;
PREPARE stmt3 FROM @add_notifications_push;
PREPARE stmt4 FROM @add_updated_at;

EXECUTE stmt1;
EXECUTE stmt2;
EXECUTE stmt3;
EXECUTE stmt4;

DEALLOCATE PREPARE stmt1;
DEALLOCATE PREPARE stmt2;
DEALLOCATE PREPARE stmt3;
DEALLOCATE PREPARE stmt4; 