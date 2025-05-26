const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/authMiddleware');
const { optimizeCoverLetter, evaluateCoverLetter } = require('../services/aiService');
const { convertPDFToText, convertTextToPDF } = require('../utils/pdfUtils');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
    destination: 'uploads/coverletters/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/optimize', auth, upload.single('coverLetter'), async (req, res) => {
    try {
        const { jobId } = req.body;
        const userId = req.user.userId;

        // 1. Get job and user details
        const job = await Job.findById(jobId);
        const user = await User.findById(userId);

        if (!job || !user) {
            return res.status(404).json({ message: 'Job or user not found' });
        }

        // 2. Convert PDF to text
        const originalText = await convertPDFToText(req.file.path);

        // 3. Optimize cover letter
        const optimizedText = await optimizeCoverLetter(originalText, job, user);

        // 4. Evaluate the optimized version
        const evaluation = await evaluateCoverLetter(optimizedText, job);

        if (evaluation.score < 0.7) { // 70% threshold
            return res.status(400).json({
                message: 'Cover letter needs improvement',
                suggestions: evaluation.suggestions
            });
        }

        // 5. Convert back to PDF
        const pdfPath = await convertTextToPDF(optimizedText, userId);

        res.json({
            success: true,
            pdfUrl: `/uploads/coverletters/${pdfPath}`,
            evaluation: evaluation
        });

    } catch (error) {
        console.error('Cover letter optimization error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
