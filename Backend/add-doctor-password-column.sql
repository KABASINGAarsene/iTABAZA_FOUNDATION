-- Add password_hash column to doctors table for authentication
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add comment to document the column
COMMENT ON COLUMN doctors.password_hash IS 'Hashed password for doctor authentication';
