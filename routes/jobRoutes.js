const express = require('express');
const { createJob, getJobs } = require('../controllers/jobController');
const router = express.Router();

router.post('/create', createJob);
router.get('/', getJobs);

module.exports = router;
