const { supabase } = require("./config/db");
const bcrypt = require('bcrypt');

async function checkExistingAccounts() {
  try {
    console.log(" Checking existing accounts...\n");
    
    // Check patients in users table
    console.log(" PATIENTS (users table):");
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, mobile');
      
    if (usersError) {
      console.error(" Error fetching users:", usersError);
    } else {
      users.forEach(user => {
        console.log(`  - ${user.first_name} ${user.last_name} (${user.email})`);
      });
      console.log(`  Total patients: ${users.length}\n`);
    }
    
    // Check doctors
    console.log(" DOCTORS (doctors table):");
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('id, doctor_name, email, status, is_available, password_hash');
      
    if (doctorsError) {
      console.error(" Error fetching doctors:", doctorsError);
    } else {
      doctors.forEach(doctor => {
        const hasPassword = doctor.password_hash ? 'key' : 'wrong';
        const status = doctor.status ? 'correct' : 'pending';
        const available = doctor.is_available ? '🟢' : '🔴';
        console.log(`  - ${doctor.doctor_name} (${doctor.email}) ${hasPassword} ${status} ${available}`);
      });
      console.log(`  Total doctors: ${doctors.length}`);
      console.log(`  correct = Has password, wrong = No password`);
      console.log(`  tick = Approved, pending = Pending approval`);
      console.log(`  🟢 = Available, 🔴 = Not available\n`);
    }
    
    // Check admins
    console.log("👥 ADMINS (admins table):");
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('id, name, email, role, is_active');
      
    if (adminsError) {
      console.error(" Error fetching admins:", adminsError);
    } else {
      admins.forEach(admin => {
        const status = admin.is_active ? 'correct' : 'wrong';
        console.log(`  - ${admin.name} (${admin.email}) - ${admin.role} ${status}`);
      });
      console.log(`  Total admins: ${admins.length}\n`);
    }
    
    // Test password verification for a patient (if exists)
    if (users && users.length > 0) {
      const testUser = users[0];
      console.log(`Testing patient password for ${testUser.email}...`);
      
      const { data: userWithPassword, error } = await supabase
        .from('users')
        .select('password')
        .eq('id', testUser.id)
        .single();
        
      if (error) {
        console.log("Could not fetch user password");
      } else {
        console.log("Patient has password hash in database");
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkExistingAccounts();
