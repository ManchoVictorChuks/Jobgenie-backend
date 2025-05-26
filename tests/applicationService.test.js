const applicationService = require('../services/applicationService');
const Application = require('../models/Application');
const User = require('../models/User');
const Job = require('../models/Job');

jest.mock('../models/Application');
jest.mock('../models/User');
jest.mock('../models/Job');

describe('Application Service Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('submitApplication creates application for recruiter job', async () => {
        const mockUser = { _id: 'userId' };
        const mockJob = { 
            _id: 'jobId',
            recruiterId: 'recruiterId'
        };

        User.findById.mockResolvedValue(mockUser);
        Job.findById.mockResolvedValue(mockJob);
        Application.prototype.save.mockResolvedValue({ _id: 'applicationId' });

        const result = await applicationService.submitApplication(
            'userId',
            'jobId',
            'Cover letter content'
        );

        expect(result.status).toBe('success');
        expect(result.message).toBe('Application submitted to recruiter');
    });

    test('submitApplication handles external job applications', async () => {
        const mockUser = { _id: 'userId' };
        const mockJob = { 
            _id: 'jobId',
            applicationLink: 'https://example.com/apply'
        };

        User.findById.mockResolvedValue(mockUser);
        Job.findById.mockResolvedValue(mockJob);
        Application.prototype.save.mockResolvedValue({ _id: 'applicationId' });

        const result = await applicationService.submitApplication(
            'userId',
            'jobId',
            'Cover letter content'
        );

        expect(result.status).toBe('success');
        expect(result.message).toBe('Application submitted via external link');
    });
});
