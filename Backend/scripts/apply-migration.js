const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service key for admin operations
);

async function applyMigration() {
  try {
    console.log('Applying migration: add-doctor-password.sql');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add-doctor-password.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL commands (remove line numbers and comments)
    const sqlCommands = migrationSQL
      .split('\n')
      .map(line => line.replace(/^\d+\|/, '').trim()) // Remove line numbers
      .filter(line => line && !line.startsWith('--')) // Remove empty lines and comments
      .join(' ')
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd); // Remove empty commands
    
    console.log('Executing SQL commands:');
    
    for (const command of sqlCommands) {
      console.log(`\n> ${command}`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: command
      });
      
      if (error) {
        console.error('Error executing command:', error);
        
        // Try alternative approach using direct query
        const { data: altData, error: altError } = await supabase
          .from('doctors')
          .select('*')
          .limit(1);
        
        if (altError) {
          console.error('Alternative query also failed:', altError);
        } else {
          console.log('Database connection is working, trying raw SQL...');
          
          // For ALTER TABLE commands, we'll use a different approach
          if (command.includes('ALTER TABLE')) {
            console.log('Attempting to add password column directly...');
            
            // Check if column already exists
            const { data: columns, error: columnError } = await supabase
              .rpc('get_table_columns', { table_name: 'doctors' });
            
            if (columnError) {
              console.error('Could not check table columns:', columnError);
            } else {
              const hasPasswordColumn = columns && columns.some(col => col.column_name === 'password');
              
              if (hasPasswordColumn) {
                console.log('Password column already exists');
              } else {
                console.log('Password column does not exist, manual intervention required');
                console.log('Please add the password column manually through Supabase SQL editor');
              }
            }
          }
        }
      } else {
        console.log('✓ Command executed successfully');
        if (data) {
          console.log('Result:', data);
        }
      }
    }
    
    console.log('\nMigration application completed!');
    
    // Verify the migration worked
    console.log('\nVerifying migration...');
    const { data: testData, error: testError } = await supabase
      .from('doctors')
      .select('id, full_name, email, password')
      .limit(1);
    
    if (testError) {
      console.error('Verification failed:', testError);
    } else {
      console.log('✓ Migration verified successfully');
      console.log('Sample doctor record:', testData);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
applyMigration();
