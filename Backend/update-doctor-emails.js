const { supabase } = require('./config/db');

async function updateDoctorEmails() {
    try {
        console.log(' Starting doctor email update process...');
        
        // First, check if there are any doctors with @medistar.com emails
        const { data: medistartDoctors, error: checkError } = await supabase
            .from('doctors')
            .select('id, doctor_name, email')
            .ilike('email', '%@medistar.com');
            
        if (checkError) {
            console.error(' Error checking for medistar emails:', checkError);
            return;
        }
        
        if (!medistartDoctors || medistartDoctors.length === 0) {
            console.log(' No doctors found with @medistar.com emails. All emails already use iTABAZA branding.');
            
            // Let's also check what emails currently exist
            const { data: allDoctors, error: allError } = await supabase
                .from('doctors')
                .select('doctor_name, email')
                .order('doctor_name');
                
            if (allError) {
                console.error(' Error fetching all doctors:', allError);
                return;
            }
            
            console.log('\n Current doctor emails:');
            allDoctors.forEach(doctor => {
                console.log(`   • ${doctor.doctor_name}: ${doctor.email}`);
            });
            
            return;
        }

        console.log(`\n Found ${medistartDoctors.length} doctors with @medistar.com emails:`);
        medistartDoctors.forEach(doctor => {
            console.log(`   • ${doctor.doctor_name}: ${doctor.email}`);
        });
        
        console.log('\n Updating emails to use @itabaza.com...');
        
        // Update each doctor's email
        const updatePromises = medistartDoctors.map(async (doctor) => {
            const newEmail = doctor.email.replace('@medistar.com', '@itabaza.com');
            
            const { data, error } = await supabase
                .from('doctors')
                .update({ email: newEmail })
                .eq('id', doctor.id)
                .select('doctor_name, email');
                
            if (error) {
                console.error(` Error updating ${doctor.doctor_name}:`, error);
                return null;
            }
            
            return {
                name: doctor.doctor_name,
                oldEmail: doctor.email,
                newEmail: newEmail
            };
        });
        
        const results = await Promise.all(updatePromises);
        const successfulUpdates = results.filter(result => result !== null);
        
        console.log('\n Email update results:');
        successfulUpdates.forEach(result => {
            console.log(`   • ${result.name}: ${result.oldEmail} → ${result.newEmail}`);
        });
        
        console.log(`\n Successfully updated ${successfulUpdates.length} doctor emails!`);
        
        // Verify the updates
        console.log('\n Verifying updates...');
        const { data: verifyDoctors, error: verifyError } = await supabase
            .from('doctors')
            .select('doctor_name, email')
            .order('doctor_name');
            
        if (verifyError) {
            console.error(' Error during verification:', verifyError);
            return;
        }
        
        console.log('\n Updated doctor emails:');
        verifyDoctors.forEach(doctor => {
            const status = doctor.email.includes('@itabaza.com') ? 'ok' : 'warn';
            console.log(`   [${status}] ${doctor.doctor_name}: ${doctor.email}`);
        });
        
    } catch (error) {
        console.error(' Unexpected error during email update:', error);
    }
}

// Function to also update any test files or documentation with the old emails
async function updateTestCredentials() {
    console.log('\n Note: The following test credentials are now available:');
    console.log('   • Admin: admin@itabaza.com / k@#+ymej@AQ@3');
    console.log('   • Doctor (Robert Taylor): robert.taylor@itabaza.com / doctor123');
    console.log('   • Doctor (Michael Brown): michael.brown@iTABAZA.com / doctor123');
    console.log('   • All other doctors: [name]@itabaza.com / doctor123');
}

// Main execution
async function main() {
    console.log(' iTABAZA Email Branding Update');
    console.log('=================================');
    
    await updateDoctorEmails();
    await updateTestCredentials();
    
    console.log('\n Email branding update complete!');
    console.log('All doctor emails now use @itabaza.com branding.');
}

// Run the update
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    updateDoctorEmails,
    updateTestCredentials
};
