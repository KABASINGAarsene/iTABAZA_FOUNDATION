const { supabase } = require('./config/db');
const bcrypt = require('bcrypt');

console.log("Checking for valid user and doctor records...\n");

async function checkAndCreateTestData() {
  try {
    // Step 1: Check existing users
    console.log("Step 1: Checking existing users...");
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, mobile')
      .limit(5);
    
    if (userError) throw userError;
    
    console.log(`Found ${users.length} existing users:`);
    users.forEach(user => {
      console.log(`  - ${user.first_name} ${user.last_name} (${user.email})`);
    });

    let testUser = users.length > 0 ? users[0] : null;

    // Create a test user if none exist
    if (!testUser) {
      console.log("\nCreating a test user...");
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert([{
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@test.com',
          mobile: '+250123456789',
          password: hashedPassword
        }])
        .select()
        .single();
      
      if (createUserError) {
        console.log("Failed to create test user:", createUserError.message);
        return false;
      }
      
      testUser = newUser;
      console.log("Test user created:", testUser.first_name, testUser.last_name);
    }

    // Step 2: Check existing departments
    console.log("\nStep 2: Checking existing departments...");
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, dept_name')
      .limit(5);
    
    if (deptError) throw deptError;
    
    console.log(`Found ${departments.length} existing departments:`);
    departments.forEach(dept => {
      console.log(`  - ${dept.dept_name}`);
    });

    let testDepartment = departments.length > 0 ? departments[0] : null;

    // Create a test department if none exist
    if (!testDepartment) {
      console.log("\nCreating a test department...");
      const { data: newDept, error: createDeptError } = await supabase
        .from('departments')
        .insert([{
          dept_name: 'General Medicine',
          about: 'General medical consultation and checkups',
          image: 'https://example.com/general-medicine.jpg'
        }])
        .select()
        .single();
      
      if (createDeptError) {
        console.log("Failed to create test department:", createDeptError.message);
        return false;
      }
      
      testDepartment = newDept;
      console.log("Test department created:", testDepartment.dept_name);
    }

    // Step 3: Check existing doctors
    console.log("\nStep 3: Checking existing doctors...");
    const { data: doctors, error: doctorError } = await supabase
      .from('doctors')
      .select('id, doctor_name, email, qualifications, experience, phone_no, city, department_id, status, is_available')
      .limit(5);
    
    if (doctorError) throw doctorError;
    
    console.log(`Found ${doctors.length} existing doctors:`);
    doctors.forEach(doctor => {
      console.log(`  - Dr. ${doctor.doctor_name} (${doctor.email}) - Available: ${doctor.is_available}`);
    });

    let testDoctor = doctors.find(doc => doc.is_available && doc.status) || (doctors.length > 0 ? doctors[0] : null);

    // Create a test doctor if none exist or none are available
    if (!testDoctor) {
      console.log("\nCreating a test doctor...");
      const { data: newDoctor, error: createDoctorError } = await supabase
        .from('doctors')
        .insert([{
          doctor_name: 'Dr. Jane Smith',
          email: 'dr.jane.smith@test.com',
          qualifications: 'MBBS, MD in General Medicine',
          experience: '10 years of experience',
          phone_no: '+250987654321',
          city: 'Kigali',
          department_id: testDepartment.id,
          status: true,
          is_available: true,
          image: 'https://example.com/dr-jane-smith.jpg',
          // Add some available time slots
          april_11: ['11-12', '2-3', '4-5', '7-8'],
          april_12: ['11-12', '2-3', '4-5', '7-8'],
          april_13: ['11-12', '2-3', '4-5', '7-8']
        }])
        .select()
        .single();
      
      if (createDoctorError) {
        console.log("Failed to create test doctor:", createDoctorError.message);
        return false;
      }
      
      testDoctor = newDoctor;
      console.log("Test doctor created:", testDoctor.doctor_name);
    }

    // Step 4: Test appointment creation with real data
    console.log("\nStep 4: Testing appointment creation with valid data...");
    
    const { AppointmentModel } = require('./models/appointment.model');
    
    const appointmentData = {
      patient_id: testUser.id,
      doctor_id: testDoctor.id,
      patient_first_name: testUser.first_name,
      doc_first_name: testDoctor.doctor_name,
      age_of_patient: 30,
      gender: 'male',
      address: 'Test Address, Kigali',
      problem_description: 'General health checkup and consultation',
      appointment_date: '2025-07-02',
      appointment_time: '11-12',
      consultation_type: 'in-person',
      symptoms: ['general_checkup'],
      medical_history: 'No significant medical history',
      medications: 'None currently',
      payment_status: true,
      payment_transaction_id: 'TEST123456789',
      payment_simcard_holder: testUser.first_name + ' ' + testUser.last_name,
      payment_phone_number: testUser.mobile,
      payment_method: 'mobile-money',
      payment_amount: 8000,
      payment_currency: 'RWF',
      patient_email: testUser.email,
      patient_phone: testUser.mobile
    };
    
    console.log("Creating test appointment with valid user and doctor...");
    const createdAppointment = await AppointmentModel.create(appointmentData);
    
    if (createdAppointment && createdAppointment.id) {
      console.log("SUCCESS! Appointment created successfully!");
      console.log("Appointment Details:");
      console.log(`  - ID: ${createdAppointment.id}`);
      console.log(`  - Patient: ${createdAppointment.patient_first_name}`);
      console.log(`  - Doctor: ${createdAppointment.doc_first_name}`);
      console.log(`  - Date: ${createdAppointment.appointment_date}`);
      console.log(`  - Time: ${createdAppointment.appointment_time}`);
      console.log(`  - Type: ${createdAppointment.consultation_type}`);
      console.log(`  - Payment Status: ${createdAppointment.payment_status}`);
      console.log(`  - Payment Amount: ${createdAppointment.payment_amount} ${createdAppointment.payment_currency}`);
      
      // Step 5: Verify appointment exists in database
      console.log("\n Step 5: Verifying appointment in database...");
      const { data: verifyAppointment, error: verifyError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', createdAppointment.id)
        .single();
      
      if (verifyError) {
        console.log(" Failed to verify appointment:", verifyError.message);
      } else {
        console.log(" Appointment verified in database!");
        console.log(`  - Found appointment with payment status: ${verifyAppointment.payment_status}`);
      }
      
      // Clean up test appointment
      console.log("\n Cleaning up test appointment...");
      await AppointmentModel.delete(createdAppointment.id);
      console.log(" Test appointment cleaned up");
      
      // Step 6: Summary and next steps
      console.log("\n APPOINTMENT BOOKING SYSTEM IS WORKING CORRECTLY!");
      console.log("\n Summary of test data:");
      console.log(`  - Test User: ${testUser.first_name} ${testUser.last_name} (${testUser.email})`);
      console.log(`  - Test Doctor: ${testDoctor.doctor_name} (${testDoctor.email})`);
      console.log(`  - Test Department: ${testDepartment.dept_name}`);
      
      console.log("\n Next Steps:");
      console.log("1. Start your backend server: npm run server");
      console.log("2. Ensure your frontend is pointing to the correct backend URL");
      console.log("3. Make sure users are properly authenticated when booking appointments");
      console.log("4. Test the complete booking flow from the frontend");
      
      return {
        success: true,
        testUser,
        testDoctor,
        testDepartment
      };
      
    } else {
      console.log(" Appointment creation failed - no data returned");
      return false;
    }
    
  } catch (error) {
    console.error(" Error during test data check/creation:", error);
    return false;
  }
}

// Run the test
checkAndCreateTestData().then(result => {
  if (result && result.success) {
    console.log("\n Ready to test appointment booking!");
  } else {
    console.log("\n Test data setup failed. Please check the errors above.");
  }
}).catch(error => {
  console.error(" Script execution failed:", error);
});
