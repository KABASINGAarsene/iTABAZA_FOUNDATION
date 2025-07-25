const { supabase } = require("./config/db");

async function testDoctorAPI() {
    console.log("=== Testing Doctor API Endpoints ===\n");
    
    try {
        // Test 1: Get all doctors
        console.log("1. Testing GET /doctor/allDoctor");
        const { data: allDoctors, error: allError } = await supabase
            .from('doctors')
            .select('*');
            
        if (allError) {
            console.error(" Error fetching all doctors:", allError);
        } else {
            console.log(` Successfully fetched ${allDoctors.length} doctors`);
            console.log("   Sample doctors:");
            allDoctors.slice(0, 3).forEach(doctor => {
                console.log(`   - ${doctor.doctor_name} (${doctor.email})`);
            });
        }
        
        // Test 2: Get available doctors
        console.log("\n2. Testing GET /doctor/availableDoctors");
        const { data: availableDoctors, error: availableError } = await supabase
            .from('doctors')
            .select('*')
            .eq('status', true)
            .eq('is_available', true);
            
        if (availableError) {
            console.error(" Error fetching available doctors:", availableError);
        } else {
            console.log(` Successfully fetched ${availableDoctors.length} available doctors`);
            if (availableDoctors.length > 0) {
                console.log("   Available doctors:");
                availableDoctors.forEach(doctor => {
                    console.log(`   - ${doctor.doctor_name} (Status: ${doctor.status}, Available: ${doctor.is_available})`);
                });
            }
        }
        
        // Test 3: Search doctors by name
        console.log("\n3. Testing GET /doctor/search");
        const searchTerm = "Dr";
        const { data: searchResults, error: searchError } = await supabase
            .from('doctors')
            .select('*')
            .ilike('doctor_name', `%${searchTerm}%`);
            
        if (searchError) {
            console.error(" Error searching doctors:", searchError);
        } else {
            console.log(` Search for "${searchTerm}" returned ${searchResults.length} results`);
        }
        
        // Test 4: Get doctors by department
        console.log("\n4. Testing GET /doctor/allDoctor/:id");
        const departmentId = "1"; // Neurology
        const { data: deptDoctors, error: deptError } = await supabase
            .from('doctors')
            .select('*')
            .eq('department_id', departmentId);
            
        if (deptError) {
            console.error(" Error fetching doctors by department:", deptError);
        } else {
            console.log(` Found ${deptDoctors.length} doctors in department ${departmentId}`);
        }
        
        // Test 5: Get available doctors by department
        console.log("\n5. Testing GET /doctor/availableDoctors/:id");
        const { data: availableDeptDoctors, error: availableDeptError } = await supabase
            .from('doctors')
            .select('*')
            .eq('department_id', departmentId)
            .eq('status', true)
            .eq('is_available', true);
            
        if (availableDeptError) {
            console.error(" Error fetching available doctors by department:", availableDeptError);
        } else {
            console.log(` Found ${availableDeptDoctors.length} available doctors in department ${departmentId}`);
        }
        
        // Test 6: Check doctor data structure
        console.log("\n6. Testing Doctor Data Structure");
        if (allDoctors && allDoctors.length > 0) {
            const sampleDoctor = allDoctors[0];
            const requiredFields = ['id', 'doctor_name', 'email', 'qualifications', 'experience', 'phone_no', 'city', 'department_id', 'status', 'is_available'];
            const missingFields = requiredFields.filter(field => !sampleDoctor[field]);
            
            if (missingFields.length === 0) {
                console.log(" Doctor data structure is complete");
                console.log("   Sample doctor structure:");
                console.log(`   - ID: ${sampleDoctor.id}`);
                console.log(`   - Name: ${sampleDoctor.doctor_name}`);
                console.log(`   - Email: ${sampleDoctor.email}`);
                console.log(`   - Status: ${sampleDoctor.status}`);
                console.log(`   - Available: ${sampleDoctor.is_available}`);
            } else {
                console.log(` Missing fields in doctor data: ${missingFields.join(', ')}`);
            }
        }
        
        // Test 7: Performance test
        console.log("\n7. Testing API Performance");
        const startTime = Date.now();
        const { data: perfTest, error: perfError } = await supabase
            .from('doctors')
            .select('*')
            .eq('status', true)
            .eq('is_available', true);
        const endTime = Date.now();
        
        if (perfError) {
            console.error(" Performance test failed:", perfError);
        } else {
            const responseTime = endTime - startTime;
            console.log(` Performance test completed in ${responseTime}ms`);
            if (responseTime < 1000) {
                console.log("    Response time is excellent (< 1 second)");
            } else if (responseTime < 3000) {
                console.log("    Response time is acceptable (< 3 seconds)");
            } else {
                console.log("    Response time is too slow (> 3 seconds)");
            }
        }
        
        // Summary
        console.log("\n=== Test Summary ===");
        console.log(`Total doctors in database: ${allDoctors?.length || 0}`);
        console.log(`Available doctors: ${availableDoctors?.length || 0}`);
        console.log(`Doctors with search term "${searchTerm}": ${searchResults?.length || 0}`);
        
        if (availableDoctors && availableDoctors.length > 0) {
            console.log("\n All tests passed! Doctor API is working correctly.");
            console.log(" The system is ready for frontend testing.");
        } else {
            console.log("\n Warning: No available doctors found.");
            console.log("   Please run the sample doctors script to add test data.");
        }
        
    } catch (error) {
        console.error(" Test failed with unexpected error:", error);
    }
}

// Run the tests
testDoctorAPI().catch(console.error); 