-- Supabase Database Schema for iTABAZA Hospital Management System

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table
CREATE TABLE departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    about TEXT,
    image VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctors table
CREATE TABLE doctors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    doctor_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    qualifications TEXT NOT NULL,
    experience VARCHAR(100) NOT NULL,
    phone_no VARCHAR(20) UNIQUE NOT NULL,
    city VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES departments(id),
    status BOOLEAN DEFAULT TRUE,
    image VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    april_11 TEXT[] DEFAULT ARRAY['11-12', '2-3', '4-5', '7-8'],
    april_12 TEXT[] DEFAULT ARRAY['11-12', '2-3', '4-5', '7-8'],
    april_13 TEXT[] DEFAULT ARRAY['11-12', '2-3', '4-5', '7-8'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    patient_first_name VARCHAR(100) NOT NULL,
    doc_first_name VARCHAR(100) NOT NULL,
    age_of_patient INTEGER NOT NULL,
    gender VARCHAR(10) NOT NULL,
    address TEXT NOT NULL,
    problem_description TEXT,
    appointment_date DATE NOT NULL,
    slot_time VARCHAR(20) NOT NULL,
    voice_recording_id UUID,
    status VARCHAR(50) DEFAULT 'pending',
    consultation_type VARCHAR(20) DEFAULT 'in-person',
    payment_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Recordings table
CREATE TABLE voice_recordings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL,
    duration INTEGER,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins table
CREATE TABLE admins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Departments policies (public read)
CREATE POLICY "Anyone can view departments" ON departments
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify departments" ON departments
    FOR ALL USING (auth.role() = 'admin');

-- Doctors policies
CREATE POLICY "Anyone can view doctors" ON doctors
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify doctors" ON doctors
    FOR ALL USING (auth.role() = 'admin');

-- Appointments policies
CREATE POLICY "Users can view their own appointments" ON appointments
    FOR SELECT USING (auth.uid()::text = patient_id::text);

CREATE POLICY "Users can create appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid()::text = patient_id::text);

CREATE POLICY "Users can update their own appointments" ON appointments
    FOR UPDATE USING (auth.uid()::text = patient_id::text);

CREATE POLICY "Admins can view all appointments" ON appointments
    FOR SELECT USING (auth.role() = 'admin');

-- Admins policies
CREATE POLICY "Only admins can access admin table" ON admins
    FOR ALL USING (auth.role() = 'admin');

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_doctors_email ON doctors(email);
CREATE INDEX idx_doctors_department ON doctors(department_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO departments (dept_name, about, image) VALUES
('Neurology', 'Specialized in nervous system disorders', 'https://example.com/neurology.jpg'),
('Cardiology', 'Heart and cardiovascular system specialists', 'https://example.com/cardiology.jpg'),
('Orthopedics', 'Bone and joint specialists', 'https://example.com/orthopedics.jpg'),
('Dermatology', 'Skin and hair specialists', 'https://example.com/dermatology.jpg'),
('Pediatrics', 'Child healthcare specialists', 'https://example.com/pediatrics.jpg');

-- Insert sample admin
INSERT INTO admins (name, email, password) VALUES
('Admin User', 'admin@iTABAZA.com', '$2b$10$hashedpasswordhere');

-- Add voice_recording_id foreign key to appointments table
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_voice_recording 
FOREIGN KEY (voice_recording_id) REFERENCES voice_recordings(id) ON DELETE SET NULL; 