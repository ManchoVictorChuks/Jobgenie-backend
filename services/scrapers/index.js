const puppeteer = require('puppeteer');
const JobListing = require('../../models/JobListing');

class BaseScraper {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async saveJob(jobData) {
        try {
            // Check if job already exists
            const existingJob = await JobListing.findOne({
                source: jobData.source,
                sourceId: jobData.sourceId
            });

            if (existingJob) {
                console.log(`[DB] Updated existing job: ${jobData.title} (${jobData.sourceId})`);
                existingJob.lastScraped = new Date();
                await existingJob.save();
                return 'updated';
            }

            // Create new job listing
            const job = new JobListing({
                ...jobData,
                lastScraped: new Date()
            });
            await job.save();
            console.log(`[DB] Added new job: ${jobData.title} (${jobData.sourceId})`);
            return 'created';
        } catch (error) {
            console.error(`[DB] Error saving job ${jobData.sourceId}:`, error.message);
            throw error;
        }
    }
}

module.exports = BaseScraper;
