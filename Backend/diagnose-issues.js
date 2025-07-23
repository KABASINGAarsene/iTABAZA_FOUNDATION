const { supabase } = require('./config/db');
const { UserModel } = require('./models/user.model');
const { AppointmentModel } = require('./models/appointment.model');
const { DoctorModel } = require('./models/doctor.model');
const bcrypt = require('bcrypt');

async function diagnoseIssues() {
    console.log(' Starting diagnosis of user registration and appointment creation issues...\n');
    
    // Test 1: Database Connection
    console.log(' Testing database connection...');
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) {
            console.log(' Database connection failed:', error.message);
            return;
        }
        console.log(' Database connection successful\n');
    } catch (error) {
        console.log(' Database connection error:', error.message);
        return;
    }

    // Test 2: User Registration Flow
    console.log(' Testing user registration...');
    const testUser = {
        first_name: 'Test',
        last_name: 'Patient',
        email: `test.patient.${Date.now()}@example.com`,
        mobile: `+250${Math.floor(Math.random() * 1000000000)}`,
        password: await bcrypt.hash('test123', 5)
    };

    try {
        console.log('Creating user with data:', {
            ...testUser,
            password: '[HASHED]'
        });
        
        const createdUser = await UserModel.create(testUser);
        console.log(' User created successfully:', {
            id: createdUser.id,
            email: createdUser.email,
            mobile: createdUser.mobile
        });
        
        // Test 3: Retrieve the created user
        console.log('\n Testing user retrieval...');
        const retrievedUser = await UserModel.findByEmail(testUser.email);
        if (retrievedUser) {
            console.log('User retrieval successful:', retrievedUser.id);
        } else {
            console.log('User retrieval failed');
        }

        // Test 4: Get a test doctor for appointment creation
        console.log('\n Testing appointment creation...');
        const doctors = await DoctorModel.findAll();
        if (doctors.length === 0) {
            console.log( 'No doctors found in database. Creating a test doctor...');
            
            // Create a test doctor
            const testDoctor = {
                doctor_name: 'Dr. Test Doctor',
                email: `dr.test.${Date.now()}@hospital.com`,
                qualifications: 'MBBS, MD',
                experience: '5 years',
                phone_no: `+250${Math.floor(Math.random() * 1000000000)}`,
                city: 'Kigali',
                department_id: null, // We'll handle this
                status: true,
                is_available: true,
                image: 'https://example.com/doctor.jpg'
            };
            
            const createdDoctor = await DoctorModel.create(testDoctor);
            console.log('Test doctor created:', createdDoctor.id);
            
            // Test appointment creation with the new doctor
            await testAppointmentCreation(createdUser.id, createdDoctor.id);
        } else {
            console.log('Found existing doctors. Using first available doctor...');
            const testDoctor = doctors.find(doc => doc.status && doc.is_available) || doctors[0];
            console.log('Using doctor:', testDoctor.doctor_name, testDoctor.id);
            
            // Test appointment creation
            await testAppointmentCreation(createdUser.id, testDoctor.id);
        }

    } catch (error) {
        console.log(' User registration failed:', error.message);
        console.log('Full error:', error);
    }
}

async function testAppointmentCreation(patientId, doctorId) {
    console.log('\n Testing appointment creation...');
    
    const testAppointment = {
        patient_id: patientId,
        doctor_id: doctorId,
        patient_first_name: 'Test',
        doc_first_name: 'Dr. Test',
        age_of_patient: 30,
        gender: 'M',
        address: 'Test Address, Kigali',
        problem_description: 'Test problem description for diagnostic purposes',
        appointment_date: '2024-07-10',
        appointment_time: '10:00',
        consultation_type: 'in-person',
        symptoms: ['fever', 'headache'],
        medical_history: 'No significant medical history',
        medications: 'None',
        status: false,
        payment_status: false,
        payment_transaction_id: null,
        payment_amount: 5000.00,
        payment_currency: 'RWF',
        patient_email: 'test@example.com',
        patient_phone: '+250123456789'
    };

    try {
        console.log('Creating appointment with data:', {
            ...testAppointment,
            patient_id: patientId.substring(0, 8) + '...',
            doctor_id: doctorId.substring(0, 8) + '...'
        });
        
        const createdAppointment = await AppointmentModel.create(testAppointment);
        console.log(' Appointment created successfully:', {
            id: createdAppointment.id,
            appointment_date: createdAppointment.appointment_date,
            appointment_time: createdAppointment.appointment_time,
            consultation_type: createdAppointment.consultation_type
        });

        // Test 5: Retrieve the created appointment
        console.log('\n Testing appointment retrieval...');
        const retrievedAppointment = await AppointmentModel.findById(createdAppointment.id);
        if (retrievedAppointment) {
            console.log(' Appointment retrieval successful');
        } else {
            console.log(' Appointment retrieval failed');
        }

    } catch (error) {
        console.log(' Appointment creation failed:', error.message);
        console.log('Full error:', error);
        
        // Check if it's a foreign key constraint error
        if (error.code === '23503') {
            console.log('\n🔍 Foreign key constraint error detected. Checking relationships...');
            
            // Check if patient exists
            try {
                const patient = await UserModel.findById(patientId);
                console.log('Patient exists:', !!patient);
            } catch (e) {
                console.log('Error checking patient:', e.message);
            }
            
            // Check if doctor exists
            try {
                const doctor = await DoctorModel.findById(doctorId);
                console.log('Doctor exists:', !!doctor);
            } catch (e) {
                console.log('Error checking doctor:', e.message);
            }
        }
    }
}

// Test 6: Check table schemas
async function checkTableSchemas() {
    console.log('\n Checking table schemas...');
    
    try {
        // Check users table structure
        const { data: usersSchema, error: usersError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'users')
            .eq('table_schema', 'public');
            
        if (usersError) {
            console.log(' Error checking users schema:', usersError.message);
        } else {
            console.log(' Users table schema:');
            usersSchema.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });
        }

        // Check appointments table structure
        const { data: appointmentsSchema, error: appointmentsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'appointments')
            .eq('table_schema', 'public');
            
        if (appointmentsError) {
            console.log(' Error checking appointments schema:', appointmentsError.message);
        } else {
            console.log('\n Appointments table schema:');
            appointmentsSchema.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });
        }

    } catch (error) {
        console.log(' Error checking schemas:', error.message);
    }
}

// Test 7: Check RLS policies
async function checkRLSPolicies() {
    console.log('\n Checking Row Level Security policies...');
    
    try {
        const { data: policies, error } = await supabase
            .from('pg_policies')
            .select('tablename, policyname, cmd, qual')
            .in('tablename', ['users', 'appointments', 'doctors']);
            
        if (error) {
            console.log(' Error checking RLS policies:', error.message);
        } else {
            console.log(' RLS Policies found:');
            policies.forEach(policy => {
                console.log(`  - ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
            });
        }
    } catch (error) {
        console.log(' Error checking RLS policies:', error.message);
    }
}

// Run all diagnostics
async function runFullDiagnosis() {
    await diagnoseIssues();
    await checkTableSchemas();
    await checkRLSPolicies();
    
    console.log('\n Diagnosis Summary:');
    console.log('If you see approaved for all tests, the database operations are working correctly.');
    console.log('If you see wrong for any test, that indicates where the issue lies.');
    console.log('\nCommon fixes:');
    console.log('1. Check environment variables (.env file)');
    console.log('2. Verify Supabase project is active and accessible');
    console.log('3. Check if RLS policies are too restrictive');
    console.log('4. Ensure all required table columns exist');
    console.log('5. Verify foreign key relationships');
    
    process.exit(0);
}

runFullDiagnosis().catch(console.error);
