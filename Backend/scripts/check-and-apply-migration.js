const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndApplyMigration() {
  try {
    console.log('Checking current doctors table structure...');
    
    // First, let's check what columns exist in the doctors table
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('*')
      .limit(1);
    
    if (doctorsError) {
      console.error('Error accessing doctors table:', doctorsError);
      return;
    }
    
    console.log('Current doctors table structure:');
    if (doctors && doctors.length > 0) {
      console.log('Available columns:', Object.keys(doctors[0]));
      
      // Check if password column exists
      const hasPasswordColumn = Object.keys(doctors[0]).includes('password');
      
      if (hasPasswordColumn) {
        console.log('✓ Password column already exists in doctors table');
        
        // Check if doctors have passwords set
        const { data: doctorsWithPasswords, error: passwordCheckError } = await supabase
          .from('doctors')
          .select('id, email, password')
          .not('password', 'is', null);
        
        if (passwordCheckError) {
          console.error('Error checking for passwords:', passwordCheckError);
        } else {
          console.log(`Found ${doctorsWithPasswords.length} doctors with passwords set`);
          
          if (doctorsWithPasswords.length > 0) {
            console.log('Sample doctor with password:');
            console.log({
              id: doctorsWithPasswords[0].id,
              email: doctorsWithPasswords[0].email,
              hasPassword: !!doctorsWithPasswords[0].password
            });
          }
        }
        
        // Show all doctors
        const { data: allDoctors, error: allDoctorsError } = await supabase
          .from('doctors')
          .select('id, email, password');
        
        if (allDoctorsError) {
          console.error('Error fetching all doctors:', allDoctorsError);
        } else {
          console.log('\nAll doctors in database:');
          allDoctors.forEach(doctor => {
            console.log(`- ID: ${doctor.id}, Email: ${doctor.email}, Has Password: ${!!doctor.password}`);
          });
        }
      } else {
        console.log('❌ Password column does not exist in doctors table');
        console.log('Migration needed: Please add the password column manually through Supabase SQL editor');
        console.log('\nSQL to run in Supabase SQL Editor:');
        console.log('ALTER TABLE doctors ADD COLUMN password TEXT;');
        console.log("UPDATE doctors SET password = '$2b$10$rKvK7TUlCnTOqZLECKYMkOJqkzUm6VaQsXdKjNVKXxJNJ8D4lCm.G' WHERE password IS NULL;");
        console.log('CREATE INDEX IF NOT EXISTS idx_doctors_password ON doctors(password);');
      }
    } else {
      console.log('No doctors found in the database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkAndApplyMigration();
