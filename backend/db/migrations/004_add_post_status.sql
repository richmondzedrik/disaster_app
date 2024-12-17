-- Check if status column exists
SET @exist_status = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'posts' 
    AND COLUMN_NAME = 'status'
);

-- Add column only if it doesn't exist
SET @add_status = IF(@exist_status = 0,
    'ALTER TABLE disaster_prep.posts 
     ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT "pending" 
     CHECK (status IN ("pending", "approved", "rejected"))',
    'SELECT "status column already exists"'
);

PREPARE stmt FROM @add_status;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing posts to be approved by default (only if we just added the column)
SET @update_status = IF(@exist_status = 0,
    'UPDATE disaster_prep.posts SET status = "approved" WHERE status = "pending"',
    'SELECT "no status update needed"'
);

PREPARE stmt2 FROM @update_status;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;