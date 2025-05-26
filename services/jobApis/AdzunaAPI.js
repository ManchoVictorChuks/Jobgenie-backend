const axios = require('axios');
require('dotenv').config();

class AdzunaAPI {
    constructor() {
        this.baseUrl = 'https://api.adzuna.com/v1/api/jobs';
        this.appId = process.env.ADZUNA_APP_ID;
        this.apiKey = process.env.ADZUNA_API_KEY;
        this.countries = ['gb', 'us', 'za', 'in'];
    }

    async searchJobs({ keywords, location, page = 1 }) {
        try {
            let allJobs = [];
            console.log(`Starting Adzuna search for ${keywords} in ${location || 'all locations'}`);

            for (const country of this.countries) {
                try {
                    const url = `${this.baseUrl}/${country}/search/${page}`;
                    const params = new URLSearchParams({
                        'app_id': this.appId,
                        'app_key': this.apiKey,
                        'results_per_page': '50',
                        'what': location?.toLowerCase() === 'remote' ? 
                               `${keywords} remote` :
                               location?.toLowerCase() === 'nigeria' ?
                               `${keywords} nigeria` :
                               keywords,
                        'content-type': 'application/json',
                    });

                    // For remote jobs
                    if (location?.toLowerCase() === 'remote') {
                        params.append('title_only', '1');
                    }

                    const fullUrl = `${url}?${params.toString()}`;

                    const response = await axios.get(fullUrl);

                    if (response.data?.results?.length > 0) {
                        const jobs = response.data.results.map(job => ({
                            title: job.title,
                            company: job.company?.display_name || 'Unknown Company',
                            location: this.formatLocation(job.location?.area?.join(', ') || job.location?.display_name, country),
                            description: this.formatDescription(job.description),
                            salary: this.formatSalary(job),
                            type: this.formatJobType(job),
                            applicationLink: job.redirect_url,
                            sourceId: `adzuna_${country}_${job.id}`,
                            source: 'adzuna',
                            postedDate: new Date(job.created),
                            isActive: true,
                            isRemote: this.isRemoteJob(job),
                            companyLogo: `https://ui-avatars.com/api/?background=2D5A27&color=fff&name=${encodeURIComponent(job.company?.display_name || 'Company')}`
                        }));

                        // Filter out duplicates before adding to allJobs
                        const newJobs = jobs.filter(job => 
                            !allJobs.some(existing => 
                                existing.sourceId === job.sourceId ||
                                (existing.title === job.title && 
                                 existing.company === job.company &&
                                 existing.location === job.location)
                            )
                        );

                        allJobs = [...allJobs, ...newJobs];
                    }

                    // Add delay between requests to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    // Only log country-specific errors if they're not rate limiting
                    if (!error.response?.status === 429) {
                        console.error(`Adzuna API Error for ${country}:`, error.response?.data || error.message);
                    }
                    continue;
                }
            }

            console.log(`Completed Adzuna search for ${keywords}. Found ${allJobs.length} jobs.`);
            return allJobs;
        } catch (error) {
            console.error('Adzuna API Error:', error.message);
            return [];
        }
    }

    formatLocation(location, country) {
        if (!location) return 'Location not specified';
        if (location.toLowerCase().includes('remote')) return 'Remote';
        return `${location} (${country.toUpperCase()})`;
    }

    formatSalary(job) {
        if (job.salary_min && job.salary_max) {
            const min = this.formatNumber(job.salary_min);
            const max = this.formatNumber(job.salary_max);
            return `${min} - ${max} ${job.salary_currency || 'USD'}/year`;
        }
        return 'Salary not specified';
    }

    formatJobType(job) {
        const type = job.contract_type || 'Full-time';
        const remote = this.isRemoteJob(job) ? '• Remote' : '';
        return `${type}${remote ? ' ' + remote : ''}`;
    }

    formatNumber(num) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(num);
    }

    isRemoteJob(job) {
        const remoteTerms = ['remote', 'work from home', 'wfh', 'virtual', 'telecommute'];
        const searchText = `${job.title} ${job.description} ${job.location?.display_name || ''}`.toLowerCase();
        return remoteTerms.some(term => searchText.includes(term));
    }

    isNigerianJob(job) {
        const searchText = `${job.location?.display_name || ''} ${job.description || ''}`.toLowerCase();
        return searchText.includes('nigeria') || searchText.includes('lagos') || 
               searchText.includes('abuja') || searchText.includes('port harcourt');
    }

    formatDescription(description) {
        if (!description) return '';
        
        return description
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Remove "Description" word at start
            .replace(/^Description:?\s*/i, '')
            .replace(/^Job Description:?\s*/i, '')
            // Replace HTML entities
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            // Format bullet points
            .replace(/[•●\-]/g, '\n•')
            // Replace multiple spaces
            .replace(/\s{2,}/g, ' ')
            // Clean up newlines
            .replace(/\n{3,}/g, '\n\n')
            // Remove any remaining "Description" occurrences with a newline
            .replace(/\n[Dd]escription:?\s*/g, '\n')
            .trim();
    }
}

module.exports = AdzunaAPI;
