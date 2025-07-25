const { supabase } = require("./config/db");

async function testDoctorsDepartments() {
    console.log("Testing doctors and their department mappings...\n");
    
    try {
        // 1. Get all departments
        console.log("1. Loading departments:");
        const { data: departments } = await supabase
            .from('departments')
            .select('*');
            
        const deptMap = {};
        departments.forEach(dept => {
            deptMap[dept.id] = dept.dept_name;
        });
        
        console.log("Department mapping:");
        Object.entries(deptMap).forEach(([id, name]) => {
            console.log(`  ${name}: ${id}`);
        });
        
        // 2. Get all doctors
        console.log("\n2. Loading doctors:");
        const { data: doctors } = await supabase
            .from('doctors')
            .select('id, doctor_name, department_id, qualifications, status, is_available');
            
        console.log(`Found ${doctors.length} doctors:`);
        doctors.forEach(doctor => {
            const deptName = deptMap[doctor.department_id] || "Unknown Department";
            const status = doctor.status && doctor.is_available ? "Available" : "Not Available";
            console.log(`  - ${doctor.doctor_name} (${deptName}) - ${status}`);
            console.log(`    Qualifications: ${doctor.qualifications}`);
            console.log(`    Department ID: ${doctor.department_id}`);
            console.log("");
        });
        
        // 3. Test the specific department from the screenshot
        const problematicDeptId = "dd90f89e-fdb8-4a65-b91c-a66864d0e49f";
        console.log(`3. Testing problematic department ID from screenshot: ${problematicDeptId}`);
        const mappedName = deptMap[problematicDeptId];
        console.log(`  This ID maps to: ${mappedName || "NOT FOUND"}`);
        
        // Find doctors in this department
        const doctorsInDept = doctors.filter(doc => doc.department_id === problematicDeptId);
        console.log(`  Doctors in this department: ${doctorsInDept.length}`);
        doctorsInDept.forEach(doc => {
            console.log(`    - ${doc.doctor_name} (${doc.qualifications})`);
        });
        
        console.log("\n✅ Doctors and departments test completed!");
        
    } catch (error) {
        console.error("❌ Error in doctors-departments test:", error);
    }
}

testDoctorsDepartments();
