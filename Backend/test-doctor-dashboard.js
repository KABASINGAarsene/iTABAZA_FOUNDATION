const { supabase } = require('./config/db');
const { AppointmentModel } = require('./models/appointment.model');
const { DoctorModel } = require('./models/doctor.model');

async function testDoctorDashboardConnection() {
    console.log(' Testing Doctor Dashboard Supabase Connection...\n');

    try {
        // Test 1: Check Supabase connection
        console.log('1. Testing Supabase connection...');
        const { data: testData, error: testError } = await supabase
            .from('doctors')
            .select('*')
            .limit(1);
        
        if (testError) {
            throw new Error(`Supabase connection failed: ${testError.message}`);
        }
        console.log(' Supabase connection successful');

        // Test 2: Get sample doctor
        console.log('\n2. Testing doctor retrieval...');
        const doctors = await DoctorModel.findAll();
        if (!doctors || doctors.length === 0) {
            console.log('  No doctors found in database');
            return;
        }
        
        const sampleDoctor = doctors[0];
        console.log(` Found doctor: ${sampleDoctor.doctor_name} (ID: ${sampleDoctor.id})`);

        // Test 3: Get appointments for doctor
        console.log('\n3. Testing appointment retrieval by doctor...');
        const appointments = await AppointmentModel.findByDoctorId(sampleDoctor.id);
        console.log(` Found ${appointments.length} appointments for doctor ${sampleDoctor.doctor_name}`);

        // Test 4: Test appointment statistics
        console.log('\n4. Testing appointment statistics...');
        if (appointments.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const stats = {
                total: appointments.length,
                today: appointments.filter(app => app.appointment_date === today).length,
                pending: appointments.filter(app => app.status === 'pending').length,
                confirmed: appointments.filter(app => app.status === 'confirmed').length,
                completed: appointments.filter(app => app.status === 'completed').length,
                cancelled: appointments.filter(app => app.status === 'cancelled').length
            };
            console.log(' Statistics calculated:', stats);
        } else {
            console.log('  No appointments to calculate statistics');
        }

        // Test 5: Test appointment data structure
        console.log('\n5. Testing appointment data structure...');
        if (appointments.length > 0) {
            const sampleAppointment = appointments[0];
            const requiredFields = [
                'id', 'patient_id', 'doctor_id', 'patient_first_name', 
                'appointment_date', 'status', 'payment_status', 'problem_description'
            ];
            
            const missingFields = requiredFields.filter(field => !(field in sampleAppointment));
            if (missingFields.length === 0) {
                console.log(' All required appointment fields present');
                console.log('Sample appointment data:', {
                    id: sampleAppointment.id,
                    patient_name: sampleAppointment.patient_first_name,
                    date: sampleAppointment.appointment_date,
                    status: sampleAppointment.status,
                    payment_status: sampleAppointment.payment_status
                });
            } else {
                console.log(' Missing required fields:', missingFields);
            }
        }

        // Test 6: Create sample data if needed
        console.log('\n6. Checking for test data...');
        if (appointments.length === 0) {
            console.log('  No appointments found. Consider creating sample data for testing.');
            console.log('You can use the create-sample-appointments.js script to add test data.');
        }

        console.log('\n All tests completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Start your backend server: node index.js');
        console.log('2. Open the doctor dashboard: doctor-dashboard-complete.html');
        console.log('3. Login with a doctor account to test the connection');

    } catch (error) {
        console.error(' Test failed:', error.message);
        console.error('Full error:', error);
    }
}

// Create sample appointments for testing
async function createSampleAppointments() {
    console.log('\n Creating sample appointments for testing...');
    
    try {
        // Get first doctor
        const doctors = await DoctorModel.findAll();
        if (!doctors || doctors.length === 0) {
            console.log(' No doctors found. Please add doctors first.');
            return;
        }

        const doctor = doctors[0];

        // Check for users (patients)
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        if (usersError) {
            throw new Error(`Error fetching users: ${usersError.message}`);
        }

        if (!users || users.length === 0) {
            console.log(' No users (patients) found. Please add users first.');
            return;
        }

        const patient = users[0];

        // Create sample appointments
        const sampleAppointments = [
            {
                patient_id: patient.id,
                doctor_id: doctor.id,
                patient_first_name: patient.first_name,
                doc_first_name: doctor.doctor_name,
                age_of_patient: 30,
                gender: 'male',
                address: 'Kigali, Rwanda',
                problem_description: 'Regular checkup and consultation',
                appointment_date: new Date().toISOString().split('T')[0], // Today
                slot_time: '10:00-11:00',
                status: 'pending',
                payment_status: false,
                consultation_type: 'in-person'
            },
            {
                patient_id: patient.id,
                doctor_id: doctor.id,
                patient_first_name: patient.first_name,
                doc_first_name: doctor.doctor_name,
                age_of_patient: 30,
                gender: 'male',
                address: 'Kigali, Rwanda',
                problem_description: 'Follow-up appointment for previous treatment',
                appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
                slot_time: '14:00-15:00',
                status: 'confirmed',
                payment_status: true,
                consultation_type: 'video-call',
                payment_amount: 50.00,
                payment_currency: 'RWF'
            }
        ];

        for (const appointmentData of sampleAppointments) {
            const appointment = await AppointmentModel.create(appointmentData);
            console.log(` Created appointment: ${appointment.id}`);
        }

        console.log(`\n Successfully created ${sampleAppointments.length} sample appointments!`);

    } catch (error) {
        console.error(' Error creating sample appointments:', error.message);
    }
}

// Run tests
async function runTests() {
    await testDoctorDashboardConnection();
    
    // Ask if user wants to create sample data
    const args = process.argv.slice(2);
    if (args.includes('--create-sample')) {
        await createSampleAppointments();
    } else {
        console.log('\n Tip: Run with --create-sample flag to create test appointments');
        console.log('Example: node test-doctor-dashboard.js --create-sample');
    }
    
    process.exit(0);
}

runTests();
