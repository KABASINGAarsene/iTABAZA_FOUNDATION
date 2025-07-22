# ITABAZA Dashboard System Documentation

## Overview

The ITABAZA hospital management system now includes comprehensive dashboards for both doctors and patients with the following features:

##  Doctor Dashboard

### Access
- **URL**: `http://localhost:3000/doctor-dashboard-new.html`
- **Login**: Through existing doctor login system

### Features
1. **Three Sidebar Pages**:
   - **Appointments**: View and manage patient appointments
   - **Documents**: Upload and manage patient documents
   - **Support**: Submit support requests

2. **Dashboard Statistics**:
   - Total appointments
   - Pending appointments
   - Completed appointments
   - Today's appointments
   - Upcoming appointments
   - Total documents uploaded
   - Support tickets submitted

3. **Appointment Management**:
   - View appointment cards with patient details
   - Categorized by consultation type (in-person/virtual)
   - Expandable descriptions for detailed information
   - Status management (pending/confirmed/completed)
   - Patient contact information display

4. **Document Management**:
   - Upload documents for specific appointments
   - Categorize documents (prescription, lab results, exam results, other)
   - View all uploaded documents in table format
   - Link documents to specific patients and appointments

5. **Support System**:
   - Three support categories:
     - Appointment Support
     - Login Support
     - Dashboard Updating Support
   - Priority levels (low, medium, high, urgent)
   - Detailed problem descriptions

## 👤 Patient Dashboard

### Access
- **URL**: `http://localhost:3000/patient-dashboard-new.html`
- **Login**: Through existing patient login system

### Features
1. **Three Sidebar Pages**:
   - **Appointment Records**: View all booked appointments
   - **Documents**: Download documents from doctors
   - **Support**: Submit support requests

2. **Dashboard Statistics**:
   - Total appointments
   - Upcoming appointments
   - Available documents
   - Support tickets submitted

3. **Appointment Records**:
   - View all appointment history
   - Status indicators (pending, confirmed, completed)
   - Doctor information display
   - Appointment details (date, time, type)

4. **Document Access**:
   - Download documents uploaded by doctors
   - View document details (type, date, doctor)
   - Organized in table format for easy access

5. **Support System**:
   - Four support categories:
     - Appointment Issues
     - Login Issues
     - Payment Issues
     - Dashboard Updating Requests
   - Priority levels and detailed descriptions

##  Technical Implementation

### Backend API Endpoints

#### Doctor Endpoints
- `POST /api/dashboard/doctor/login` - Doctor authentication
- `GET /api/dashboard/doctor/:doctorId/dashboard` - Dashboard statistics
- `GET /api/dashboard/doctor/:doctorId/appointments` - Doctor appointments
- `POST /api/dashboard/doctor/:doctorId/documents/upload` - Upload documents
- `GET /api/dashboard/doctor/:doctorId/documents` - Get doctor documents
- `PUT /api/dashboard/appointment/:appointmentId/status` - Update appointment status

#### Patient Endpoints
- `GET /api/dashboard/patient/:patientId/dashboard` - Patient dashboard statistics
- `GET /api/dashboard/patient/:patientId/appointments` - Patient appointments
- `GET /api/dashboard/patient/:patientId/documents` - Patient documents

#### Support Endpoints
- `POST /api/dashboard/support/ticket` - Create support ticket
- `GET /api/dashboard/support/tickets/:userId` - Get user support tickets

### Database Schema

Currently working with existing tables:
- `users` - Patient information
- `doctors` - Doctor information
- `appointments` - Appointment records
- `departments` - Medical departments

### Future Enhancements

The following tables need to be created for full functionality:
- `documents` - Document storage and metadata
- `support_tickets` - Support request management
- `doctor_sessions` - Doctor authentication sessions

##  Getting Started

1. **Start the Backend Server**:
   ```bash
   cd Backend
   node index.js
   ```

2. **Access Doctor Dashboard**:
   - Go to `http://localhost:3000/doctor-dashboard-new.html`
   - Login with doctor credentials
   - You'll be redirected to the dashboard automatically

3. **Access Patient Dashboard**:
   - Go to `http://localhost:3000/login.html`
   - Login with patient credentials
   - Click on profile icon → Dashboard

##  Features Implemented

###  Currently Working
- Doctor and patient authentication
- Dashboard statistics display
- Appointment viewing and management
- Responsive design for mobile and desktop
- Real-time data fetching from Supabase
- Status updates for appointments

###  Pending (requires database table creation)
- Document upload and management
- Support ticket system
- File storage integration

##  Design Features

- **Responsive Design**: Works on all device sizes
- **Modern UI**: Clean, professional interface
- **Interactive Elements**: Expandable content, hover effects
- **Color Coding**: Different colors for appointment types and statuses
- **Real-time Updates**: Live data fetching and updates
- **Loading States**: Proper loading indicators

##  Security Features

- JWT-based authentication
- Session management
- Role-based access control
- Input validation and sanitization
- CORS protection

##  Analytics and Reporting

- Real-time statistics
- Appointment tracking
- Document management metrics
- Support ticket tracking

##  Configuration

All configuration is handled through environment variables in `Backend/.env`:
- Database connection (Supabase)
- JWT secrets
- Email configuration
- File upload settings

##  Troubleshooting

### Common Issues
1. **Database Connection**: Ensure Supabase credentials are correct
2. **Authentication**: Check JWT token validity
3. **File Uploads**: Verify file size and type restrictions
4. **CORS Issues**: Ensure proper CORS configuration

### Error Handling
- User-friendly error messages
- Proper HTTP status codes
- Detailed logging for debugging
- Graceful fallbacks for missing data

##  Development Notes

- Built with vanilla JavaScript (ES6+)
- Modular architecture with separate files
- RESTful API design
- Supabase integration for real-time capabilities
- Mobile-first responsive design

This dashboard system provides a comprehensive solution for hospital management with intuitive interfaces for both doctors and patients.
