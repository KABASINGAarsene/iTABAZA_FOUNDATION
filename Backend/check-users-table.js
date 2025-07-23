const { supabase } = require('./config/db');

async function checkUserTable() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(3);
        
        if (!error && data) {
            console.log('Sample user records:');
            data.forEach((user, index) => {
                console.log(`User ${index + 1}:`, user);
            });
        } else {
            console.log('Error fetching users:', error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUserTable();
