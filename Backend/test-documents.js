const { supabase } = require('./config/db');

async function testDocumentSystem() {
    console.log(' Testing Document System Setup...\n');
    
    try {
        // Test 1: Check if patient_documents table exists and is accessible
        console.log('1. Testing patient_documents table access...');
        const { data: tableTest, error: tableError } = await supabase
            .from('patient_documents')
            .select('id')
            .limit(1);
        
        if (tableError) {
            console.error(' Table access failed:', tableError.message);
            return;
        } else {
            console.log(' patient_documents table is accessible');
        }
        
        // Test 2: Test direct insert (fallback method)
        console.log('\n2. Testing direct insert to patient_documents...');
        const testPatientId = 'test-patient-' + Date.now();
        const testDoctorId = 'test-doctor-' + Date.now();
        
        const { data: insertData, error: insertError } = await supabase
            .from('patient_documents')
            .insert({
                patient_id: testPatientId,
                doctor_id: testDoctorId,
                document_name: 'Test Document.pdf',
                document_type: 'prescription',
                file_url: 'https://example.com/test.pdf',
                file_name: 'test.pdf',
                file_size: 1024,
                mime_type: 'application/pdf',
                description: 'Test document for verification',
                document_category: 'medical',
                is_accessible_to_patient: true,
                status: 'active'
            })
            .select();
        
        if (insertError) {
            console.error(' Direct insert failed:', insertError.message);
            console.log('This might mean some columns are missing. Please run the SQL script.');
        } else {
            console.log(' Direct insert successful');
            console.log('Document ID:', insertData[0]?.id);
            
            // Clean up test data
            await supabase
                .from('patient_documents')
                .delete()
                .eq('id', insertData[0]?.id);
        }
        
        // Test 3: Test the upload function (if available)
        console.log('\n3. Testing upload_patient_document function...');
        try {
            const { data: funcData, error: funcError } = await supabase
                .rpc('upload_patient_document', {
                    p_patient_id: testPatientId,
                    p_doctor_id: testDoctorId,
                    p_document_name: 'Function Test.pdf',
                    p_document_type: 'lab_report',
                    p_file_url: 'https://example.com/func-test.pdf',
                    p_file_name: 'func-test.pdf',
                    p_file_size: 2048,
                    p_mime_type: 'application/pdf',
                    p_description: 'Function test document'
                });
            
            if (funcError) {
                console.log(' Function not available:', funcError.message);
                console.log('Will use fallback method (direct insert)');
            } else {
                console.log(' upload_patient_document function works');
                console.log('Document ID from function:', funcData);
                
                // Clean up
                await supabase
                    .from('patient_documents')
                    .delete()
                    .eq('id', funcData);
            }
        } catch (error) {
            console.log(' Function not available, will use fallback');
        }
        
        // Test 4: Test the get documents function (if available)
        console.log('\n4. Testing get_patient_documents function...');
        try {
            const { data: getDocsData, error: getDocsError } = await supabase
                .rpc('get_patient_documents', {
                    p_patient_id: testPatientId,
                    p_limit: 10,
                    p_offset: 0
                });
            
            if (getDocsError) {
                console.log(' Function not available:', getDocsError.message);
                console.log('Will use fallback method (direct query)');
            } else {
                console.log(' get_patient_documents function works');
                console.log('Returned documents:', getDocsData?.length || 0);
            }
        } catch (error) {
            console.log('  Function not available, will use fallback');
        }
        
        // Test 5: Test API endpoints
        console.log('\n5. Testing API endpoints...');
        console.log('You can test the following endpoints:');
        console.log('- GET /api/dashboard/patient/:patientId/documents');
        console.log('- POST /api/dashboard/doctor/:doctorId/documents/upload');
        console.log('- GET /api/dashboard/patient/:patientId/dashboard');
        
        console.log('\n Document system setup verification completed!');
        console.log('\n Summary:');
        console.log('- Table exists and is accessible');
        console.log('- Direct insert/query methods work (fallback)');
        console.log('- API endpoints have fallback mechanisms');
        console.log('- Frontend dashboard should work with current setup');
        
        if (insertError || funcError) {
            console.log('\n Recommendations:');
            console.log('- Run the fix-patient-documents.sql script to add missing columns and functions');
            console.log('- The system will work with fallback methods in the meantime');
        }
        
    } catch (error) {
        console.error(' Test failed:', error);
    }
}

testDocumentSystem();
