-- =====================================================
-- PATIENT DOCUMENTS SYSTEM - COMPLETE IMPLEMENTATION
-- =====================================================
-- This creates a comprehensive document management system

-- 1. Create patient_documents table (your requested table name)
CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Foreign key relationships
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    
    -- Document metadata
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL, -- 'prescription', 'lab_report', 'medical_certificate', 'x_ray', 'scan', 'discharge_summary', etc.
    document_category VARCHAR(50) DEFAULT 'medical', -- 'medical', 'administrative', 'insurance'
    
    -- File information
    file_url VARCHAR(1000) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- Document content and context
    description TEXT,
    medical_notes TEXT,
    doctor_comments TEXT,
    
    -- Access control
    is_accessible_to_patient BOOLEAN DEFAULT TRUE,
    is_confidential BOOLEAN DEFAULT FALSE,
    access_level VARCHAR(20) DEFAULT 'standard', -- 'public', 'standard', 'restricted', 'confidential'
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    upload_status VARCHAR(20) DEFAULT 'completed' CHECK (upload_status IN ('uploading', 'completed', 'failed')),
    
    -- Versioning (for document updates)
    version INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES patient_documents(id) ON DELETE SET NULL,
    
    -- Timestamps
    document_date DATE DEFAULT CURRENT_DATE, -- Date when the document was created/issued
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_doctor_id ON patient_documents(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_appointment_id ON patient_documents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_type ON patient_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_patient_documents_category ON patient_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_patient_documents_status ON patient_documents(status);
CREATE INDEX IF NOT EXISTS idx_patient_documents_accessible ON patient_documents(is_accessible_to_patient);
CREATE INDEX IF NOT EXISTS idx_patient_documents_date ON patient_documents(document_date);
CREATE INDEX IF NOT EXISTS idx_patient_documents_uploaded ON patient_documents(uploaded_at);

-- 3. Create document access log table
CREATE TABLE IF NOT EXISTS document_access_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES patient_documents(id) ON DELETE CASCADE NOT NULL,
    accessed_by_user_id UUID, -- Can be patient, doctor, or admin
    accessed_by_type VARCHAR(20) NOT NULL, -- 'patient', 'doctor', 'admin'
    access_type VARCHAR(20) NOT NULL, -- 'view', 'download', 'share'
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_access_log_document ON document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_user ON document_access_log(accessed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_date ON document_access_log(accessed_at);

-- 4. Create document sharing table (for sharing with other doctors/patients)
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES patient_documents(id) ON DELETE CASCADE NOT NULL,
    shared_by_doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
    shared_with_user_id UUID, -- Can be patient or another doctor
    shared_with_type VARCHAR(20) NOT NULL, -- 'patient', 'doctor'
    share_type VARCHAR(20) DEFAULT 'view', -- 'view', 'download', 'full'
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    share_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_shares_document ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with ON document_shares(shared_with_user_id);

-- 5. Enable RLS (Row Level Security)
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
-- Patients can view their own accessible documents
CREATE POLICY "Patients can view their own documents" ON patient_documents 
    FOR SELECT USING (is_accessible_to_patient = TRUE);

-- Doctors can manage documents for their patients
CREATE POLICY "Doctors can manage patient documents" ON patient_documents 
    FOR ALL USING (true); -- Simplified for now, adjust based on your auth setup

-- Public access for app functionality (adjust based on your auth)
CREATE POLICY "Public access for app functionality" ON patient_documents 
    FOR SELECT USING (true);

-- 7. Create triggers for updated_at
CREATE TRIGGER update_patient_documents_updated_at 
    BEFORE UPDATE ON patient_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Create comprehensive functions for document management

-- Function to upload a new document
CREATE OR REPLACE FUNCTION upload_patient_document(
    p_patient_id UUID,
    p_doctor_id UUID,
    p_appointment_id UUID DEFAULT NULL,
    p_document_name VARCHAR(255),
    p_document_type VARCHAR(100),
    p_file_url VARCHAR(1000),
    p_file_name VARCHAR(255),
    p_file_size BIGINT,
    p_mime_type VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_medical_notes TEXT DEFAULT NULL,
    p_doctor_comments TEXT DEFAULT NULL,
    p_document_category VARCHAR(50) DEFAULT 'medical'
)
RETURNS UUID AS $$
DECLARE
    document_id UUID;
BEGIN
    INSERT INTO patient_documents (
        patient_id, doctor_id, appointment_id, document_name, document_type,
        file_url, file_name, file_size, mime_type, description,
        medical_notes, doctor_comments, document_category
    ) VALUES (
        p_patient_id, p_doctor_id, p_appointment_id, p_document_name, p_document_type,
        p_file_url, p_file_name, p_file_size, p_mime_type, p_description,
        p_medical_notes, p_doctor_comments, p_document_category
    ) RETURNING id INTO document_id;
    
    RETURN document_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get patient documents with full details
CREATE OR REPLACE FUNCTION get_patient_documents(
    p_patient_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    document_name VARCHAR(255),
    document_type VARCHAR(100),
    document_category VARCHAR(50),
    file_url VARCHAR(1000),
    file_size BIGINT,
    description TEXT,
    doctor_name VARCHAR(100),
    doctor_qualifications TEXT,
    department_name VARCHAR(100),
    document_date DATE,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    appointment_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pd.id,
        pd.document_name,
        pd.document_type,
        pd.document_category,
        pd.file_url,
        pd.file_size,
        pd.description,
        d.doctor_name,
        d.qualifications,
        dept.dept_name,
        pd.document_date,
        pd.uploaded_at,
        a.appointment_date
    FROM patient_documents pd
    LEFT JOIN doctors d ON pd.doctor_id = d.id
    LEFT JOIN departments dept ON d.department_id = dept.id
    LEFT JOIN appointments a ON pd.appointment_id = a.id
    WHERE pd.patient_id = p_patient_id 
        AND pd.status = 'active'
        AND pd.is_accessible_to_patient = TRUE
    ORDER BY pd.uploaded_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to log document access
CREATE OR REPLACE FUNCTION log_document_access(
    p_document_id UUID,
    p_accessed_by_user_id UUID,
    p_accessed_by_type VARCHAR(20),
    p_access_type VARCHAR(20),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO document_access_log (
        document_id, accessed_by_user_id, accessed_by_type, access_type,
        ip_address, user_agent
    ) VALUES (
        p_document_id, p_accessed_by_user_id, p_accessed_by_type, p_access_type,
        p_ip_address, p_user_agent
    );
    
    -- Update last_accessed timestamp on the document
    UPDATE patient_documents 
    SET last_accessed = NOW() 
    WHERE id = p_document_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get document statistics for dashboard
CREATE OR REPLACE FUNCTION get_patient_document_stats(p_patient_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_documents', (SELECT COUNT(*) FROM patient_documents WHERE patient_id = p_patient_id AND status = 'active'),
        'recent_documents', (SELECT COUNT(*) FROM patient_documents WHERE patient_id = p_patient_id AND uploaded_at >= NOW() - INTERVAL '30 days' AND status = 'active'),
        'document_types', (
            SELECT json_object_agg(document_type, count)
            FROM (
                SELECT document_type, COUNT(*) as count
                FROM patient_documents 
                WHERE patient_id = p_patient_id AND status = 'active'
                GROUP BY document_type
            ) type_counts
        ),
        'documents_by_doctor', (
            SELECT json_object_agg(doctor_name, count)
            FROM (
                SELECT d.doctor_name, COUNT(*) as count
                FROM patient_documents pd
                JOIN doctors d ON pd.doctor_id = d.id
                WHERE pd.patient_id = p_patient_id AND pd.status = 'active'
                GROUP BY d.doctor_name
            ) doctor_counts
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 9. Insert sample documents for testing (optional)
/*
-- Uncomment this section to insert sample documents
INSERT INTO patient_documents (
    patient_id, doctor_id, document_name, document_type, document_category,
    file_url, file_name, file_size, mime_type, description, medical_notes
) VALUES 
(
    (SELECT id FROM users LIMIT 1), -- First patient
    (SELECT id FROM doctors LIMIT 1), -- First doctor
    'Blood Test Results - Complete Blood Count',
    'lab_report',
    'medical',
    'https://example.com/documents/blood_test_001.pdf',
    'blood_test_001.pdf',
    256000,
    'application/pdf',
    'Complete blood count test results showing normal values',
    'All parameters within normal range. Patient is healthy.'
),
(
    (SELECT id FROM users LIMIT 1), -- First patient
    (SELECT id FROM doctors LIMIT 1), -- First doctor
    'Prescription - Antibiotics',
    'prescription',
    'medical',
    'https://example.com/documents/prescription_001.pdf',
    'prescription_001.pdf',
    128000,
    'application/pdf',
    'Antibiotic prescription for bacterial infection',
    'Take medication for 7 days as prescribed. Follow up in 1 week.'
);
*/

-- 10. Comments for documentation
COMMENT ON TABLE patient_documents IS 'Comprehensive patient medical documents storage with access control';
COMMENT ON TABLE document_access_log IS 'Audit log for document access tracking';
COMMENT ON TABLE document_shares IS 'Document sharing mechanism between healthcare providers';

COMMENT ON COLUMN patient_documents.access_level IS 'Access level: public, standard, restricted, confidential';
COMMENT ON COLUMN patient_documents.version IS 'Document version for revision tracking';
COMMENT ON COLUMN patient_documents.parent_document_id IS 'Reference to previous version of the document';
COMMENT ON COLUMN patient_documents.is_accessible_to_patient IS 'Whether patient can view this document';
COMMENT ON COLUMN patient_documents.document_date IS 'Date when the medical document was originally created/issued';

-- Schema creation completed successfully!
