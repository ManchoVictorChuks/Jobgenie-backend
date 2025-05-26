// Import dependencies
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes'); // Import user routes
const jobScraperRoutes = require('./routes/jobScraperRoutes'); // Import job scraper routes
const recruiterRoutes = require('./routes/recruiterRoutes'); // Import recruiter routes
const authRoutes = require('./routes/authRoutes'); // New auth routes
const coverLetterRoutes = require('./routes/coverLetterRoutes'); // Import cover letter routes
require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Basic Express and DB setup
const app = express();
connectDB();

// Middleware configuration:
// 1. CORS - Allows cross-origin requests
// 2. express.json() - Parses JSON request bodies
// 3. Static file serving for 'public' and 'uploads' folders
// 4. Request logger that prints method, path, and request body
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Increase payload limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static('public')); // Serve static files from public folder

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware with sensitive data masking
app.use((req, res, next) => {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) {
        sanitizedBody.password = '[HIDDEN]';
    }
    console.log(`${req.method} ${req.path}`, sanitizedBody);
    next();
});

// API Routes setup
app.use('/api/auth', authRoutes); // New auth routes for login/signup
app.use('/api/users', userRoutes); // All user-related routes will be under /api/users
app.use('/api/jobs', jobScraperRoutes); // All job scraper routes will be under /api/jobs
app.use('/api/recruiters', recruiterRoutes); // All recruiter-related routes will be under /api/recruiters
app.use('/api/cover-letters', coverLetterRoutes); // All cover letter routes will be under /api/cover-letters

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Server startup
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Default to '0.0.0.0' if HOST is not set

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`API available at http://${HOST}:${PORT}/api`);
});
