const { supabase } = require('./config/db');

async function createPatientSession() {
    console.log(' Creating Patient Session for Dashboard Testing...\n');

    try {
        // Get the test patient
        const { data: patients, error: patientError } = await supabase
            .from('users')
            .select('*')
            .eq('first_name', 'Test')
            .limit(1);

        if (patientError || !patients.length) {
            console.error(' Test patient not found');
            return;
        }

        const patient = patients[0];
        console.log(' Found test patient:', patient.first_name, patient.last_name);
        console.log(' Patient ID:', patient.id);
        console.log(' Email:', patient.email);

        // Create session data that the frontend expects
        const patientInfo = {
            id: patient.id,
            first_name: patient.first_name,
            last_name: patient.last_name,
            email: patient.email
        };

        console.log('\n To test the client dashboard:');
        console.log('\n**Option A - Frontend served by Backend (Port 8080):**');
        console.log('1A. Open your browser to: http://localhost:8080/client-dashboard.html');
        console.log('\n**Option B - Separate Frontend Server (Port 3000):**');
        console.log('1B. Open your browser to: http://localhost:3000/client-dashboard.html');
        console.log('\n**Then follow these steps:**');
        console.log('2. Open browser developer tools (F12)');
        console.log('3. Go to the Console tab');
        console.log('4. Paste this JavaScript code:');
        console.log('\n--- COPY AND PASTE THIS CODE ---');
        console.log(`localStorage.setItem('patientInfo', '${JSON.stringify(patientInfo)}');`);
        console.log(`localStorage.setItem('patientToken', 'test-token-123');`);
        console.log(`location.reload();`);
        console.log('--- END OF CODE ---\n');

        console.log('5. Press Enter to execute the code');
        console.log('6. The page will reload and you should see the patient data');
        console.log('7. Click on "Documents" in the sidebar to see the documents');
        
        console.log('\n Expected documents for this patient:');
        const { data: docs, error: docsError } = await supabase
            .from('patient_documents')
            .select(`
                document_name, 
                document_type,
                doctors:doctor_id (
                    doctor_name
                )
            `)
            .eq('patient_id', patient.id);

        if (docsError) {
            console.error('Error fetching docs:', docsError);
        } else {
            docs.forEach((doc, i) => {
                const doctorName = doc.doctors?.doctor_name || 'Unknown Doctor';
                console.log(`   ${i + 1}. ${doc.document_name} (${doc.document_type}) by ${doctorName}`);
            });
        }

    } catch (error) {
        console.error(' Error:', error.message);
    }
}

createPatientSession().then(() => {
    console.log('\n Session setup instructions provided!');
    process.exit(0);
});
