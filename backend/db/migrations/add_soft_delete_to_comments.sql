-- First, check if columns exist
SET @exist_deleted_by = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'comments' 
    AND COLUMN_NAME = 'deleted_by'
);

SET @exist_deletion_reason = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'comments' 
    AND COLUMN_NAME = 'deletion_reason'
);

SET @exist_deleted_at = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'comments' 
    AND COLUMN_NAME = 'deleted_at'
);

-- Add columns only if they don't exist
SET @add_deleted_by = IF(@exist_deleted_by = 0,
    'ALTER TABLE comments ADD COLUMN deleted_by INT NULL, ADD FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT "deleted_by column already exists"'
);

SET @add_deletion_reason = IF(@exist_deletion_reason = 0,
    'ALTER TABLE comments ADD COLUMN deletion_reason VARCHAR(255) NULL',
    'SELECT "deletion_reason column already exists"'
);

SET @add_deleted_at = IF(@exist_deleted_at = 0,
    'ALTER TABLE comments ADD COLUMN deleted_at DATETIME NULL',
    'SELECT "deleted_at column already exists"'
);

PREPARE stmt1 FROM @add_deleted_by;
PREPARE stmt2 FROM @add_deletion_reason;
PREPARE stmt3 FROM @add_deleted_at;

EXECUTE stmt1;
EXECUTE stmt2;
EXECUTE stmt3;

DEALLOCATE PREPARE stmt1;
DEALLOCATE PREPARE stmt2;
DEALLOCATE PREPARE stmt3;