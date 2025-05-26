const dotenv = require('dotenv');
dotenv.config({ path: '.env.test' });

// Mock DeepseekAI
jest.mock('../config/deepseekConfig', () => ({
    optimize: jest.fn().mockResolvedValue('Optimized content'),
    evaluate: jest.fn().mockResolvedValue({
        scores: { relevance: 85 },
        totalScore: 85,
        suggestions: ['Test suggestion']
    })
}));

// Rest of your test setup code...
