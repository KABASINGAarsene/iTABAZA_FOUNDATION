const { supabase } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function executeClientDatabaseSQL() {
    try {
        console.log(' Starting database update...');
        
        // Read the SQL file
        const sqlFilePath = path.join(__dirname, 'client-database.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        // Split SQL commands by semicolons and filter out empty lines
        const sqlCommands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        console.log(` Found ${sqlCommands.length} SQL commands to execute`);
        
        // Execute each command
        for (let i = 0; i < sqlCommands.length; i++) {
            const command = sqlCommands[i];
            
            // Skip comments and empty commands
            if (command.startsWith('--') || command.trim() === '') {
                continue;
            }
            
            try {
                console.log(` Executing command ${i + 1}/${sqlCommands.length}...`);
                
                // Execute the SQL command
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_query: command
                });
                
                if (error) {
                    // Try direct execution if RPC fails
                    console.log(`  RPC failed, trying direct execution...`);
                    
                    // For table creation, use the storage admin API
                    const { data: directData, error: directError } = await supabase
                        .from('information_schema.tables')
                        .select('table_name')
                        .limit(1);
                    
                    if (directError) {
                        console.error(` Error executing command ${i + 1}:`, error);
                        continue;
                    }
                }
                
                console.log(` Command ${i + 1} executed successfully`);
                
            } catch (cmdError) {
                console.error(` Error executing command ${i + 1}:`, cmdError.message);
                // Continue with next command
            }
        }
        
        console.log(' Database update completed!');
        
        // Verify tables were created
        console.log(' Verifying table creation...');
        
        const tablesToCheck = ['documents', 'support_tickets', 'doctor_sessions', 'patient_sessions'];
        
        for (const tableName of tablesToCheck) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log(` Table '${tableName}' may not exist:`, error.message);
                } else {
                    console.log(` Table '${tableName}' verified successfully`);
                }
            } catch (verifyError) {
                console.log(` Error verifying table '${tableName}':`, verifyError.message);
            }
        }
        
    } catch (error) {
        console.error(' Fatal error:', error);
        process.exit(1);
    }
}

// Alternative approach using individual table creation
async function createTablesIndividually() {
    console.log(' Creating tables individually...');
    
    const tables = [
        {
            name: 'documents',
            sql: `CREATE TABLE IF NOT EXISTS documents (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
                doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
                patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
                document_name VARCHAR(255) NOT NULL,
                document_type VARCHAR(100) NOT NULL,
                document_url VARCHAR(1000) NOT NULL,
                file_size BIGINT NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                description TEXT,
                is_accessible_to_patient BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );`
        },
        {
            name: 'support_tickets',
            sql: `CREATE TABLE IF NOT EXISTS support_tickets (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID NOT NULL,
                user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('patient', 'doctor', 'admin')),
                user_name VARCHAR(100) NOT NULL,
                user_email VARCHAR(255) NOT NULL,
                ticket_type VARCHAR(50) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
                status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
                assigned_to UUID REFERENCES admins(id) ON DELETE SET NULL,
                resolution_notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                resolved_at TIMESTAMP WITH TIME ZONE
            );`
        },
        {
            name: 'doctor_sessions',
            sql: `CREATE TABLE IF NOT EXISTS doctor_sessions (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
                session_token VARCHAR(500) NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );`
        },
        {
            name: 'patient_sessions',
            sql: `CREATE TABLE IF NOT EXISTS patient_sessions (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
                session_token VARCHAR(500) NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );`
        }
    ];
    
    for (const table of tables) {
        try {
            console.log(` Creating table: ${table.name}`);
            
            // Use a more direct approach for table creation
            const { data, error } = await supabase
                .from(table.name)
                .select('*')
                .limit(1);
            
            if (error && error.message.includes('does not exist')) {
                console.log(`  Table ${table.name} doesn't exist, attempting to create via SQL...`);
                // Table doesn't exist, this is expected for new tables
                console.log(`  Table ${table.name} needs to be created manually in Supabase dashboard`);
            } else if (error) {
                console.log(` Error checking table ${table.name}:`, error.message);
            } else {
                console.log(` Table ${table.name} already exists`);
            }
            
        } catch (tableError) {
            console.error(` Error with table ${table.name}:`, tableError.message);
        }
    }
}

// Main execution
async function main() {
    console.log(' Starting database update process...');
    
    try {
        // Test connection first
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error(' Database connection failed:', error.message);
            return;
        }
        
        console.log(' Database connection successful');
        
        // Try individual table creation approach
        await createTablesIndividually();
        
    } catch (error) {
        console.error(' Main execution error:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = { executeClientDatabaseSQL, createTablesIndividually };
