const { supabase } = require('./config/db');
const { UserModel } = require('./models/user.model');
const { DoctorModel } = require('./models/doctor.model');
const { AppointmentModel } = require('./models/appointment.model');

async function testAppointmentBooking() {
    try {
        console.log('Testing appointment booking flow...\n');
        
        // Get test data
        const { data: users } = await supabase
            .from('users')
            .select('*')
            .limit(1);
        
        const { data: doctors } = await supabase
            .from('doctors')
            .select('*')
            .eq('is_available', true)
            .limit(1);
        
        if (!users.length || !doctors.length) {
            console.log('❌ Missing test data');
            return;
        }

        const testUser = users[0];
        const testDoctor = doctors[0];
        
        console.log('📊 Test Data:');
        console.log(`  User: ${testUser.first_name} ${testUser.last_name} (ID: ${testUser.id})`);
        console.log(`  Doctor: ${testDoctor.doctor_name} (ID: ${testDoctor.id})`);
        
        // Simulate the appointment booking endpoint data
        console.log('\n🔍 Simulating appointment booking request...');
        
        const doctorId = testDoctor.id;
        const patientId = testUser.id; // This comes from authentication middleware
        const patientEmail = testUser.email; // This comes from authentication middleware
        
        console.log('Auth data from middleware:');
        console.log(`  patientId: ${patientId}`);
        console.log(`  patientEmail: ${patientEmail}`);
        
        // Fetch doctor and patient data (like in the endpoint)
        const docName = await DoctorModel.findById(doctorId);
        const patientName = await UserModel.findById(patientId);
        
        if (!docName || !patientName) {
            console.log('❌ Doctor or patient not found');
            return;
        }
        
        const docFirstName = docName.doctor_name;
        const patientFirstName = patientName.first_name;
        
        console.log(`  Doctor Name: ${docFirstName}`);
        console.log(`  Patient Name: ${patientFirstName}`);
        
        // Simulate request body data
        const requestBody = {
            ageOfPatient: 25,
            gender: 'female',
            address: '123 Test Street, Kigali',
            problemDescription: 'General checkup',
            appointmentDate: '2025-07-25',
            slotTime: '10:00',
            paymentDetails: {
                transactionId: 'TEST123456',
                simcardHolder: 'Test Holder',
                ownerName: 'Test Owner',
                phoneNumber: '+250123456789',
                paymentMethod: 'mobile-money',
                amount: 5000,
                currency: 'RWF'
            }
        };
        
        console.log('\n📝 Building appointment data...');
        
        // Build appointment data exactly like in the endpoint
        const appointmentData = {
            patient_id: patientId,
            doctor_id: doctorId,
            patient_first_name: patientFirstName,
            doc_first_name: docFirstName,
            age_of_patient: requestBody.ageOfPatient,
            gender: requestBody.gender,
            address: requestBody.address,
            problem_description: requestBody.problemDescription,
            appointment_date: requestBody.appointmentDate,
            slot_time: requestBody.slotTime,
            status: 'pending', // This is key!
            payment_status: Boolean(requestBody.paymentDetails.transactionId),
            // Payment details
            payment_transaction_id: requestBody.paymentDetails.transactionId || null,
            payment_simcard_holder: requestBody.paymentDetails.simcardHolder || null,
            payment_owner_name: requestBody.paymentDetails.ownerName || null,
            payment_phone_number: requestBody.paymentDetails.phoneNumber || null,
            payment_method: requestBody.paymentDetails.paymentMethod || null,
            payment_amount: requestBody.paymentDetails.amount || null,
            payment_currency: requestBody.paymentDetails.currency || 'RWF'
        };
        
        console.log('Appointment data to be created:');
        console.log(JSON.stringify(appointmentData, null, 2));
        
        console.log('\n🚀 Creating appointment...');
        
        try {
            const createdAppointment = await AppointmentModel.create(appointmentData);
            
            console.log('✅ Appointment created successfully!');
            console.log(`   ID: ${createdAppointment.id}`);
            console.log(`   Patient ID: ${createdAppointment.patient_id}`);
            console.log(`   Doctor ID: ${createdAppointment.doctor_id}`);
            console.log(`   Status: ${createdAppointment.status}`);
            
            // Verify the appointment was saved with correct patient_id
            const savedAppointment = await AppointmentModel.findById(createdAppointment.id);
            
            if (savedAppointment && savedAppointment.patient_id === patientId) {
                console.log('✅ Patient ID correctly saved to database!');
            } else {
                console.log('❌ Patient ID was not saved correctly:');
                console.log(`   Expected: ${patientId}`);
                console.log(`   Actual: ${savedAppointment?.patient_id}`);
            }
            
            // Clean up
            await AppointmentModel.delete(createdAppointment.id);
            console.log('🧹 Test appointment cleaned up');
            
        } catch (createError) {
            console.log('❌ Failed to create appointment:');
            console.log(`   Error: ${createError.message}`);
            console.log('   Full error:', createError);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAppointmentBooking();
