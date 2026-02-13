/**
 * Integration test for OC-Decider
 * Tests the API endpoints without requiring actual OpenAI API calls
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

/**
 * Make an HTTP request
 */
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: body ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(body))
      } : {}
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testHealthEndpoint() {
  console.log('Testing /health endpoint...');
  const response = await request('GET', '/health');
  
  if (response.statusCode !== 200) {
    throw new Error(`Health check failed with status ${response.statusCode}`);
  }
  
  if (response.body.status !== 'ok') {
    throw new Error('Health check returned wrong status');
  }
  
  console.log('✓ Health endpoint working');
}

async function testRootEndpoint() {
  console.log('Testing / endpoint...');
  const response = await request('GET', '/');
  
  if (response.statusCode !== 200) {
    throw new Error(`Root endpoint failed with status ${response.statusCode}`);
  }
  
  if (!response.body.service || !response.body.endpoints) {
    throw new Error('Root endpoint returned incomplete data');
  }
  
  console.log('✓ Root endpoint working');
}

async function testModelsEndpoint() {
  console.log('Testing /v1/models endpoint...');
  const response = await request('GET', '/v1/models');
  
  if (response.statusCode !== 200) {
    throw new Error(`Models endpoint failed with status ${response.statusCode}`);
  }
  
  if (!Array.isArray(response.body.data)) {
    throw new Error('Models endpoint returned invalid format');
  }
  
  console.log('✓ Models endpoint working');
}

async function testChatCompletionsEndpointFormat() {
  console.log('Testing /v1/chat/completions endpoint format...');
  
  // Test with missing messages (should fail)
  const response = await request('POST', '/v1/chat/completions', {
    model: 'gpt-4-turbo-preview'
  });
  
  if (response.statusCode !== 500) {
    throw new Error(`Expected 500 status for invalid request, got ${response.statusCode}`);
  }
  
  if (!response.body.error) {
    throw new Error('Error response missing error field');
  }
  
  console.log('✓ Chat completions endpoint validates input correctly');
}

async function runTests() {
  console.log('\n=== OC-Decider Integration Tests ===\n');
  
  const tests = [
    testHealthEndpoint,
    testRootEndpoint,
    testModelsEndpoint,
    testChatCompletionsEndpointFormat
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      console.error(`✗ ${test.name} failed:`, error.message);
      failed++;
    }
  }
  
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${tests.length}`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Wait a moment for server to be ready
setTimeout(() => {
  runTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
}, 1000);
