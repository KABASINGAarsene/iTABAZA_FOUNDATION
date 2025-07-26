-- =====================================================
-- DASHBOARD TABLES FOR DOCTOR AND PATIENT DASHBOARDS
-- =====================================================

-- =====================================================
-- 1. DOCUMENTS TABLE
-- =====================================================
-- Stores documents uploaded by doctors for patients
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Document Information
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('prescription', 'lab_result', 'exam_result', 'other')),
    document_url VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- Metadata
    description TEXT,
    is_accessible_to_patient BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. SUPPORT TICKETS TABLE
-- =====================================================
-- Stores support requests from doctors and patients
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- User Information
    user_id UUID, -- Can be patient or doctor
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('patient', 'doctor')),
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    
    -- Ticket Information
    ticket_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    
    -- Admin Response
    admin_response TEXT,
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. DOCTOR SESSIONS TABLE
-- =====================================================
-- Stores doctor login sessions for dashboard access
CREATE TABLE IF NOT EXISTS doctor_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_appointment ON documents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_documents_doctor ON documents(doctor_id);
CREATE INDEX IF NOT EXISTS idx_documents_patient ON documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Support tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_type ON support_tickets(ticket_type);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);

-- Doctor sessions indexes
CREATE INDEX IF NOT EXISTS idx_doctor_sessions_doctor ON doctor_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_sessions_token ON doctor_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_doctor_sessions_expires ON doctor_sessions(expires_at);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at 
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================
-- Enable RLS on new tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_sessions ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Doctors can manage their documents" ON documents 
    FOR ALL USING (true);

CREATE POLICY "Patients can read their documents" ON documents 
    FOR SELECT USING (true);

-- Support tickets policies
CREATE POLICY "Users can manage their support tickets" ON support_tickets 
    FOR ALL USING (true);

-- Doctor sessions policies
CREATE POLICY "Doctors can manage their sessions" ON doctor_sessions 
    FOR ALL USING (true);

-- =====================================================
-- DASHBOARD FUNCTIONS
-- =====================================================

-- Function to get doctor dashboard data
CREATE OR REPLACE FUNCTION get_doctor_dashboard_data(p_doctor_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_appointments', (
            SELECT COUNT(*) FROM appointments 
            WHERE doctor_id = p_doctor_id
        ),
        'pending_appointments', (
            SELECT COUNT(*) FROM appointments 
            WHERE doctor_id = p_doctor_id AND status = 'pending'
        ),
        'completed_appointments', (
            SELECT COUNT(*) FROM appointments 
            WHERE doctor_id = p_doctor_id AND status = 'completed'
        ),
        'today_appointments', (
            SELECT COUNT(*) FROM appointments 
            WHERE doctor_id = p_doctor_id AND appointment_date = CURRENT_DATE
        ),
        'upcoming_appointments', (
            SELECT COUNT(*) FROM appointments 
            WHERE doctor_id = p_doctor_id AND appointment_date > CURRENT_DATE
        ),
        'total_documents', (
            SELECT COUNT(*) FROM documents 
            WHERE doctor_id = p_doctor_id
        ),
        'support_tickets', (
            SELECT COUNT(*) FROM support_tickets 
            WHERE user_id = p_doctor_id AND user_type = 'doctor'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get patient dashboard data
CREATE OR REPLACE FUNCTION get_patient_dashboard_data(p_patient_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_appointments', (
            SELECT COUNT(*) FROM appointments 
            WHERE patient_id = p_patient_id
        ),
        'upcoming_appointments', (
            SELECT COUNT(*) FROM appointments 
            WHERE patient_id = p_patient_id AND appointment_date >= CURRENT_DATE
        ),
        'completed_appointments', (
            SELECT COUNT(*) FROM appointments 
            WHERE patient_id = p_patient_id AND status = 'completed'
        ),
        'pending_appointments', (
            SELECT COUNT(*) FROM appointments 
            WHERE patient_id = p_patient_id AND status = 'pending'
        ),
        'total_documents', (
            SELECT COUNT(*) FROM documents 
            WHERE patient_id = p_patient_id AND is_accessible_to_patient = true
        ),
        'support_tickets', (
            SELECT COUNT(*) FROM support_tickets 
            WHERE user_id = p_patient_id AND user_type = 'patient'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create support ticket
CREATE OR REPLACE FUNCTION create_support_ticket(
    p_user_id UUID,
    p_user_type VARCHAR(20),
    p_user_name VARCHAR(100),
    p_user_email VARCHAR(255),
    p_ticket_type VARCHAR(50),
    p_subject VARCHAR(255),
    p_description TEXT,
    p_priority VARCHAR(20) DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    ticket_id UUID;
BEGIN
    INSERT INTO support_tickets (
        user_id, user_type, user_name, user_email, ticket_type, 
        subject, description, priority
    ) VALUES (
        p_user_id, p_user_type, p_user_name, p_user_email, p_ticket_type,
        p_subject, p_description, p_priority
    ) RETURNING id INTO ticket_id;
    
    RETURN ticket_id;
END;
$$ LANGUAGE plpgsql;

-- Function to upload document
CREATE OR REPLACE FUNCTION upload_document(
    p_appointment_id UUID,
    p_doctor_id UUID,
    p_patient_id UUID,
    p_document_name VARCHAR(255),
    p_document_type VARCHAR(50),
    p_document_url VARCHAR(1000),
    p_file_size BIGINT,
    p_mime_type VARCHAR(100),
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    document_id UUID;
BEGIN
    INSERT INTO documents (
        appointment_id, doctor_id, patient_id, document_name, document_type,
        document_url, file_size, mime_type, description
    ) VALUES (
        p_appointment_id, p_doctor_id, p_patient_id, p_document_name, p_document_type,
        p_document_url, p_file_size, p_mime_type, p_description
    ) RETURNING id INTO document_id;
    
    RETURN document_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE documents IS 'Documents uploaded by doctors for patients';
COMMENT ON TABLE support_tickets IS 'Support requests from doctors and patients';
COMMENT ON TABLE doctor_sessions IS 'Doctor login sessions for dashboard access';

COMMENT ON COLUMN documents.document_type IS 'Type of document: prescription, lab_result, exam_result, other';
COMMENT ON COLUMN support_tickets.ticket_type IS 'Type of support request based on user type';
COMMENT ON COLUMN support_tickets.user_type IS 'Whether the user is a patient or doctor';
