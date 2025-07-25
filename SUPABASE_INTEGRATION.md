# Supabase Integration Guide for iTABAZA Hospital Management System

## Overview

This guide explains how to integrate Supabase (PostgreSQL database with real-time features) to replace MongoDB in the iTABAZA Hospital Management System. Supabase provides:

- **PostgreSQL Database**: Robust, scalable database
- **Real-time Subscriptions**: Live updates across the application
- **Row Level Security**: Built-in security policies
- **Auto-generated APIs**: RESTful and GraphQL APIs
- **Authentication**: Built-in auth system (optional)

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js**: Version 14 or higher
3. **Git**: For version control

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `iTABAZA-hospital`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
5. Click "Create new project"

### 2. Get Supabase Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (SUPABASE_URL)
   - **Anon Public Key** (SUPABASE_ANON_KEY)
   - **Service Role Key** (SUPABASE_SERVICE_ROLE_KEY)

### 3. Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `Backend/supabase-schema.sql`
3. Click "Run" to execute the schema

### 4. Configure Environment Variables

1. Copy `Backend/env.example` to `Backend/.env`
2. Update the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here

# Email Configuration
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Server Configuration
PORT=8080
NODE_ENV=development
```

### 5. Install Dependencies

```bash
cd Backend
npm install
```

### 6. Update Frontend Configuration

1. Open `Frontend/Scripts/supabase-client.js`
2. Replace the placeholder values:
   ```javascript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

## Database Schema Overview

### Tables

1. **users**: Patient/user information
2. **doctors**: Doctor profiles and availability
3. **appointments**: Appointment bookings
4. **departments**: Hospital departments
5. **admins**: Administrative users

### Key Features

- **UUID Primary Keys**: Secure, non-sequential IDs
- **Timestamps**: Automatic created_at and updated_at
- **Foreign Keys**: Proper relationships between tables
- **Array Fields**: Time slots stored as PostgreSQL arrays
- **Row Level Security**: Built-in access control

## Real-time Features

### Backend Real-time Endpoints

The following endpoints provide real-time subscriptions:

- `GET /user/realtime` - User changes
- `GET /doctor/realtime` - Doctor changes
- `GET /appointment/realtime` - Appointment changes
- `GET /department/realtime` - Department changes
- `GET /admin/realtime` - Dashboard updates

### Frontend Real-time Integration

```javascript
import { NotificationManager, DashboardRealtime } from './supabase-client.js';

// Initialize real-time notifications
const notificationManager = new NotificationManager();

// Initialize dashboard real-time updates
const dashboardRealtime = new DashboardRealtime();
```

## API Changes

### Updated Endpoints

All API endpoints now use Supabase models instead of Mongoose:

- **User Management**: `/user/*`
- **Doctor Management**: `/doctor/*`
- **Appointment Management**: `/appointment/*`
- **Department Management**: `/department/*`
- **Admin Dashboard**: `/admin/*`

### Response Format

Responses maintain the same format for backward compatibility:

```json
{
  "message": "Success message",
  "data": {...},
  "status": true
}
```

## Security Features

### Row Level Security (RLS)

- **Users**: Can only access their own data
- **Doctors**: Public read, admin-only write
- **Appointments**: Users see their own, admins see all
- **Departments**: Public read, admin-only write

### Authentication

- JWT-based authentication maintained
- Password hashing with bcrypt
- Token-based session management

## Migration from MongoDB

### Data Migration

If you have existing MongoDB data:

1. Export data from MongoDB:
   ```bash
   mongoexport --db iTABAZA --collection users --out users.json
   mongoexport --db iTABAZA --collection doctors --out doctors.json
   mongoexport --db iTABAZA --collection appointments --out appointments.json
   ```

2. Transform data to match Supabase schema
3. Import using Supabase dashboard or API

### Code Changes

- Models now use Supabase client instead of Mongoose
- Database queries use Supabase syntax
- Real-time subscriptions added for live updates

## Testing

### Health Check

Test the connection:

```bash
curl http://localhost:8080/api/health
```

Expected response:
```json
{
  "status": "Connected to Supabase",
  "data": [...]
}
```

### Real-time Testing

1. Open browser console
2. Subscribe to real-time updates
3. Make changes in another tab/window
4. Verify real-time notifications

## Deployment

### Environment Variables

Ensure all environment variables are set in your deployment platform:

- **Vercel**: Add to project settings
- **Heroku**: Use `heroku config:set`
- **Railway**: Add to environment variables
- **DigitalOcean**: Add to app configuration

### Database Backups

Supabase provides automatic backups, but you can also:

1. Use Supabase dashboard to export data
2. Set up automated backups via API
3. Use pg_dump for manual backups

## Troubleshooting

### Common Issues

1. **Connection Errors**:
   - Verify SUPABASE_URL and SUPABASE_ANON_KEY
   - Check network connectivity
   - Ensure project is active

2. **Permission Errors**:
   - Verify RLS policies
   - Check user authentication
   - Review API key permissions

3. **Real-time Not Working**:
   - Check WebSocket connectivity
   - Verify subscription setup
   - Review browser console for errors

### Debug Mode

Enable debug logging:

```javascript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    debug: true
  }
});
```

## Performance Optimization

### Database Indexes

The schema includes optimized indexes for:
- Email lookups
- Foreign key relationships
- Date-based queries
- Search operations

### Caching Strategy

- Use Supabase's built-in caching
- Implement client-side caching for static data
- Use Redis for session storage (optional)

## Monitoring

### Supabase Dashboard

Monitor your application through:
- **Database**: Query performance, connections
- **API**: Request logs, error rates
- **Auth**: User sessions, login attempts
- **Storage**: File uploads, bandwidth

### Custom Metrics

Track custom metrics:
- Appointment booking rates
- User registration trends
- Doctor availability patterns
- System response times

## Support

For additional help:

1. **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
2. **Community Forum**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
3. **Discord**: [discord.supabase.com](https://discord.supabase.com)

## Conclusion

This Supabase integration provides:

-  **Real-time functionality** for live updates
-  **Better performance** with PostgreSQL
-  **Enhanced security** with RLS
-  **Scalability** for growing applications
-  **Developer experience** with auto-generated APIs

The system maintains all existing functionality while adding powerful real-time features that enhance user experience and administrative efficiency. 