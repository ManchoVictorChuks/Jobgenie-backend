const AdzunaAPI = require('../services/jobApis/AdzunaAPI');
const JobListing = require('../models/JobListing');
const cron = require('node-cron');

const adzunaAPI = new AdzunaAPI();

const scrapeAllSources = async () => {
    try {
        const startTime = new Date();
        console.log('\n=== Starting Job Scraping Process ===');
        console.log('Start time:', startTime.toISOString());
        
        // Get initial count
        const initialCount = await JobListing.countDocuments();
        console.log('Initial job count in database:', initialCount);

        let stats = {
            processed: 0,
            created: 0,
            updated: 0,
            failed: 0
        };

        const searchConfigs = [
            {
                keywords: [
                    // Technology
                    'Software Engineer', 'Web Developer', 'Data Scientist', 'IT Support',
                    // Business & Finance
                    'Accountant', 'Financial Analyst', 'Business Manager', 'Marketing Manager',
                    // Healthcare
                    'Nurse', 'Doctor', 'Healthcare Assistant', 'Medical Officer',
                    // Education
                    'Teacher', 'Lecturer', 'Education Coordinator', 'Principal',
                    // Sales & Customer Service
                    'Sales Representative', 'Customer Service', 'Account Manager',
                    // Admin & Office
                    'Administrative Assistant', 'Office Manager', 'Secretary', 'Receptionist',
                    // Engineering & Construction
                    'Civil Engineer', 'Mechanical Engineer', 'Project Manager', 'Architect',
                    // Hospitality & Service
                    'Chef', 'Hotel Manager', 'Restaurant Manager', 'Waiter',
                    // Media & Creative
                    'Graphic Designer', 'Content Writer', 'Journalist', 'Social Media Manager',
                    // Human Resources
                    'HR Manager', 'Recruiter', 'Training Coordinator', 'HR Assistant',
                    // Legal
                    'Lawyer', 'Legal Assistant', 'Paralegal', 'Legal Secretary'
                ],
                locations: ['Nigeria', '']  // Empty string for remote jobs
            }
        ];

        for (const config of searchConfigs) {
            for (const keywords of config.keywords) {
                for (const location of config.locations) {
                    try {
                        const jobs = await adzunaAPI.searchJobs({
                            keywords: location ? keywords : `Remote ${keywords}`,
                            location: location
                        });

                        for (const job of jobs) {
                            try {
                                stats.processed++;
                                const result = await JobListing.findOneAndUpdate(
                                    { sourceId: job.sourceId },
                                    job,
                                    { upsert: true, new: true }
                                );
                                
                                if (result.isNew) {
                                    stats.created++;
                                } else {
                                    stats.updated++;
                                }
                            } catch (error) {
                                stats.failed++;
                                if (!error.code === 11000) {
                                    console.error('Error saving job:', error.message);
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Failed to fetch ${keywords} jobs:`, error.message);
                    }
                }
            }
        }

        // Get final count
        const finalCount = await JobListing.countDocuments();
        const endTime = new Date();
        const duration = (endTime - startTime) / 1000;

        console.log('\n=== Job Scraping Summary ===');
        console.log('Duration:', `${duration.toFixed(2)} seconds`);
        console.log('Jobs processed:', stats.processed);
        console.log('New jobs created:', stats.created);
        console.log('Existing jobs updated:', stats.updated);
        console.log('Failed operations:', stats.failed);
        console.log('Initial job count:', initialCount);
        console.log('Final job count:', finalCount);
        console.log('Net new jobs:', finalCount - initialCount);
        console.log('===============================\n');

    } catch (error) {
        console.error('Error in scrapeAllSources:', error);
        throw error;
    }
};

// Start scraping immediately when server starts
console.log('Starting initial job scraping...');
scrapeAllSources().catch(error => {
    console.error('Initial scraping failed:', error);
});

// Schedule future scraping every 30 minutes
cron.schedule('*/30 * * * *', async () => {
    console.log('Starting scheduled job scraping...');
    try {
        await scrapeAllSources();
    } catch (error) {
        console.error('Scheduled scraping failed:', error);
    }
});

const getJobs = async (req, res) => {
    try {
        const { search, location, type, remote } = req.query;
        const query = {};
        
        // Basic search filters
        if (search) {
            query.$text = { $search: search };
        }

        // Location and remote filtering logic
        if (remote === 'true') {
            // For remote jobs - search globally
            query.$or = [
                { location: /remote/i },
                { title: /remote/i },
                { type: /remote/i }
            ];
        } else if (location) {
            // For specific location - prioritize Nigerian jobs
            query.location = new RegExp(location, 'i');
        } else {
            // Default to showing Nigerian jobs first, then remote jobs
            query.$or = [
                { location: /nigeria/i },
                { location: /remote/i }
            ];
        }

        if (type) {
            query.type = new RegExp(type, 'i');
        }

        const jobs = await JobListing.find(query)
            .sort({ postedDate: -1 });

        const total = await JobListing.countDocuments(query);

        res.json({
            jobs,
            total,
            filters: {
                remote: remote === 'true',
                location,
                type
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    scrapeAllSources,
    getJobs
};
