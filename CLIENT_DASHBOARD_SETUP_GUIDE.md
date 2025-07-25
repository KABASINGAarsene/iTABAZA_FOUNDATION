# Client Dashboard Database Connection Guide

##  Current Status

Your ITABAZA hospital management system is properly connected to Supabase with the following status:

- ** Database Connection**: Working
- ** Core Tables**: users, departments, doctors, appointments, voice_recordings, admins
- ** Backend Server**: Running on port 8080
- ** Missing Tables**: documents, support_tickets, doctor_sessions, patient_sessions

##  Complete Setup Instructions

### Step 1: Create Missing Database Tables

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com/project/ffajyjqtidprerlmebvf
   - Navigate to **SQL Editor**

2. **Execute Safe SQL**
   - Copy the contents of `Backend/client-database-safe.sql`
   - Paste into a new SQL query
   - Click **Run** to execute

3. **Verify Tables Created**
   ```bash
   cd Backend
   node setup-database.js
   ```

### Step 2: Update API Endpoints

Your dashboard router has been updated to support:

- ** Patient dashboard statistics**
- ** Patient appointments management** 
- ** Document management** (once tables are created)
- ** Support ticket system** (once tables are created)
- ** Real-time data updates**

### Step 3: Client Dashboard Features

#### Available API Endpoints:

**Dashboard Data:**
```
GET /api/dashboard/patient/{patientId}/dashboard
GET /api/dashboard/patient/{patientId}/appointments
GET /api/dashboard/patient/{patientId}/documents
```

**Support System:**
```
POST /api/dashboard/support/ticket
GET /api/dashboard/support/tickets/{userId}
```

**Appointment Management:**
```
PUT /api/dashboard/appointment/{appointmentId}/status
```

#### Frontend Integration:

The patient dashboard JavaScript (`Backend/Frontend/Scripts/patient-dashboard-new.js`) includes:

- ** Proper authentication headers**
- ** Real-time dashboard statistics**
- ** Appointment cards with status badges**
- ** Document viewing and downloading**
- ** Support ticket submission**
- ** Error handling and loading states**

### Step 4: Appointment Booking Flow

**How appointments are correctly recorded:**

1. **User books appointment** → `POST /appointment/create/{doctorId}`
2. **Data saved to database** with proper status: `'pending'`
3. **Email confirmation sent** to patient
4. **Dashboard displays** appointment in real-time
5. **Doctor can manage** appointment status via doctor dashboard

#### Appointment Status Flow:
```
pending → confirmed → completed
     ↘ cancelled
```

### Step 5: Testing the Setup

#### Test Database Connection:
```bash
cd Backend
curl http://localhost:8080/api/health
```

#### Test Patient Dashboard:
```bash
# Get sample patient ID from users table
curl http://localhost:8080/api/dashboard/patient/{PATIENT_ID}/dashboard
```

#### Test Appointment Creation:
- Use the frontend booking form
- Check if appointment appears in patient dashboard
- Verify email notification is sent

### Step 6: Frontend Client Dashboard

**File Locations:**
- **Main Dashboard**: `Backend/Frontend/patient-dashboard-new.html`
- **Dashboard Script**: `Backend/Frontend/Scripts/patient-dashboard-new.js`
- **Alternative Dashboard**: `Frontend/client-dashboard.html`

**Features Available:**
- ** Dashboard Statistics**: Total appointments, upcoming, documents, support tickets
- ** Appointment Management**: View appointments with status and type badges
- ** Document Access**: View and download medical documents
- ** Support System**: Submit and track support tickets
- ** Real-time Updates**: Auto-refresh functionality

### Step 7: Authentication Flow

**Patient Login Process:**
1. Patient logs in via `/user/login`
2. JWT token stored in `localStorage.patientToken`
3. Patient info stored in `localStorage.patientInfo`
4. Dashboard uses patient-specific auth headers
5. All API calls include proper authorization

### Step 8: Database Schema Summary

**Core Tables ( Existing):**
- `users` - Patient information
- `doctors` - Doctor profiles and availability
- `appointments` - Appointment bookings and management
- `departments` - Medical departments
- `voice_recordings` - Audio recordings for appointments
- `admins` - System administrators

**Additional Tables ( Need to be created):**
- `documents` - Medical documents and reports
- `support_tickets` - Support and help desk tickets
- `doctor_sessions` - Doctor authentication sessions
- `patient_sessions` - Patient authentication sessions

##  Configuration Details

### Environment Variables (`.env`):
```
SUPABASE_URL=https://ffajyjqtidprerlmebvf.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
PORT=8080
```

### API Base URL:
```javascript
const baseURL = 'http://localhost:8080';
```

##  Important Notes

1. **Appointment Status**: Fixed to use proper enum values (`'pending'`, `'confirmed'`, `'completed'`, `'cancelled'`) instead of boolean
2. **Authentication**: Patient dashboard uses separate auth headers for security
3. **Real-time Updates**: Dashboard refreshes automatically on page load and manual refresh
4. **Error Handling**: Comprehensive error messages and loading states
5. **Document Security**: RLS policies ensure patients only see their own documents

##  Verification Checklist

- [ ] Database tables created successfully
- [ ] Backend server running on port 8080
- [ ] Patient can log in and see dashboard
- [ ] Appointments display correctly
- [ ] Document system functional (after table creation)
- [ ] Support ticket system working (after table creation)
- [ ] Email notifications sending
- [ ] All API endpoints responding

##  Next Steps

1. **Execute the safe SQL** to create missing tables
2. **Test patient login** and dashboard functionality
3. **Create sample appointments** to test the flow
4. **Upload sample documents** to test document management
5. **Submit test support tickets** to verify support system

##  Troubleshooting

**Common Issues:**

1. **"Table does not exist" errors** → Run the safe SQL file
2. **"Trigger already exists" errors** → Use `client-database-safe.sql` instead
3. **Authentication failures** → Check JWT_SECRET and token storage
4. **CORS errors** → Ensure frontend and backend URLs match
5. **Email not sending** → Verify EMAIL_USER and EMAIL_PASS in .env

Your system is well-structured and ready for production use once the missing tables are created!
