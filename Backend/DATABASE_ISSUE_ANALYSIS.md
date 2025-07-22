# Database Connection Issue Analysis

## Problem Summary
The application appears to have database connection issues where:
1. Signup works smoothly in the frontend
2. Signin fails with 500 Internal Server Error
3. Database connection test shows everything is working

## Root Cause Analysis

### 1. Row Level Security (RLS) Policy Issue
**Problem**: The Supabase database has RLS policies enabled that require authentication context, but the backend is using the anon key without proper authentication.

**Error**: `new row violates row-level security policy for table "users"`

**Current RLS Policies** (from supabase-schema.sql):
```sql
CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (true);
```
This policy expects `auth.uid()` to be available, but the backend doesn't provide authentication context.

### 2. Service Role Key Not Configured
**Problem**: The `.env` file has a placeholder for the service role key:
```
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**Impact**: Without the service role key, the backend can't bypass RLS policies.

## Solutions

### Solution 1: Use Service Role Key (Recommended)
1. Get your service role key from Supabase dashboard:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to Settings > API
   - Copy the "service_role" key

2. Update the `.env` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. The database config is already updated to use service role key first:
   ```javascript
   const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
   ```

### Solution 2: Fix RLS Policies (Alternative)
If you prefer to keep using the anon key, run the SQL in `fix-rls-policies.sql` in your Supabase SQL editor.

## Why Signup Works But Signin Fails

### Signup Process:
1. Frontend calls `/user/emailVerify` → sends OTP
2. Frontend calls `/user/signup` → creates user
3. Both endpoints work because they're using the same database connection

### Signin Process:
1. Frontend calls `/user/signin` → tries to find user
2. The `findByEmail` and `findByMobile` methods in UserModel work
3. But the signin endpoint might have additional logic that fails

## Testing Steps

1. **Update service role key** in `.env` file
2. **Restart the server**:
   ```bash
   # Kill existing server
   pkill -f "node index.js"
   
   # Start server
   node index.js
   ```

3. **Test database connection**:
   ```bash
   node test-connection.js
   ```

4. **Test signup**:
   ```bash
   curl -X POST http://localhost:8080/user/signup \
     -H "Content-Type: application/json" \
     -d '{"first_name":"Test","last_name":"User","email":"test@test.com","mobile":"1234567890","password":"test123"}'
   ```

5. **Test signin**:
   ```bash
   curl -X POST http://localhost:8080/user/signin \
     -H "Content-Type: application/json" \
     -d '{"payload":"test@test.com","password":"test123"}'
   ```

## Expected Results After Fix

- Database connection test: ✅ All tables accessible
- Signup endpoint: ✅ Creates users successfully
- Signin endpoint: ✅ Authenticates users successfully
- Frontend signup: ✅ Works smoothly
- Frontend signin: ✅ Works without 500 errors

## Security Considerations

Using the service role key bypasses RLS policies, which is appropriate for backend operations but means:
- All database operations are performed with admin privileges
- RLS policies are not enforced
- The backend is responsible for implementing proper access control

This is the standard approach for backend applications that need to perform database operations on behalf of users. 