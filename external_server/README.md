# Doctor Dashboard Server Setup

## Overview
This is a simple server setup to host the doctor dashboard at `http://0.0.0.0:3000/doctor-dashboard.html`.

## Quick Setup

1. **Install dependencies:**
   ```bash
   cd /tmp/external_server
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Access the dashboard:**
   - Open your browser and go to: `http://0.0.0.0:3000/doctor-dashboard.html`

## Features Implemented

### ✅ Dashboard Redirect
- The doctor dashboard is now accessible at `http://0.0.0.0:3000/doctor-dashboard.html`
- The old dashboard files are still available but the new URL is prioritized

### ✅ Support Ticket System
- **Database Connected**: Support tickets are stored in the `support_tickets` table in Supabase
- **Doctor Support Form**: Located in the Support section of the dashboard
- **Complete Integration**: When doctors submit support requests, they are automatically saved to the database

### ✅ Database Schema
The support tickets table structure matches your requirements:
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  user_type VARCHAR(20) CHECK (user_type IN ('patient', 'doctor', 'admin')),
  user_name VARCHAR(100) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  ticket_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### ✅ API Endpoints
- **Create Support Ticket**: `POST /api/dashboard/support/ticket`
- **Get Support Tickets**: `GET /api/dashboard/support/tickets/:userId?userType=doctor`

## Testing the Support System

1. **Start the main backend server** (on port 8080):
   ```bash
   cd /home/joe/Documents/Class-project/ITABAZA/Backend
   npm start
   ```

2. **Start the dashboard server** (on port 3000):
   ```bash
   cd /tmp/external_server
   npm start
   ```

3. **Test the Support Form**:
   - Navigate to `http://0.0.0.0:3000/doctor-dashboard.html`
   - Click on "Support" in the sidebar
   - Fill out the support form and submit
   - The ticket will be saved to the database

## Important Notes

- The backend server (port 8080) must be running for the dashboard to work properly
- The dashboard connects to the backend API for all data operations
- Support tickets are automatically associated with the logged-in doctor
- All form submissions are validated and stored in the Supabase database

## Database Functions Used

- `create_support_ticket()`: Creates new support tickets
- Support tickets are queried directly from the `support_tickets` table
- Full CRUD operations are available through the dashboard API
