const { supabase } = require('./Backend/config/db');

async function checkDatabase() {
    console.log('🔍 Checking database content...\n');
    
    try {
        // Check doctors
        console.log('👨‍⚕️ Checking doctors table:');
        const { data: doctors, error: doctorError } = await supabase
            .from('doctors')
            .select('id, doctor_name, email')
            .limit(5);
            
        if (doctorError) {
            console.log('❌ Error fetching doctors:', doctorError);
        } else {
            console.log(`Found ${doctors.length} doctors:`);
            doctors.forEach(doctor => {
                console.log(`  - ID: ${doctor.id}, Name: ${doctor.doctor_name}, Email: ${doctor.email}`);
            });
        }
        
        console.log('\n📅 Checking appointments table:');
        const { data: appointments, error: appointmentError } = await supabase
            .from('appointments')
            .select('id, patient_first_name, doctor_id, appointment_date, status')
            .limit(5);
            
        if (appointmentError) {
            console.log('❌ Error fetching appointments:', appointmentError);
        } else {
            console.log(`Found ${appointments.length} appointments:`);
            appointments.forEach(app => {
                console.log(`  - ID: ${app.id}, Patient: ${app.patient_first_name}, Doctor ID: ${app.doctor_id}, Date: ${app.appointment_date}, Status: ${app.status}`);
            });
        }
        
        console.log('\n🏥 Database schema check complete!');
        
    } catch (error) {
        console.log('❌ Database connection error:', error);
    }
    
    process.exit(0);
}

checkDatabase();
