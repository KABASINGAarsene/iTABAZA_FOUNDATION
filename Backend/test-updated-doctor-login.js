const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8080'; // Adjust if your server runs on a different port
const ADMIN_URL = 'http://localhost:3000'; // Frontend URL

// Updated doctor test credentials (now with @itabaza.com)
const testCredentials = [
    {
        name: 'Dr. Robert Taylor',
        email: 'robert.taylor@itabaza.com',
        password: 'doctor123'
    },
    {
        name: 'Dr. Michael Brown', 
        email: 'michael.brown@itabaza.com',
        password: 'doctor123'
    },
    {
        name: 'Dr. John Smith',
        email: 'john.smith@itabaza.com', 
        password: 'doctor123'
    },
    {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@itabaza.com',
        password: 'doctor123'  
    }
];

async function testDoctorLogin(credential) {
    try {
        console.log(`🧪 Testing login for ${credential.name}...`);
        
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: credential.email,
            password: credential.password
        });
        
        if (response.data.success && response.data.userType === 'doctor') {
            console.log(`✅ ${credential.name} login successful!`);
            console.log(`   📧 Email: ${credential.email}`);
            console.log(`   🏥 Dashboard: ${response.data.dashboardUrl}`);
            console.log(`   🆔 Doctor ID: ${response.data.user.id}`);
            console.log(`   🩺 Department ID: ${response.data.user.departmentId}`);
            console.log('');
            return true;
        } else {
            console.log(`❌ ${credential.name} login failed:`, response.data.message);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ ${credential.name} login error:`, error.response?.data?.message || error.message);
        return false;
    }
}

async function testAllUpdatedDoctorLogins() {
    console.log('🏥 iTABAZA Doctor Login Testing');
    console.log('===============================');
    console.log('Testing updated doctor emails with @itabaza.com branding\n');
    
    const results = [];
    
    for (const credential of testCredentials) {
        const result = await testDoctorLogin(credential);
        results.push({ ...credential, success: result });
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('📊 Test Results Summary:');
    console.log('========================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful logins: ${successful.length}/${results.length}`);
    successful.forEach(r => {
        console.log(`   • ${r.name} (${r.email})`);
    });
    
    if (failed.length > 0) {
        console.log(`❌ Failed logins: ${failed.length}/${results.length}`);
        failed.forEach(r => {
            console.log(`   • ${r.name} (${r.email})`);
        });
    }
    
    console.log('\n📝 Updated Login Instructions:');
    console.log('==============================');
    console.log('1. Go to your login page: http://0.0.0.0:3000/login.html');
    console.log('2. Use any of these doctor credentials:');
    
    successful.forEach(r => {
        console.log(`   • Email: ${r.email}`);
        console.log(`     Password: ${r.password}`);
        console.log('');
    });
    
    if (successful.length === results.length) {
        console.log('🎉 All doctor emails have been successfully updated to iTABAZA branding!');
        console.log('🔐 All test logins are working correctly with the new @itabaza.com emails.');
    } else {
        console.log('⚠️  Some doctors may need password setup. Run: node setup-doctor-credentials.js');
    }
}

async function checkServerHealth() {
    try {
        const response = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ Server is running and database is connected');
        return true;
    } catch (error) {
        console.log('❌ Server is not running or not accessible');
        console.log('   Make sure your server is running on:', BASE_URL);
        return false;
    }
}

// Main execution
async function main() {
    const serverReady = await checkServerHealth();
    
    if (!serverReady) {
        console.log('\n🔧 To start the server:');
        console.log('1. cd Backend');
        console.log('2. npm install');  
        console.log('3. node index.js');
        return;
    }
    
    console.log('');
    await testAllUpdatedDoctorLogins();
}

// Run the test
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    testDoctorLogin,
    testAllUpdatedDoctorLogins
};
