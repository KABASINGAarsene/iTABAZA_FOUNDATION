const { supabase } = require('./config/db');

async function testDocumentSystem() {
    console.log(' Testing Document Upload and Patient Access System...\n');

    try {
        // Step 1: Check existing patients
        console.log(' Checking existing patients...');
        const { data: patients, error: patientError } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .limit(5);

        if (patientError) {
            console.error(' Error fetching patients:', patientError);
            return;
        }

        console.log(` Found ${patients.length} patients:`);
        patients.forEach((patient, i) => {
            console.log(`   ${i + 1}. ${patient.first_name} ${patient.last_name} (${patient.id})`);
        });

        if (patients.length === 0) {
            console.log(' No patients found. Please create a test patient first.');
            return;
        }

        const testPatient = patients[0];
        console.log(`\n Testing with patient: ${testPatient.first_name} ${testPatient.last_name}\n`);

        // Step 2: Check existing documents for this patient
        console.log(' Checking existing patient documents...');
        const { data: existingDocs, error: docsError } = await supabase
            .from('patient_documents')
            .select('*')
            .eq('patient_id', testPatient.id);

        if (docsError) {
            console.error(' Error fetching existing documents:', docsError);
        } else {
            console.log(` Found ${existingDocs.length} existing documents for this patient`);
            existingDocs.forEach((doc, i) => {
                console.log(`   ${i + 1}. ${doc.document_name} (${doc.document_type}) - Accessible: ${doc.is_accessible_to_patient}`);
            });
        }

        // Step 3: Test patient API endpoint
        console.log('\n Testing patient documents API endpoint...');
        const response = await fetch(`http://localhost:8080/api/dashboard/patient/${testPatient.id}/documents`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(` API request failed: ${response.status} ${response.statusText}`);
            return;
        }

        const apiData = await response.json();
        console.log(' API Response:', JSON.stringify(apiData, null, 2));

        // Step 4: Test dashboard stats API
        console.log('\n Testing patient dashboard stats API...');
        const statsResponse = await fetch(`http://localhost:8080/api/dashboard/patient/${testPatient.id}/dashboard`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!statsResponse.ok) {
            console.error(` Stats API request failed: ${statsResponse.status} ${statsResponse.statusText}`);
        } else {
            const statsData = await statsResponse.json();
            console.log(' Dashboard Stats Response:', JSON.stringify(statsData, null, 2));
        }

        // Step 5: Test doctor documents API
        console.log('\n Testing doctor documents API...');
        const { data: doctors, error: doctorError } = await supabase
            .from('doctors')
            .select('id, doctor_name')
            .limit(1);

        if (doctorError || !doctors.length) {
            console.log(' No doctors found, skipping doctor API test');
        } else {
            const testDoctor = doctors[0];
            const doctorResponse = await fetch(`http://localhost:8080/api/dashboard/doctor/${testDoctor.id}/documents`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!doctorResponse.ok) {
                console.error(` Doctor API request failed: ${doctorResponse.status} ${doctorResponse.statusText}`);
            } else {
                const doctorData = await doctorResponse.json();
                console.log(' Doctor Documents Response:', JSON.stringify(doctorData, null, 2));
            }
        }

        // Step 6: Test cross-patient access prevention
        console.log('\n Testing cross-patient access prevention...');
        if (patients.length > 1) {
            const otherPatient = patients[1];
            const crossResponse = await fetch(`http://localhost:8080/api/dashboard/patient/${otherPatient.id}/documents`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!crossResponse.ok) {
                console.error(` Cross-patient API request failed: ${crossResponse.status}`);
            } else {
                const crossData = await crossResponse.json();
                console.log(` Other patient (${otherPatient.first_name}) has ${crossData.data?.length || 0} documents`);
                
                // Verify no overlap
                const originalDocIds = apiData.data?.map(d => d.id) || [];
                const otherDocIds = crossData.data?.map(d => d.id) || [];
                const overlap = originalDocIds.filter(id => otherDocIds.includes(id));
                
                if (overlap.length > 0) {
                    console.error(` SECURITY ISSUE: Found ${overlap.length} shared document IDs between patients!`);
                } else {
                    console.log(' Security check passed: No document overlap between patients');
                }
            }
        }

        console.log('\n Document system test completed!');

    } catch (error) {
        console.error(' Test failed:', error.message);
    }
}

// Run the test
testDocumentSystem().then(() => {
    console.log('\n Test script finished');
    process.exit(0);
}).catch(err => {
    console.error(' Test script error:', err);
    process.exit(1);
});
