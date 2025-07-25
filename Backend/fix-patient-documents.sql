-- =====================================================
-- CREATE/FIX PATIENT DOCUMENTS TABLE
-- =====================================================

-- First, create the patient_documents table if it doesn't exist
-- Note: patient_id references users(id) since patient info is stored in users table
CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    document_category VARCHAR(50) DEFAULT 'medical',
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    description TEXT,
    medical_notes TEXT,
    doctor_comments TEXT,
    is_accessible_to_patient BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'active',
    document_date DATE DEFAULT CURRENT_DATE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table created with all required columns above

-- =====================================================
-- CREATE UPLOAD FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION upload_patient_document(
    p_patient_id UUID,
    p_doctor_id UUID,
    p_document_name VARCHAR(255),
    p_document_type VARCHAR(100),
    p_file_url VARCHAR(1000),
    p_file_name VARCHAR(255),
    p_file_size BIGINT,
    p_mime_type VARCHAR(100),
    p_appointment_id UUID DEFAULT NULL,
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
        medical_notes, doctor_comments, document_category, 
        is_accessible_to_patient, status, document_date
    ) VALUES (
        p_patient_id, p_doctor_id, p_appointment_id, p_document_name, p_document_type,
        p_file_url, p_file_name, p_file_size, p_mime_type, p_description,
        p_medical_notes, p_doctor_comments, p_document_category,
        TRUE, 'active', CURRENT_DATE
    ) RETURNING id INTO document_id;
    
    RETURN document_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE GET DOCUMENTS FUNCTION
-- =====================================================

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

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_doctor_id ON patient_documents(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_appointment_id ON patient_documents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_type ON patient_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_patient_documents_category ON patient_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_patient_documents_status ON patient_documents(status);
CREATE INDEX IF NOT EXISTS idx_patient_documents_accessible ON patient_documents(is_accessible_to_patient);
CREATE INDEX IF NOT EXISTS idx_patient_documents_date ON patient_documents(document_date);
CREATE INDEX IF NOT EXISTS idx_patient_documents_uploaded ON patient_documents(uploaded_at);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE patient_documents IS 'Patient medical documents storage with access control';
COMMENT ON COLUMN patient_documents.document_category IS 'Document category: medical, administrative, insurance';
COMMENT ON COLUMN patient_documents.is_accessible_to_patient IS 'Whether patient can view this document';
COMMENT ON COLUMN patient_documents.document_date IS 'Date when the medical document was originally created/issued';
COMMENT ON COLUMN patient_documents.status IS 'Document status: active, archived, deleted';

-- Schema fix completed successfully!
