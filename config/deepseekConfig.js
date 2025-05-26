const axios = require('axios');

class DeepseekAI {
    constructor() {
        this.apiKey = process.env.DEEPSEEK_API_KEY;
        this.baseURL = 'https://api.deepseek.com/v1/chat';
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        });
    }

    async generateResponse(prompt) {
        try {
            const response = await this.client.post('/completions', {
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 2000,
                stream: false
            });

            if (!response.data || !response.data.choices) {
                throw new Error('Invalid response from DeepSeek API');
            }

            return response.data.choices[0].message.content;
        } catch (error) {
            if (error.response?.data?.error) {
                throw new Error(`DeepseekAI Error: ${error.response.data.error.message}`);
            }
            throw error;
        }
    }

    async optimize(originalText, jobDetails, userProfile) {
        const prompt = `
        As an expert career advisor, optimize this cover letter for maximum impact.
        
        JOB DETAILS:
        Title: ${jobDetails.title}
        Description: ${jobDetails.description}
        Key Requirements: ${jobDetails.requirements.join(', ')}
        
        CANDIDATE PROFILE:
        Skills: ${userProfile.skills.join(', ')}
        Experience: ${userProfile.experience}
        
        ORIGINAL COVER LETTER:
        ${originalText}
        
        OPTIMIZATION GUIDELINES:
        1. Maintain professional tone and natural flow
        2. Highlight specific matching skills from candidate profile
        3. Address key job requirements directly
        4. Keep under 400 words
        5. Use active voice and impactful language
        6. Include measurable achievements where possible
        7. Remove generic statements
        
        Please provide the optimized cover letter in a clear, professional format.`;

        return this.generateResponse(prompt);
    }

    async evaluate(coverLetter, jobDetails) {
        const prompt = `
        Evaluate this cover letter based on the following criteria.
        Provide a score from 0-100 for each criterion and specific improvement suggestions.
        
        COVER LETTER:
        ${coverLetter}
        
        JOB DETAILS:
        ${jobDetails.description}
        
        EVALUATION CRITERIA:
        1. Relevance to Position (How well it matches job requirements)
        2. Professional Tone & Language
        3. Specific Examples & Achievements
        4. Skills Alignment
        5. Clarity & Conciseness
        6. Overall Impact
        
        Format your response as:
        {
          "scores": {
            "relevance": X,
            "tone": X,
            "examples": X,
            "skills": X,
            "clarity": X,
            "impact": X
          },
          "totalScore": X,
          "suggestions": [
            "specific improvement point 1",
            "specific improvement point 2"
          ]
        }`;

        const response = await this.generateResponse(prompt);
        return JSON.parse(response);
    }
}

module.exports = new DeepseekAI();
