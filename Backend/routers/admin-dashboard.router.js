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