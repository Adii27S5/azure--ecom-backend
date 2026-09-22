/**
 * Database Schema Initialization
 * Works across PostgreSQL and SQLite
 */

const db = require('./db');

async function initSchema() {
  console.log(`[Schema] Initializing tables for ${db.type}...`);

  if (db.type === 'memory') {
    console.log('[Schema] In-memory store ready.');
    return;
  }

  const idType = db.type === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const timestampDefault = db.type === 'postgres' ? 'CURRENT_TIMESTAMP' : "datetime('now')";

  // 1. Users table
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id ${idType},
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      role VARCHAR(50) DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT ${timestampDefault}
    )
  `);

  // 2. Products table
  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id ${idType},
      name VARCHAR(150) NOT NULL,
      category VARCHAR(100) NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      stock INTEGER NOT NULL DEFAULT 100,
      description TEXT,
      created_at TIMESTAMP DEFAULT ${timestampDefault}
    )
  `);

  // Index on products category and name for search performance
  try {
    await db.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`);
  } catch (err) {
    // Indexes might already exist or differ slightly
  }

  // 3. Orders table
  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id ${idType},
      user_id INTEGER NOT NULL,
      total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
      status VARCHAR(50) DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT ${timestampDefault}
    )
  `);

  // 4. Order items table
  await db.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id ${idType},
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price NUMERIC(10, 2) NOT NULL
    )
  `);

  try {
    await db.query(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`);
  } catch (err) {
    // index ignore
  }

  console.log('[Schema] Schema initialization complete.');
}

module.exports = { initSchema };
