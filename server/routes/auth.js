const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password, name, department, year, role } = req.body;

        let user;
        if (role === 'ADVISOR') {
            // Specialized 5-field validation for Advisors
            user = await User.findOne({
                where: {
                    email,
                    password,
                    name,
                    department,
                    role: 'ADVISOR',
                    year
                }
            });
        } else if (role === 'HOD') {
            // HOD Login - only requires email and password
            user = await User.findOne({
                where: {
                    email,
                    password,
                    role: 'HOD'
                }
            });
        } else {
            // Faculty and Student Login
            user = await User.findOne({
                where: {
                    email,
                    password,
                    role
                }
            });
        }

        if (user) {
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials for selected role.' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// HOD Signup (Only role that can signup via frontend)
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, department, id } = req.body;

        const exists = await User.findOne({ where: { email } });
        if (exists) {
            return res.status(400).json({ success: false, message: 'HOD with this email already exists.' });
        }

        const newUser = await User.create({
            id: id || require('crypto').randomUUID(),
            role: 'HOD',
            email,
            password,
            name,
            department
        });

        res.json({ success: true, user: newUser });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// Update Profile Route
router.post('/update-profile', async (req, res) => {
    try {
        const { id, name, email, phone } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update fields
        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;

        await user.save();

        res.json({ success: true, user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
