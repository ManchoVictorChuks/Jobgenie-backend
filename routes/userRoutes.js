const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const User = require('../models/User'); // Add this import
const { 
    registerUser, 
    loginUser, 
    getTestUser,
    getUserByUsername,
    updateUser 
} = require('../controllers/userController');
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb) {
    cb(null, 'doc-' + Date.now() + path.extname(file.originalname));
  }
});

const uploadDocument = multer({ storage: storage });

const uploadFields = upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 }
]);

// Add health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/test-user', getTestUser);
router.get('/username/:username', getUserByUsername);
router.put('/username/:username', updateUser);

router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ 
                success: false,
                exists: false,
                message: 'Email is required'
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        return res.status(200).json({ 
            success: true,
            exists: !!existingUser,
            message: existingUser ? 'Email already registered' : 'Email is available' 
        });
        
    } catch (error) {
        console.error('Check email error:', error);
        return res.status(500).json({ 
            success: false,
            exists: false,
            message: 'Server error occurred while checking email',
            error: error.message 
        });
    }
});

// Add this endpoint to save jobs
router.post('/save-job', async (req, res) => {
    try {
        const { userId, job } = req.body;
        // Use findOneAndUpdate to avoid validation on the entire document
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { 
                $addToSet: { // Use $addToSet to automatically prevent duplicates
                    savedJobs: {
                        ...job,
                        savedAt: new Date()
                    }
                }
            },
            { 
                new: true, // Return updated document
                runValidators: false // Skip validation
            }
        );

        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ 
            message: 'Job saved successfully',
            savedJobs: result.savedJobs 
        });
    } catch (error) {
        console.error('Save job error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add endpoint to get saved jobs
router.get('/saved-jobs/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.savedJobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add endpoint to remove saved job
router.post('/remove-saved-job/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { jobId } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            {
                $pull: { savedJobs: { id: jobId } }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Job removed successfully',
            savedJobs: user.savedJobs
        });
    } catch (error) {
        console.error('Remove saved job error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add endpoint to save applied job
router.post('/apply-job', async (req, res) => {
    try {
        const { userId, job } = req.body;
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { 
                $addToSet: {
                    appliedJobs: {
                        ...job,
                        appliedAt: new Date(),
                        status: 'Applied', // Initial status
                    }
                }
            },
            { 
                new: true,
                runValidators: false
            }
        );

        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ 
            message: 'Job application recorded successfully',
            appliedJobs: result.appliedJobs 
        });
    } catch (error) {
        console.error('Apply job error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add endpoint to get applied jobs
router.get('/applied-jobs/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.appliedJobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add profile picture update route
router.put('/update-profile-picture/:userId', upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            {
                'profilePicture': {
                    url: fileUrl,
                    filename: req.file.filename,
                    uploadedAt: new Date()
                }
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            user
        });
    } catch (error) {
        console.error('Profile picture update error:', error);
        res.status(500).json({ message: 'Error updating profile picture' });
    }
});

// Document upload endpoint
router.post('/upload', upload.single('document'), async (req, res) => {
    try {
        console.log('File received:', req.file);
        console.log('Body:', req.body);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Get the file URL
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        // Update user's document
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    [`documents.${req.body.type}`]: {
                        url: fileUrl,
                        filename: req.file.filename,
                        uploadedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'File uploaded successfully',
            document: {
                url: fileUrl,
                filename: req.file.filename,
                type: req.body.type
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading file'
        });
    }
});

// Simple document upload route
router.post('/document-upload', uploadDocument.single('document'), async (req, res) => {
    try {
        const { userId, type } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

        const user = await User.findByIdAndUpdate(
            userId,
            { 
                [`documents.${type}`]: {
                    url: fileUrl,
                    filename: file.filename,
                    uploadedAt: new Date()
                }
            },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Document uploaded successfully',
            document: {
                url: fileUrl,
                filename: file.filename,
                type: type
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get user documents
router.get('/documents', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('documents');
        res.json({
            success: true,
            documents: user.documents || {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching documents'
        });
    }
});

module.exports = router;
