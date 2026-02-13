const OpenAI = require('openai');
const config = require('./config');

/**
 * ComplexityAnalyzer - Analyzes the complexity of user prompts using a lightweight model
 */
class ComplexityAnalyzer {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openaiApiKey,
      baseURL: config.openaiBaseUrl
    });
    this.model = config.models.complexity;
  }

  /**
   * Analyze the complexity of a user prompt
   * @param {string} userPrompt - The user's input prompt
   * @returns {Promise<{complexity: number, reasoning: string, needsPlanning: boolean}>}
   */
  async analyzeComplexity(userPrompt) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: config.prompts.complexityAnalyzer
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const content = response.choices[0].message.content.trim();
      const analysis = JSON.parse(content);
      
      // Validate the response structure
      if (!analysis.complexity || !analysis.reasoning || analysis.needsPlanning === undefined) {
        throw new Error('Invalid response format from complexity analyzer');
      }

      // Ensure complexity is within range
      analysis.complexity = Math.max(1, Math.min(10, analysis.complexity));
      
      // Override needsPlanning based on threshold if not explicitly set correctly
      if (analysis.complexity >= config.complexity.highComplexityThreshold) {
        analysis.needsPlanning = true;
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing complexity:', error);
      // Default to medium complexity on error
      return {
        complexity: 5,
        reasoning: 'Error in complexity analysis, defaulting to medium complexity',
        needsPlanning: false
      };
    }
  }
}

module.exports = ComplexityAnalyzer;
