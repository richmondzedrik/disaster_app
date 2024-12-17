-- First, check if columns exist
SET @exist_verification_token = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'verification_token'
);

SET @exist_verification_expires = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'verification_expires'
);

SET @exist_email_verified = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'email_verified'
);

-- Add columns only if they don't exist
SET @add_verification_token = IF(@exist_verification_token = 0,
    'ALTER TABLE users ADD COLUMN verification_token VARCHAR(255)',
    'SELECT "verification_token column already exists"'
);

SET @add_verification_expires = IF(@exist_verification_expires = 0,
    'ALTER TABLE users ADD COLUMN verification_expires DATETIME',
    'SELECT "verification_expires column already exists"'
);

SET @add_email_verified = IF(@exist_email_verified = 0,
    'ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE',
    'SELECT "email_verified column already exists"'
);

PREPARE stmt1 FROM @add_verification_token;
PREPARE stmt2 FROM @add_verification_expires;
PREPARE stmt3 FROM @add_email_verified;

EXECUTE stmt1;
EXECUTE stmt2;
EXECUTE stmt3;

DEALLOCATE PREPARE stmt1;
DEALLOCATE PREPARE stmt2;
DEALLOCATE PREPARE stmt3; 