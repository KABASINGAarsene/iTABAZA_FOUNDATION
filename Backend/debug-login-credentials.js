const { supabase } = require("./config/db");
const bcrypt = require('bcrypt');

async function debugLoginCredentials() {
  try {
    console.log(" Debugging login credentials...\n");
    
    // Test the most common user from your database
    const testEmail = "nishimwejoseph26@gmail.com";
    
    console.log(` Testing user: ${testEmail}`);
    
    // Get the user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
      
    if (error) {
      console.log(" User not found:", error.message);
      return;
    }
    
    console.log(" User found in database:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Mobile: ${user.mobile}`);
    console.log(`   Password hash exists: ${user.password ? 'approved' : 'wrong'}`);
    
    if (user.password) {
      console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
      
      // Test common passwords
      const testPasswords = [
        "test123",
        "password",
        "123456",
        "nishimwe123",
        "joseph123",
        "itabaza123"
      ];
      
      console.log("\n Testing common passwords:");
      
      for (const pwd of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(pwd, user.password);
          if (isMatch) {
            console.log(` MATCH FOUND! Password: "${pwd}"`);
            
            // Test the unified login with this password
            console.log("\n Testing unified login with found credentials...");
            const axios = require('axios');
            
            const response = await axios.post('http://localhost:8080/auth/login', {
              email: testEmail,
              password: pwd
            });
            
            if (response.data.success) {
              console.log(" Unified login successful!");
              console.log(`   User Type: ${response.data.userType}`);
              console.log(`   Dashboard URL: ${response.data.dashboardUrl}`);
            }
            
            return; // Found working password, exit
          } else {
            console.log(` "${pwd}" - no match`);
          }
        } catch (err) {
          console.log(` Error testing "${pwd}":`, err.message);
        }
      }
      
      console.log("\n  None of the common passwords worked.");
      console.log(" You may need to:");
      console.log("   1. Check what password was used when creating this account");
      console.log("   2. Reset the password in your database");
      console.log("   3. Try the old /user/signin endpoint to see if it works");
    }
    
    // Test old endpoint for comparison
    console.log("\n Testing old /user/signin endpoint...");
    try {
      const axios = require('axios');
      const response = await axios.post('http://localhost:8080/user/signin', {
        payload: testEmail,
        password: "test123" // Try common password
      });
      
      console.log("Old endpoint response:", response.data);
      
    } catch (error) {
      console.log("Old endpoint error:", error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error(" Debug error:", error.message);
  }
}

debugLoginCredentials();
