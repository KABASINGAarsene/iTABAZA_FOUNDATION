const axios = require('axios');

async function testUnifiedLogin() {
  const baseURL = 'http://localhost:8080';
  
  console.log(' Testing Unified Login System\n');
  
  // Test cases
  const testCases = [
    {
      name: "Patient Login",
      email: "nishimwejoseph26@gmail.com",
      password: "yourpassword", // You'll need to replace this
      expectedType: "patient"
    },
    {
      name: "Admin Login", 
      email: "admin@iTABAZA.com",
      password: "admin123", // Default admin password
      expectedType: "admin"
    },
    {
      name: "Invalid Login",
      email: "nonexistent@example.com", 
      password: "wrongpassword",
      expectedType: null
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`🔍 Testing: ${testCase.name}`);
    console.log(`   Email: ${testCase.email}`);
    
    try {
      const response = await axios.post(`${baseURL}/auth/login`, {
        email: testCase.email,
        password: testCase.password
      });
      
      const data = response.data;
      
      if (data.success) {
        console.log(` Login successful!`);
        console.log(`   User Type: ${data.userType}`);
        console.log(`   Dashboard URL: ${data.dashboardUrl}`);
        console.log(`   User Name: ${data.user.firstName || data.user.name}`);
        
        if (data.userType === testCase.expectedType) {
          console.log(` User type matches expected: ${testCase.expectedType}`);
        } else {
          console.log(`  User type mismatch. Expected: ${testCase.expectedType}, Got: ${data.userType}`);
        }
        
        // Test the user-role endpoint
        console.log(` Testing /auth/user-role endpoint...`);
        try {
          const roleResponse = await axios.get(`${baseURL}/auth/user-role`, {
            headers: {
              'Authorization': `Bearer ${data.token}`
            }
          });
          
          if (roleResponse.data.success) {
            console.log(` Role endpoint works: ${roleResponse.data.userType}`);
          }
        } catch (roleError) {
          console.log(` Role endpoint failed:`, roleError.response?.data);
        }
        
      } else {
        console.log(` Login failed: ${data.message}`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(` Login failed: ${error.response.data.message || error.response.data}`);
        if (testCase.expectedType === null) {
          console.log(` Expected failure for invalid credentials`);
        }
      } else {
        console.log(` Network error:`, error.message);
      }
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log(' Testing complete!');
  
  // Instructions
  console.log('\n Next Steps:');
  console.log('1. Replace "yourpassword" with the actual password for nishimwejoseph26@gmail.com');
  console.log('2. Add password_hash column to doctors table using the SQL in SETUP_INSTRUCTIONS.md');
  console.log('3. Test doctor login after database update');
  console.log('4. Visit http://localhost:8080/unified-login.html to test in browser');
}

// Only run if this file is executed directly
if (require.main === module) {
  testUnifiedLogin().catch(console.error);
}

module.exports = { testUnifiedLogin };
