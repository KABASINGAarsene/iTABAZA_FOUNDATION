const { supabase } = require("./config/db");

async function testDoctorEndpoints() {
    console.log("🧪 Testing Doctor Endpoints...\n");
    
    try {
        // Test 1: Get all doctors
        console.log("1. Testing GET /doctor/allDoctor");
        const { data: allDoctors, error: allError } = await supabase
            .from('doctors')
            .select('*');
        
        if (allError) {
            console.error("❌ Error getting all doctors:", allError);
        } else {
            console.log(`✅ Found ${allDoctors.length} total doctors`);
        }
        
        // Test 2: Get available doctors
        console.log("\n2. Testing GET /doctor/availableDoctors");
        const { data: availableDoctors, error: availableError } = await supabase
            .from('doctors')
            .select('*')
            .eq('status', true)
            .eq('is_available', true);
        
        if (availableError) {
            console.error("❌ Error getting available doctors:", availableError);
        } else {
            console.log(`✅ Found ${availableDoctors.length} available doctors`);
            if (availableDoctors.length > 0) {
                console.log("   Available doctors:");
                availableDoctors.forEach(doctor => {
                    console.log(`   - ${doctor.doctor_name} (${doctor.email})`);
                });
            }
        }
        
        // Test 3: Get doctors by department (if departments exist)
        console.log("\n3. Testing GET /doctor/availableDoctors/:id");
        const { data: departments, error: deptError } = await supabase
            .from('departments')
            .select('id, dept_name')
            .limit(1);
        
        if (deptError) {
            console.error("❌ Error getting departments:", deptError);
        } else if (departments.length > 0) {
            const deptId = departments[0].id;
            const { data: deptDoctors, error: deptDoctorsError } = await supabase
                .from('doctors')
                .select('*')
                .eq('department_id', deptId)
                .eq('status', true)
                .eq('is_available', true);
            
            if (deptDoctorsError) {
                console.error("❌ Error getting doctors by department:", deptDoctorsError);
            } else {
                console.log(`✅ Found ${deptDoctors.length} available doctors in ${departments[0].dept_name}`);
            }
        } else {
            console.log("⚠️  No departments found to test department filtering");
        }
        
        // Test 4: Check doctor status distribution
        console.log("\n4. Doctor Status Distribution:");
        const { data: statusCounts, error: statusError } = await supabase
            .from('doctors')
            .select('status, is_available');
        
        if (statusError) {
            console.error("❌ Error getting status counts:", statusError);
        } else {
            const approved = statusCounts.filter(d => d.status === true).length;
            const available = statusCounts.filter(d => d.is_available === true).length;
            const approvedAndAvailable = statusCounts.filter(d => d.status === true && d.is_available === true).length;
            
            console.log(`   Total doctors: ${statusCounts.length}`);
            console.log(`   Approved (status=true): ${approved}`);
            console.log(`   Available (is_available=true): ${available}`);
            console.log(`   Approved & Available: ${approvedAndAvailable}`);
        }
        
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

// Run the test
testDoctorEndpoints(); 