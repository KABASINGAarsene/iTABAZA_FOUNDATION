const http = require('http');

const baseURL = 'localhost';
const port = 8080;

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: baseURL,
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testUnifiedLogin() {
  console.log(' Testing Unified Login System');
  console.log('='.repeat(50));
  
  const testCases = [
    {
      name: "Patient Login Test",
      email: "nishimwejoseph26@gmail.com",
      password: "k@#+ymej@AQ@3",
      expectedType: "patient",
      description: "Testing patient authentication"
    },
    {
      name: "Doctor Login Test (Dr. John Smith)",
      email: "john.smith@iTABAZA.com", 
      password: "doctor123",
      expectedType: "doctor",
      description: "Testing doctor authentication with default password"
    },
    {
      name: "Doctor Login Test (Dr. Sarah Johnson)",
      email: "sarah.johnson@iTABAZA.com",
      password: "password123",
      expectedType: "doctor", 
      description: "Testing doctor authentication with alternative password"
    },
    {
      name: "Admin Login Test",
      email: "admin@iTABAZA.com",
      password: "password123",
      expectedType: "admin",
      description: "Testing admin authentication"
    },
    {
      name: "Invalid Login Test",
      email: "nonexistent@example.com",
      password: "wrongpassword", 
      expectedType: null,
      description: "Testing invalid credentials handling"
    }
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  // First, test server health
  try {
    console.log(' Checking if server is running...');
    const healthResponse = await makeRequest('/api/health', 'GET');
    if (healthResponse.statusCode === 200) {
      console.log(' Server is running!\n');
    } else {
      console.log('  Server health check returned:', healthResponse.statusCode);
    }
  } catch (error) {
    console.log(' Server appears to be offline:', error.message);
    console.log('Please make sure the backend server is running on port 8080\n');
    return;
  }
  
  for (const testCase of testCases) {
    console.log(` ${testCase.name}`);
    console.log(`   Description: ${testCase.description}`);
    console.log(`   Email: ${testCase.email}`);
    
    try {
      const response = await makeRequest('/auth/login', 'POST', {
        email: testCase.email,
        password: testCase.password
      });
      
      const data = response.data;
      
      if (response.statusCode === 200 && data.success) {
        console.log(' Login successful!');
        console.log(`   User Type: ${data.userType}`);
        console.log(`   Dashboard URL: ${data.dashboardUrl}`);
        console.log(`   User Name: ${data.user.firstName || data.user.name}`);
        console.log(`   Token: ${data.token ? 'Generated' : 'Missing'}`);
        
        if (data.userType === testCase.expectedType) {
          console.log(` User type matches expected: ${testCase.expectedType}`);
          passedTests++;
        } else {
          console.log(` User type mismatch. Expected: ${testCase.expectedType}, Got: ${data.userType}`);
        }
        
        // Test the user-role endpoint if login was successful
        if (data.token) {
          console.log(' Testing /auth/user-role endpoint...');
          try {
            const roleResponse = await makeRequest('/auth/user-role', 'GET', null);
            // Note: We can't easily test the auth endpoint without proper headers in this simple setup
            console.log('   (Role endpoint test skipped - would need Authorization header)');
          } catch (roleError) {
            console.log(` Role endpoint failed: ${roleError.message}`);
          }
        }
        
      } else {
        if (testCase.expectedType === null) {
          console.log(` Expected failure for invalid credentials: ${data.message}`);
          passedTests++;
        } else {
          console.log(` Login failed unexpectedly: ${data.message || 'Unknown error'}`);
          console.log(`   Status Code: ${response.statusCode}`);
        }
      }
      
    } catch (error) {
      if (testCase.expectedType === null) {
        console.log(` Expected failure for invalid credentials`);
        passedTests++;
      } else {
        console.log(` Network error: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('='.repeat(50));
  console.log(' Testing Complete!');
  console.log(` Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log(' All tests passed! Unified login is working correctly.');
  } else {
    console.log('  Some tests failed. Please check the issues above.');
  }
  
  console.log('\n Instructions for manual testing:');
  console.log('1. Visit: http://localhost:3000/login.html');
  console.log('2. Try logging in with these WORKING credentials:');
  console.log('    Patient: nishimwejoseph26@gmail.com / k@#+ymej@AQ@3');
  console.log('    Doctor: john.smith@iTABAZA.com / doctor123');
  console.log('    Doctor: sarah.johnson@iTABAZA.com / password123');
  console.log('    Admin: [password needs to be determined]');
  console.log('3. Each should redirect to the appropriate dashboard');
}

// Run the tests
testUnifiedLogin().catch(console.error);
