const { supabase } = require('./config/db');
const jwt = require('jsonwebtoken');

async function testDoctorSupportTicket() {
    try {
        console.log(' Testing Doctor Support Ticket Functionality...\n');

        // First, get a real doctor from the database
        const { data: doctors, error: doctorError } = await supabase
            .from('doctors')
            .select('*')
            .eq('status', true)
            .limit(1);

        if (doctorError || !doctors || doctors.length === 0) {
            console.log(' No doctors found in database');
            return;
        }

        const doctor = doctors[0];
        console.log(' Found doctor:', {
            id: doctor.id,
            name: doctor.doctor_name,
            email: doctor.email
        });

        // Generate a valid JWT token for this doctor
        const token = jwt.sign(
            { 
                id: doctor.id, 
                email: doctor.email, 
                type: 'doctor' 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log(' Generated JWT token:', token.substring(0, 50) + '...');

        // Test creating a support ticket
        console.log('\n Testing support ticket creation...');
        
        const { data: ticketId, error: ticketError } = await supabase
            .rpc('create_support_ticket', {
                p_user_id: doctor.id,
                p_user_type: 'doctor',
                p_user_name: doctor.doctor_name,
                p_user_email: doctor.email,
                p_ticket_type: 'technical',
                p_subject: 'Dashboard Login Issue',
                p_description: 'Having trouble accessing the doctor dashboard features',
                p_priority: 'medium'
            });

        if (ticketError) {
            console.log(' Error creating support ticket:', ticketError);
            return;
        }

        console.log(' Support ticket created successfully!');
        console.log(' Ticket ID:', ticketId);

        // Query the created ticket
        const { data: tickets, error: queryError } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('id', ticketId);

        if (queryError) {
            console.log(' Error querying ticket:', queryError);
            return;
        }

        console.log(' Ticket details:', tickets[0]);

        // Test querying tickets by user
        console.log('\n🔍 Testing ticket retrieval by user...');
        const { data: userTickets, error: userTicketError } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('user_id', doctor.id)
            .eq('user_type', 'doctor')
            .order('created_at', { ascending: false });

        if (userTicketError) {
            console.log(' Error querying user tickets:', userTicketError);
            return;
        }

        console.log(` Found ${userTickets.length} tickets for doctor`);

        // Output instructions for frontend testing
        console.log('\n  FOR FRONTEND TESTING:');
        console.log('1. Store this doctor info in localStorage:');
        console.log(`   localStorage.setItem('doctorInfo', '${JSON.stringify({
            id: doctor.id,
            doctor_name: doctor.doctor_name,
            email: doctor.email,
            qualifications: doctor.qualifications
        })}');`);
        console.log('\n2. Store this token in localStorage:');
        console.log(`   localStorage.setItem('doctorToken', '${token}');`);
        console.log('\n3. Open the doctor dashboard and test support ticket creation');

    } catch (error) {
        console.error(' Test failed:', error);
    }
}

testDoctorSupportTicket();
