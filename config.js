/**
 * Configuration for OC-Decider
 * 
 * This file contains the configuration for the multi-model routing system.
 */

module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  
  // OpenAI API configuration
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  
  // Model configuration
  models: {
    // Fast, lightweight model for complexity analysis
    complexity: process.env.COMPLEXITY_MODEL || 'gpt-3.5-turbo',
    
    // Advanced model for planning (for complex queries)
    planner: process.env.PLANNER_MODEL || 'gpt-4-turbo-preview',
    
    // Default model for final response generation
    default: process.env.DEFAULT_MODEL || 'gpt-4-turbo-preview'
  },
  
  // Complexity thresholds
  complexity: {
    // Threshold score above which a query is considered "high complexity"
    // Scale: 1-10, where 10 is most complex
    highComplexityThreshold: parseInt(process.env.HIGH_COMPLEXITY_THRESHOLD || '6', 10)
  },
  
  // System prompts
  prompts: {
    complexityAnalyzer: `You are a complexity analyzer. Analyze the user's prompt and determine its complexity level.
Consider factors like:
- Number of steps required
- Domain knowledge needed
- Ambiguity in the request
- Multiple sub-tasks or dependencies
- Need for structured planning

Respond ONLY with a JSON object in this exact format:
{
  "complexity": <number 1-10>,
  "reasoning": "<brief explanation>",
  "needsPlanning": <boolean>
}`,
    
    planner: `You are an expert planning assistant. The user has submitted a complex request.
Create a clear, step-by-step plan to address their request effectively.

Your plan should:
- Break down the task into logical steps
- Identify key considerations or dependencies
- Suggest an approach or structure for the response
- Be concise but comprehensive

Respond with a structured plan that will help guide the generation of a high-quality response.`
  }
};
