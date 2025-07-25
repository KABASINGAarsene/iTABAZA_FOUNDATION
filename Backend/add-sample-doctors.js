const { supabase } = require("./config/db");

// Sample doctors data with proper availability status
const sampleDoctors = [
    {
        doctor_name: "Dr. Sarah Johnson",
        email: "sarah.johnson@iTABAZA.com",
        qualifications: "MBBS, MD - Neurology",
        experience: "15 years",
        phone_no: "+250788123456",
        city: "Kigali",
        department_id: "1", // Neurology
        status: true,
        is_available: true,
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
        april_11: ["11-12", "2-3", "4-5", "7-8"],
        april_12: ["11-12", "2-3", "4-5", "7-8"],
        april_13: ["11-12", "2-3", "4-5", "7-8"]
    },
    {
        doctor_name: "Dr. Michael Chen",
        email: "michael.chen@iTABAZA.com",
        qualifications: "MBBS, MD - Cardiology",
        experience: "12 years",
        phone_no: "+250788123457",
        city: "Kigali",
        department_id: "10", // Cardiology
        status: true,
        is_available: true,
        image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
        april_11: ["11-12", "2-3", "4-5"],
        april_12: ["11-12", "2-3", "4-5", "7-8"],
        april_13: ["11-12", "2-3", "4-5"]
    },
    {
        doctor_name: "Dr. Emily Rodriguez",
        email: "emily.rodriguez@iTABAZA.com",
        qualifications: "MBBS, MD - Dermatology",
        experience: "8 years",
        phone_no: "+250788123458",
        city: "Kigali",
        department_id: "2", // Dermatology
        status: true,
        is_available: true,
        image: "https://images.unsplash.com/photo-1594824475544-3c0b1b3b8b8b?w=150&h=150&fit=crop&crop=face",
        april_11: ["2-3", "4-5", "7-8"],
        april_12: ["11-12", "2-3", "4-5"],
        april_13: ["11-12", "2-3", "4-5", "7-8"]
    },
    {
        doctor_name: "Dr. David Kim",
        email: "david.kim@iTABAZA.com",
        qualifications: "MBBS, MD - Orthopedics",
        experience: "18 years",
        phone_no: "+250788123459",
        city: "Kigali",
        department_id: "9", // Orthopedic
        status: true,
        is_available: true,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        april_11: ["11-12", "2-3", "4-5", "7-8"],
        april_12: ["11-12", "2-3", "4-5"],
        april_13: ["2-3", "4-5", "7-8"]
    },
    {
        doctor_name: "Dr. Lisa Wang",
        email: "lisa.wang@iTABAZA.com",
        qualifications: "MBBS, MD - Gynecology",
        experience: "10 years",
        phone_no: "+250788123460",
        city: "Kigali",
        department_id: "6", // Gynecology
        status: true,
        is_available: true,
        image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face",
        april_11: ["11-12", "2-3", "4-5"],
        april_12: ["11-12", "2-3", "4-5", "7-8"],
        april_13: ["11-12", "2-3", "4-5"]
    },
    {
        doctor_name: "Dr. James Wilson",
        email: "james.wilson@iTABAZA.com",
        qualifications: "MBBS, MD - General Physician",
        experience: "20 years",
        phone_no: "+250788123461",
        city: "Kigali",
        department_id: "8", // General Physician
        status: true,
        is_available: true,
        image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
        april_11: ["11-12", "2-3", "4-5", "7-8"],
        april_12: ["11-12", "2-3", "4-5", "7-8"],
        april_13: ["11-12", "2-3", "4-5", "7-8"]
    },
    {
        doctor_name: "Dr. Maria Garcia",
        email: "maria.garcia@iTABAZA.com",
        qualifications: "MBBS, MD - ENT",
        experience: "14 years",
        phone_no: "+250788123462",
        city: "Kigali",
        department_id: "7", // ENT
        status: true,
        is_available: true,
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
        april_11: ["2-3", "4-5", "7-8"],
        april_12: ["11-12", "2-3", "4-5"],
        april_13: ["11-12", "2-3", "4-5", "7-8"]
    },
    {
        doctor_name: "Dr. Robert Taylor",
        email: "robert.taylor@iTABAZA.com",
        qualifications: "MBBS, MD - Gastroenterology",
        experience: "16 years",
        phone_no: "+250788123463",
        city: "Kigali",
        department_id: "5", // Gastroenterology
        status: true,
        is_available: true,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        april_11: ["11-12", "2-3", "4-5"],
        april_12: ["11-12", "2-3", "4-5", "7-8"],
        april_13: ["2-3", "4-5", "7-8"]
    },
    {
        doctor_name: "Dr. Anna Brown",
        email: "anna.brown@iTABAZA.com",
        qualifications: "MBBS, MD - Dental",
        experience: "9 years",
        phone_no: "+250788123464",
        city: "Kigali",
        department_id: "3", // Dental
        status: true,
        is_available: true,
        image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face",
        april_11: ["11-12", "2-3", "4-5", "7-8"],
        april_12: ["11-12", "2-3", "4-5"],
        april_13: ["11-12", "2-3", "4-5", "7-8"]
    },
    {
        doctor_name: "Dr. Thomas Anderson",
        email: "thomas.anderson@iTABAZA.com",
        qualifications: "MBBS, MD - Ayurveda",
        experience: "11 years",
        phone_no: "+250788123465",
        city: "Kigali",
        department_id: "4", // Ayurveda
        status: true,
        is_available: true,
        image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
        april_11: ["2-3", "4-5", "7-8"],
        april_12: ["11-12", "2-3", "4-5", "7-8"],
        april_13: ["11-12", "2-3", "4-5"]
    }
];

async function addSampleDoctors() {
    try {
        console.log("Starting to add sample doctors...");
        
        // First, let's check if doctors already exist
        const { data: existingDoctors, error: checkError } = await supabase
            .from('doctors')
            .select('id')
            .limit(1);
            
        if (checkError) {
            console.error("Error checking existing doctors:", checkError);
            return;
        }
        
        if (existingDoctors && existingDoctors.length > 0) {
            console.log("Doctors already exist in the database. Skipping sample data insertion.");
            return;
        }
        
        // Insert sample doctors
        const { data, error } = await supabase
            .from('doctors')
            .insert(sampleDoctors)
            .select();
            
        if (error) {
            console.error("Error adding sample doctors:", error);
            return;
        }
        
        console.log(`Successfully added ${data.length} sample doctors to the database!`);
        console.log("Sample doctors added:");
        data.forEach(doctor => {
            console.log(`- ${doctor.doctor_name} (${doctor.email})`);
        });
        
        // Verify the doctors are available
        const { data: availableDoctors, error: verifyError } = await supabase
            .from('doctors')
            .select('*')
            .eq('status', true)
            .eq('is_available', true);
            
        if (verifyError) {
            console.error("Error verifying doctors:", verifyError);
        } else {
            console.log(`\nVerification: ${availableDoctors.length} doctors are available for appointments.`);
        }
        
    } catch (error) {
        console.error("Unexpected error:", error);
    }
}

// Function to update existing doctors to be available
async function updateDoctorsAvailability() {
    try {
        console.log("Updating doctors availability...");
        
        const { data, error } = await supabase
            .from('doctors')
            .update({ 
                status: true, 
                is_available: true 
            })
            .eq('status', false)
            .select();
            
        if (error) {
            console.error("Error updating doctors availability:", error);
            return;
        }
        
        if (data && data.length > 0) {
            console.log(`Updated ${data.length} doctors to be available.`);
        } else {
            console.log("No doctors needed availability updates.");
        }
        
    } catch (error) {
        console.error("Error updating doctors:", error);
    }
}

// Function to check current doctors status
async function checkDoctorsStatus() {
    try {
        console.log("Checking current doctors status...");
        
        const { data: allDoctors, error: allError } = await supabase
            .from('doctors')
            .select('doctor_name, status, is_available');
            
        if (allError) {
            console.error("Error fetching doctors:", allError);
            return;
        }
        
        console.log(`Total doctors in database: ${allDoctors.length}`);
        
        const availableDoctors = allDoctors.filter(d => d.status && d.is_available);
        const unavailableDoctors = allDoctors.filter(d => !d.status || !d.is_available);
        
        console.log(`Available doctors: ${availableDoctors.length}`);
        console.log(`Unavailable doctors: ${unavailableDoctors.length}`);
        
        if (unavailableDoctors.length > 0) {
            console.log("\nUnavailable doctors:");
            unavailableDoctors.forEach(doctor => {
                console.log(`- ${doctor.doctor_name} (status: ${doctor.status}, available: ${doctor.is_available})`);
            });
        }
        
    } catch (error) {
        console.error("Error checking doctors status:", error);
    }
}

// Main execution
async function main() {
    console.log("=== iTABAZA Sample Doctors Setup ===");
    
    await checkDoctorsStatus();
    await addSampleDoctors();
    await updateDoctorsAvailability();
    await checkDoctorsStatus();
    
    console.log("\n=== Setup Complete ===");
    console.log("You can now test the doctor listing functionality.");
}

// Run the setup
main().catch(console.error); 
addSampleDoctors(); 
addSampleDoctors(); 