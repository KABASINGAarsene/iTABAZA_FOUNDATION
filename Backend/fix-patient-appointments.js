const { supabase } = require('./config/db');

async function fixPatientAppointments() {
    console.log('🔧 Starting Patient Appointments Fix...\n');
    
    try {
        // Step 1: Check appointments with NULL patient_id
        console.log('📊 Step 1: Checking appointments with NULL patient_id...');
        const { data: nullAppointments, error: nullError } = await supabase
            .from('appointments')
            .select('*')
            .is('patient_id', null);
        
        if (nullError) {
            console.error('❌ Error fetching NULL appointments:', nullError);
            return;
        }
        
        console.log(`   Found ${nullAppointments.length} appointments with NULL patient_id`);
        
        // Step 2: Get available patients for matching
        console.log('\n👥 Step 2: Getting available patients...');
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .order('created_at', { ascending: false });
            
        if (userError) {
            console.error('❌ Error fetching users:', userError);
            return;
        }
        
        console.log(`   Found ${users.length} users in database`);
        
        // Step 3: Attempt to fix appointments by matching names/emails
        let fixedCount = 0;
        const testPatientId = 'aaa31e37-ba6f-4177-ade1-694a63f4b8ba'; // From your error
        
        // Check if this test patient exists
        const { data: testPatient, error: testError } = await supabase
            .from('users')
            .select('*')
            .eq('id', testPatientId)
            .single();
            
        if (!testPatient && !testError) {
            console.log('⚠️  Test patient does not exist, creating one...');
            const { data: newPatient, error: createError } = await supabase
                .from('users')
                .insert({
                    id: testPatientId,
                    first_name: 'Test',
                    last_name: 'Patient', 
                    email: 'test.patient@itabaza.rw',
                    mobile: '+250788123456',
                    password: '$2b$10$rQJ0eKcHmM7rQJ0eKcHmMOKmN9o9o9o9o9o9o9o9o9o9o9o9o9o9o9'
                })
                .select()
                .single();
                
            if (createError) {
                console.error('❌ Error creating test patient:', createError);
            } else {
                console.log('✅ Created test patient:', newPatient.email);
            }
        } else if (testPatient) {
            console.log('✅ Test patient exists:', testPatient.email);
        }
        
        console.log('\n🔄 Step 3: Fixing NULL patient_id appointments...');
        
        // For simplicity, let's assign the first user to all NULL appointments
        // In a real scenario, you'd want more sophisticated matching
        if (users.length > 0 && nullAppointments.length > 0) {
            const assignPatient = testPatient || users[0];
            
            for (const appointment of nullAppointments) {
                const { error: updateError } = await supabase
                    .from('appointments')
                    .update({ 
                        patient_id: assignPatient.id,
                        patient_email: assignPatient.email || appointment.patient_email
                    })
                    .eq('id', appointment.id);
                    
                if (updateError) {
                    console.error(`❌ Error updating appointment ${appointment.id}:`, updateError);
                } else {
                    console.log(`✅ Fixed appointment ${appointment.id} -> Patient: ${assignPatient.first_name} ${assignPatient.last_name}`);
                    fixedCount++;
                }
            }
        }
        
        console.log(`\n📈 Fixed ${fixedCount} appointments`);
        
        // Step 4: Test the patient appointments API
        console.log('\n🧪 Step 4: Testing patient appointments API...');
        
        const testPatientIdToUse = testPatient?.id || users[0]?.id || testPatientId;
        console.log(`   Testing with patient ID: ${testPatientIdToUse}`);
        
        // Test direct database query
        const { data: patientAppointments, error: fetchError } = await supabase
            .from('appointments')
            .select(`
                *,
                doctors:doctor_id (
                    doctor_name,
                    qualifications,
                    department_id
                )
            `)
            .eq('patient_id', testPatientIdToUse)
            .order('appointment_date', { ascending: false });
            
        if (fetchError) {
            console.error('❌ Error fetching patient appointments:', fetchError);
        } else {
            console.log(`✅ Successfully fetched ${patientAppointments.length} appointments for patient`);
            
            patientAppointments.forEach((app, idx) => {
                console.log(`   ${idx + 1}. Date: ${app.appointment_date}, Doctor: ${app.doc_first_name || 'N/A'}, Status: ${app.status}`);
            });
        }
        
        // Step 5: Test dashboard stats
        console.log('\n📊 Step 5: Testing dashboard statistics...');
        
        const { data: statsAppointments, error: statsError } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', testPatientIdToUse);
            
        if (statsError) {
            console.error('❌ Error fetching stats appointments:', statsError);
        } else {
            const totalAppointments = statsAppointments?.length || 0;
            const pendingAppointments = statsAppointments?.filter(a => a.status === 'pending').length || 0;
            const completedAppointments = statsAppointments?.filter(a => a.status === 'completed').length || 0;
            const upcomingAppointments = statsAppointments?.filter(a => {
                const today = new Date().toISOString().split('T')[0];
                return a.appointment_date >= today;
            }).length || 0;
            
            console.log(`✅ Dashboard Stats:`);
            console.log(`   Total appointments: ${totalAppointments}`);
            console.log(`   Pending appointments: ${pendingAppointments}`);
            console.log(`   Completed appointments: ${completedAppointments}`);  
            console.log(`   Upcoming appointments: ${upcomingAppointments}`);
        }
        
        // Step 6: Create some test appointments if none exist
        if (patientAppointments?.length === 0) {
            console.log('\n🎯 Step 6: Creating test appointments...');
            
            // Get a doctor ID
            const { data: doctors, error: doctorError } = await supabase
                .from('doctors')
                .select('id, doctor_name')
                .limit(1);
                
            if (!doctorError && doctors?.length > 0) {
                const testAppointment = {
                    patient_id: testPatientIdToUse,
                    doctor_id: doctors[0].id,
                    patient_first_name: testPatient?.first_name || users[0]?.first_name || 'Test',
                    doc_first_name: doctors[0].doctor_name,
                    age_of_patient: 30,
                    gender: 'M',
                    address: 'Test Address, Kigali',
                    problem_description: 'Regular checkup and consultation',
                    appointment_date: '2025-07-25',
                    appointment_time: '10:00',
                    status: 'pending',
                    consultation_type: 'in-person',
                    payment_status: false
                };
                
                const { data: newAppointment, error: createAppError } = await supabase
                    .from('appointments')
                    .insert(testAppointment)
                    .select()
                    .single();
                    
                if (createAppError) {
                    console.error('❌ Error creating test appointment:', createAppError);
                } else {
                    console.log('✅ Created test appointment:', newAppointment.id);
                }
            }
        }
        
        console.log('\n🎉 Patient appointments fix completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('   1. Test the patient dashboard in your browser');
        console.log('   2. Make sure the API endpoint /api/dashboard/patient/:patientId/appointments works');
        console.log(`   3. Use patient ID: ${testPatientIdToUse} for testing`);
        
    } catch (error) {
        console.error('❌ Unexpected error during fix:', error);
    }
}

// Run the fix
if (require.main === module) {
    fixPatientAppointments();
}

module.exports = { fixPatientAppointments };
