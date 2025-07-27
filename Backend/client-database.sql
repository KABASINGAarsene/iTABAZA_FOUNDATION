-- =====================================================
-- CLIENT DASHBOARD ADDITIONAL TABLES
-- =====================================================
-- These tables are needed for full client dashboard functionality

-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_url VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    description TEXT,
    is_accessible_to_patient BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('patient', 'doctor', 'admin')),
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    ticket_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES admins(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create doctor_sessions table for authentication
CREATE TABLE IF NOT EXISTS doctor_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patient_sessions table for authentication
CREATE TABLE IF NOT EXISTS patient_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_patient ON documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_doctor ON documents(doctor_id);
CREATE INDEX IF NOT EXISTS idx_documents_appointment ON documents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_doctor_sessions_doctor ON doctor_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_sessions_patient ON patient_sessions(patient_id);

-- Add RLS policies for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own documents" ON documents 
    FOR SELECT USING (patient_id = auth.uid() OR doctor_id = auth.uid());
CREATE POLICY "Doctors can manage documents" ON documents 
    FOR ALL USING (doctor_id = auth.uid());
CREATE POLICY "Patients can view accessible documents" ON documents 
    FOR SELECT USING (patient_id = auth.uid() AND is_accessible_to_patient = TRUE);

-- Add RLS policies for support_tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tickets" ON support_tickets 
    FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all tickets" ON support_tickets 
    FOR ALL USING (true);

-- Add RLS policies for sessions
ALTER TABLE doctor_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can manage their own sessions" ON doctor_sessions 
    FOR ALL USING (doctor_id = auth.uid());

ALTER TABLE patient_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can manage their own sessions" ON patient_sessions 
    FOR ALL USING (patient_id = auth.uid());

-- Add triggers for updated_at columns
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at 
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for document management
CREATE OR REPLACE FUNCTION upload_document(
    p_appointment_id UUID,
    p_doctor_id UUID,
    p_patient_id UUID,
    p_document_name VARCHAR(255),
    p_document_type VARCHAR(100),
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

-- Function for support ticket creation
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

-- Function to get patient dashboard statistics
CREATE OR REPLACE FUNCTION get_patient_dashboard_stats(p_patient_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_appointments', (SELECT COUNT(*) FROM appointments WHERE patient_id = p_patient_id),
        'upcoming_appointments', (SELECT COUNT(*) FROM appointments WHERE patient_id = p_patient_id AND appointment_date >= CURRENT_DATE),
        'completed_appointments', (SELECT COUNT(*) FROM appointments WHERE patient_id = p_patient_id AND status = 'completed'),
        'pending_appointments', (SELECT COUNT(*) FROM appointments WHERE patient_id = p_patient_id AND status = 'pending'),
        'total_documents', (SELECT COUNT(*) FROM documents WHERE patient_id = p_patient_id AND is_accessible_to_patient = TRUE),
        'support_tickets', (SELECT COUNT(*) FROM support_tickets WHERE user_id = p_patient_id)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE documents IS 'Patient medical documents and reports';
COMMENT ON TABLE support_tickets IS 'Support tickets for patient and doctor assistance';
COMMENT ON TABLE doctor_sessions IS 'Doctor authentication sessions';
COMMENT ON TABLE patient_sessions IS 'Patient authentication sessions';
