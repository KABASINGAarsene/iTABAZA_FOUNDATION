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