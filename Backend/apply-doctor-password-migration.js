const { supabase } = require("./config/db");
const fs = require('fs');
const path = require('path');

async function applyDoctorPasswordMigration() {
  try {
    console.log("Applying doctor password migration...");
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add-doctor-password.sql'), 
      'utf8'
    );
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log("Executing:", statement.substring(0, 100) + "...");
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.log("Non-critical error (might be expected):", error.message);
        } else {
          console.log("Statement executed successfully");
        }
      }
    }
    
    // Verify the column was added
    const { data: columns, error: columnError } = await supabase
      .from('doctors')
      .select('*')
      .limit(1);
      
    if (columnError) {
      console.error("Error checking doctors table:", columnError);
    } else {
      console.log("Migration completed successfully");
      if (columns && columns.length > 0) {
        const hasPasswordHash = 'password_hash' in columns[0];
        console.log("password_hash column exists:", hasPasswordHash);
      }
    }
    
  } catch (error) {
    console.error("Migration failed:", error.message);
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  applyDoctorPasswordMigration();
}

module.exports = { applyDoctorPasswordMigration };
