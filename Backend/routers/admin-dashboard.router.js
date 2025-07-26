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