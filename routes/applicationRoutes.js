const express = require('express');
const router = express.Router();
const applicationService = require('../services/applicationService');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/submit', authMiddleware, async (req, res) => {
    try {
        const { jobId, coverLetter } = req.body;
        const result = await applicationService.submitApplication(
            req.user._id,
            jobId,
            coverLetter
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/status/:applicationId', authMiddleware, async (req, res) => {
    try {
        const status = await applicationService.getApplicationStatus(req.params.applicationId);
        res.json(status);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
