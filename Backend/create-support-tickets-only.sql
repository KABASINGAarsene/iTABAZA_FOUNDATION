-- Create support_tickets table immediately
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('patient', 'doctor', 'admin')),
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

-- Create support ticket function
CREATE OR REPLACE FUNCTION create_support_ticket(
    p_user_id VARCHAR(255),
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
