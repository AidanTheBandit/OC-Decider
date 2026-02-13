# Usage Guide

This guide provides detailed examples of using OC-Decider.

## Quick Start

1. **Install and Configure**
   ```bash
   npm install
   cp .env.example .env
   # Edit .env with your OpenAI API key
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Test the Endpoint**
   ```bash
   curl http://localhost:3000/health
   ```

## API Examples

### Example 1: Simple Query (No Planning)

For simple queries with low complexity, the system skips the planning phase for faster responses.

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4-turbo-preview",
    "messages": [
      {
        "role": "user",
        "content": "What is the capital of France?"
      }
    ]
  }'
```

**Flow:**
1. Complexity analyzer determines this is a low-complexity query (score: ~2/10)
2. No planning needed
3. Directly sent to the final model
4. Response returned

### Example 2: Complex Query (With Planning)

For complex queries requiring structured thinking, the system generates a plan first.

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4-turbo-preview",
    "messages": [
      {
        "role": "user",
        "content": "Design a complete microservices architecture for an e-commerce platform. Include authentication, payment processing, inventory management, order fulfillment, and analytics. Explain the tech stack, communication patterns, data consistency strategies, and deployment approach."
      }
    ]
  }'
```

**Flow:**
1. Complexity analyzer determines this is a high-complexity query (score: ~9/10)
2. Planning model generates a structured plan
3. Plan is injected into the conversation as system guidance
4. Final model generates response following the plan
5. More comprehensive, structured response returned

### Example 3: Streaming Response

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4-turbo-preview",
    "messages": [
      {
        "role": "user",
        "content": "Explain quantum computing and its potential applications."
      }
    ],
    "stream": true
  }'
```

### Example 4: Multi-Turn Conversation

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4-turbo-preview",
    "messages": [
      {
        "role": "user",
        "content": "I need help designing a REST API"
      },
      {
        "role": "assistant",
        "content": "I'\''d be happy to help you design a REST API..."
      },
      {
        "role": "user",
        "content": "How should I handle authentication and rate limiting?"
      }
    ]
  }'
```

## Using with OpenAI SDK

### Node.js

```javascript
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: 'not-needed',  // Not used for local deployment
  baseURL: 'http://localhost:3000/v1'
});

async function main() {
  // Simple query
  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'user', content: 'Hello, how are you?' }
    ]
  });
  
  console.log(response.choices[0].message.content);
}

main();
```

### Python

```python
from openai import OpenAI

client = OpenAI(
    api_key="not-needed",
    base_url="http://localhost:3000/v1"
)

response = client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[
        {"role": "user", "content": "What is machine learning?"}
    ]
)

print(response.choices[0].message.content)
```

### cURL

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4-turbo-preview",
    "messages": [{"role": "user", "content": "Tell me a joke"}]
  }'
```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `OPENAI_BASE_URL` | OpenAI API base URL | `https://api.openai.com/v1` |
| `PORT` | Server port | `3000` |
| `COMPLEXITY_MODEL` | Model for complexity analysis | `gpt-3.5-turbo` |
| `PLANNER_MODEL` | Model for planning | `gpt-4-turbo-preview` |
| `DEFAULT_MODEL` | Default model for responses | `gpt-4-turbo-preview` |
| `HIGH_COMPLEXITY_THRESHOLD` | Threshold for planning (1-10) | `6` |

### Customizing Models

You can use different models for each stage:

```env
# Use faster models for cost savings
COMPLEXITY_MODEL=gpt-3.5-turbo
PLANNER_MODEL=gpt-4
DEFAULT_MODEL=gpt-4

# Or use the same model for everything
COMPLEXITY_MODEL=gpt-4-turbo-preview
PLANNER_MODEL=gpt-4-turbo-preview
DEFAULT_MODEL=gpt-4-turbo-preview
```

### Adjusting Complexity Threshold

The threshold determines when planning is triggered:

- `1-3`: Only extremely complex queries trigger planning
- `4-6`: Balanced (recommended)
- `7-10`: Most queries trigger planning

```env
# More conservative (less planning)
HIGH_COMPLEXITY_THRESHOLD=8

# More aggressive (more planning)
HIGH_COMPLEXITY_THRESHOLD=4
```

## Integration Examples

### Using as OpenAI Proxy

You can configure any OpenAI-compatible client to use OC-Decider:

```javascript
// Before
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// After
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'http://localhost:3000/v1'
});
```

### With LangChain

```javascript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  openAIApiKey: "not-needed",
  configuration: {
    baseURL: "http://localhost:3000/v1",
  },
});
```

### With Vercel AI SDK

```javascript
import { openai } from '@ai-sdk/openai';

const model = openai('gpt-4-turbo-preview', {
  baseURL: 'http://localhost:3000/v1'
});
```

## Monitoring and Debugging

The server logs provide visibility into the decision process:

```
=== New Request ===
Model requested: gpt-4-turbo-preview
Messages count: 1
Step 1: Analyzing prompt complexity...
Complexity: 8/10 - This query requires multiple steps...
Step 2: Generating plan for complex query...
Plan generated successfully
Step 3: Plan injected into prompt
Step 4: Sending to final LLM...
=== Request Complete ===
```

## Best Practices

1. **Model Selection**
   - Use `gpt-3.5-turbo` for complexity analysis (fast and cheap)
   - Use `gpt-4` or `gpt-4-turbo-preview` for planning and final responses
   - Adjust based on your quality/cost requirements

2. **Threshold Tuning**
   - Start with default threshold of 6
   - Monitor which queries trigger planning
   - Adjust up if too many false positives, down if missing complex queries

3. **Cost Optimization**
   - Simple queries bypass planning, saving API calls
   - Use cheaper models for complexity analysis
   - Consider caching complexity analyses for repeated queries

4. **Error Handling**
   - If complexity analysis fails, defaults to medium complexity
   - If planning fails, the error is logged and propagated
   - Always validate your API key is set correctly

## Troubleshooting

### Server won't start
- Check that port 3000 is available
- Verify `.env` file exists and is readable
- Ensure `OPENAI_API_KEY` is set

### API calls fail
- Verify OpenAI API key is valid
- Check network connectivity
- Review server logs for detailed errors

### Planning not triggering
- Lower `HIGH_COMPLEXITY_THRESHOLD`
- Check that queries are actually complex enough
- Review complexity analysis logs

### Unexpected responses
- Check which model was used (see logs)
- Verify model configuration in `.env`
- Review the generated plan in logs
