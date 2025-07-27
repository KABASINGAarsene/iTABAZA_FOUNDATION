const { supabase } = require('./config/db');

async function setupEnhancedAppointments() {
  console.log('Setting up enhanced appointments table...');
  
  try {
    // Check if appointments table exists by trying to describe it
    const { data: existingData, error: existingError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (existingError && existingError.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating appointments table...');
      
      // Note: In a real Supabase setup, you would run this SQL in the SQL Editor
      console.log(`
        Please run the following SQL in your Supabase SQL Editor:
        
        CREATE TABLE IF NOT EXISTS appointments (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          patient_id UUID REFERENCES users(id),
          doctor_id UUID REFERENCES doctors(id),
          patient_first_name VARCHAR(100) NOT NULL,
          doc_first_name VARCHAR(100) NOT NULL,
          age_of_patient INTEGER NOT NULL,
          gender VARCHAR(10) NOT NULL,
          address TEXT NOT NULL,
          problem_description TEXT NOT NULL,
          appointment_date VARCHAR(20) NOT NULL,
          slot_time VARCHAR(20),
          appointment_time VARCHAR(20),
          consultation_type VARCHAR(20) DEFAULT 'in-person',
          symptoms TEXT[],
          medical_history TEXT,
          medications TEXT,
          status BOOLEAN DEFAULT FALSE,
          payment_status BOOLEAN DEFAULT FALSE,
          payment_transaction_id VARCHAR(100),
          payment_simcard_holder VARCHAR(100),
          payment_owner_name VARCHAR(100),
          payment_phone_number VARCHAR(20),
          payment_method VARCHAR(20),
          payment_amount DECIMAL(10,2),
          payment_currency VARCHAR(3) DEFAULT 'RWF',
          booking_source VARCHAR(20) DEFAULT 'web',
          patient_email VARCHAR(255),
          patient_phone VARCHAR(20),
          voice_recording_id UUID REFERENCES voice_recordings(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);
        CREATE INDEX IF NOT EXISTS idx_appointments_consultation_type ON appointments(consultation_type);
        CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
        
        -- Enable RLS
        ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
        
        -- RLS Policies
        CREATE POLICY "Users can view their own appointments" ON appointments
          FOR SELECT USING (auth.uid()::text = patient_id::text);
        
        CREATE POLICY "Users can create appointments" ON appointments
          FOR INSERT WITH CHECK (true);
        
        CREATE POLICY "Users can update their own appointments" ON appointments
          FOR UPDATE USING (auth.uid()::text = patient_id::text);
      `);
      
    } else if (existingError) {
      console.error('Error checking appointments table:', existingError);
    } else {
      console.log('Appointments table exists. Checking for required columns...');
      
      // Check if payment_owner_name column exists
      const testData = existingData[0];
      if (testData && !testData.hasOwnProperty('payment_owner_name')) {
        console.log(`
          Please add the missing payment_owner_name column by running this SQL in Supabase SQL Editor:
          
          ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_owner_name VARCHAR(100);
        `);
      } else {
        console.log('All required columns are present.');
      }
    }
    
    console.log('Enhanced appointments setup completed.');
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupEnhancedAppointments();
