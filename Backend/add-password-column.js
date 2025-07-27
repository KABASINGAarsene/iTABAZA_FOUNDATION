const { supabase } = require('./config/db');

async function addPasswordColumn() {
    console.log('Adding password_hash column to doctors table...\n');

    try {
        // Use raw SQL to add the column
        const { data, error } = await supabase.rpc('sql', {
            query: `
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'doctors' AND column_name = 'password_hash'
                    ) THEN
                        ALTER TABLE doctors ADD COLUMN password_hash VARCHAR(255);
                        RAISE NOTICE 'password_hash column added successfully';
                    ELSE
                        RAISE NOTICE 'password_hash column already exists';
                    END IF;
                END $$;
            `
        });

        if (error) {
            console.log('RPC method not available. Trying direct query...');
            
            // Alternative method: Direct query execution
            const result = await supabase
                .from('doctors')
                .select('password_hash')
                .limit(1);
            
            if (result.error && result.error.message.includes('password_hash')) {
                console.log('password_hash column does not exist and cannot be added via API');
                console.log('Manual steps required:');
                console.log('1. Go to your Supabase dashboard');
                console.log('2. Open the Table Editor');
                console.log('3. Select the "doctors" table');
                console.log('4. Add a new column:');
                console.log('   - Name: password_hash');
                console.log('   - Type: text');
                console.log('   - Default value: (leave empty)');
                console.log('   - Is nullable: true');
                console.log('5. Save the changes');
                console.log('\nAlternatively, run this SQL in the SQL Editor:');
                console.log('ALTER TABLE doctors ADD COLUMN password_hash TEXT;');
                return false;
            } else {
                console.log('password_hash column already exists');
                return true;
            }
        } else {
            console.log('password_hash column operation completed');
            return true;
        }

    } catch (error) {
        console.error('Error adding password column:', error.message);
        return false;
    }
}

// Test the column addition
async function main() {
    const success = await addPasswordColumn();
    
    if (success) {
        console.log('\nReady to set up doctor credentials!');
        console.log('Run: node setup-doctor-credentials.js');
    }
    
    process.exit(0);
}

main();
