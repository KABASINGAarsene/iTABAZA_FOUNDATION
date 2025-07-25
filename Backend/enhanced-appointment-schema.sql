-- MIGRATION: Create appointments table if not exists (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
        CREATE TABLE appointments (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            patient_id UUID REFERENCES users(id),
            doctor_id UUID REFERENCES doctors(id),
            patient_first_name VARCHAR(100) NOT NULL,
            doc_first_name VARCHAR(100) NOT NULL,
            age_of_patient INTEGER NOT NULL,
            gender VARCHAR(10) NOT NULL,
            address TEXT NOT NULL,
            problem_description TEXT NOT NULL,
            appointment_date VARCHAR(20) NOT NULL,
            appointment_time VARCHAR(20),
            consultation_type VARCHAR(20) DEFAULT 'in-person',
            symptoms TEXT[],
            medical_history TEXT,
            medications TEXT,
            status BOOLEAN DEFAULT FALSE,
            payment_status BOOLEAN DEFAULT FALSE,
            payment_transaction_id VARCHAR(100),
            payment_simcard_holder VARCHAR(100),
            payment_phone_number VARCHAR(20),
            payment_method VARCHAR(20),
            payment_amount DECIMAL(10,2),
            payment_currency VARCHAR(3) DEFAULT 'RWF',
            booking_source VARCHAR(20) DEFAULT 'web',
            patient_email VARCHAR(255),
            patient_phone VARCHAR(20),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);

-- Enhanced Appointments table with additional fields for improved booking system
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_time VARCHAR(20);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_type VARCHAR(20) DEFAULT 'in-person';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS symptoms TEXT[];
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS medical_history TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS medications TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_simcard_holder VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_owner_name VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_phone_number VARCHAR(20);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_currency VARCHAR(3) DEFAULT 'RWF';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booking_source VARCHAR(20) DEFAULT 'web';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_email VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_phone VARCHAR(20);

-- Create index for new fields
CREATE INDEX IF NOT EXISTS idx_appointments_consultation_type ON appointments(consultation_type);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);

-- Update the appointments table structure to be more comprehensive
-- This is a complete replacement for the appointments table if needed
/*
DROP TABLE IF EXISTS appointments CASCADE;

CREATE TABLE appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES users(id),
    doctor_id UUID REFERENCES doctors(id),
    patient_first_name VARCHAR(100) NOT NULL,
    doc_first_name VARCHAR(100) NOT NULL,
    age_of_patient INTEGER NOT NULL,
    gender VARCHAR(10) NOT NULL,
    address TEXT NOT NULL,
    problem_description TEXT NOT NULL,
    appointment_date VARCHAR(20) NOT NULL,
    appointment_time VARCHAR(20),
    consultation_type VARCHAR(20) DEFAULT 'in-person',
    symptoms TEXT[],
    medical_history TEXT,
    medications TEXT,
    status BOOLEAN DEFAULT FALSE,
    payment_status BOOLEAN DEFAULT FALSE,
    payment_transaction_id VARCHAR(100),
    payment_simcard_holder VARCHAR(100),
    payment_phone_number VARCHAR(20),
    payment_method VARCHAR(20),
    payment_amount DECIMAL(10,2),
    payment_currency VARCHAR(3) DEFAULT 'RWF',
    booking_source VARCHAR(20) DEFAULT 'web',
    patient_email VARCHAR(255),
    patient_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- Enhanced appointment creation function
CREATE OR REPLACE FUNCTION create_enhanced_appointment(
    p_patient_id UUID,
    p_doctor_id UUID,
    p_patient_first_name VARCHAR(100),
    p_doc_first_name VARCHAR(100),
    p_age_of_patient INTEGER,
    p_gender VARCHAR(10),
    p_address TEXT,
    p_problem_description TEXT,
    p_appointment_date VARCHAR(20),
    p_appointment_time VARCHAR(20),
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
    p_patient_phone VARCHAR(20) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    appointment_id UUID;
BEGIN
    INSERT INTO appointments (
        patient_id,
        doctor_id,
        patient_first_name,
        doc_first_name,
        age_of_patient,
        gender,
        address,
        problem_description,
        appointment_date,
        appointment_time,
        consultation_type,
        symptoms,
        medical_history,
        medications,
        payment_transaction_id,
        payment_simcard_holder,
        payment_phone_number,
        payment_method,
        payment_amount,
        payment_currency,
        patient_email,
        patient_phone,
        payment_status
    ) VALUES (
        p_patient_id,
        p_doctor_id,
        p_patient_first_name,
        p_doc_first_name,
        p_age_of_patient,
        p_gender,
        p_address,
        p_problem_description,
        p_appointment_date,
        p_appointment_time,
        p_consultation_type,
        p_symptoms,
        p_medical_history,
        p_medications,
        p_payment_transaction_id,
        p_payment_simcard_holder,
        p_payment_phone_number,
        p_payment_method,
        p_payment_amount,
        p_payment_currency,
        p_patient_email,
        p_patient_phone,
        CASE WHEN p_payment_transaction_id IS NOT NULL THEN TRUE ELSE FALSE END
    ) RETURNING id INTO appointment_id;
    
    RETURN appointment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get appointment statistics
CREATE OR REPLACE FUNCTION get_appointment_stats()
RETURNS TABLE(
    total_appointments BIGINT,
    pending_appointments BIGINT,
    completed_appointments BIGINT,
    video_call_appointments BIGINT,
    in_person_appointments BIGINT,
    total_revenue DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_appointments,
        COUNT(*) FILTER (WHERE status = FALSE)::BIGINT as pending_appointments,
        COUNT(*) FILTER (WHERE status = TRUE)::BIGINT as completed_appointments,
        COUNT(*) FILTER (WHERE consultation_type = 'video-call')::BIGINT as video_call_appointments,
        COUNT(*) FILTER (WHERE consultation_type = 'in-person')::BIGINT as in_person_appointments,
        COALESCE(SUM(payment_amount), 0) as total_revenue
    FROM appointments
    WHERE payment_status = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get appointments by consultation type
CREATE OR REPLACE FUNCTION get_appointments_by_type(p_consultation_type VARCHAR(20))
RETURNS TABLE(
    id UUID,
    patient_first_name VARCHAR(100),
    doc_first_name VARCHAR(100),
    appointment_date VARCHAR(20),
    appointment_time VARCHAR(20),
    consultation_type VARCHAR(20),
    status BOOLEAN,
    payment_status BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.patient_first_name,
        a.doc_first_name,
        a.appointment_date,
        a.appointment_time,
        a.consultation_type,
        a.status,
        a.payment_status,
        a.created_at
    FROM appointments a
    WHERE a.consultation_type = p_consultation_type
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for enhanced appointments
DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
CREATE POLICY "Users can create appointments" ON appointments
    FOR INSERT WITH CHECK (true);

-- Policy for viewing appointments with payment details
CREATE POLICY "Users can view their own appointments with payment details" ON appointments
    FOR SELECT USING (auth.uid()::text = patient_id::text);

-- Policy for updating payment information
CREATE POLICY "Users can update payment information" ON appointments
    FOR UPDATE USING (auth.uid()::text = patient_id::text)
    WITH CHECK (auth.uid()::text = patient_id::text);

-- Comments for documentation
COMMENT ON TABLE appointments IS 'Enhanced appointments table with comprehensive booking information';
COMMENT ON COLUMN appointments.consultation_type IS 'Type of consultation: in-person or video-call';
COMMENT ON COLUMN appointments.symptoms IS 'Array of selected symptoms';
COMMENT ON COLUMN appointments.payment_transaction_id IS 'Mobile money or bank transaction ID';
COMMENT ON COLUMN appointments.payment_simcard_holder IS 'Name on the simcard used for payment';
COMMENT ON COLUMN appointments.payment_amount IS 'Amount paid in the specified currency'; 