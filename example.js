/**
 * Example usage of OC-Decider
 * 
 * This script demonstrates how to use the OC-Decider API
 * Make sure the server is running before executing this script
 */

const OpenAI = require('openai');

// Configure the client to use the local OC-Decider endpoint
const client = new OpenAI({
  apiKey: 'not-needed-for-local',
  baseURL: 'http://localhost:3000/v1'
});

async function testSimpleQuery() {
  console.log('\n=== Testing Simple Query ===');
  console.log('Query: What is the capital of France?\n');
  
  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'user', content: 'What is the capital of France?' }
    ]
  });

  console.log('Response:', response.choices[0].message.content);
}

async function testComplexQuery() {
  console.log('\n=== Testing Complex Query ===');
  console.log('Query: Create a comprehensive guide for building a microservices architecture...\n');
  
  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { 
        role: 'user', 
        content: 'Create a comprehensive guide for building a microservices architecture with Docker and Kubernetes. Include best practices for service discovery, load balancing, monitoring, and implementing CI/CD pipelines.' 
      }
    ]
  });

  console.log('Response:', response.choices[0].message.content);
}

async function testStreamingQuery() {
  console.log('\n=== Testing Streaming Query ===');
  console.log('Query: Explain quantum computing...\n');
  
  const stream = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'user', content: 'Explain quantum computing in simple terms and provide examples of its applications.' }
    ],
    stream: true
  });

  console.log('Streaming response:');
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(content);
  }
  console.log('\n');
}

async function main() {
  console.log('OC-Decider Example Usage');
  console.log('========================\n');
  console.log('Make sure the OC-Decider server is running on http://localhost:3000\n');

  try {
    // Test with a simple query (should not trigger planning)
    await testSimpleQuery();

    // Test with a complex query (should trigger planning)
    await testComplexQuery();

    // Test streaming
    await testStreamingQuery();

    console.log('\n=== All Tests Complete ===\n');
  } catch (error) {
    console.error('Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. The server is running (npm start)');
    console.error('2. Your OPENAI_API_KEY is set in .env');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testSimpleQuery, testComplexQuery, testStreamingQuery };
