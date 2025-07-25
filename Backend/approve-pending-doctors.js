const { supabase } = require('./config/db');

async function approvePendingDoctors() {
    try {
        console.log('🔍 Checking for pending doctor approvals...');
        
        // Find all pending doctors
        const { data: pendingDoctors, error: findError } = await supabase
            .from('doctors')
            .select('id, doctor_name, email, status')
            .eq('status', false);
            
        if (findError) {
            console.error('❌ Error finding pending doctors:', findError);
            return;
        }
        
        if (!pendingDoctors || pendingDoctors.length === 0) {
            console.log('✅ No pending doctors found. All doctors are already approved.');
            return;
        }
        
        console.log(`📋 Found ${pendingDoctors.length} pending doctors:`);
        pendingDoctors.forEach(doctor => {
            console.log(`   • ${doctor.doctor_name} (${doctor.email})`);
        });
        
        console.log('\n🔄 Approving all pending doctors...');
        
        // Approve all pending doctors
        const { data: approvedDoctors, error: approveError } = await supabase
            .from('doctors')
            .update({ 
                status: true, 
                is_available: true,
                updated_at: new Date().toISOString()
            })
            .eq('status', false)
            .select('doctor_name, email, status, is_available');
            
        if (approveError) {
            console.error('❌ Error approving doctors:', approveError);
            return;
        }
        
        console.log('\n✅ Successfully approved doctors:');
        approvedDoctors.forEach(doctor => {
            console.log(`   ✓ ${doctor.doctor_name} (${doctor.email})`);
        });
        
        console.log(`\n🎉 ${approvedDoctors.length} doctors approved and available for appointments!`);
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

async function verifyAllDoctorsStatus() {
    try {
        console.log('\n🔍 Verifying current doctor status...');
        
        const { data: allDoctors, error } = await supabase
            .from('doctors')
            .select('doctor_name, email, status, is_available')
            .order('doctor_name');
            
        if (error) {
            console.error('❌ Error fetching doctors:', error);
            return;
        }
        
        const activeDoctors = allDoctors.filter(d => d.status && d.is_available);
        const pendingDoctors = allDoctors.filter(d => !d.status);
        const unavailableDoctors = allDoctors.filter(d => d.status && !d.is_available);
        
        console.log('\n📊 Doctor Status Summary:');
        console.log(`   📋 Total doctors: ${allDoctors.length}`);
        console.log(`   ✅ Active & Available: ${activeDoctors.length}`);
        console.log(`   ⏳ Pending approval: ${pendingDoctors.length}`);
        console.log(`   🚫 Approved but unavailable: ${unavailableDoctors.length}`);
        
        if (activeDoctors.length > 0) {
            console.log('\n✅ Active doctors ready for login:');
            activeDoctors.forEach(doctor => {
                console.log(`   🩺 ${doctor.doctor_name} (${doctor.email})`);
            });
        }
        
        if (pendingDoctors.length > 0) {
            console.log('\n⏳ Doctors pending approval:');
            pendingDoctors.forEach(doctor => {
                console.log(`   ⏳ ${doctor.doctor_name} (${doctor.email})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error verifying doctor status:', error);
    }
}

// Main execution
async function main() {
    console.log('🏥 iTABAZA Doctor Approval System');
    console.log('==================================');
    
    await approvePendingDoctors();
    await verifyAllDoctorsStatus();
    
    console.log('\n✨ Doctor approval process complete!');
    console.log('All approved doctors can now login with their @itabaza.com emails.');
}

// Run the approval process
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    approvePendingDoctors,
    verifyAllDoctorsStatus
};
