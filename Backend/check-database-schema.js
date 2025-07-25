const { supabase } = require('./config/db');

async function checkDatabaseSchema() {
    try {
        // Try to access known tables first
        const knownTables = ['patients', 'doctors', 'appointments', 'users', 'departments', 'patient_documents'];
        
        console.log('Checking existing tables:');
        
        for (const tableName of knownTables) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log(` ${tableName} - ${error.message}`);
                } else {
                    console.log(` ${tableName} - exists`);
                }
            } catch (err) {
                console.log(` ${tableName} - ${err.message}`);
            }
        }

        // Check specifically for patient_documents table
        console.log('\nChecking patient_documents table specifically:');
        try {
            const { data: testData, error: testError } = await supabase
                .from('patient_documents')
                .select('*')
                .limit(1);
            
            if (testError) {
                console.log(' patient_documents table does NOT exist');
                console.log('Error:', testError.message);
            } else {
                console.log(' patient_documents table exists');
                console.log('Sample data count:', testData ? testData.length : 0);
            }
        } catch (err) {
            console.log(' patient_documents table does NOT exist');
            console.log('Error:', err.message);
        }

    } catch (error) {
        console.error('Error checking database schema:', error);
    }
}

checkDatabaseSchema();
