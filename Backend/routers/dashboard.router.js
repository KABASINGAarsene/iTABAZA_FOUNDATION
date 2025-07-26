const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Allow common document types
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'));
        }
    }
});

// =====================================================
// DOCTOR AUTHENTICATION
// =====================================================

// Doctor login
router.post('/doctor/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email and password are required' 
            });
        }

        // Check if doctor exists and is active
        const { data: doctor, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('email', email)
            .eq('status', true)
            .single();

        if (error || !doctor) {
            console.log('Doctor not found or not approved:', email);
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials or doctor not approved' 
            });
        }

        // Check password - if password_hash exists, verify it
        let isValidPassword = false;
        if (doctor.password_hash) {
            // Use bcrypt to verify password
            isValidPassword = await bcrypt.compare(password, doctor.password_hash);
        } else {
            // Temporary fallback for doctors without passwords
            // In production, all doctors should have passwords
            console.warn('Doctor login without password hash - using fallback:', email);
            isValidPassword = true; // Remove this in production
        }

        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                doctorId: doctor.id, 
                id: doctor.id, // Add id for consistency
                email: doctor.email, 
                type: 'doctor' 
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '24h' }
        );

        // Try to save session to database (optional, might fail if table doesn't exist)
        try {
            const sessionData = {
                doctor_id: doctor.id,
                session_token: token,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            };

            await supabase
                .from('doctor_sessions')
                .insert([sessionData]);
        } catch (sessionError) {
            console.warn('Could not save doctor session (table might not exist):', sessionError.message);
            // Continue without saving session
        }

        // Return successful response with doctor data
        res.json({
            success: true,
            message: 'Login successful',
            token,
            doctor: {
                id: doctor.id,
                doctor_name: doctor.doctor_name,
                name: doctor.doctor_name, // For backward compatibility
                email: doctor.email,
                phone_no: doctor.phone_no,
                city: doctor.city,
                department_id: doctor.department_id,
                qualifications: doctor.qualifications,
                experience: doctor.experience,
                image: doctor.image,
                is_available: doctor.is_available,
                status: doctor.status
            }
        });
        
        console.log('Doctor login successful:', doctor.email, 'Name:', doctor.doctor_name);
        
    } catch (error) {
        console.error('Doctor login error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: 'Login failed due to server error'
        });
    }
});

// =====================================================
// DASHBOARD DATA ENDPOINTS
// =====================================================

// Get doctor dashboard data
router.get('/doctor/:doctorId/dashboard', async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Get basic statistics from existing tables
        const { data: appointments, error: appointmentError } = await supabase
            .from('appointments')
            .select('*')
            .eq('doctor_id', doctorId);

        if (appointmentError) {
            throw appointmentError;
        }

        const totalAppointments = appointments?.length || 0;
        const pendingAppointments = appointments?.filter(a => a.status === 'pending').length || 0;
        const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0;
        const todayAppointments = appointments?.filter(a => {
            const today = new Date().toISOString().split('T')[0];
            return a.appointment_date === today;
        }).length || 0;

        res.json({
            success: true,
            data: {
                total_appointments: totalAppointments,
                pending_appointments: pendingAppointments,
                completed_appointments: completedAppointments,
                today_appointments: todayAppointments,
                upcoming_appointments: appointments?.filter(a => {
                    const today = new Date().toISOString().split('T')[0];
                    return a.appointment_date > today;
                }).length || 0,
                total_documents: 0, // Will be updated once documents are uploaded
                support_tickets: 0 // Will be updated once support system is active
            }
        });
    } catch (error) {
        console.error('Error fetching doctor dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Get patient dashboard data
router.get('/patient/:patientId/dashboard', async (req, res) => {
    try {
        const { patientId } = req.params;

        // Get basic statistics from existing tables
        const { data: appointments, error: appointmentError } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', patientId);

        if (appointmentError) {
            throw appointmentError;
        }

        // Get documents count from patient_documents table
        const { data: documents, error: documentsError } = await supabase
            .from('patient_documents')
            .select('id')
            .eq('patient_id', patientId)
            .eq('status', 'active')
            .eq('is_accessible_to_patient', true);
        
        console.log(` Dashboard stats for patient ${patientId}: ${documents?.length || 0} documents`);

        if (documentsError) {
            console.error('Error fetching documents count:', documentsError);
        }

        // Get support tickets count (if support_tickets table exists)
        let supportTickets = [];
        try {
            const { data: tickets, error: supportError } = await supabase
                .from('support_tickets')
                .select('id')
                .eq('user_id', patientId)
                .eq('user_type', 'patient');
                
            if (!supportError) {
                supportTickets = tickets || [];
            } else {
                console.error('Support tickets table not available:', supportError.message);
            }
        } catch (supportErr) {
            console.error('Support tickets table not available:', supportErr.message);
        }

        const totalAppointments = appointments?.length || 0;
        const pendingAppointments = appointments?.filter(a => a.status === 'pending').length || 0;
        const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0;
        const upcomingAppointments = appointments?.filter(a => {
            const today = new Date().toISOString().split('T')[0];
            return a.appointment_date >= today;
        }).length || 0;

        res.json({
            success: true,
            data: {
                total_appointments: totalAppointments,
                upcoming_appointments: upcomingAppointments,
                pending_appointments: pendingAppointments,
                completed_appointments: completedAppointments,
                total_documents: documents?.length || 0,
                support_tickets: supportTickets?.length || 0
            }
        });
    } catch (error) {
        console.error('Error fetching patient dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// =====================================================
// APPOINTMENTS ENDPOINTS
// =====================================================

// Get doctor appointments
router.get('/doctor/:doctorId/appointments', async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        let query = supabase
            .from('appointments')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('appointment_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data: appointments, error } = await query
            .range((page - 1) * limit, page * limit - 1);

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: appointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: appointments.length
            }
        });
    } catch (error) {
        console.error('Error fetching doctor appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Get patient appointments
router.get('/patient/:patientId/appointments', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { status, page = 1, limit = 100 } = req.query;

        console.log(`[DEBUG] Fetching appointments for patientId: ${patientId}, status: ${status}, page: ${page}, limit: ${limit}`);

        // Simplified query to avoid complex joins that may fail
        let query = supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', patientId)
            .order('appointment_date', { ascending: false });

        if (status) {
            if (status === 'booked') {
                query = query.in('status', ['pending', 'confirmed']);
            } else {
                query = query.eq('status', status);
            }
        }

        const { data: appointments, error } = await query;

        if (error) {
            console.error('[ERROR] Supabase query error:', error);
            return res.status(500).json({ 
                success: false,
                error: 'Failed to fetch appointments', 
                details: error.message || error 
            });
        }

        // For each appointment, get doctor info separately if needed
        const enrichedAppointments = [];
        
        for (const appointment of appointments) {
            let enrichedAppointment = { ...appointment };
            
            // Try to get doctor info if doctor_id exists
            if (appointment.doctor_id) {
                try {
                    const { data: doctor, error: doctorError } = await supabase
                        .from('doctors')
                        .select('doctor_name, qualifications, department_id')
                        .eq('id', appointment.doctor_id)
                        .single();
                        
                    if (!doctorError && doctor) {
                        enrichedAppointment.doctor_info = doctor;
                    }
                } catch (doctorErr) {
                    console.warn(`Failed to fetch doctor info for appointment ${appointment.id}:`, doctorErr);
                }
            }
            
            enrichedAppointments.push(enrichedAppointment);
        }

        console.log(`[DEBUG] Successfully fetched ${enrichedAppointments.length} appointments for patient ${patientId}`);

        res.json({
            success: true,
            data: enrichedAppointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: enrichedAppointments.length
            }
        });
    } catch (error) {
        console.error('[ERROR] Unexpected error fetching patient appointments:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch appointments', 
            details: error.message || error.toString()
        });
    }
});

// Update appointment status
router.put('/appointment/:appointmentId/status', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', appointmentId)
            .select();

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: data[0]
        });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({ error: 'Failed to update appointment status' });
    }
});

// =====================================================
// DOCUMENTS ENDPOINTS
// =====================================================

// Upload document
router.post('/doctor/:doctorId/documents/upload', upload.single('document'), async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { appointmentId, patientId, documentType, description, documentCategory = 'medical', medicalNotes = '', doctorComments = '' } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Validate required fields
        if (!patientId || !documentType) {
            return res.status(400).json({ error: 'Patient ID and document type are required' });
        }

        // Upload file to Supabase Storage
        const fileName = `${Date.now()}_${file.originalname}`;
        const filePath = `patient-documents/${patientId}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('patient-documents')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('patient-documents')
            .getPublicUrl(filePath);

        // Save document record to patient_documents table using the stored function
        let documentData, dbError;
        
        try {
            const result = await supabase
                .rpc('upload_patient_document', {
                    p_patient_id: patientId,
                    p_doctor_id: doctorId,
                    p_appointment_id: appointmentId || null,
                    p_document_name: file.originalname,
                    p_document_type: documentType,
                    p_file_url: publicUrl,
                    p_file_name: fileName,
                    p_file_size: file.size,
                    p_mime_type: file.mimetype,
                    p_description: description || null,
                    p_medical_notes: medicalNotes || null,
                    p_doctor_comments: doctorComments || null,
                    p_document_category: documentCategory
                });
            documentData = result.data;
            dbError = result.error;
        } catch (funcError) {
            console.log('Function not available, using direct insert...');
            // Fallback: direct insert if function doesn't exist
            const insertResult = await supabase
                .from('patient_documents')
                .insert({
                    patient_id: patientId,
                    doctor_id: doctorId,
                    appointment_id: appointmentId || null,
                    document_name: file.originalname,
                    document_type: documentType,
                    file_url: publicUrl,
                    file_name: fileName,
                    file_size: file.size,
                    mime_type: file.mimetype,
                    description: description || null,
                    medical_notes: medicalNotes || null,
                    doctor_comments: doctorComments || null,
                    document_category: documentCategory || 'medical',
                    is_accessible_to_patient: true,
                    status: 'active',
                    document_date: new Date().toISOString().split('T')[0]
                })
                .select();
            
            documentData = insertResult.data?.[0]?.id;
            dbError = insertResult.error;
        }

        if (dbError) {
            console.error('Database error:', dbError);
            throw dbError;
        }

        res.json({
            success: true,
            message: 'Document uploaded successfully',
            documentId: documentData,
            data: {
                id: documentData,
                document_name: file.originalname,
                document_type: documentType,
                file_url: publicUrl,
                uploaded_at: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to upload document',
            details: error.message
        });
    }
});

// Get doctor documents
router.get('/doctor/:doctorId/documents', async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Query patient_documents table (not documents table)
        const { data: documents, error } = await supabase
            .from('patient_documents')
            .select(`
                id,
                document_name,
                document_type,
                document_category,
                file_url,
                file_size,
                description,
                document_date,
                uploaded_at,
                patient_id,
                doctors:doctor_id (
                    doctor_name,
                    qualifications
                ),
                appointments:appointment_id (
                    appointment_date
                ),
                users:patient_id (
                    first_name,
                    last_name
                )
            `)
            .eq('doctor_id', doctorId)
            .eq('status', 'active')
            .order('uploaded_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: documents || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: documents?.length || 0
            }
        });
    } catch (error) {
        console.error('Error fetching doctor documents:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch documents',
            details: error.message 
        });
    }
});

// Get patient documents from patient_documents table
router.get('/patient/:patientId/documents', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        console.log(` Fetching documents for patient ID: ${patientId}`);

        // Use the stored function to get documents with full details
        let documents, error;
        
        try {
            const result = await supabase
                .rpc('get_patient_documents', {
                    p_patient_id: patientId,
                    p_limit: parseInt(limit),
                    p_offset: (parseInt(page) - 1) * parseInt(limit)
                });
            documents = result.data;
            error = result.error;
            console.log(` Function returned ${documents?.length || 0} documents`);
        } catch (funcError) {
            console.log('Function not available, using direct query...');
            error = funcError;
        }

        if (error) {
            console.error('Error from get_patient_documents function:', error);
            // Fallback to direct table query if function fails
            const { data: fallbackDocuments, error: fallbackError } = await supabase
                .from('patient_documents')
                .select(`
                    id,
                    document_name,
                    document_type,
                    document_category,
                    file_url,
                    file_size,
                    description,
                    document_date,
                    uploaded_at,
                    doctors:doctor_id (
                        doctor_name,
                        qualifications
                    ),
                    appointments:appointment_id (
                        appointment_date
                    )
                `)
                .eq('patient_id', patientId)
                .eq('status', 'active')
                .eq('is_accessible_to_patient', true)
                .order('uploaded_at', { ascending: false })
                .range((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit) - 1);
            
            if (fallbackError) {
                console.error('Fallback query error:', fallbackError);
                throw fallbackError;
            }
            
            console.log(` Fallback query returned ${fallbackDocuments?.length || 0} documents`);
            
            return res.json({
                success: true,
                data: fallbackDocuments || [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: fallbackDocuments?.length || 0
                },
                source: 'fallback'
            });
        }

        res.json({
            success: true,
            data: documents || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: documents?.length || 0
            },
            source: 'function'
        });
    } catch (error) {
        console.error('Error fetching patient documents:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch documents',
            details: error.message 
        });
    }
});

// =====================================================
// SUPPORT TICKETS ENDPOINTS
// =====================================================

// Authentication middleware
const verifyAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Create support ticket
router.post('/support/ticket', verifyAuth, async (req, res) => {
    try {
        const { userId, userType, userName, userEmail, ticketType, subject, description, priority } = req.body;

        // Verify user can only create tickets for themselves
        if (req.user.id !== userId) {
            return res.status(403).json({ success: false, message: 'You can only create tickets for yourself' });
        }

        const { data: ticketId, error } = await supabase
            .rpc('create_support_ticket', {
                p_user_id: userId,
                p_user_type: userType,
                p_user_name: userName,
                p_user_email: userEmail,
                p_ticket_type: ticketType,
                p_subject: subject,
                p_description: description,
                p_priority: priority || 'medium'
            });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            message: 'Support ticket created successfully',
            ticketId: ticketId
        });
    } catch (error) {
        console.error('Error creating support ticket:', error);
        res.status(500).json({ error: 'Failed to create support ticket' });
    }
});

// Get user support tickets
router.get('/support/tickets/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { userType, page = 1, limit = 10 } = req.query;

        const { data: tickets, error } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('user_id', userId)
            .eq('user_type', userType)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: tickets.length
            }
        });
    } catch (error) {
        console.error('Error fetching support tickets:', error);
        res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
});

// Alternative support ticket creation without auth middleware for testing
router.post('/support/ticket-test', async (req, res) => {
    try {
        const { userId, userType, userName, userEmail, ticketType, subject, description, priority } = req.body;

        const { data: ticketId, error } = await supabase
            .rpc('create_support_ticket', {
                p_user_id: userId,
                p_user_type: userType,
                p_user_name: userName,
                p_user_email: userEmail,
                p_ticket_type: ticketType,
                p_subject: subject,
                p_description: description,
                p_priority: priority || 'medium'
            });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            message: 'Support ticket created successfully',
            ticketId: ticketId
        });
    } catch (error) {
        console.error('Error creating support ticket:', error);
        res.status(500).json({ error: 'Failed to create support ticket', details: error.message });
    }
});

module.exports = router;
