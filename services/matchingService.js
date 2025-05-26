const Job = require('../models/Job');
const User = require('../models/User');

class MatchingService {
    async getMatchedJobs(userId) {
        // Fetch user details
        const user = await User.findById(userId).populate('savedJobs appliedJobs');
        if (!user) {
            throw new Error('User not found');
        }

        // Fetch all jobs
        const jobs = await Job.find();

        // Calculate match scores for each job
        const matchedJobs = jobs.map((job) => {
            const score = this.calculateMatchScore(user, job);
            return { job, score };
        });

        // Sort jobs by match score in descending order
        matchedJobs.sort((a, b) => b.score - a.score);

        // Return top 10 matched jobs
        return matchedJobs.slice(0, 10).map((match) => match.job);
    }

    calculateMatchScore(user, job) {
        let score = 0;

        // Match based on saved or applied jobs
        if (user.savedJobs.some((savedJob) => savedJob._id.equals(job._id))) {
            score += 30; // Higher weight for saved jobs
        }
        if (user.appliedJobs.some((appliedJob) => appliedJob._id.equals(job._id))) {
            score += 20; // Lower weight for applied jobs
        }

        // Match based on skills
        const matchingSkills = job.requirements.filter((skill) =>
            user.skills.includes(skill)
        );
        score += matchingSkills.length * 10;

        // Match based on location preference
        if (user.location && job.location && user.location === job.location) {
            score += 15;
        }

        // Match based on job type preference
        if (user.preferences && user.preferences.jobType === job.jobType) {
            score += 10;
        }

        return score;
    }
}

module.exports = new MatchingService();
