-- Drop existing columns (might fail if they don't exist, that's OK)
SET foreign_key_checks = 0;

ALTER TABLE users DROP COLUMN verification_token;
ALTER TABLE users DROP COLUMN verification_expires;
ALTER TABLE users DROP COLUMN email_verified;

-- Add columns with correct specifications
ALTER TABLE users
ADD COLUMN verification_token VARCHAR(255),
ADD COLUMN verification_expires DATETIME,
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

SET foreign_key_checks = 1; 