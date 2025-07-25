const { DoctorModel } = require('./models/doctor.model');
const { supabase } = require('./config/db');

async function setupDoctorCredentials() {
    console.log(' Setting up Doctor Login Credentials...\n');

    try {
        // Get all doctors
        const doctors = await DoctorModel.findAll();
        
        if (!doctors || doctors.length === 0) {
            console.log(' No doctors found in the database.');
            console.log('Please add doctors first using the admin panel or API.');
            return;
        }

        console.log(` Found ${doctors.length} doctors in the database:\n`);

        // Display current doctors
        doctors.forEach((doctor, index) => {
            console.log(`${index + 1}. ${doctor.doctor_name}`);
            console.log(`   Email: ${doctor.email}`);
            console.log(`   Status: ${doctor.status ? 'Active' : 'Pending'}`);
            console.log(`   Has Password: ${doctor.password_hash ? 'Yes' : 'No'}`);
            console.log(`   Department ID: ${doctor.department_id || 'Not assigned'}`);
            console.log('');
        });

        // Set up passwords for doctors without them
        const doctorsNeedingPasswords = doctors.filter(doctor => !doctor.password_hash);
        
        if (doctorsNeedingPasswords.length === 0) {
            console.log(' All doctors already have passwords set up!');
            console.log('\n Doctor Login Credentials:');
            doctors.forEach(doctor => {
                console.log(` ${doctor.doctor_name}:`);
                console.log(`   Email: ${doctor.email}`);
                console.log(`   Password: Use the password set during doctor creation`);
                console.log('');
            });
            return;
        }

        console.log(` Setting up passwords for ${doctorsNeedingPasswords.length} doctors...\n`);

        // Set default passwords for doctors
        const defaultPasswords = [
            'doctor123',
            'medical456', 
            'health789',
            'care2024',
            'doctor2024'
        ];

        for (let i = 0; i < doctorsNeedingPasswords.length; i++) {
            const doctor = doctorsNeedingPasswords[i];
            const password = defaultPasswords[i] || 'doctor123';
            
            try {
                // Hash and update password
                const hashedPassword = await DoctorModel.hashPassword(password);
                
                const { data, error } = await supabase
                    .from('doctors')
                    .update({ password_hash: hashedPassword })
                    .eq('id', doctor.id)
                    .select();

                if (error) {
                    throw error;
                }

                console.log(` Password set for ${doctor.doctor_name}`);
                console.log(`   Email: ${doctor.email}`);
                console.log(`   Password: ${password}`);
                console.log('');

            } catch (error) {
                console.error(` Error setting password for ${doctor.doctor_name}:`, error.message);
            }
        }

        console.log(' Doctor credentials setup completed!\n');
        console.log(' Summary of Login Credentials:\n');

        // Display final credentials summary
        const updatedDoctors = await DoctorModel.findAll();
        updatedDoctors.forEach((doctor, index) => {
            if (doctor.password_hash) {
                console.log(` Doctor #${index + 1}: ${doctor.doctor_name}`);
                console.log(`   Email: ${doctor.email}`);
                console.log(`   Status: ${doctor.status ? 'Active ' : 'Pending '}`);
                
                // Show default password if we just set it
                const wasUpdated = doctorsNeedingPasswords.find(d => d.id === doctor.id);
                if (wasUpdated) {
                    const passwordIndex = doctorsNeedingPasswords.indexOf(wasUpdated);
                    const password = defaultPasswords[passwordIndex] || 'doctor123';
                    console.log(`   Password: ${password}`);
                } else {
                    console.log(`   Password: [Previously set]`);
                }
                console.log('');
            }
        });

        console.log(' Next Steps:');
        console.log('1. Start your backend server: node index.js');
        console.log('2. Open doctor login page: unified-login.html');
        console.log('3. Use the credentials above to login');
        console.log('4. Access the complete dashboard: doctor-dashboard-complete.html');
        console.log('\n Tip: Change default passwords after first login for security!');

    } catch (error) {
        console.error(' Error setting up doctor credentials:', error);
    }
}

// Create a test doctor with credentials if none exist
async function createTestDoctor() {
    console.log(' Creating test doctor account...\n');
    
    try {
        // Check if we need to create a test doctor
        const doctors = await DoctorModel.findAll();
        
        if (doctors && doctors.length > 0) {
            console.log('  Doctors already exist. Skipping test doctor creation.');
            return;
        }

        // Get a department ID (if departments exist)
        const { data: departments } = await supabase
            .from('departments')
            .select('id')
            .limit(1);

        const departmentId = departments && departments.length > 0 ? departments[0].id : null;

        // Create test doctor
        const testDoctorData = {
            doctor_name: 'Dr. John Smith',
            email: 'doctor@iTABAZA.com',
            password: 'doctor123', // Will be hashed automatically
            qualifications: 'MD Cardiology, FACC',
            experience: '15 years',
            phone_no: '+250788123456',
            city: 'Kigali',
            department_id: departmentId,
            status: true,
            is_available: true,
            image: null
        };

        const createdDoctor = await DoctorModel.create(testDoctorData);
        
        console.log(' Test doctor created successfully!');
        console.log(`   Name: ${createdDoctor.doctor_name}`);
        console.log(`   Email: ${createdDoctor.email}`);
        console.log(`   Password: doctor123`);
        console.log(`   ID: ${createdDoctor.id}`);
        console.log('');

    } catch (error) {
        console.error(' Error creating test doctor:', error.message);
    }
}

// Run the setup
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--create-test')) {
        await createTestDoctor();
    }
    
    await setupDoctorCredentials();
    process.exit(0);
}

main();
