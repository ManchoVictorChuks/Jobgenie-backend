const deepseekAI = require('./deepseekAI');

const TARGET_SCORE = 9.0;
const MAX_ITERATIONS = 3;

const optimizeCoverLetter = async (coverLetter, jobDescription, userCV) => {
    if (!coverLetter || !jobDescription || !userCV) {
        throw new Error('Missing required parameters');
    }
    
    try {
        // First analyze CV to extract key qualifications and experience
        const cvAnalysis = await deepseekAI.analyzeCV(userCV);
        let currentLetter = coverLetter;
        let currentScore = 0;
        let iterations = 0;
        let optimizationHistory = [];
        
        do {
            // Optimize letter using CV data and job requirements
            currentLetter = await deepseekAI.optimize(
                currentLetter, 
                jobDescription, 
                cvAnalysis
            );
            
            // Evaluate the optimized version
            const evaluation = await evaluateCoverLetter(
                currentLetter, 
                jobDescription, 
                cvAnalysis
            );
            
            currentScore = evaluation.score;
            optimizationHistory.push({
                iteration: iterations + 1,
                letter: currentLetter,
                score: currentScore,
                feedback: evaluation.feedback,
                suggestions: evaluation.suggestions
            });
            
            if (currentScore >= TARGET_SCORE || ++iterations >= MAX_ITERATIONS) {
                break;
            }
        } while (true);
        
        return {
            optimizedText: currentLetter,
            finalScore: currentScore,
            iterationsUsed: iterations,
            cvConsistency: await deepseekAI.checkConsistency(currentLetter, cvAnalysis),
            optimizationHistory: optimizationHistory
        };
    } catch (error) {
        console.error('Cover letter optimization error:', error);
        throw new Error('Failed to optimize cover letter: ' + error.message);
    }
};

const evaluateCoverLetter = async (coverLetter, jobDescription) => {
    if (!coverLetter || !jobDescription) {
        throw new Error('Missing required parameters');
    }

    try {
        const evaluation = await deepseekAI.evaluate(coverLetter, jobDescription);
        return {
            score: evaluation.score,
            feedback: evaluation.feedback,
            suggestions: evaluation.suggestions
        };
    } catch (error) {
        console.error('Cover letter evaluation error:', error);
        throw new Error('Failed to evaluate cover letter: ' + error.message);
    }
};

module.exports = { optimizeCoverLetter, evaluateCoverLetter };
