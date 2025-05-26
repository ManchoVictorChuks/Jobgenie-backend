# JobGenie Backend API Documentation

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Routes](#api-routes)
- [AI Services](#ai-services)
- [Application Process](#application-process)
- [Database Models](#database-models)
- [File Processing](#file-processing)
- [Error Handling](#error-handling)
- [Test Status](#test-status)
- [Matching Algorithm](#matching-algorithm)
- [Email Notifications](#email-notifications)

## Overview
JobGenie is a comprehensive job application platform that connects users with recruiters and provides AI-powered cover letter optimization.

### Key Features
- User and Recruiter Authentication
- Job Posting and Management
- Cover Letter Optimization using DeepSeek AI
- PDF Processing and Generation
- Job Scraping Integration

## System Architecture

### Tech Stack
- Node.js & Express.js
- MongoDB (Database)
- JWT (Authentication)
- DeepSeek AI (Natural Language Processing)
- Multer (File Upload)
- PDF Processing (pdf-parse & PDFKit)

### Directory Structure
```
job-app-backend/
├── config/
│   ├── db.js                 # Database configuration
│   └── deepseekConfig.js     # AI configuration
├── middleware/
│   ├── authMiddleware.js     # Authentication middleware
│   └── upload.js            # File upload middleware
├── models/
│   ├── User.js              # User model
│   ├── Recruiter.js         # Recruiter model
│   └── Job.js              # Job model
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   ├── userRoutes.js        # User management
│   ├── recruiterRoutes.js   # Recruiter management
│   ├── jobScraperRoutes.js  # Job scraping
│   └── coverLetterRoutes.js # Cover letter processing
├── services/
│   ├── aiService.js         # AI processing
│   └── jobScraperService.js # Job scraping
├── utils/
│   └── pdfUtils.js         # PDF processing
└── server.js               # Main application file
```

## Getting Started

### Prerequisites
- Node.js v14+
- MongoDB
- DeepSeek AI API key
- npm or yarn

### Installation
```bash
git clone [repository-url]
cd job-app-backend
npm install
```

### Environment Variables
Create a `.env` file:
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
DEEPSEEK_API_KEY=your_deepseek_api_key
NODE_ENV=development
```

## Authentication

### User Authentication
#### Signup
```
POST /api/auth/user/signup
Body: {
  "email": "string",
  "password": "string",
  "name": "string"
}
```

#### Recruiter Signup
```
POST /api/auth/recruiter/signup
Body: {
  "email": "string",
  "password": "string",
  "name": "string",
  "company": "string"
}
```

#### Login
```
POST /api/auth/login
Body: {
  "email": "string",
  "password": "string",
  "role": "user|recruiter"
}
```

## API Routes

### User Routes
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/applications` - Get user's job applications

### Recruiter Routes
- `GET /api/recruiters/profile` - Get recruiter profile
- `PUT /api/recruiters/profile` - Update recruiter profile
- `GET /api/recruiters/jobs` - Get recruiter's posted jobs

### Job Routes
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get specific job
- `POST /api/jobs` - Create new job (recruiter only)
- `PUT /api/jobs/:id` - Update job (recruiter only)
- `DELETE /api/jobs/:id` - Delete job (recruiter only)

### Cover Letter Routes
- `POST /api/cover-letters/optimize` - Optimize cover letter
```
Multipart Form Data:
- coverLetter: PDF file
- jobId: string
```

## AI Services

### Cover Letter Optimization
The system uses DeepSeek AI for:
1. Text Analysis
2. Content Optimization
3. Quality Evaluation

#### Optimization Process
1. PDF to Text Conversion
2. Context Analysis
   - Job Requirements
   - User Skills
   - Original Content
3. AI Optimization
4. Quality Check
5. PDF Generation

#### Evaluation Criteria
- Relevance to job description
- Professional tone
- Clarity and conciseness
- Skills alignment
- Proper structure

## Application Process

### Overview
The application bot automates the job application process by:
1. Using the optimized cover letter from the AI service.
2. Fetching user details (name, phone number, email, and resume).
3. Retrieving job details from the database based on the job ID.
4. Applying to the job:
   - If the job was created by a recruiter, the application is stored in the recruiter's job applicants list.
   - If the job was scraped, the bot applies via the external application link.

### Key Features
- Automated application submission.
- Integration with recruiter-created jobs and scraped jobs.
- Tracks application status (e.g., `pending`, `submitted`, `failed`).

### API Endpoints
#### Submit Application
```
POST /api/applications/submit
Body: {
  "jobId": "string",
  "coverLetter": "string"
}
Headers: {
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

#### Check Application Status
```
GET /api/applications/status/:applicationId
Headers: {
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

## Database Models

### User Model
```javascript
{
  email: String,
  password: String,
  name: String,
  skills: [String],
  experience: String,
  applications: [ObjectId]
}
```

### Recruiter Model
```javascript
{
  email: String,
  password: String,
  name: String,
  company: String,
  postedJobs: [ObjectId]
}
```

### Job Model
```javascript
{
  title: String,
  company: String,
  description: String,
  requirements: [String],
  recruiter: ObjectId,
  applications: [ObjectId],
  status: String
}
```

## File Processing

### PDF Processing
The system uses:
- `pdf-parse` for reading PDFs
- `PDFKit` for generating PDFs

#### PDF to Text
```javascript
const pdfParse = require('pdf-parse');
const dataBuffer = fs.readFileSync(pdfPath);
const data = await pdfParse(dataBuffer);
```

#### Text to PDF
```javascript
const PDFDocument = require('pdfkit');
const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('output.pdf'));
```

### File Upload
Using Multer middleware:
- File size limit: 5MB
- Allowed formats: PDF
- Storage: Local filesystem

## Error Handling

### Global Error Handler
```javascript
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

### Error Types
1. Authentication Errors (401)
2. Authorization Errors (403)
3. Validation Errors (400)
4. Not Found Errors (404)
5. Server Errors (500)

## Security Measures

### API Security
- JWT Authentication
- Password Hashing (bcrypt)
- Rate Limiting
- CORS Configuration
- Input Validation
- File Upload Restrictions

### Best Practices
- Environment Variables
- Secure Headers
- Error Masking
- Request Logging
- File Size Limits

## Testing

### Running Tests
```bash
npm run test
```

### Test Coverage
- Authentication
- File Processing
- AI Integration
- Database Operations
- API Endpoints

## Test Status

### AI Service Tests (`tests/aiService.test.js`)

Currently 3/5 tests are passing:

✅ optimizeCoverLetter returns optimized content  
✅ evaluateCoverLetter returns proper evaluation structure  
✅ handles missing parameters  
❌ optimizeCoverLetter performs iterative optimization until target score  
❌ real-world cover letter optimization with CV  

### Potential Issues to Check

1. Verify that mock implementations for iterative optimization are working correctly
2. Check if the target score comparison in iterative optimization test is correct
3. Ensure CV analysis data is being properly passed to the optimize function
4. Verify consistency check implementation in the real-world test case

### Running Tests

```bash
npm test
```

For detailed test output:
```bash
npm test -- --verbose
```

### Application Integration Tests (`tests/applicationIntegration.test.js`)

✅ Submit application with real user data  
✅ Check application status flow  

### Running Integration Tests
To run the integration tests:
```bash
npm run test:integration
```

For debugging open handles:
```bash
npm run test:integration -- --detectOpenHandles
```

### Notes
- Ensure the `.env` file is properly configured with the `MONGO_URI` and other required variables.
- MongoDB must be running for the integration tests to pass.

## Deployment

### Production Setup
1. Set environment variables
2. Configure MongoDB
3. Setup AI credentials
4. Configure file storage
5. Enable logging

### Monitoring
- Server status
- API performance
- Error tracking
- Resource usage

## Contributing
[Contributing guidelines and instructions]

## License
[License information]

## Matching Algorithm

### Overview
The matching algorithm recommends jobs to users based on:
1. **User Activity**: Jobs the user has saved or applied to.
2. **User Preferences**: Location, job type, and skills.
3. **Job Attributes**: Title, description, required skills, and location.

### API Endpoint
#### Get Matched Jobs
```
GET /api/matching/matches
Headers: {
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

### Scoring Criteria
- **Saved Jobs**: +30 points
- **Applied Jobs**: +20 points
- **Matching Skills**: +10 points per skill
- **Location Match**: +15 points
- **Job Type Match**: +10 points

### Example Response
```json
[
  {
    "_id": "jobId1",
    "title": "Software Developer",
    "company": "Tech Corp",
    "location": "Remote",
    "requirements": ["JavaScript", "React", "Node.js"]
  },
  {
    "_id": "jobId2",
    "title": "Frontend Developer",
    "company": "Design Inc",
    "location": "New York",
    "requirements": ["HTML", "CSS", "JavaScript"]
  }
]
```

## Email Notifications

### Overview
The system sends email notifications for job applications:
1. **To the Applicant**: Includes job title, cover letter, improvements made, and a success message.
2. **To the Recruiter**: Includes applicant details and a link to view the application.

### Configuration
Add the following to your `.env` file:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
APP_URL=http://localhost:5000
```

### Example Emails
#### Applicant Email
Subject: `Application Successful: Software Developer`
Body:
- Job Title: Software Developer
- Cover Letter: [User's Cover Letter]
- Improvements Made: [List of Improvements]
- Success Message

#### Recruiter Email
Subject: `New Application for Software Developer`
Body:
- Job Title: Software Developer
- Applicant Details: Name, Email, Phone
- Link to View Application
