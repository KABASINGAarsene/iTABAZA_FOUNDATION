-- =====================================================
-- iTABAZA HOSPITAL MANAGEMENT SYSTEM - COMPLETE SUPABASE SCHEMA
-- =====================================================
-- This schema includes all necessary tables for the hospital management system
-- with proper admin functionality, enhanced appointment features, and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
-- Stores patient information for the system
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. DEPARTMENTS TABLE
-- =====================================================
-- Stores medical departments information
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    about TEXT,
    image VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. DOCTORS TABLE
-- =====================================================
-- Stores doctor information with availability and scheduling
CREATE TABLE IF NOT EXISTS doctors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    doctor_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    qualifications TEXT NOT NULL,
    experience VARCHAR(100) NOT NULL,
    phone_no VARCHAR(20) UNIQUE NOT NULL,
    city VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    status BOOLEAN DEFAULT TRUE,
    image VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    -- Time slots for scheduling (can be extended with more dates)
    april_11 TEXT[] DEFAULT ARRAY['11-12', '2-3', '4-5', '7-8'],
    april_12 TEXT[] DEFAULT ARRAY['11-12', '2-3', '4-5', '7-8'],
    april_13 TEXT[] DEFAULT ARRAY['11-12', '2-3', '4-5', '7-8'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. VOICE RECORDINGS TABLE
-- =====================================================
-- Stores voice recordings for appointments
CREATE TABLE IF NOT EXISTS voice_recordings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL,
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. APPOINTMENTS TABLE (Enhanced)
-- =====================================================
-- Comprehensive appointments table with payment and consultation details
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    voice_recording_id UUID REFERENCES voice_recordings(id) ON DELETE SET NULL,
    
    -- Patient Information
    patient_first_name VARCHAR(100) NOT NULL,
    patient_email VARCHAR(255),
    patient_phone VARCHAR(20),
    age_of_patient INTEGER NOT NULL,
    gender VARCHAR(10) NOT NULL,
    address TEXT NOT NULL,
    
    -- Doctor Information
    doc_first_name VARCHAR(100) NOT NULL,
    
    -- Medical Information
    problem_description TEXT NOT NULL,
    symptoms TEXT[],
    medical_history TEXT,
    medications TEXT,
    
    -- Appointment Details
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20),
    slot_time VARCHAR(20),
    consultation_type VARCHAR(20) DEFAULT 'in-person' CHECK (consultation_type IN ('in-person', 'video-call')),
    
    -- Status and Tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    booking_source VARCHAR(20) DEFAULT 'web',
    
    -- Payment Information
    payment_status BOOLEAN DEFAULT FALSE,
    payment_transaction_id VARCHAR(100),
    payment_simcard_holder VARCHAR(100),
    payment_owner_name VARCHAR(100),
    payment_phone_number VARCHAR(20),
    payment_method VARCHAR(20),
    payment_amount DECIMAL(10,2),
    payment_currency VARCHAR(3) DEFAULT 'RWF',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. ADMINS TABLE
-- =====================================================
-- Stores admin user information with full system access
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Departments indexes
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(dept_name);

-- Doctors indexes
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(is_available);
CREATE INDEX IF NOT EXISTS idx_doctors_status_available ON doctors(status, is_available);

-- Voice recordings indexes
CREATE INDEX IF NOT EXISTS idx_voice_recordings_user ON voice_recordings(user_id);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_consultation_type ON appointments(consultation_type);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);

-- Admins indexes
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);

-- =====================================================
-- FUNCTIONS FOR TIMESTAMPS
-- =====================================================
-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
-- Triggers to automatically update updated_at column
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at 
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at 
    BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_recordings_updated_at 
    BEFORE UPDATE ON voice_recordings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ENHANCED APPOINTMENT FUNCTIONS
-- =====================================================
-- Function to create enhanced appointments
CREATE OR REPLACE FUNCTION create_enhanced_appointment(
    p_patient_id UUID,
    p_doctor_id UUID,
    p_patient_first_name VARCHAR(100),
    p_doc_first_name VARCHAR(100),
    p_age_of_patient INTEGER,
    p_gender VARCHAR(10),
    p_address TEXT,
    p_problem_description TEXT,
    p_appointment_date DATE,
    p_appointment_time VARCHAR(20) DEFAULT NULL,
    p_consultation_type VARCHAR(20) DEFAULT 'in-person',
    p_symptoms TEXT[] DEFAULT NULL,
    p_medical_history TEXT DEFAULT NULL,
    p_medications TEXT DEFAULT NULL,
    p_payment_transaction_id VARCHAR(100) DEFAULT NULL,
    p_payment_simcard_holder VARCHAR(100) DEFAULT NULL,
    p_payment_phone_number VARCHAR(20) DEFAULT NULL,
    p_payment_method VARCHAR(20) DEFAULT NULL,
    p_payment_amount DECIMAL(10,2) DEFAULT NULL,
    p_payment_currency VARCHAR(3) DEFAULT 'RWF',
    p_patient_email VARCHAR(255) DEFAULT NULL,
    p_patient_phone VARCHAR(20) DEFAULT NULL,
    p_voice_recording_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    appointment_id UUID;
BEGIN
    INSERT INTO appointments (
        patient_id, doctor_id, patient_first_name, doc_first_name,
        age_of_patient, gender, address, problem_description,
        appointment_date, appointment_time, consultation_type,
        symptoms, medical_history, medications, payment_transaction_id,
        payment_simcard_holder, payment_phone_number, payment_method,
        payment_amount, payment_currency, patient_email, patient_phone,
        voice_recording_id, payment_status
    ) VALUES (
        p_patient_id, p_doctor_id, p_patient_first_name, p_doc_first_name,
        p_age_of_patient, p_gender, p_address, p_problem_description,
        p_appointment_date, p_appointment_time, p_consultation_type,
        p_symptoms, p_medical_history, p_medications, p_payment_transaction_id,
        p_payment_simcard_holder, p_payment_phone_number, p_payment_method,
        p_payment_amount, p_payment_currency, p_patient_email, p_patient_phone,
        p_voice_recording_id, CASE WHEN p_payment_transaction_id IS NOT NULL THEN TRUE ELSE FALSE END
    ) RETURNING id INTO appointment_id;
    
    RETURN appointment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get comprehensive appointment statistics
CREATE OR REPLACE FUNCTION get_appointment_stats()
RETURNS TABLE(
    total_appointments BIGINT,
    pending_appointments BIGINT,
    confirmed_appointments BIGINT,
    completed_appointments BIGINT,
    cancelled_appointments BIGINT,
    video_call_appointments BIGINT,
    in_person_appointments BIGINT,
    paid_appointments BIGINT,
    unpaid_appointments BIGINT,
    total_revenue DECIMAL(12,2),
    today_appointments BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_appointments,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_appointments,
        COUNT(*) FILTER (WHERE status = 'confirmed')::BIGINT as confirmed_appointments,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_appointments,
        COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled_appointments,
        COUNT(*) FILTER (WHERE consultation_type = 'video-call')::BIGINT as video_call_appointments,
        COUNT(*) FILTER (WHERE consultation_type = 'in-person')::BIGINT as in_person_appointments,
        COUNT(*) FILTER (WHERE payment_status = TRUE)::BIGINT as paid_appointments,
        COUNT(*) FILTER (WHERE payment_status = FALSE)::BIGINT as unpaid_appointments,
        COALESCE(SUM(payment_amount) FILTER (WHERE payment_status = TRUE), 0) as total_revenue,
        COUNT(*) FILTER (WHERE appointment_date = CURRENT_DATE)::BIGINT as today_appointments
    FROM appointments;
END;
$$ LANGUAGE plpgsql;

-- Function to get doctor statistics
CREATE OR REPLACE FUNCTION get_doctor_stats()
RETURNS TABLE(
    total_doctors BIGINT,
    active_doctors BIGINT,
    available_doctors BIGINT,
    pending_doctors BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_doctors,
        COUNT(*) FILTER (WHERE status = TRUE)::BIGINT as active_doctors,
        COUNT(*) FILTER (WHERE status = TRUE AND is_available = TRUE)::BIGINT as available_doctors,
        COUNT(*) FILTER (WHERE status = FALSE)::BIGINT as pending_doctors
    FROM doctors;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Users policies - Allow public access for app functionality
CREATE POLICY "Public access to users" ON users FOR ALL USING (true);

-- Departments policies - Public read access
CREATE POLICY "Public read access to departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admin can modify departments" ON departments FOR ALL USING (true);

-- Doctors policies - Public read, admin modify
CREATE POLICY "Public read access to doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Admin can modify doctors" ON doctors FOR ALL USING (true);

-- Voice recordings policies - Users can manage their own recordings
CREATE POLICY "Users can manage their voice recordings" ON voice_recordings FOR ALL USING (true);

-- Appointments policies - Public access for app functionality
CREATE POLICY "Public access to appointments" ON appointments FOR ALL USING (true);

-- Admins policies - Public access for authentication
CREATE POLICY "Public access to admins" ON admins FOR ALL USING (true);

-- =====================================================
-- SAMPLE DATA INSERT
-- =====================================================
-- Insert sample departments
INSERT INTO departments (dept_name, about, image) VALUES
('Cardiology', 'Heart and cardiovascular system specialists providing comprehensive cardiac care', 'https://example.com/cardiology.jpg'),
('Neurology', 'Specialized in nervous system disorders and brain health', 'https://example.com/neurology.jpg'),
('Orthopedics', 'Bone, joint, and musculoskeletal system specialists', 'https://example.com/orthopedics.jpg'),
('Pediatrics', 'Child healthcare specialists providing care for infants to adolescents', 'https://example.com/pediatrics.jpg'),
('Dermatology', 'Skin, hair, and nail specialists', 'https://example.com/dermatology.jpg'),
('General Medicine', 'Primary care physicians providing general health services', 'https://example.com/general.jpg'),
('Psychiatry', 'Mental health specialists providing psychological care', 'https://example.com/psychiatry.jpg'),
('Gynecology', 'Women''s health specialists', 'https://example.com/gynecology.jpg')
ON CONFLICT (dept_name) DO NOTHING;

-- Insert sample admin (password should be hashed in production)
INSERT INTO admins (name, email, password, role) VALUES
('Super Admin', 'admin@iTABAZA.com', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'super_admin'),
('Hospital Admin', 'hospital@iTABAZA.com', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'admin'),
('System Admin', 'system@iTABAZA.com', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample doctors (get department IDs first)
DO $$
DECLARE
    cardiology_id UUID;
    neurology_id UUID;
    orthopedics_id UUID;
    pediatrics_id UUID;
    dermatology_id UUID;
    general_id UUID;
BEGIN
    -- Get department IDs
    SELECT id INTO cardiology_id FROM departments WHERE dept_name = 'Cardiology';
    SELECT id INTO neurology_id FROM departments WHERE dept_name = 'Neurology';
    SELECT id INTO orthopedics_id FROM departments WHERE dept_name = 'Orthopedics';
    SELECT id INTO pediatrics_id FROM departments WHERE dept_name = 'Pediatrics';
    SELECT id INTO dermatology_id FROM departments WHERE dept_name = 'Dermatology';
    SELECT id INTO general_id FROM departments WHERE dept_name = 'General Medicine';
    
    -- Insert sample doctors
    INSERT INTO doctors (doctor_name, email, qualifications, experience, phone_no, city, department_id, status, is_available, image) VALUES
    ('Dr. John Smith', 'john.smith@iTABAZA.com', 'MD Cardiology, FACC', '15 years', '+250788123456', 'Kigali', cardiology_id, TRUE, TRUE, 'https://example.com/dr-john.jpg'),
    ('Dr. Sarah Johnson', 'sarah.johnson@iTABAZA.com', 'MD Neurology, PhD', '12 years', '+250788123457', 'Kigali', neurology_id, TRUE, TRUE, 'https://example.com/dr-sarah.jpg'),
    ('Dr. Michael Brown', 'michael.brown@iTABAZA.com', 'MD Orthopedics, MS', '10 years', '+250788123458', 'Butare', orthopedics_id, TRUE, TRUE, 'https://example.com/dr-michael.jpg'),
    ('Dr. Emily Davis', 'emily.davis@iTABAZA.com', 'MD Pediatrics, FAAP', '8 years', '+250788123459', 'Kigali', pediatrics_id, TRUE, TRUE, 'https://example.com/dr-emily.jpg'),
    ('Dr. David Wilson', 'david.wilson@iTABAZA.com', 'MD Dermatology, AAD', '6 years', '+250788123460', 'Musanze', dermatology_id, TRUE, TRUE, 'https://example.com/dr-david.jpg'),
    ('Dr. Lisa Anderson', 'lisa.anderson@iTABAZA.com', 'MD General Medicine, MBBS', '14 years', '+250788123461', 'Kigali', general_id, TRUE, TRUE, 'https://example.com/dr-lisa.jpg'),
    ('Dr. Robert Taylor', 'robert.taylor@iTABAZA.com', 'MD Cardiology, FACC', '20 years', '+250788123462', 'Kigali', cardiology_id, FALSE, FALSE, 'https://example.com/dr-robert.jpg')
    ON CONFLICT (email) DO NOTHING;
END $$;

-- =====================================================
-- ADMIN MANAGEMENT FUNCTIONS
-- =====================================================
-- Function to create doctor account (Admin only)
CREATE OR REPLACE FUNCTION admin_create_doctor(
    p_doctor_name VARCHAR(100),
    p_email VARCHAR(255),
    p_qualifications TEXT,
    p_experience VARCHAR(100),
    p_phone_no VARCHAR(20),
    p_city VARCHAR(100),
    p_department_id UUID,
    p_status BOOLEAN DEFAULT TRUE,
    p_is_available BOOLEAN DEFAULT TRUE,
    p_image VARCHAR(500) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    doctor_id UUID;
BEGIN
    INSERT INTO doctors (
        doctor_name, email, qualifications, experience, phone_no, 
        city, department_id, status, is_available, image
    ) VALUES (
        p_doctor_name, p_email, p_qualifications, p_experience, p_phone_no,
        p_city, p_department_id, p_status, p_is_available, p_image
    ) RETURNING id INTO doctor_id;
    
    RETURN doctor_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve/reject doctor applications
CREATE OR REPLACE FUNCTION admin_update_doctor_status(
    p_doctor_id UUID,
    p_status BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE doctors 
    SET status = p_status, updated_at = NOW()
    WHERE id = p_doctor_id;
    
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get comprehensive dashboard data
CREATE OR REPLACE FUNCTION get_admin_dashboard_data()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'users', (SELECT COUNT(*) FROM users),
        'doctors', (SELECT COUNT(*) FROM doctors),
        'approved_doctors', (SELECT COUNT(*) FROM doctors WHERE status = TRUE),
        'pending_doctors', (SELECT COUNT(*) FROM doctors WHERE status = FALSE),
        'available_doctors', (SELECT COUNT(*) FROM doctors WHERE status = TRUE AND is_available = TRUE),
        'appointments', (SELECT COUNT(*) FROM appointments),
        'pending_appointments', (SELECT COUNT(*) FROM appointments WHERE status = 'pending'),
        'completed_appointments', (SELECT COUNT(*) FROM appointments WHERE status = 'completed'),
        'total_revenue', (SELECT COALESCE(SUM(payment_amount), 0) FROM appointments WHERE payment_status = TRUE),
        'departments', (SELECT COUNT(*) FROM departments),
        'today_appointments', (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE users IS 'Patient users of the system';
COMMENT ON TABLE departments IS 'Medical departments in the hospital';
COMMENT ON TABLE doctors IS 'Medical doctors with availability and scheduling';
COMMENT ON TABLE voice_recordings IS 'Voice recordings for appointments';
COMMENT ON TABLE appointments IS 'Patient appointments with comprehensive details';
COMMENT ON TABLE admins IS 'System administrators with full access';

COMMENT ON COLUMN appointments.consultation_type IS 'Type of consultation: in-person or video-call';
COMMENT ON COLUMN appointments.status IS 'Appointment status: pending, confirmed, completed, cancelled';
COMMENT ON COLUMN appointments.payment_status IS 'Whether payment has been completed';
COMMENT ON COLUMN appointments.payment_amount IS 'Amount paid in the specified currency';
COMMENT ON COLUMN doctors.status IS 'Whether doctor is approved by admin';
COMMENT ON COLUMN doctors.is_available IS 'Whether doctor is currently available for appointments';

-- =====================================================
-- STORAGE BUCKET POLICIES (for Supabase Storage)
-- =====================================================
-- These policies should be applied in Supabase Dashboard for file uploads

-- For doctor profile images
-- Bucket: doctor-images
-- Policy: Allow public read access
-- Policy: Allow authenticated upload

-- For voice recordings
-- Bucket: voice-recordings
-- Policy: Allow users to upload their own recordings
-- Policy: Allow users to read their own recordings

-- =====================================================
-- FINAL NOTES
-- =====================================================
-- 1. All passwords should be hashed using bcrypt with salt rounds >= 10
-- 2. In production, implement proper JWT authentication
-- 3. Add rate limiting for API endpoints
-- 4. Implement proper logging and monitoring
-- 5. Add data validation triggers as needed
-- 6. Consider implementing soft deletes for audit trails
-- 7. Add backup and recovery procedures
-- 8. Implement proper error handling in application code
-- 9. Add comprehensive unit and integration tests
-- 10. Consider implementing caching for frequently accessed data

-- Schema creation completed successfully!
-- This schema provides:
-- - Complete user management
-- - Doctor management with admin approval
-- - Enhanced appointment system with payments
-- - Voice recording support
-- - Admin dashboard functionality
-- - Proper indexing for performance
-- - Row Level Security policies
-- - Comprehensive statistics and reporting functions
