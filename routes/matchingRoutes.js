const express = require('express');
const router = express.Router();
const matchingService = require('../services/matchingService');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/matches', authMiddleware, async (req, res) => {
    try {
        const matchedJobs = await matchingService.getMatchedJobs(req.user._id);
        res.json(matchedJobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
