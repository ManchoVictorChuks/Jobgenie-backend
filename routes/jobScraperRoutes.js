const express = require('express');
const router = express.Router();
const { getJobs } = require('../controllers/jobScraperController');
const JobListing = require('../models/JobListing');

router.get('/jobs', getJobs);

router.get('/stats', async (req, res) => {
    try {
        const stats = {
            total: await JobListing.countDocuments(),
            bySource: await JobListing.aggregate([
                { $group: { _id: "$source", count: { $sum: 1 } } }
            ]),
            byLocation: await JobListing.aggregate([
                { $group: { _id: "$location", count: { $sum: 1 } } }
            ]),
            remote: await JobListing.countDocuments({ isRemote: true }),
            lastScraped: await JobListing.findOne().sort({ lastScraped: -1 }).select('lastScraped')
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
