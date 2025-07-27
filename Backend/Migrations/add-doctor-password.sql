-- Add password field to doctors table for admin-managed login credentials
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Update existing doctors with a default hashed password
-- This is a temporary password that should be changed by the admin
UPDATE doctors 
SET password = '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa' 
WHERE password IS NULL;

-- Add index for password field
CREATE INDEX IF NOT EXISTS idx_doctors_password ON doctors(password);

-- Comment on the password field
COMMENT ON COLUMN doctors.password IS 'Hashed password for doctor login. Default password is "password123"';
