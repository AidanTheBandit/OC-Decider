const OpenAI = require('openai');
const config = require('./config');
const ComplexityAnalyzer = require('./complexityAnalyzer');
const PlanningGenerator = require('./planningGenerator');

/**
 * DeciderOrchestrator - Orchestrates the multi-model decision process
 * 
 * This class manages the flow:
 * 1. Analyze prompt complexity with lightweight model
 * 2. Generate plan with advanced model if needed
 * 3. Inject plan into user prompt
 * 4. Send augmented prompt to final LLM
 */
class DeciderOrchestrator {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openaiApiKey,
      baseURL: config.openaiBaseUrl
    });
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.planningGenerator = new PlanningGenerator();
  }

  /**
   * Process a chat completion request with multi-model routing
   * @param {object} requestBody - OpenAI chat completion request body
   * @param {boolean} stream - Whether to stream the response
   * @returns {Promise<object>} - OpenAI chat completion response
   */
  async processChatCompletion(requestBody, stream = false) {
    const { messages, model, ...otherParams } = requestBody;
    
    // Extract the last user message for complexity analysis
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (!lastUserMessage) {
      throw new Error('No user message found in request');
    }

    const userPrompt = lastUserMessage.content;

    // Step 1: Analyze complexity
    console.log('Step 1: Analyzing prompt complexity...');
    const complexityAnalysis = await this.complexityAnalyzer.analyzeComplexity(userPrompt);
    console.log(`Complexity: ${complexityAnalysis.complexity}/10 - ${complexityAnalysis.reasoning}`);

    let augmentedMessages = [...messages];

    // Step 2: Generate plan if high complexity
    if (complexityAnalysis.needsPlanning) {
      console.log('Step 2: Generating plan for complex query...');
      const plan = await this.planningGenerator.generatePlan(userPrompt, complexityAnalysis);
      console.log('Plan generated successfully');

      // Step 3: Inject plan into the conversation
      // Insert the plan as a system message or augment the user message
      const planMessage = {
        role: 'system',
        content: `PLANNING GUIDANCE: The following plan has been generated to help structure the response to the user's complex request:\n\n${plan}\n\nPlease follow this plan while addressing the user's request.`
      };

      // Insert the plan message before the last user message
      augmentedMessages = [
        ...messages.slice(0, -1),
        planMessage,
        lastUserMessage
      ];

      console.log('Step 3: Plan injected into prompt');
    } else {
      console.log('Step 2-3: Skipped (low/medium complexity, no planning needed)');
    }

    // Step 4: Send to final LLM
    console.log('Step 4: Sending to final LLM...');
    const finalModel = model || config.models.default;
    
    const completionParams = {
      model: finalModel,
      messages: augmentedMessages,
      stream,
      ...otherParams
    };

    if (stream) {
      // Return the stream directly
      return await this.client.chat.completions.create(completionParams);
    } else {
      // Return the complete response
      const response = await this.client.chat.completions.create(completionParams);
      
      // Add metadata about the decision process
      response._deciderMetadata = {
        complexityAnalysis,
        planGenerated: complexityAnalysis.needsPlanning,
        modelsUsed: {
          complexity: config.models.complexity,
          planner: complexityAnalysis.needsPlanning ? config.models.planner : null,
          final: finalModel
        }
      };

      return response;
    }
  }
}

module.exports = DeciderOrchestrator;
