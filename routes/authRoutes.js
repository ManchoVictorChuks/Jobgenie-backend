const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Recruiter = require('../models/Recruiter');

// User signup
router.post('/user/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, name });
        await user.save();
        
        const token = jwt.sign(
            { userId: user._id, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(201).json({ token, userId: user._id });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Recruiter signup
router.post('/recruiter/signup', async (req, res) => {
    try {
        const { email, password, name, company } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const recruiter = new Recruiter({ 
            email, 
            password: hashedPassword, 
            name,
            company 
        });
        await recruiter.save();
        
        const token = jwt.sign(
            { userId: recruiter._id, role: 'recruiter' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(201).json({ token, recruiterId: recruiter._id });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Login for both users and recruiters
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const Model = role === 'recruiter' ? Recruiter : User;
        
        const user = await Model.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, userId: user._id });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
