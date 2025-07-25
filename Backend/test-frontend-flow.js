const baseURL = 'http://localhost:8080';

async function testFrontendFlow() {
    const { default: fetch } = await import('node-fetch');
    console.log(' Testing exact frontend OTP flow...\n');
    
    // Simulate user data from frontend form
    const userDetails = {
        first_name: 'Frontend',
        last_name: 'Test',
        email: `frontend.test.${Date.now()}@example.com`,
        mobile: `+25078${Math.floor(Math.random() * 10000000)}`,
        password: 'frontendpass123'
    };
    
    try {
        // STEP 1: Simulate signup.js - Send OTP
        console.log(' Simulating signup.js - Sending OTP...');
        const otpResponse = await fetch(`${baseURL}/user/emailVerify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: userDetails.email })
        });
        
        const otpData = await otpResponse.json();
        console.log(' OTP Response:', otpData);
        
        // Simulate localStorage.setItem(\"userDetails\", JSON.stringify(userDetails));
        // Simulate localStorage.setItem(\"otp\", otpData.otp);
        
        // STEP 2: Simulate otp.js - Verify OTP and create user
        console.log('\n Simulating otp.js - Verifying OTP and creating user...');
        
        // This simulates the OTP verification process
        const enteredOTP = otpData.otp; // User enters correct OTP
        const storedOTP = otpData.otp;  // OTP from localStorage
        
        console.log('OTP Verification:', {
            enteredOTP,
            storedOTP,
            match: enteredOTP === storedOTP
        });
        
        if (enteredOTP === storedOTP) {
            console.log(' OTP matches, proceeding with signup...');
            
            // This is the actual signup call from otp.js
            const signupResponse = await fetch(`${baseURL}/user/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userDetails)
            });
            
            const signupData = await signupResponse.json();
            console.log(' Signup Response:', signupData);
            
            // STEP 3: Verify user was created in database
            console.log('\n Verifying user was created in database...');
            
            // Try to login with the created user
            const loginResponse = await fetch(`${baseURL}/user/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    payload: userDetails.email,
                    password: userDetails.password
                })
            });
            
            const loginData = await loginResponse.json();
            console.log('Login Response:', loginData);
            
            if (loginData.message === 'Login Successful') {
                console.log(' SUCCESS: User was created and can login!');
                console.log('   User ID:', loginData.id);
                console.log('   Name:', loginData.name);
                console.log('   Email:', loginData.email);
            } else {
                console.log(' PROBLEM: User cannot login after successful signup');
                console.log('   Error:', loginData.msg);
            }
        } else {
            console.log(' OTP does not match');
        }
        
    } catch (error) {
        console.error(' Test failed:', error.message);
    }
}

// Run the test
testFrontendFlow();
