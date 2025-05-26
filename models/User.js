const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: {
            values: ['male', 'female', 'other'],
            message: '{VALUE} is not a valid gender'
        },
        set: v => v.toLowerCase(),  // Convert to lowercase before saving
    },
    username: {
        type: String,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    profilePicture: {
        url: {
            type: String,
            default: function() {
                return `https://ui-avatars.com/api/?background=2D5A27&color=fff&name=${this.fullName || 'User'}`;
            }
        },
        filename: String,
        uploadedAt: Date
    },
    savedJobs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job'
        }
    ],
    appliedJobs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job'
        }
    ],
    preferences: {
        jobType: { type: String, enum: ['remote', 'full-time', 'part-time'], default: 'full-time' },
        location: { type: String }
    },
    documents: {
        cv: {
            url: String,
            filename: String,
            uploadedAt: Date,
            contentType: String
        },
        resume: {
            url: String,
            filename: String,
            uploadedAt: Date,
            contentType: String
        },
        coverLetter: {
            url: String,
            filename: String,
            uploadedAt: Date,
            contentType: String
        }
    }
}, { timestamps: true });

// Pre-save hook to handle username generation
userSchema.pre('save', async function(next) {
    // Convert gender to lowercase if it exists
    if (this.gender) {
        this.gender = this.gender.toLowerCase();
    }
    if (!this.username) {
        // Generate username from full name and random string
        const baseUsername = this.fullName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 15);
        const randomString = crypto.randomBytes(4).toString('hex');
        this.username = `${baseUsername}${randomString}`;
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
