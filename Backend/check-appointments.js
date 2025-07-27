const { supabase } = require('./config/db');

async function checkAppointments() {
    try {
        // Check recent appointments
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('createdAt', { ascending: false })
            .limit(5);
        
        if (error) {
            console.error('Error fetching appointments:', error);
            return;
        }
        
        console.log('Recent appointments:');
        data.forEach((appointment, index) => {
            console.log(`\n--- Appointment ${index + 1} ---`);
            console.log('ID:', appointment.id);
            console.log('Patient ID:', appointment.patient_id);
            console.log('Doctor ID:', appointment.doctor_id);
            console.log('Patient Name:', appointment.patient_first_name);
            console.log('Patient Email:', appointment.patient_email);
            console.log('Status:', appointment.status);
            console.log('Created At:', appointment.createdAt);
        });
        
        // Check users table for comparison
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, first_name, email')
            .limit(3);
            
        if (!userError && users) {
            console.log('\n--- Sample Users ---');
            users.forEach((user, index) => {
                console.log(`User ${index + 1}: ID=${user.id}, Name=${user.first_name}, Email=${user.email}`);
            });
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAppointments();
