const { supabase } = require("./config/db");

async function testDepartments() {
    console.log("Testing departments functionality...\n");
    
    try {
        // 1. Test direct database query
        console.log("1. Testing direct database query for departments:");
        const { data: departments, error } = await supabase
            .from('departments')
            .select('*');
            
        if (error) {
            console.error("Database error:", error);
            return;
        }
        
        console.log("Departments found:", departments.length);
        departments.forEach(dept => {
            console.log(`  - ${dept.dept_name} (ID: ${dept.id})`);
        });
        
        // 2. Test the DepartmentModel
        console.log("\n2. Testing DepartmentModel:");
        const { DepartmentModel } = require("./models/department.model");
        const modelDepartments = await DepartmentModel.findAll();
        
        console.log("Departments via model:", modelDepartments.length);
        modelDepartments.forEach(dept => {
            console.log(`  - ${dept.dept_name} (ID: ${dept.id})`);
        });
        
        // 3. Check if departments have the expected structure
        console.log("\n3. Checking department structure:");
        if (modelDepartments.length > 0) {
            const firstDept = modelDepartments[0];
            console.log("First department structure:", {
                id: firstDept.id,
                dept_name: firstDept.dept_name,
                about: firstDept.about ? firstDept.about.substring(0, 50) + "..." : null,
                created_at: firstDept.created_at
            });
        }
        
        console.log("\n✅ All departments tests passed!");
        
    } catch (error) {
        console.error("❌ Error in departments test:", error);
    }
}

testDepartments();
