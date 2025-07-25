# Unified Login Setup Instructions

## 1. Database Schema Update Required

You need to add the `password_hash` column to the doctors table in your Supabase dashboard:

### SQL to run in Supabase SQL Editor:

```sql
-- Add password_hash column to doctors table
ALTER TABLE doctors ADD COLUMN password_hash VARCHAR(255);

-- Add default password hash for existing doctors (password: "doctor123")  
UPDATE doctors 
SET password_hash = '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa' 
WHERE password_hash IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_doctors_password_hash ON doctors(password_hash);
```

## 2. Test the Unified Login System

### Available Endpoints:

- **POST /auth/login** - Unified login for all user types
- **POST /auth/register** - Unified registration for patients and doctors  
- **GET /auth/user-role** - Get current user's role and info
- **POST /auth/logout** - Logout

### Test Accounts:

#### Patient Login:
- **Email:** nishimwejoseph26@gmail.com
- **Password:** [your existing password]

#### Doctor Login (after adding password_hash column):
- **Email:** john.smith@iTABAZA.com
- **Password:** doctor123

#### Admin Login:
- **Email:** admin@iTABAZA.com  
- **Password:** [default admin password]

### Test Page:
Visit: `http://localhost:8080/unified-login.html`

## 3. How the Unified Login Works

1. **Single Login Endpoint**: `/auth/login` handles all user types
2. **Automatic User Type Detection**: Checks users → doctors → admins tables
3. **Role-Based Redirection**: 
   - Patients → `/patient-dashboard`
   - Doctors → `/doctor-dashboard`  
   - Admins → `/admin-dashboard`
4. **JWT Token**: Contains user type for frontend routing
5. **Backwards Compatibility**: Original endpoints still work

## 4. Frontend Integration

```javascript
// Login request
const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
});

const data = await response.json();

if (data.success) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userType', data.userType);
    window.location.href = data.dashboardUrl;
}
```

## 5. Current Status

✅ **Implemented:**
- Unified authentication router (`/auth/*` endpoints)
- Role-based login detection
- JWT tokens with user type
- Test login page
- Backwards compatibility with existing endpoints

⏳ **Still Needed:**
- Add `password_hash` column to doctors table in Supabase
- Update your existing login forms to use `/auth/login`
- Test with actual doctor accounts

## 6. Security Features

- Password hashing with bcrypt
- JWT tokens with expiration
- Role-based access control
- Input validation
- Error handling without revealing user existence
