const { supabase } = require('./config/db');

console.log(" Debugging appointment creation...\n");

async function debugAppointmentCreation() {
  try {
    // Get a real user and doctor
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
      console.log(" Missing valid users or doctors");
      return;
    }

    const testUser = users[0];
    const testDoctor = doctors[0];
    
    console.log(" Found valid test data:");
    console.log(`  - User: ${testUser.first_name} ${testUser.last_name} (ID: ${testUser.id})`);
    console.log(`  - Doctor: ${testDoctor.doctor_name} (ID: ${testDoctor.id})`);

    // Test 1: Direct Supabase insert
    console.log("\n Test 1: Direct Supabase insert...");
    
    const directInsertData = {
      patient_id: testUser.id,
      doctor_id: testDoctor.id,
      patient_first_name: testUser.first_name,
      doc_first_name: testDoctor.doctor_name,
      age_of_patient: 30,
      gender: 'male',
      address: 'Test Address',
      problem_description: 'Test problem',
      appointment_date: '2025-07-02',
      appointment_time: '10:00',
      consultation_type: 'in-person',
      symptoms: ['test'],
      medical_history: 'None',
      medications: 'None',
      payment_status: true,
      payment_transaction_id: 'TEST123',
      payment_simcard_holder: 'Test Holder',
      payment_phone_number: '+250123456789',
      payment_method: 'mobile-money',
      payment_amount: 5000,
      payment_currency: 'RWF',
      patient_email: testUser.email,
      patient_phone: testUser.mobile
    };

    const { data: directResult, error: directError } = await supabase
      .from('appointments')
      .insert([directInsertData])
      .select()
      .single();

    if (directError) {
      console.log(" Direct insert failed:", directError.message);
      console.log("Error details:", directError);
      
      // Check if it's a column issue
      if (directError.message.includes('column') && directError.message.includes('does not exist')) {
        console.log("\n Missing column detected. Let's check the table structure...");
        
        // Try a simpler insert to see which columns exist
        const simpleData = {
          patient_id: testUser.id,
          doctor_id: testDoctor.id,
          patient_first_name: testUser.first_name,
          doc_first_name: testDoctor.doctor_name,
          age_of_patient: 30,
          gender: 'male',
          address: 'Test Address',
          problem_description: 'Test problem',
          appointment_date: '2025-07-02',
          status: false,
          payment_status: true
        };
        
        console.log("Trying simple insert with basic columns...");
        const { data: simpleResult, error: simpleError } = await supabase
          .from('appointments')
          .insert([simpleData])
          .select()
          .single();
        
        if (simpleError) {
          console.log("Even simple insert failed:", simpleError.message);
        } else {
          console.log("Simple insert worked! The issue is with extended columns.");
          console.log("Created appointment:", simpleResult.id);
          
          // Clean up
          await supabase.from('appointments').delete().eq('id', simpleResult.id);
          console.log("Cleaned up test appointment");
        }
      }
    } else {
      console.log("Direct insert successful!");
      console.log("Created appointment:", directResult.id);
      
      // Clean up
      await supabase.from('appointments').delete().eq('id', directResult.id);
      console.log("Cleaned up test appointment");
    }

    // Test 2: Using AppointmentModel
    console.log("\n Test 2: Using AppointmentModel...");
    
    try {
      const { AppointmentModel } = require('./models/appointment.model');
      
      const modelData = {
        patient_id: testUser.id,
        doctor_id: testDoctor.id,
        patient_first_name: testUser.first_name,
        doc_first_name: testDoctor.doctor_name,
        age_of_patient: 30,
        gender: 'male',
        address: 'Test Address',
        problem_description: 'Test problem via model',
        appointment_date: '2025-07-02',
        status: false,
        payment_status: true
      };
      
      console.log(" Data being sent to model:", JSON.stringify(modelData, null, 2));
      
      const modelResult = await AppointmentModel.create(modelData);
      
      if (modelResult && modelResult.id) {
        console.log(" AppointmentModel insert successful!");
        console.log("Created appointment:", modelResult.id);
        
        // Clean up
        await AppointmentModel.delete(modelResult.id);
        console.log(" Cleaned up test appointment");
      } else {
        console.log(" AppointmentModel returned no data");
        console.log("Result:", modelResult);
      }
      
    } catch (modelError) {
      console.log(" AppointmentModel failed:", modelError.message);
      console.log("Full error:", modelError);
    }

    // Test 3: Check what columns actually exist in the appointments table
    console.log("\n Test 3: Checking appointments table structure...");
    
    try {
      // Try to get the first appointment to see the structure
      const { data: existingAppointments, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .limit(1);
      
      if (fetchError) {
        console.log(" Cannot fetch existing appointments:", fetchError.message);
      } else if (existingAppointments.length > 0) {
        console.log(" Sample appointment structure:");
        console.log(Object.keys(existingAppointments[0]));
      } else {
        console.log("ℹ  No existing appointments found");
        
        // Try to insert a minimal appointment to see what columns are required
        const minimalData = {
          patient_id: testUser.id,
          doctor_id: testDoctor.id,
          patient_first_name: testUser.first_name,
          doc_first_name: testDoctor.doctor_name,
          age_of_patient: 30,
          gender: 'male',
          address: 'Test Address',
          problem_description: 'Minimal test',
          appointment_date: '2025-07-02'
        };
        
        console.log(" Trying minimal insert...");
        const { data: minResult, error: minError } = await supabase
          .from('appointments')
          .insert([minimalData])
          .select()
          .single();
        
        if (minError) {
          console.log(" Minimal insert failed:", minError.message);
          
          // Try to understand what columns are missing
          if (minError.message.includes('null value in column')) {
            const missingColumn = minError.message.match(/"([^"]+)"/)?.[1];
            console.log(` Missing required column: ${missingColumn}`);
          }
        } else {
          console.log(" Minimal insert worked!");
          console.log("Available columns:", Object.keys(minResult));
          
          // Clean up
          await supabase.from('appointments').delete().eq('id', minResult.id);
          console.log(" Cleaned up minimal test appointment");
        }
      }
    } catch (structureError) {
      console.log(" Structure check failed:", structureError.message);
    }

  } catch (error) {
    console.error(" Debug script failed:", error);
  }
}

debugAppointmentCreation();
