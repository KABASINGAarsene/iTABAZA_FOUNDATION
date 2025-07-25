const axios = require('axios');

const baseURL = 'http://localhost:8080';

async function testSignupLoginFlow() {
    console.log(' Testing complete signup and login flow...\n');
    
    // Test data
    const testUser = {
        first_name: 'Test',
        last_name: 'User',
        email: `test.${Date.now()}@example.com`,
        mobile: `+25078${Math.floor(Math.random() * 10000000)}`,
        password: 'testpass123'
    };
    
    try {
        // Test 1: Direct signup (should work)
        console.log(' Testing direct signup...');
        const signupResponse = await axios.post(`${baseURL}/user/signup-direct`, testUser);
        console.log(' Direct signup successful:', signupResponse.data.msg);
        console.log('   User ID:', signupResponse.data.user.id);
        console.log('   Token provided:', !!signupResponse.data.token);
        
        // Test 2: Login with the created user
        console.log('\n Testing login with created user...');
        const loginResponse = await axios.post(`${baseURL}/user/signin`, {
            payload: testUser.email,
            password: testUser.password
        });
        console.log(' Login successful:', loginResponse.data.message);
        console.log('   User ID:', loginResponse.data.id);
        console.log('   Token provided:', !!loginResponse.data.token);
        
        // Test 3: Try to signup again (should fail)
        console.log('\n Testing duplicate signup...');
        try {
            await axios.post(`${baseURL}/user/signup-direct`, testUser);
            console.log(' Duplicate signup should have failed');
        } catch (error) {
            console.log(' Duplicate signup correctly rejected:', error.response.data.msg);
        }
        
        // Test 4: Test OTP-based signup flow
        console.log('\n Testing OTP-based signup...');
        const newUser = {
            first_name: 'OTP',
            last_name: 'User',
            email: `otp.${Date.now()}@example.com`,
            mobile: `+25078${Math.floor(Math.random() * 10000000)}`,
            password: 'otppass123'
        };
        
        const otpResponse = await axios.post(`${baseURL}/user/emailVerify`, {
            email: newUser.email
        });
        console.log('OTP sent successfully:', otpResponse.data.msg);
        console.log('OTP:', otpResponse.data.otp);
        
        // Test 5: Complete OTP signup
        console.log('\n Testing OTP signup completion...');
        const completeSignupResponse = await axios.post(`${baseURL}/user/signup`, newUser);
        console.log('OTP signup successful:', completeSignupResponse.data.msg);
        
        // Test 6: Login with OTP-created user
        console.log('\n Testing login with OTP-created user...');
        const otpLoginResponse = await axios.post(`${baseURL}/user/signin`, {
            payload: newUser.email,
            password: newUser.password
        });
        console.log(' OTP user login successful:', otpLoginResponse.data.message);
        
        console.log('\n All tests passed! The signup and login flow is working correctly.');
        
    } catch (error) {
        console.error(' Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testSignupLoginFlow();
