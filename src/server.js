/**
 * Production-like Web Application for Azure Load Testing Capacity Study
 * Project ID: 24CC3046-P056
 */

require('dotenv').config();

// 1. Initialize Azure Application Insights if connection string provided
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  try {
    const appInsights = require('applicationinsights');
    appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .start();
    console.log('[Telemetry] Azure Application Insights initialized successfully.');
  } catch (err) {
    console.warn('[Telemetry] Application Insights initialization skipped:', err.message);
  }
}

const express = require('express');
const crypto = require('crypto');
const path = require('path');
const db = require('./database/db');
const { initSchema } = require('./database/schema');
const { seed } = require('./database/seed');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Simple request logging & metrics counter in memory
let totalRequestsServed = 0;
let totalErrorsEncountered = 0;
const serverStartTime = Date.now();

app.use((req, res, next) => {
  totalRequestsServed++;
  const start = Date.now();
  res.on('finish', () => {
    if (res.statusCode >= 500) {
      totalErrorsEncountered++;
    }
  });
  next();
});

// ==========================================
// 1. GET /health (PHASE 2 REQUIREMENT)
// ==========================================
app.get('/health', async (req, res) => {
  let dbStatus = 'ok';
  try {
    await db.query('SELECT 1');
  } catch (err) {
    dbStatus = 'degraded: ' + err.message;
  }

  const memoryUsage = process.memoryUsage();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
    instanceId: process.env.WEBSITE_INSTANCE_ID || 'local-instance-1',
    hostname: process.env.COMPUTERNAME || require('os').hostname(),
    database: {
      type: db.type,
      status: dbStatus
    },
    metrics: {
      totalRequests: totalRequestsServed,
      totalErrors: totalErrorsEncountered,
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024)
    }
  });
});

// ==========================================
// 2. GET /api/products
// ==========================================
app.get('/api/products', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const category = req.query.category;

    let query = 'SELECT * FROM products';
    let params = [];

    if (category) {
      query += ' WHERE category = ? ORDER BY id ASC LIMIT ?';
      params = [category, limit];
    } else {
      query += ' ORDER BY id ASC LIMIT ?';
      params = [limit];
    }

    const result = await db.query(query, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      dbDurationMs: result.duration
    });
  } catch (err) {
    console.error('Error in /api/products:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. GET /api/products/:id
// ==========================================
app.get('/api/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    const result = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
      dbDurationMs: result.duration
    });
  } catch (err) {
    console.error('Error in /api/products/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. GET /api/search?q=laptop
// ==========================================
app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Query parameter q is required' });
    }

    const searchPattern = `%${q.trim()}%`;
    const result = await db.query(
      'SELECT * FROM products WHERE name LIKE ? OR category LIKE ? OR description LIKE ? LIMIT 50',
      [searchPattern, searchPattern, searchPattern]
    );

    res.json({
      success: true,
      query: q,
      count: result.rows.length,
      data: result.rows,
      dbDurationMs: result.duration
    });
  } catch (err) {
    console.error('Error in /api/search:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. GET /api/dashboard
// ==========================================
app.get('/api/dashboard', async (req, res) => {
  try {
    const statsQuery = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders) as total_revenue
    `);

    const recentOrders = await db.query(
      'SELECT id, user_id, total_amount, status, created_at FROM orders ORDER BY id DESC LIMIT 10'
    );

    res.json({
      success: true,
      stats: statsQuery.rows[0] || {},
      recentOrders: recentOrders.rows,
      serverStats: {
        uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
        totalRequestsServed,
        totalErrorsEncountered,
        instanceId: process.env.WEBSITE_INSTANCE_ID || 'local-instance-1'
      }
    });
  } catch (err) {
    console.error('Error in /api/dashboard:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. GET /api/orders
// ==========================================
app.get('/api/orders', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const result = await db.query('SELECT * FROM orders ORDER BY id DESC LIMIT ?', [limit]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      dbDurationMs: result.duration
    });
  } catch (err) {
    console.error('Error in /api/orders:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 7. POST /api/orders
// ==========================================
app.post('/api/orders', async (req, res) => {
  try {
    const { userId = 1, items = [{ productId: 1, quantity: 1, unitPrice: 99.99 }] } = req.body;
    let total = 0;
    items.forEach(i => {
      total += (i.unitPrice || 99.99) * (i.quantity || 1);
    });
    total = parseFloat(total.toFixed(2));

    const orderRes = await db.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [userId, total, 'completed']
    );

    const orderId = orderRes.lastInsertRowid || Math.floor(Math.random() * 100000);

    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.productId || 1, item.quantity || 1, item.unitPrice || 99.99]
      );
    }

    res.status(201).json({
      success: true,
      orderId,
      totalAmount: total,
      status: 'completed'
    });
  } catch (err) {
    console.error('Error in POST /api/orders:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 8. GET /api/heavy-operation
// Used to test breaking point, CPU scaling & autoscale triggers
// ==========================================
app.get('/api/heavy-operation', (req, res) => {
  const iterations = parseInt(req.query.iterations || '15000', 10);
  const start = Date.now();

  // Controlled CPU-intensive cryptographic / hashing loop
  let hash = 'seed';
  for (let i = 0; i < iterations; i++) {
    hash = crypto.createHash('sha256').update(hash + i).digest('hex');
  }

  // Memory buffer allocation
  const buffer = Buffer.alloc(1024 * 64, 'a');

  const durationMs = Date.now() - start;

  res.json({
    success: true,
    operation: 'crypto_hash_benchmark',
    iterations,
    durationMs,
    finalHashSample: hash.substring(0, 16),
    bufferSizeKb: buffer.length / 1024,
    instanceId: process.env.WEBSITE_INSTANCE_ID || 'local-instance-1'
  });
});

// Initialize database schema and auto-seed if empty
initSchema()
  .then(() => seed())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`Azure Capacity Study Web App running on port ${PORT}`);
      console.log(`Health endpoint: http://localhost:${PORT}/health`);
      console.log(`=======================================================`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database during startup:', err);
    app.listen(PORT, () => {
      console.log(`App started on port ${PORT} with fallback mode.`);
    });
  });

module.exports = app;
