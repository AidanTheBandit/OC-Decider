require('dotenv').config();
const express = require('express');
const config = require('./config');
const DeciderOrchestrator = require('./deciderOrchestrator');

const app = express();
app.use(express.json());

const orchestrator = new DeciderOrchestrator();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'OC-Decider',
    version: '1.0.0'
  });
});

/**
 * OpenAI-compliant chat completions endpoint
 * This endpoint mimics the OpenAI API but with multi-model routing
 */
app.post('/v1/chat/completions', async (req, res) => {
  try {
    console.log('\n=== New Request ===');
    console.log('Model requested:', req.body.model || 'default');
    console.log('Messages count:', req.body.messages?.length || 0);

    const stream = req.body.stream || false;

    if (stream) {
      // Handle streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const streamResponse = await orchestrator.processChatCompletion(req.body, true);

      for await (const chunk of streamResponse) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Handle non-streaming response
      const response = await orchestrator.processChatCompletion(req.body, false);
      
      // Log metadata (not sent to client in standard OpenAI format)
      if (response._deciderMetadata) {
        console.log('Decision metadata:', JSON.stringify(response._deciderMetadata, null, 2));
        delete response._deciderMetadata; // Remove before sending
      }

      res.json(response);
    }

    console.log('=== Request Complete ===\n');
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'server_error',
        code: 'internal_error'
      }
    });
  }
});

/**
 * Optional: Models endpoint for compatibility
 */
app.get('/v1/models', (req, res) => {
  res.json({
    data: [
      {
        id: config.models.default,
        object: 'model',
        created: Date.now(),
        owned_by: 'oc-decider'
      }
    ],
    object: 'list'
  });
});

/**
 * Root endpoint with API information
 */
app.get('/', (req, res) => {
  res.json({
    service: 'OC-Decider',
    description: 'OpenAI compliant endpoint with multi-model routing for improved responses',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      chatCompletions: 'POST /v1/chat/completions',
      models: 'GET /v1/models'
    },
    documentation: 'https://github.com/AidanTheBandit/OC-Decider'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      type: 'server_error'
    }
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`OC-Decider server running on port ${PORT}`);
  console.log(`Chat completions endpoint: http://localhost:${PORT}/v1/chat/completions`);
  console.log(`\nConfiguration:`);
  console.log(`- Complexity Model: ${config.models.complexity}`);
  console.log(`- Planner Model: ${config.models.planner}`);
  console.log(`- Default Model: ${config.models.default}`);
  console.log(`- High Complexity Threshold: ${config.complexity.highComplexityThreshold}/10`);
});

module.exports = app;
