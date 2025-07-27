const { supabase } = require('./config/db');

async function checkPatientTable() {
    try {
        // Check different possible patient table names
        const possibleNames = ['patients', 'patient', 'users'];
        
        for (const name of possibleNames) {
            try {
                const { data, error } = await supabase
                    .from(name)
                    .select('id')
                    .limit(1);
                
                if (!error) {
                    console.log('Found table:', name);
                    
                    // Check columns
                    const { data: sample } = await supabase
                        .from(name)
                        .select('*')
                        .limit(1);
                    
                    if (sample && sample.length > 0) {
                        console.log('Sample columns:', Object.keys(sample[0]));
                    }
                } else {
                    console.log('wrong', name, '- does not exist');
                }
            } catch (err) {
                console.log('wrong', name, '- error:', err.message);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkPatientTable();
