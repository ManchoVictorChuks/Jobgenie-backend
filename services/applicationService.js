const Application = require('../models/Application');
const User = require('../models/User');
const Job = require('../models/Job');
const { sendEmail } = require('../utils/emailUtils');

class ApplicationService {
    async submitApplication(userId, jobId, coverLetter) {
        try {
            // Fetch user and job details
            const user = await User.findById(userId);
            const job = await Job.findById(jobId);

            if (!user || !job) {
                throw new Error('User or Job not found');
            }

            // Create application
            const application = new Application({
                userId,
                jobId,
                coverLetter,
                isRecruiterJob: !!job.recruiterId,
                applicationLink: job.applicationLink || null
            });

            // Save application
            await application.save();

            // Send email notifications
            await this.sendUserNotification(user, job, coverLetter);
            if (job.recruiterId) {
                await this.sendRecruiterNotification(job.recruiterId, user, job, application._id);
            }

            return {
                status: 'success',
                applicationId: application._id,
                message: job.recruiterId
                    ? 'Application submitted to recruiter'
                    : 'Application submitted via external link'
            };
        } catch (error) {
            throw new Error(`Failed to submit application: ${error.message}`);
        }
    }

    async sendUserNotification(user, job, coverLetter) {
        const subject = `Application Successful: ${job.title}`;
        const html = `
            <h1>Application Successful</h1>
            <p>Dear ${user.fullName},</p>
            <p>You have successfully applied for the job <strong>${job.title}</strong>.</p>
            <p><strong>Your Cover Letter:</strong></p>
            <blockquote>${coverLetter}</blockquote>
            <p><strong>Improvements Made:</strong></p>
            <ul>
                <li>Aligned your skills with the job requirements.</li>
                <li>Enhanced the tone for professionalism.</li>
                <li>Improved structure and clarity.</li>
            </ul>
            <p>Keep up the great work! We wish you the best of luck.</p>
            <p>Regards,<br>JobGenie Team</p>
        `;

        await sendEmail(user.email, subject, html);
    }

    async sendRecruiterNotification(recruiterId, user, job, applicationId) {
        const recruiter = await User.findById(recruiterId); // Assuming recruiters are also stored in the User model
        if (!recruiter) return;

        const subject = `New Application for ${job.title}`;
        const html = `
            <h1>New Job Application</h1>
            <p>Dear ${recruiter.fullName},</p>
            <p>You have received a new application for the job <strong>${job.title}</strong>.</p>
            <p><strong>Applicant Details:</strong></p>
            <ul>
                <li>Name: ${user.fullName}</li>
                <li>Email: ${user.email}</li>
                <li>Phone: ${user.phoneNumber}</li>
            </ul>
            <p><a href="${process.env.APP_URL}/applications/${applicationId}">View Application</a></p>
            <p>Regards,<br>JobGenie Team</p>
        `;

        await sendEmail(recruiter.email, subject, html);
    }

    async getApplicationStatus(applicationId) {
        return await Application.findById(applicationId)
            .populate('jobId', 'title company')
            .select('status submissionDate');
    }
}

module.exports = new ApplicationService();
