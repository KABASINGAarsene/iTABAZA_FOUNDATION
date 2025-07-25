const { supabase } = require('./Backend/config/db');
const bcrypt = require('bcrypt');

async function setupTestDoctors() {
    try {
        console.log(' Setting up test doctors...');
        
        // Check if any doctors exist
        const { data: existingDoctors, error: checkError } = await supabase
            .from('doctors')
            .select('*');
            
        if (checkError) {
            console.error('Error checking existing doctors:', checkError);
            return;
        }
        
        console.log(`Found ${existingDoctors?.length || 0} existing doctors`);
        
        // Create test doctors with passwords
        const testDoctors = [
            {
                doctor_name: 'Dr. Sarah Johnson',
                email: 'sarah.johnson@hospital.com',
                password: 'doctor123',
                qualifications: 'MBBS, MD (Cardiology)',
                experience: '8 years',
                phone_no: '+250788123456',
                city: 'Kigali',
                department_id: null, // You can set this if you have departments
                status: true,
                is_available: true,
                image: null
            },
            {
                doctor_name: 'Dr. Michael Brown',
                email: 'michael.brown@hospital.com',
                password: 'doctor123',
                qualifications: 'MBBS, MS (General Surgery)',
                experience: '12 years',
                phone_no: '+250788123457',
                city: 'Kigali',
                department_id: null,
                status: true,
                is_available: true,
                image: null
            },
            {
                doctor_name: 'Dr. Emily Davis',
                email: 'emily.davis@hospital.com',
                password: 'doctor123',
                qualifications: 'MBBS, MD (Pediatrics)',
                experience: '6 years',
                phone_no: '+250788123458',
                city: 'Butare',
                department_id: null,
                status: true,
                is_available: true,
                image: null
            }
        ];
        
        // Hash passwords and insert doctors
        for (const doctor of testDoctors) {
            // Check if doctor already exists
            const { data: existing } = await supabase
                .from('doctors')
                .select('email')
                .eq('email', doctor.email)
                .single();
                
            if (existing) {
                console.log(` Doctor ${doctor.email} already exists`);
                continue;
            }
            
            // Hash password
            const password_hash = await bcrypt.hash(doctor.password, 10);
            delete doctor.password; // Remove plain password
            doctor.password_hash = password_hash;
            
            // Insert doctor
            const { data: newDoctor, error: insertError } = await supabase
                .from('doctors')
                .insert([doctor])
                .select();
                
            if (insertError) {
                console.error(` Error creating doctor ${doctor.email}:`, insertError);
            } else {
                console.log(` Created doctor: ${doctor.doctor_name} (${doctor.email})`);
            }
        }
        
        // Display all doctors
        const { data: allDoctors, error: listError } = await supabase
            .from('doctors')
            .select('id, doctor_name, email, qualifications, status, is_available')
            .order('created_at', { ascending: false });
            
        if (listError) {
            console.error('Error listing doctors:', listError);
        } else {
            console.log('\n All doctors in database:');
            allDoctors.forEach(doctor => {
                console.log(`${doctor.doctor_name} (${doctor.email}) - ${doctor.qualifications}`);
            });
        }
        
        console.log('\n Doctor setup complete!');
        console.log('\n Test login credentials:');
        console.log('Email: sarah.johnson@hospital.com');
        console.log('Password: doctor123');
        console.log('\nEmail: michael.brown@hospital.com');
        console.log('Password: doctor123');
        console.log('\nEmail: emily.davis@hospital.com');
        console.log('Password: doctor123');
        
    } catch (error) {
        console.error(' Error setting up doctors:', error);
    }
}

// Run if called directly
if (require.main === module) {
    setupTestDoctors().then(() => {
        console.log('Script completed');
        process.exit(0);
    }).catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
}

module.exports = { setupTestDoctors };
