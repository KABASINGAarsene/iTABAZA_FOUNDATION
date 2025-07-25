const { supabase } = require('./config/db');
const { UserModel } = require('./models/user.model');
const { DoctorModel } = require('./models/doctor.model');
const { AppointmentModel } = require('./models/appointment.model');

async function debugAppointmentCreation() {
    console.log('🔍 Debugging appointment creation issue...\n');
    
    try {
        // Get a test user and doctor
        const users = await UserModel.findAll();
        const doctors = await DoctorModel.findAll();
        
        if (users.length === 0 || doctors.length === 0) {
            console.log('❌ No users or doctors found. Creating test data...');
            return;
        }
        
        const testUser = users[0];
        const testDoctor = doctors.find(d => d.status && d.is_available) || doctors[0];
        
        console.log('Using user:', testUser.first_name, testUser.id);
        console.log('Using doctor:', testDoctor.doctor_name, testDoctor.id);
        
        // Create a minimal appointment data object
        const appointmentData = {
            patient_id: testUser.id,
            doctor_id: testDoctor.id,
            patient_first_name: testUser.first_name,
            doc_first_name: testDoctor.doctor_name,
            age_of_patient: 25,
            gender: 'F',
            address: 'Test Address, Kigali',
            problem_description: 'Debug test appointment',
            appointment_date: '2024-07-25',
            appointment_time: '11:00',
            consultation_type: 'in-person',
            symptoms: ['test'],
            medical_history: 'None',
            medications: 'None',
            status: 'pending',
            payment_status: true,
            payment_transaction_id: 'DEBUG123',
            payment_simcard_holder: 'Debug Test',
            payment_phone_number: '+250123456789',
            payment_method: 'mobile-money',
            payment_amount: 6000.00,
            payment_currency: 'RWF',
            patient_email: testUser.email,
            patient_phone: testUser.mobile
        };
        
        console.log('\n1️⃣ Testing direct database insertion...');
        console.log('Appointment data:', {
            patient_id: appointmentData.patient_id,
            doctor_id: appointmentData.doctor_id,
            appointment_date: appointmentData.appointment_date,
            appointment_time: appointmentData.appointment_time
        });
        
        // Try direct supabase insertion
        const { data: directData, error: directError } = await supabase
            .from('appointments')
            .insert([appointmentData])
            .select();
        
        if (directError) {
            console.log('❌ Direct insertion failed:', directError.message);
            console.log('Error details:', directError);
            
            // Check if it's a missing column error
            if (directError.message.includes('column')) {
                console.log('\n🔍 Checking table schema...');
                const { data: schemaData, error: schemaError } = await supabase
                    .from('information_schema.columns')
                    .select('column_name')
                    .eq('table_name', 'appointments')
                    .eq('table_schema', 'public');
                
                if (!schemaError) {
                    console.log('Available columns:', schemaData.map(col => col.column_name));
                }
            }
        } else {
            console.log('✅ Direct insertion successful!');
            console.log('Created appointment:', directData[0].appointment_id || directData[0].id);
            
            // Test using the model
            console.log('\n2️⃣ Testing model creation...');
            try {
                const modelAppointment = await AppointmentModel.create({
                    ...appointmentData,
                    appointment_time: '14:00',  // Different time
                    payment_transaction_id: 'MODEL123'
                });
                console.log('✅ Model creation successful!');
                console.log('Model appointment ID:', modelAppointment.appointment_id || modelAppointment.id);
            } catch (modelError) {
                console.log('❌ Model creation failed:', modelError.message);
            }
        }
        
    } catch (error) {
        console.log('❌ Debug failed:', error.message);
        console.log('Full error:', error);
    }
}

debugAppointmentCreation().catch(console.error);
