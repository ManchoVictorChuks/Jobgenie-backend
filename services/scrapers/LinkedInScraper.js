const BaseScraper = require('./index');

class LinkedInScraper extends BaseScraper {
    constructor() {
        super();
        this.source = 'linkedin';
        this.baseUrl = 'https://www.linkedin.com/jobs/search';
        this.timeout = 60000; // Increase timeout to 60 seconds
    }

    async scrapeJobs(keywords, location) {
        try {
            await this.init();
            
            // Configure page for better reliability
            await this.page.setDefaultNavigationTimeout(this.timeout);
            await this.page.setDefaultTimeout(this.timeout);
            await this.page.setRequestInterception(true);
            
            // Optimize performance by blocking unnecessary resources
            this.page.on('request', (request) => {
                if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
                    request.abort();
                } else {
                    request.continue();
                }
            });

            const isRemote = location.toLowerCase() === 'remote';
            const searchParams = new URLSearchParams({
                keywords: keywords,
                location: isRemote ? '' : location,
                f_WT: isRemote ? '2' : '',
                sortBy: 'DD',
                f_TPR: 'r86400',
                start: '0'
            });

            const searchUrl = `${this.baseUrl}?${searchParams.toString()}`;
            
            // Add retry mechanism
            let retries = 3;
            let success = false;
            let jobs = [];

            while (retries > 0 && !success) {
                try {
                    await this.page.goto(searchUrl, { 
                        waitUntil: 'networkidle2',
                        timeout: this.timeout 
                    });

                    // Wait for job cards to load
                    await this.page.waitForSelector('.job-card-container', {
                        timeout: this.timeout
                    });

                    jobs = await this.page.evaluate(() => {
                        const jobCards = document.querySelectorAll('.job-card-container');
                        return Array.from(jobCards).map(card => ({
                            title: card.querySelector('.job-card-list__title')?.textContent?.trim() || '',
                            company: card.querySelector('.job-card-container__company-name')?.textContent?.trim() || '',
                            location: card.querySelector('.job-card-container__metadata-item')?.textContent?.trim() || '',
                            sourceId: card.getAttribute('data-job-id') || '',
                            applicationLink: card.querySelector('.job-card-container__link')?.href || ''
                        })).filter(job => job.title && job.company); // Only keep jobs with required fields
                    });

                    success = true;
                } catch (error) {
                    console.warn(`Attempt ${4 - retries}/3 failed:`, error.message);
                    retries--;
                    if (retries === 0) throw error;
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s between retries
                }
            }

            // Process found jobs
            const processedJobs = [];
            for (const job of jobs) {
                try {
                    if (!job.applicationLink) continue;

                    await this.page.goto(job.applicationLink, {
                        waitUntil: 'networkidle2',
                        timeout: this.timeout
                    });

                    const details = await this.page.evaluate(() => ({
                        description: document.querySelector('.description__text')?.textContent?.trim() || '',
                        salary: document.querySelector('.compensation__salary')?.textContent?.trim() || '',
                        requirements: Array.from(document.querySelectorAll('.job-requirements__list-item'))
                            .map(item => item.textContent.trim())
                            .filter(Boolean)
                    }));

                    const isJobRemote = job.location.toLowerCase().includes('remote') || 
                                     job.title.toLowerCase().includes('remote');
                    const isInNigeria = job.location.toLowerCase().includes('nigeria');

                    if (isRemote && isJobRemote || !isRemote && isInNigeria) {
                        const processedJob = {
                            ...job,
                            ...details,
                            source: this.source,
                            postedDate: new Date(),
                            isActive: true,
                            isRemote: isJobRemote
                        };
                        await this.saveJob(processedJob);
                        processedJobs.push(processedJob);
                    }

                    // Add delay between job processing
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`Error processing job ${job.title}:`, error.message);
                    continue;
                }
            }

            return processedJobs;
        } catch (error) {
            console.error(`LinkedIn scraping error for ${keywords} in ${location}:`, error.message);
            throw error;
        } finally {
            await this.close();
        }
    }
}

module.exports = LinkedInScraper;
