-- Add password_hash column to doctors table
ALTER TABLE doctors ADD COLUMN password_hash VARCHAR(255);

-- Add default password hash for existing doctors (password: "doctor123")
UPDATE doctors 
SET password_hash = '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa' 
WHERE password_hash IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_doctors_password_hash ON doctors(password_hash);
