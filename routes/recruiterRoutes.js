const express = require('express');
const router = express.Router();
const Recruiter = require('../models/Recruiter');

// Create a new recruiter
router.post('/', async (req, res) => {
    try {
        const { name, email, company, phoneNumber, position } = req.body;

        if (!name || !email || !company || !phoneNumber) {
            return res.status(400).json({ message: 'All required fields must be filled' });
        }

        const newRecruiter = await Recruiter.create({ name, email, company, phoneNumber, position });
        res.status(201).json({ message: 'Recruiter created successfully', recruiter: newRecruiter });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all recruiters
router.get('/', async (req, res) => {
    try {
        const recruiters = await Recruiter.find();
        res.json(recruiters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a recruiter by ID
router.get('/:id', async (req, res) => {
    try {
        const recruiter = await Recruiter.findById(req.params.id);
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        res.json(recruiter);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a recruiter
router.put('/:id', async (req, res) => {
    try {
        const { name, email, company, phoneNumber, position } = req.body;
        const recruiter = await Recruiter.findById(req.params.id);

        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        if (name) recruiter.name = name;
        if (email) recruiter.email = email;
        if (company) recruiter.company = company;
        if (phoneNumber) recruiter.phoneNumber = phoneNumber;
        if (position) recruiter.position = position;

        const updatedRecruiter = await recruiter.save();
        res.json({ message: 'Recruiter updated successfully', recruiter: updatedRecruiter });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a recruiter
router.delete('/:id', async (req, res) => {
    try {
        const recruiter = await Recruiter.findByIdAndDelete(req.params.id);
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        res.json({ message: 'Recruiter deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
