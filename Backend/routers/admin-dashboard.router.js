const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// =====================================================
// ADMIN AUTHENTICATION
// =====================================================

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if admin exists
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .eq('is_active', true)
            .single();

        if (error || !admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { adminId: admin.id, email: admin.email, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login
        await supabase
            .from('admins')
            .update({ last_login: new Date() })
            .eq('id', admin.id);

        res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// =====================================================
// DASHBOARD OVERVIEW
// =====================================================

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
    try {
        // Get all counts in parallel
        const [
            { count: totalUsers },
            { count: totalDoctors },
            { count: totalAppointments },
            { count: totalDepartments }
        ] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('doctors').select('*', { count: 'exact', head: true }),
            supabase.from('appointments').select('*', { count: 'exact', head: true }),
            supabase.from('departments').select('*', { count: 'exact', head: true })
        ]);

        // Get detailed statistics
        const { data: doctors } = await supabase.from('doctors').select('*');
        const { data: appointments } = await supabase.from('appointments').select('*');

        const approvedDoctors = doctors?.filter(d => d.status === true).length || 0;
        const pendingDoctors = doctors?.filter(d => d.status === false).length || 0;
        const availableDoctors = doctors?.filter(d => d.is_available === true).length || 0;

        const pendingAppointments = appointments?.filter(a => a.status === 'pending').length || 0;
        const confirmedAppointments = appointments?.filter(a => a.status === 'confirmed').length || 0;
        const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0;

        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointments?.filter(a => a.appointment_date === today).length || 0;

        const totalRevenue = appointments?.reduce((sum, a) => {
            return sum + (a.payment_status && a.payment_amount ? parseFloat(a.payment_amount) : 0);
        }, 0) || 0;

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalDoctors,
                    totalAppointments,
                    totalDepartments,
                    totalRevenue
                },
                doctors: {
                    total: totalDoctors,
                    approved: approvedDoctors,
                    pending: pendingDoctors,
                    available: availableDoctors
                },
                appointments: {
                    total: totalAppointments,
                    pending: pendingAppointments,
                    confirmed: confirmedAppointments,
                    completed: completedAppointments,
                    today: todayAppointments
                }
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

// =====================================================
// DOCTORS MANAGEMENT
// =====================================================

// Get all doctors
router.get('/doctors', async (req, res) => {
    try {
        const { data: doctors, error } = await supabase
            .from('doctors')
            .select(`
                *,
                departments:department_id (
                    dept_name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: doctors
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
});

// Add new doctor
router.post('/doctors', async (req, res) => {
    try {
        const { 
            doctor_name, 
            email, 
            password, 
            qualifications, 
            experience, 
            phone_no, 
            city, 
            department_id,
            image 
        } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: doctor, error } = await supabase
            .from('doctors')
            .insert([{
                doctor_name,
                email,
                password: hashedPassword,
                qualifications,
                experience,
                phone_no,
                city,
                department_id,
                image,
                status: true, // Auto-approve admin-created doctors
                is_available: true
            }])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Doctor added successfully',
            data: doctor
        });
    } catch (error) {
        console.error('Error adding doctor:', error);
        res.status(500).json({ error: 'Failed to add doctor' });
    }
});

// Update doctor
router.put('/doctors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // If password is being updated, hash it
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        const { data: doctor, error } = await supabase
            .from('doctors')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Doctor updated successfully',
            data: doctor
        });
    } catch (error) {
        console.error('Error updating doctor:', error);
        res.status(500).json({ error: 'Failed to update doctor' });
    }
});

// Delete doctor
router.delete('/doctors/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('doctors')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Doctor deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting doctor:', error);
        res.status(500).json({ error: 'Failed to delete doctor' });
    }
});

// Toggle doctor status
router.patch('/doctors/:id/toggle-status', async (req, res) => {
    try {
        const { id } = req.params;

        // Get current status
        const { data: doctor, error: fetchError } = await supabase
            .from('doctors')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Toggle status
        const { data: updatedDoctor, error: updateError } = await supabase
            .from('doctors')
            .update({ status: !doctor.status })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        res.json({
            success: true,
            message: `Doctor ${updatedDoctor.status ? 'approved' : 'suspended'} successfully`,
            data: updatedDoctor
        });
    } catch (error) {
        console.error('Error toggling doctor status:', error);
        res.status(500).json({ error: 'Failed to toggle doctor status' });
    }
});

// =====================================================
// PATIENTS MANAGEMENT
// =====================================================

// Get all patients
router.get('/patients', async (req, res) => {
    try {
        const { data: patients, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: patients
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});

// Add new patient
router.post('/patients', async (req, res) => {
    try {
        const { first_name, last_name, email, mobile, password } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: patient, error } = await supabase
            .from('users')
            .insert([{
                first_name,
                last_name,
                email,
                mobile,
                password: hashedPassword
            }])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Patient added successfully',
            data: patient
        });
    } catch (error) {
        console.error('Error adding patient:', error);
        res.status(500).json({ error: 'Failed to add patient' });
    }
});

// Update patient
router.put('/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // If password is being updated, hash it
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        const { data: patient, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Patient updated successfully',
            data: patient
        });
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ error: 'Failed to update patient' });
    }
});

// Delete patient
router.delete('/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Patient deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ error: 'Failed to delete patient' });
    }
});

// =====================================================
// APPOINTMENTS MANAGEMENT
// =====================================================

// Get all appointments
router.get('/appointments', async (req, res) => {
    try {
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
                *,
                users:patient_id (
                    first_name,
                    last_name,
                    email,
                    mobile
                ),
                doctors:doctor_id (
                    doctor_name,
                    qualifications,
                    phone_no
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: appointments
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Update appointment status
router.patch('/appointments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data: appointment, error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Appointment status updated successfully',
            data: appointment
        });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({ error: 'Failed to update appointment status' });
    }
});

// Delete appointment
router.delete('/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Appointment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ error: 'Failed to delete appointment' });
    }
});

// =====================================================
// DEPARTMENTS MANAGEMENT
// =====================================================

// Get all departments
router.get('/departments', async (req, res) => {
    try {
        const { data: departments, error } = await supabase
            .from('departments')
            .select('*')
            .order('dept_name', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: departments
        });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// Add new department
router.post('/departments', async (req, res) => {
    try {
        const { dept_name, about, image } = req.body;

        const { data: department, error } = await supabase
            .from('departments')
            .insert([{ dept_name, about, image }])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Department added successfully',
            data: department
        });
    } catch (error) {
        console.error('Error adding department:', error);
        res.status(500).json({ error: 'Failed to add department' });
    }
});

// Update department
router.put('/departments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { dept_name, about, image } = req.body;

        const { data: department, error } = await supabase
            .from('departments')
            .update({ dept_name, about, image })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Department updated successfully',
            data: department
        });
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ error: 'Failed to update department' });
    }
});

// Delete department
router.delete('/departments/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('departments')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Department deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ error: 'Failed to delete department' });
    }
});

module.exports = router;
