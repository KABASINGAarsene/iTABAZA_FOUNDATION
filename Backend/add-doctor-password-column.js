const { supabase } = require("./config/db");

async function addDoctorPasswordColumn() {
  try {
    console.log("Adding password_hash column to doctors table...");
    
    // First check if the column already exists
    const { data: existingDoctors, error: checkError } = await supabase
      .from('doctors')
      .select('*')
      .limit(1);
      
    if (checkError) {
      console.error("Error checking doctors table:", checkError);
      return;
    }
    
    if (existingDoctors && existingDoctors.length > 0 && 'password_hash' in existingDoctors[0]) {
      console.log("password_hash column already exists in doctors table");
      return;
    }
    
    console.log("Column doesn't exist, adding it...");
    
    // Since Supabase doesn't support direct ALTER TABLE, we need to use the SQL editor
    // For now, let's create a simple test to see if we can access it
    
    // Try to select from doctors to see current structure
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('id, doctor_name, email')
      .limit(1);
      
    if (error) {
      console.error("Error accessing doctors table:", error);
    } else {
      console.log("Current doctors table accessible");
      console.log("Current columns visible:", Object.keys(doctors[0] || {}));
    }
    
    console.log("Note: You need to add the password_hash column manually in Supabase dashboard");
    console.log("   or run the SQL: ALTER TABLE doctors ADD COLUMN password_hash VARCHAR(255);");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

addDoctorPasswordColumn();
