/**
 * Database Seeder
 * Populates realistic data: 100 Users, 500 Products, 1000 Orders
 */

const db = require('./db');
const { initSchema } = require('./schema');

async function seed() {
  await initSchema();

  console.log('[Seed] Checking existing records...');
  const countCheck = await db.query('SELECT COUNT(*) as count FROM products');
  const count = parseInt(countCheck.rows[0].count || countCheck.rows[0].COUNT || 0, 10);

  if (count > 0) {
    console.log(`[Seed] Database already contains ${count} products. Skipping duplicate seed.`);
    return;
  }

  console.log('[Seed] Seeding 100 users...');
  const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Lucas', 'Mia', 'Aiden', 'Harper', 'Oliver'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee'];

  for (let i = 1; i <= 100; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[Math.floor(i / 3) % lastNames.length];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`;
    const name = `${fn} ${ln}`;
    if (db.type === 'memory') {
      db.store.users.push({ id: i, name, email, role: i <= 5 ? 'admin' : 'customer' });
    } else {
      await db.query('INSERT INTO users (name, email, role) VALUES (?, ?, ?)', [name, email, i <= 5 ? 'admin' : 'customer']);
    }
  }

  console.log('[Seed] Seeding 500 realistic products...');
  const categories = ['Laptops', 'Smartphones', 'Monitors', 'Audio', 'Accessories', 'Networking', 'Gaming', 'Storage'];
  const adjectives = ['Ultra', 'Pro', 'Gaming', 'Wireless', 'Ergonomic', 'Portable', 'Smart', 'Elite', 'Titanium', 'Precision'];
  const productTypes = [
    { cat: 'Laptops', names: ['ThinkPad Carbon X1', 'Dell XPS 15', 'MacBook Pro M3', 'Asus ROG Zephyrus', 'HP Spectre x360', 'Lenovo Legion 5', 'Acer Swift Go'] },
    { cat: 'Smartphones', names: ['Galaxy S24 Ultra', 'iPhone 15 Pro Max', 'Pixel 8 Pro', 'OnePlus 12', 'Xiaomi 14 Ultra'] },
    { cat: 'Monitors', names: ['4K UltraWide 34-inch', 'Curved Gaming Monitor 144Hz', 'OLED 27-inch 240Hz', '4K Professional Color-Accurate 32-inch'] },
    { cat: 'Audio', names: ['Active Noise Canceling Headphones', 'True Wireless Earbuds', 'Hi-Fi Studio Monitors', 'USB Condenser Microphone'] },
    { cat: 'Accessories', names: ['Mechanical RGB Keyboard', 'Ergonomic Wireless Mouse', 'Thunderbolt 4 Docking Station', 'USB-C Fast Charger 100W'] },
    { cat: 'Gaming', names: ['Flight Simulator Yoke', 'Racing Wheel & Pedals', 'VR Headset Pro', 'High-FPS Capture Card'] },
    { cat: 'Storage', names: ['PCIe 4.0 NVMe SSD 2TB', 'External Rugged SSD 1TB', 'NAS Storage Server 16TB', 'Enterprise Flash Drive 512GB'] }
  ];

  const categoryImages = {
    'Laptops': [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80'
    ],
    'Smartphones': [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&auto=format&fit=crop&q=80'
    ],
    'Monitors': [
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&auto=format&fit=crop&q=80'
    ],
    'Audio': [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80'
    ],
    'Accessories': [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&auto=format&fit=crop&q=80'
    ],
    'Gaming': [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1612287233207-6b66e3001815?w=600&auto=format&fit=crop&q=80'
    ],
    'Storage': [
      'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=600&auto=format&fit=crop&q=80'
    ]
  };

  let prodId = 1;
  for (let i = 1; i <= 500; i++) {
    const pTypeGroup = productTypes[i % productTypes.length];
    const baseName = pTypeGroup.names[i % pTypeGroup.names.length];
    const adj = adjectives[i % adjectives.length];
    const name = `${adj} ${baseName} (Gen ${Math.floor(i / 10) + 1})`;
    const category = pTypeGroup.cat;
    const price = parseFloat((25 + (i * 7.5) % 1950).toFixed(2));
    const stock = 20 + (i * 13) % 250;
    const description = `High-performance ${name} with enterprise reliability, optimized for productivity and gaming.`;
    const imgList = categoryImages[category] || categoryImages['Laptops'];
    const imageUrl = imgList[i % imgList.length];
    const rating = parseFloat((4.3 + (i % 7) * 0.1).toFixed(1));

    if (db.type === 'memory') {
      db.store.products.push({ id: prodId++, name, category, price, stock, description, image_url: imageUrl, rating });
    } else {
      await db.query(
        'INSERT INTO products (name, category, price, stock, description, image_url, rating) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, category, price, stock, description, imageUrl, rating]
      );
    }
  }

  console.log('[Seed] Seeding 1000 orders with order items...');
  const orderStatuses = ['completed', 'processing', 'shipped', 'delivered', 'pending'];
  for (let i = 1; i <= 1000; i++) {
    const userId = 1 + (i % 100);
    const status = orderStatuses[i % orderStatuses.length];
    const numItems = 1 + (i % 4);
    let totalAmount = 0;

    let orderId = i;
    if (db.type !== 'memory') {
      const ordRes = await db.query('INSERT INTO orders (user_id, total_amount, status) VALUES (?, 0, ?)', [userId, status]);
      orderId = ordRes.lastInsertRowid || i;
    }

    for (let k = 1; k <= numItems; k++) {
      const productId = 1 + ((i * 7 + k * 13) % 500);
      const qty = 1 + (k % 3);
      const unitPrice = parseFloat((49.99 + (productId * 3.75) % 350).toFixed(2));
      totalAmount += unitPrice * qty;

      if (db.type === 'memory') {
        db.store.order_items.push({ id: (i - 1) * 4 + k, order_id: orderId, product_id: productId, quantity: qty, unit_price: unitPrice });
      } else {
        await db.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)', [orderId, productId, qty, unitPrice]);
      }
    }

    if (db.type === 'memory') {
      db.store.orders.push({ id: orderId, user_id: userId, total_amount: parseFloat(totalAmount.toFixed(2)), status });
    } else {
      await db.query('UPDATE orders SET total_amount = ? WHERE id = ?', [parseFloat(totalAmount.toFixed(2)), orderId]);
    }
  }

  console.log('[Seed] Database seeding completed successfully.');
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('[Seed] Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error('[Seed] Error:', err);
      process.exit(1);
    });
}

module.exports = { seed };
