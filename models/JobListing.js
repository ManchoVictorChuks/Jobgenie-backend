const mongoose = require('mongoose');

const jobListingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    salary: String,
    type: String,
    description: String,
    requirements: [String],
    postedDate: Date,
    applicationLink: String,
    companyLogo: {
        type: String,
        default: function() {
            return `https://ui-avatars.com/api/?background=2D5A27&color=fff&name=${encodeURIComponent(this.company)}`;
        }
    },
    source: {
        type: String,
        required: true // 'linkedin', 'indeed', etc.
    },
    sourceId: {
        type: String,
        required: true // Original job ID from source
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastScraped: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create compound index for source and sourceId to prevent duplicates
jobListingSchema.index({ source: 1, sourceId: 1 }, { unique: true });

// Create text indices for searching
jobListingSchema.index({ 
    title: 'text', 
    description: 'text', 
    company: 'text',
    location: 'text' 
});

// Add a pre-save hook to format description
jobListingSchema.pre('save', function(next) {
    if (this.description) {
        // Remove HTML tags
        this.description = this.description
            .replace(/<[^>]*>/g, '')
            // Replace multiple newlines with single newline
            .replace(/\n{3,}/g, '\n\n')
            // Replace multiple spaces with single space
            .replace(/\s{2,}/g, ' ')
            // Trim whitespace
            .trim();

        // Split into paragraphs and format
        const paragraphs = this.description.split('\n');
        this.description = paragraphs
            .map(p => p.trim())
            .filter(p => p.length > 0)
            .join('\n\n');
    }
    next();
});

module.exports = mongoose.model('JobListing', jobListingSchema);
