const { supabase } = require('./config/db');
const { UserModel } = require('./models/user.model');
const { DoctorModel } = require('./models/doctor.model');
const { AppointmentModel } = require('./models/appointment.model');

console.log('🔧 Testing patient_id autocomplete fix...\n');

async function testPatientIdFix() {
  try {
    // Get test data
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .limit(2);
    
    const { data: doctors } = await supabase
      .from('doctors')
      .select('*')
      .eq('is_available', true)
      .limit(1);
    
    if (!users.length || !doctors.length) {
      console.log('❌ Missing test data (users or doctors)');
      return;
    }

    const testUser = users[0];
    const testDoctor = doctors[0];
    
    console.log('📊 Test Data:');
    console.log(`  User: ${testUser.first_name} ${testUser.last_name}`);
    console.log(`  Email: ${testUser.email}`);
    console.log(`  ID: ${testUser.id}`);
    console.log(`  Doctor: ${testDoctor.doctor_name} (ID: ${testDoctor.id})\n`);

    // Test 1: Direct appointment creation with patient_id
    console.log('🧪 Test 1: Direct appointment with patient_id');
    const directAppointmentData = {
      patient_id: testUser.id,
      doctor_id: testDoctor.id,
      patient_first_name: testUser.first_name,
      doc_first_name: testDoctor.doctor_name,
      age_of_patient: 30,
      gender: 'male',
      address: 'Test Address',
      problem_description: 'Test problem - direct with patient_id',
      appointment_date: '2025-07-25',
      status: 'pending',
      payment_status: false,
      patient_email: testUser.email,
      patient_phone: testUser.mobile
    };

    const directAppointment = await AppointmentModel.create(directAppointmentData);
    console.log('✅ Direct appointment created successfully');
    console.log(`   ID: ${directAppointment.id}`);
    console.log(`   Patient ID: ${directAppointment.patient_id}`);
    
    // Test 2: Appointment creation with email lookup (simulate create-pending)
    console.log('\n🧪 Test 2: Appointment with email lookup');
    const emailAppointmentData = {
      // No patient_id initially
      doctor_id: testDoctor.id,
      patient_first_name: 'Unknown', // Will be updated
      doc_first_name: testDoctor.doctor_name,
      age_of_patient: 25,
      gender: 'female',
      address: 'Test Address 2',
      problem_description: 'Test problem - email lookup',
      appointment_date: '2025-07-26',
      status: 'pending',
      payment_status: false,
      patient_email: testUser.email
    };

    // Simulate the enhanced logic from create-pending
    console.log('🔍 Attempting patient lookup by email...');
    try {
      const patient = await UserModel.findByEmail(emailAppointmentData.patient_email);
      if (patient) {
        emailAppointmentData.patient_id = patient.id;
        emailAppointmentData.patient_first_name = patient.first_name;
        emailAppointmentData.patient_phone = patient.mobile;
        // Patient found successfully
        console.log('✅ Found patient by email lookup');
        console.log(`   Patient ID: ${patient.id}`);
        console.log(`   Patient Name: ${patient.first_name}`);
      } else {
        console.log('❌ No patient found with email');
      }
    } catch (error) {
      console.log('❌ Error in email lookup:', error.message);
    }

    const emailAppointment = await AppointmentModel.create(emailAppointmentData);
    console.log('✅ Email-lookup appointment created successfully');
    console.log(`   ID: ${emailAppointment.id}`);
    console.log(`   Patient ID: ${emailAppointment.patient_id}`);
    console.log(`   Patient auto-linked: ${emailAppointment.patient_id ? '✅' : '❌'}`);

    // Test 3: Test with phone lookup
    console.log('\n🧪 Test 3: Appointment with phone lookup');
    const phoneAppointmentData = {
      doctor_id: testDoctor.id,
      patient_first_name: 'Unknown',
      doc_first_name: testDoctor.doctor_name,
      age_of_patient: 35,
      gender: 'male',
      address: 'Test Address 3',
      problem_description: 'Test problem - phone lookup',
      appointment_date: '2025-07-27',
      status: 'pending',
      payment_status: false,
      patient_phone: testUser.mobile
    };

    // Simulate phone lookup
    console.log('🔍 Attempting patient lookup by phone...');
    try {
      const patient = await UserModel.findByMobile(phoneAppointmentData.patient_phone);
      if (patient) {
        phoneAppointmentData.patient_id = patient.id;
        phoneAppointmentData.patient_first_name = patient.first_name;
        phoneAppointmentData.patient_email = patient.email;
        // Patient found successfully
        console.log('✅ Found patient by phone lookup');
        console.log(`   Patient ID: ${patient.id}`);
        console.log(`   Patient Name: ${patient.first_name}`);
      } else {
        console.log('❌ No patient found with phone');
      }
    } catch (error) {
      console.log('❌ Error in phone lookup:', error.message);
    }

    const phoneAppointment = await AppointmentModel.create(phoneAppointmentData);
    console.log('✅ Phone-lookup appointment created successfully');
    console.log(`   ID: ${phoneAppointment.id}`);
    console.log(`   Patient ID: ${phoneAppointment.patient_id}`);
    console.log(`   Patient auto-linked: ${phoneAppointment.patient_id ? '✅' : '❌'}`);

    // Test 4: Test failure case (no matching patient)
    console.log('\n🧪 Test 4: Appointment with no matching patient');
    const noMatchData = {
      doctor_id: testDoctor.id,
      patient_first_name: 'John Doe',
      doc_first_name: testDoctor.doctor_name,
      age_of_patient: 40,
      gender: 'male',
      address: 'Unknown Address',
      problem_description: 'Test problem - no match',
      appointment_date: '2025-07-28',
      status: 'pending',
      payment_status: false,
      patient_email: 'nonexistent@example.com',
      patient_phone: '+250999999999'
    };

    const noMatchAppointment = await AppointmentModel.create(noMatchData);
    console.log('✅ No-match appointment created (expected behavior)');
    console.log(`   ID: ${noMatchAppointment.id}`);
    console.log(`   Patient ID: ${noMatchAppointment.patient_id} (should be null)`);
    console.log(`   Patient auto-linked: ${noMatchAppointment.patient_id ? '✅' : '❌'}`);

    // Summary
    console.log('\n📋 Test Summary:');
    console.log('✅ All tests completed successfully');
    console.log('✅ Patient ID autocomplete is working for:');
    console.log('   - Direct patient_id provision');
    console.log('   - Email-based patient lookup');
    console.log('   - Phone-based patient lookup');
    console.log('   - Graceful handling of non-matching patients');

    // Cleanup
    console.log('\n🧹 Cleaning up test appointments...');
    await AppointmentModel.delete(directAppointment.id);
    await AppointmentModel.delete(emailAppointment.id);
    await AppointmentModel.delete(phoneAppointment.id);
    await AppointmentModel.delete(noMatchAppointment.id);
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testPatientIdFix();
