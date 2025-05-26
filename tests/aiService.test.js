const { optimizeCoverLetter, evaluateCoverLetter } = require('../services/aiService');

// Update mock setup
const mockAnalyzeCV = jest.fn();
const mockOptimize = jest.fn();
const mockEvaluate = jest.fn();
const mockCheckConsistency = jest.fn();

jest.mock('../services/deepseekAI', () => ({
    analyzeCV: (...args) => mockAnalyzeCV(...args),
    optimize: (...args) => mockOptimize(...args),
    evaluate: (...args) => mockEvaluate(...args),
    checkConsistency: (...args) => mockCheckConsistency(...args)
}));

describe('AI Service Tests', () => {
    beforeEach(() => {
        mockAnalyzeCV.mockClear();
        mockOptimize.mockClear();
        mockEvaluate.mockClear();
        mockCheckConsistency.mockClear();

        // Set default mock implementations
        mockAnalyzeCV.mockResolvedValue({
            yearsOfExperience: 5,
            keySkills: ['React', 'Node.js', 'AWS', 'TypeScript'],
            leadership: true,
            mentoring: true,
            education: 'B.Sc Computer Science'
        });
        mockCheckConsistency.mockResolvedValue(true);
    });

    const sampleCV = `JOHN DOE
        Software Developer
        
        EXPERIENCE
        Senior Developer, Tech Corp (2020-Present)
        - Led team of 5 developers in cloud migration project
        - Mentored 3 junior developers in React and Node.js
        - Implemented CI/CD pipelines using AWS`;

    test('optimizeCoverLetter returns optimized content', async () => {
        const sampleInput = {
            coverLetter: 'Original cover letter',
            jobDescription: 'Sample job description',
            userCV: sampleCV
        };

        const expectedOutput = {
            optimizedText: 'Final optimized cover letter with CV details',
            finalScore: 9.2,
            iterationsUsed: 1,
            cvConsistency: true,
            optimizationHistory: [
                {
                    iteration: 1,
                    letter: 'Final optimized cover letter with CV details',
                    score: 9.2,
                    feedback: 'Good',
                    suggestions: []
                }
            ]
        };

        mockOptimize.mockResolvedValueOnce('Final optimized cover letter with CV details');
        mockEvaluate.mockResolvedValueOnce({
            score: 9.2,
            feedback: 'Good',
            suggestions: []
        });

        const result = await optimizeCoverLetter(
            sampleInput.coverLetter,
            sampleInput.jobDescription,
            sampleInput.userCV
        );

        expect(result).toEqual(expectedOutput);
    });

    test('evaluateCoverLetter returns proper evaluation structure', async () => {
        const sampleInput = {
            coverLetter: 'Test cover letter',
            jobDescription: 'Test job description',
            userCV: sampleCV
        };

        const mockEvaluation = {
            score: 8.5,
            feedback: 'Good cover letter',
            suggestions: ['Add more details']
        };

        mockEvaluate.mockResolvedValue(mockEvaluation);

        const result = await evaluateCoverLetter(
            sampleInput.coverLetter,
            sampleInput.jobDescription,
            sampleInput.userCV
        );

        expect(result).toEqual(mockEvaluation);
    });

    test('handles missing parameters', async () => {
        await Promise.all([
            expect(optimizeCoverLetter()).rejects.toThrow('Missing required parameters'),
            expect(evaluateCoverLetter()).rejects.toThrow('Missing required parameters')
        ]);
    });

    test('optimizeCoverLetter performs iterative optimization until target score', async () => {
        const sampleInput = {
            coverLetter: 'Original cover letter',
            jobDescription: 'Sample job description',
            userCV: sampleCV
        };

        mockOptimize
            .mockResolvedValueOnce('First optimization with CV details')
            .mockResolvedValueOnce('Final optimization with CV details');

        mockEvaluate
            .mockResolvedValueOnce({
                score: 7.5,
                feedback: 'Good start',
                suggestions: ['Improve 1']
            })
            .mockResolvedValueOnce({
                score: 9.2,
                feedback: 'Excellent',
                suggestions: []
            });

        const result = await optimizeCoverLetter(
            sampleInput.coverLetter,
            sampleInput.jobDescription,
            sampleInput.userCV
        );

        expect(result.finalScore).toBeGreaterThanOrEqual(9.0);
        expect(result.cvConsistency).toBe(true);
        expect(mockOptimize).toHaveBeenCalledWith(
            expect.any(String),
            sampleInput.jobDescription,
            expect.any(Object) // CV analysis object
        );
    });

    test('real-world cover letter optimization with CV', async () => {
        const sampleInput = {
            coverLetter: `Dear Hiring Manager,
                I am writing to express my interest in the Software Developer position at your company. 
                I have 3 years of experience in web development using JavaScript and Node.js.
                I believe I would be a great fit for your team.
                Best regards,
                John Doe`,
            jobDescription: `We are seeking a Senior Software Developer with:
                - 5+ years of experience in full-stack development
                - Strong expertise in React, Node.js, and TypeScript
                - Experience with cloud services (AWS/Azure)
                - Strong communication and leadership skills
                - Ability to mentor junior developers`,
            userCV: sampleCV
        };

        mockOptimize.mockResolvedValueOnce(`Dear Hiring Manager,
            Drawing from my 5 years of software development experience, I am excited to apply for 
            the Senior Software Developer position. In my current role at Tech Corp, I lead a team 
            of 5 developers and actively mentor junior team members in React and Node.js development.
            
            My experience aligns perfectly with your requirements, as I've successfully:
            - Led cloud migration projects using AWS services
            - Implemented full-stack solutions using React, Node.js, and TypeScript
            - Mentored 3 junior developers, fostering their professional growth
            
            With my Computer Science degree and proven track record in team leadership, 
            I am confident in my ability to contribute to your organization's success.
            
            Best regards,
            John Doe`);

        mockEvaluate.mockResolvedValueOnce({
            score: 9.5,
            feedback: 'Excellent alignment with both job requirements and CV credentials',
            suggestions: []
        });

        const result = await optimizeCoverLetter(
            sampleInput.coverLetter,
            sampleInput.jobDescription,
            sampleInput.userCV
        );

        expect(result.finalScore).toBeGreaterThanOrEqual(9.0);
        expect(result.cvConsistency).toBe(true);
        expect(result.optimizedText).toContain('5 years');
        expect(result.optimizedText).toContain('AWS');
        expect(result.optimizedText).toContain('team of 5 developers');
    });
});
