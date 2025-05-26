const mockOptimizedResponse = `Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position. With my 3 years of experience in full-stack development and expertise in Node.js, I am confident in my ability to contribute effectively to your team.

Best regards,
John`;

const mockEvaluation = {
    scores: {
        relevance: 85,
        tone: 90,
        examples: 75,
        skills: 85,
        clarity: 88,
        impact: 82
    },
    totalScore: 84,
    suggestions: [
        "Add more specific achievements",
        "Include more technical details"
    ]
};

module.exports = {
    mockOptimizedResponse,
    mockEvaluation
};
