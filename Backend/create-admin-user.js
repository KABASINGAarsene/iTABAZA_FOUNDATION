const { supabase } = require('./config/db');
const bcrypt = require('bcrypt');

async function createAdminUser() {
    try {
        const adminEmail = 'admin@itabaza.com';
        const adminPassword = 'k@#+ymej@AQ@3';
        const adminName = 'ITABAZA Admin';

        // Check if admin already exists
        const { data: existingAdmin, error: fetchError } = await supabase
            .from('admins')
            .select('*')
            .eq('email', adminEmail)
            .single();

        if (existingAdmin) {
            console.log('Admin user already exists with email:', adminEmail);
            console.log('Admin details:', {
                id: existingAdmin.id,
                name: existingAdmin.name,
                email: existingAdmin.email,
                role: existingAdmin.role,
                is_active: existingAdmin.is_active
            });
            return existingAdmin;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create new admin user
        const { data: newAdmin, error: insertError } = await supabase
            .from('admins')
            .insert([{
                name: adminName,
                email: adminEmail,
                password: hashedPassword,
                role: 'super_admin',
                is_active: true
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Error creating admin user:', insertError);
            throw insertError;
        }

        console.log('Admin user created successfully!');
        console.log('Admin details:', {
            id: newAdmin.id,
            name: newAdmin.name,
            email: newAdmin.email,
            role: newAdmin.role,
            is_active: newAdmin.is_active
        });

        console.log('\n Login Credentials:');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        console.log('\n Note: Make sure to change the password after first login for security.');

        return newAdmin;

    } catch (error) {
        console.error(' Error in createAdminUser:', error);
        throw error;
    }
}

// Test admin login after creation
async function testAdminLogin() {
    try {
        const adminEmail = 'admin@itabaza.com';
        const adminPassword = 'k@#+ymej@AQ@3';

        console.log('\n Testing admin login...');

        // Find admin by email
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', adminEmail)
            .eq('is_active', true)
            .single();

        if (error || !admin) {
            console.error(' Admin not found or not active');
            return false;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(adminPassword, admin.password);
        if (!isValidPassword) {
            console.error(' Invalid password');
            return false;
        }

        console.log(' Admin login test successful!');
        console.log('Admin authenticated:', {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        });

        return true;

    } catch (error) {
        console.error(' Error testing admin login:', error);
        return false;
    }
}

// Run the functions
async function main() {
    console.log(' Setting up admin user for ITABAZA...\n');
    
    try {
        await createAdminUser();
        await testAdminLogin();
        
        console.log('\n Admin setup completed successfully!');
        console.log('You can now login to the admin dashboard with:');
        console.log('Email: admin@itabaza.com');
        console.log('Password: k@#+ymej@AQ@3');
        
    } catch (error) {
        console.error(' Admin setup failed:', error);
    } finally {
        process.exit(0);
    }
}

// Export functions for use in other files
module.exports = {
    createAdminUser,
    testAdminLogin
};

// Run if this file is executed directly
if (require.main === module) {
    main();
}
