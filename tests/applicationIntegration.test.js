const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const applicationService = require('../services/applicationService');

describe('Application Integration Tests', () => {
    // Increase timeout for the test suite
    jest.setTimeout(30000);

    beforeAll(async () => {
        try {
            // Connect to test database
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jobgenie_test');
        } catch (error) {
            console.error('Error connecting to the database:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            // Close database connection
            await mongoose.connection.close();
        } catch (error) {
            console.error('Error closing the database connection:', error);
        }
    });

    beforeEach(async () => {
        try {
            // Clear test data
            await User.deleteMany({});
            await Job.deleteMany({});
            await Application.deleteMany({});
        } catch (error) {
            console.error('Error clearing test data:', error);
            throw error;
        }
    });

    test('Submit application with real user data', async () => {
        // Create test user
        const user = await User.create({
            email: 'testuser@example.com',
            fullName: 'Test User',
            password: 'hashedpassword123',
            phoneNumber: '+1234567890',
            gender: 'Male'
        });

        // Create test job
        const job = await Job.create({
            title: 'Software Developer',
            company: 'Test Corp',
            description: 'Test job description',
            isRecruiterJob: true,
            recruiterId: new mongoose.Types.ObjectId(),
            location: 'Remote'
        });

        // Test cover letter
        const coverLetter = 'This is an optimized cover letter for testing purposes.';

        // Submit application
        const result = await applicationService.submitApplication(
            user._id,
            job._id,
            coverLetter
        );

        // Verify application
        const application = await Application.findById(result.applicationId);
        expect(application).toBeTruthy();
        expect(application.userId.toString()).toBe(user._id.toString());
        expect(application.jobId.toString()).toBe(job._id.toString());
        expect(application.status).toBe('pending');
    });

    test('Check application status flow', async () => {
        // Create test data
        const user = await User.create({
            email: 'testuser2@example.com',
            fullName: 'Test User 2',
            password: 'hashedpassword123',
            phoneNumber: '+9876543210',
            gender: 'Female'
        });

        const job = await Job.create({
            title: 'Frontend Developer',
            company: 'Test Corp',
            description: 'Frontend position',
            applicationLink: 'https://example.com/apply',
            isRecruiterJob: false
        });

        // Submit and check application
        const result = await applicationService.submitApplication(
            user._id,
            job._id,
            'Test cover letter'
        );

        const status = await applicationService.getApplicationStatus(result.applicationId);
        expect(status).toBeTruthy();
        expect(status.status).toBe('pending');
    });
});
