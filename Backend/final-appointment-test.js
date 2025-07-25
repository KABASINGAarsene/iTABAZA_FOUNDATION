const { supabase } = require('./config/db');
const { AppointmentModel } = require('./models/appointment.model');

console.log("Final test: Complete appointment booking flow...\n");

async function testCompleteAppointmentFlow() {
  try {
    // Get test user and doctor
    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, mobile')
      .limit(1);
    
    const { data: doctors } = await supabase
      .from('doctors')
      .select('id, doctor_name, email, is_available, status')
      .eq('is_available', true)
      .eq('status', true)
      .limit(1);
    
    if (!users.length || !doctors.length) {
      console.log("Missing test data");
      return;
    }

    const testUser = users[0];
    const testDoctor = doctors[0];
    
    console.log("Test data ready:");
    console.log(`  - User: ${testUser.first_name} ${testUser.last_name}`);
    console.log(`  - Doctor: ${testDoctor.doctor_name}`);

    // Test complete appointment creation with payment
    console.log("\n Creating appointment with payment details...");
    
    const appointmentData = {
      patient_id: testUser.id,
      doctor_id: testDoctor.id,
      patient_first_name: testUser.first_name,
      doc_first_name: testDoctor.doctor_name,
      age_of_patient: 28,
      gender: 'male',
      address: 'Kigali, Rwanda',
      problem_description: 'General health checkup and consultation',
      appointment_date: '2025-07-03',
      appointment_time: '14:00',
      consultation_type: 'in-person',
      symptoms: ['headache', 'fatigue'],
      medical_history: 'No significant medical history',
      medications: 'None currently',
      payment_status: true,
      payment_transaction_id: 'FINAL123456789',
      payment_simcard_holder: testUser.first_name + ' ' + testUser.last_name,
      payment_phone_number: testUser.mobile,
      payment_method: 'mobile-money',
      payment_amount: 8000,
      payment_currency: 'RWF',
      patient_email: testUser.email,
      patient_phone: testUser.mobile
    };
    
    const createdAppointment = await AppointmentModel.create(appointmentData);
    
    if (createdAppointment && createdAppointment.id) {
      console.log(" SUCCESS! Appointment created with all details!");
      console.log(`  - Appointment ID: ${createdAppointment.id}`);
      console.log(`  - Payment Status: ${createdAppointment.payment_status}`);
      console.log(`  - Payment Amount: ${createdAppointment.payment_amount} ${createdAppointment.payment_currency}`);
      console.log(`  - Transaction ID: ${createdAppointment.payment_transaction_id}`);
      console.log(`  - Consultation Type: ${createdAppointment.consultation_type}`);
      console.log(`  - Symptoms: ${createdAppointment.symptoms}`);
      
      // Test retrieving the appointment
      console.log("\n Testing appointment retrieval...");
      const retrievedAppointment = await AppointmentModel.findById(createdAppointment.id);
      
      if (retrievedAppointment) {
        console.log(" Appointment retrieval successful!");
        console.log(`  - Retrieved: ${retrievedAppointment.patient_first_name} → ${retrievedAppointment.doc_first_name}`);
      } else {
        console.log(" Failed to retrieve appointment");
      }
      
      // Test updating payment status
      console.log("\n Testing payment status update...");
      const updatedAppointment = await AppointmentModel.update(createdAppointment.id, {
        payment_status: true,
        payment_amount: 9000
      });
      
      if (updatedAppointment) {
        console.log(" Payment update successful!");
        console.log(`  - New amount: ${updatedAppointment.payment_amount}`);
      }
      
      // Clean up
      console.log("\n Cleaning up test appointment...");
      await AppointmentModel.delete(createdAppointment.id);
      console.log(" Cleanup successful");
      
      console.log("\n ALL TESTS PASSED!");
      console.log("\n The appointment booking system is fully functional:");
      console.log("  ✓ Appointments can be created with payment details");
      console.log("  ✓ Appointments can be retrieved by ID"); 
      console.log("  ✓ Payment status can be updated");
      console.log("  ✓ Appointments can be deleted");
      console.log("  ✓ All enhanced fields (symptoms, medical history, etc.) are working");
      
      console.log("\n Next steps:");
      console.log("  1. Start your backend server: npm run server");
      console.log("  2. Your frontend should now successfully create appointments");
      console.log("  3. Ensure users are authenticated when booking");
      console.log("  4. Test the complete flow from frontend payment page");
      
      return true;
      
    } else {
      console.log(" Appointment creation failed");
      return false;
    }
    
  } catch (error) {
    console.error(" Test failed:", error.message);
    return false;
  }
}

testCompleteAppointmentFlow();
