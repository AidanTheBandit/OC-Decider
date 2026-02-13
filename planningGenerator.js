const OpenAI = require('openai');
const config = require('./config');

/**
 * PlanningGenerator - Generates a structured plan for complex queries using an advanced model
 */
class PlanningGenerator {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openaiApiKey,
      baseURL: config.openaiBaseUrl
    });
    this.model = config.models.planner;
  }

  /**
   * Generate a plan for handling a complex user prompt
   * @param {string} userPrompt - The user's input prompt
   * @param {object} complexityAnalysis - The complexity analysis results
   * @returns {Promise<string>} - The generated plan
   */
  async generatePlan(userPrompt, complexityAnalysis) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: config.prompts.planner
          },
          {
            role: 'user',
            content: `Complexity Level: ${complexityAnalysis.complexity}/10
Reasoning: ${complexityAnalysis.reasoning}

User Request:
${userPrompt}

Please provide a structured plan to address this request.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating plan:', error);
      throw new Error('Failed to generate plan for complex query');
    }
  }
}

module.exports = PlanningGenerator;
