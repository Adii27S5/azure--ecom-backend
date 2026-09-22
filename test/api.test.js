/**
 * API Test Suite
 * Validates all required endpoints, status codes, and payload formats
 */

const http = require('http');

const PORT = 8080;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting API Verification ---');
  let passed = 0;
  let failed = 0;

  async function assertEndpoint(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. GET /health
  await assertEndpoint('GET /health returns 200 and healthy status', async () => {
    const res = await makeRequest('GET', '/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.status !== 'healthy') throw new Error(`Expected status healthy, got ${res.body.status}`);
  });

  // 2. GET /api/products
  await assertEndpoint('GET /api/products returns products list', async () => {
    const res = await makeRequest('GET', '/api/products?limit=10');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body.data) || res.body.data.length === 0) throw new Error('Expected non-empty products array');
  });

  // 3. GET /api/products/:id
  await assertEndpoint('GET /api/products/1 returns single product', async () => {
    const res = await makeRequest('GET', '/api/products/1');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.data || res.body.data.id != 1) throw new Error('Expected product id 1');
  });

  // 4. GET /api/search?q=laptop
  await assertEndpoint('GET /api/search?q=laptop returns matched products', async () => {
    const res = await makeRequest('GET', '/api/search?q=laptop');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body.data)) throw new Error('Expected data array');
  });

  // 5. GET /api/dashboard
  await assertEndpoint('GET /api/dashboard returns aggregations', async () => {
    const res = await makeRequest('GET', '/api/dashboard');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.stats) throw new Error('Expected stats in response');
  });

  // 6. GET /api/orders
  await assertEndpoint('GET /api/orders returns orders list', async () => {
    const res = await makeRequest('GET', '/api/orders?limit=5');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body.data)) throw new Error('Expected data array');
  });

  // 7. POST /api/orders
  await assertEndpoint('POST /api/orders creates a new order', async () => {
    const payload = {
      userId: 5,
      items: [
        { productId: 10, quantity: 2, unitPrice: 150.00 }
      ]
    };
    const res = await makeRequest('POST', '/api/orders', payload);
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    if (!res.body.orderId) throw new Error('Expected orderId in response');
  });

  // 8. GET /api/heavy-operation
  await assertEndpoint('GET /api/heavy-operation computes benchmark', async () => {
    const res = await makeRequest('GET', '/api/heavy-operation?iterations=5000');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.durationMs) throw new Error('Expected durationMs in response');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
