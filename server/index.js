const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let db;

// Initialize Database
(async () => {
    try {
        db = await open({
            filename: './storeminds.db',
            driver: sqlite3.Database
        });

        console.log('Connected to SQLite database.');

        // Create Items Table (Updated with image_url)
        await db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        quantity INTEGER DEFAULT 0,
        price REAL DEFAULT 0.0,
        category TEXT,
        image_url TEXT,
        last_updated DATETIME
      )
    `);

        // Create Categories Table
        await db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        color TEXT,
        icon TEXT
      )
    `);

        // Create Activity Log Table
        await db.exec(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        item_name TEXT,
        quantity_change INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create Transactions Table
        await db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total REAL NOT NULL,
        payment_method TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create Transaction Items Table
        await db.exec(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER,
        item_id INTEGER,
        quantity INTEGER,
        price REAL,
        FOREIGN KEY(transaction_id) REFERENCES transactions(id),
        FOREIGN KEY(item_id) REFERENCES items(id)
      )
    `);

        // Create Suppliers Table
        await db.exec(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT,
        email TEXT
      )
    `);

        // Update Items Table to include supplier_id if not exists
        try {
            await db.exec('ALTER TABLE items ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id)');
        } catch (e) {
            // Column likely exists
        }

        // Create Users Table
        await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
      )
    `);

        // Seed Admin User
        const userCount = await db.get('SELECT count(*) as count FROM users');
        if (userCount.count === 0) {
            console.log('Creating admin user...');
            // In a real app, hash this password!
            await db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', 'admin123', 'admin']);
        }

        // Seed Categories
        const catCount = await db.get('SELECT count(*) as count FROM categories');
        if (catCount.count === 0) {
            console.log('Seeding categories...');
            const cats = [
                { name: 'Electronics', color: '#3b82f6', icon: 'Headphones' },
                { name: 'Furniture', color: '#8b5cf6', icon: 'Armchair' },
                { name: 'Clothing', color: '#ec4899', icon: 'Shirt' },
                { name: 'Groceries', color: '#10b981', icon: 'Apple' },
                { name: 'Other', color: '#64748b', icon: 'Box' }
            ];
            for (const cat of cats) {
                await db.run('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)', [cat.name, cat.color, cat.icon]);
            }
        }

        // Seed Data if empty
        const count = await db.get('SELECT count(*) as count FROM items');
        if (count.count === 0) {
            console.log('Seeding database...');
            const mockInventory = [
                { name: 'Wireless Headphones', sku: 'AUDIO-001', quantity: 45, price: 129.99, category: 'Electronics' },
                { name: 'Ergonomic Chair', sku: 'FUR-002', quantity: 8, price: 299.99, category: 'Furniture' },
                { name: 'Mechanical Keyboard', sku: 'TECH-003', quantity: 12, price: 159.50, category: 'Electronics' },
            ];

            for (const item of mockInventory) {
                await db.run(
                    'INSERT INTO items (name, sku, quantity, price, category, last_updated) VALUES (?, ?, ?, ?, ?, ?)',
                    [item.name, item.sku, item.quantity, item.price, item.category, new Date()]
                );
            }
        }

    } catch (err) {
        console.error('Error connecting to database:', err);
    }
})();

// --- Endpoints ---

// POS Checkout
app.post('/api/pos/checkout', async (req, res) => {
    const { cart, paymentMethod, total } = req.body;

    if (!cart || cart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    try {
        await db.exec('BEGIN TRANSACTION');

        // 1. Create Transaction
        const transResult = await db.run(
            'INSERT INTO transactions (total, payment_method, date) VALUES (?, ?, ?)',
            [total, paymentMethod, new Date()]
        );
        const transactionId = transResult.lastID;

        // 2. Process Items
        for (const item of cart) {
            // Check stock
            const dbItem = await db.get('SELECT quantity, name FROM items WHERE id = ?', item.id);
            if (!dbItem || dbItem.quantity < item.cartQuantity) {
                throw new Error(`Insufficient stock for ${item.name}`);
            }

            // Deduct Stock
            await db.run('UPDATE items SET quantity = quantity - ? WHERE id = ?', [item.cartQuantity, item.id]);

            // Add to Transaction Items
            await db.run(
                'INSERT INTO transaction_items (transaction_id, item_id, quantity, price) VALUES (?, ?, ?, ?)',
                [transactionId, item.id, item.cartQuantity, item.price]
            );

            // Log Activity
            await db.run(
                'INSERT INTO activity_log (type, item_name, quantity_change, timestamp) VALUES (?, ?, ?, ?)',
                ['Sale', item.name, -item.cartQuantity, new Date()]
            );
        }

        await db.exec('COMMIT');
        res.status(201).json({ message: 'Transaction successful', transactionId });

    } catch (err) {
        await db.exec('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// Get All Items
app.get('/api/inventory', async (req, res) => {
    try {
        const items = await db.all('SELECT * FROM items');
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Item
app.post('/api/inventory', async (req, res) => {
    const { name, sku, quantity, price, category } = req.body;
    try {
        const result = await db.run(
            'INSERT INTO items (name, sku, quantity, price, category, last_updated) VALUES (?, ?, ?, ?, ?, ?)',
            [name, sku, quantity, price, category, new Date()]
        );
        // Log Activity
        await db.run(
            'INSERT INTO activity_log (type, item_name, quantity_change, timestamp) VALUES (?, ?, ?, ?)',
            ['New Item', name, quantity, new Date()]
        );

        res.status(201).json({ id: result.lastID, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Item
app.put('/api/inventory/:id', async (req, res) => {
    const { id } = req.params;
    const { name, sku, quantity, price, category } = req.body;

    try {
        // Get old item to compare quantity
        const oldItem = await db.get('SELECT * FROM items WHERE id = ?', id);
        if (!oldItem) return res.status(404).json({ error: 'Item not found' });

        await db.run(
            'UPDATE items SET name = ?, sku = ?, quantity = ?, price = ?, category = ?, last_updated = ? WHERE id = ?',
            [name, sku, quantity, price, category, new Date(), id]
        );

        // Activity Log
        if (quantity !== oldItem.quantity) {
            const type = quantity > oldItem.quantity ? 'Restock' : 'Sale'; // 'Sale' here is manual adjustment, distinct from POS
            const change = Math.abs(quantity - oldItem.quantity);
            await db.run(
                'INSERT INTO activity_log (type, item_name, quantity_change, timestamp) VALUES (?, ?, ?, ?)',
                [type, name, quantity > oldItem.quantity ? change : -change, new Date()]
            );
        }

        res.json({ id, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Item
app.delete('/api/inventory/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const item = await db.get('SELECT name FROM items WHERE id = ?', id);
        await db.run('DELETE FROM items WHERE id = ?', id);

        if (item) {
            await db.run(
                'INSERT INTO activity_log (type, item_name, quantity_change, timestamp) VALUES (?, ?, ?, ?)',
                ['Delete', item.name, 0, new Date()]
            );
        }

        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Categories APIs ---
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await db.all('SELECT * FROM categories');
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/categories', async (req, res) => {
    const { name, color, icon } = req.body;
    try {
        const result = await db.run('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)', [name, color, icon || 'Box']);
        res.status(201).json({ id: result.lastID, name, color, icon });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.run('DELETE FROM categories WHERE id = ?', id);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reset Database
app.post('/api/reset', async (req, res) => {
    try {
        await db.exec('DELETE FROM items');
        await db.exec('DELETE FROM activity_log');
        await db.exec('DELETE FROM transactions');
        await db.exec('DELETE FROM transaction_items');
        await db.exec('DELETE FROM suppliers');
        await db.exec('DELETE FROM users');

        // Optional: Reset sequence counters
        await db.exec('DELETE FROM sqlite_sequence WHERE name="items" OR name="activity_log" OR name="transactions" OR name="transaction_items" OR name="suppliers" OR name="users"');

        res.json({ message: 'Database reset successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dashboard Stats
app.get('/api/dashboard', async (req, res) => {
    try {
        const stats = await db.get(`
      SELECT 
        COUNT(*) as totalItems, 
        SUM(quantity * price) as totalValue,
        SUM(CASE WHEN quantity < 5 THEN 1 ELSE 0 END) as lowStock
      FROM items
    `);

        const activity = await db.all('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 5');

        res.json({ stats, activity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Suppliers APIs ---
app.get('/api/suppliers', async (req, res) => {
    try {
        const suppliers = await db.all('SELECT * FROM suppliers');
        res.json(suppliers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/suppliers', async (req, res) => {
    const { name, contact, email } = req.body;
    try {
        const result = await db.run('INSERT INTO suppliers (name, contact, email) VALUES (?, ?, ?)', [name, contact, email]);
        res.status(201).json({ id: result.lastID, name, contact, email });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/suppliers/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.run('DELETE FROM suppliers WHERE id = ?', id);
        res.json({ message: 'Supplier deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Auth APIs ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (user) {
            const { password, ...userWithoutPass } = user;
            res.json(userWithoutPass);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Analytics: Sales Trends (Last 7 days)
app.get('/api/analytics/sales', async (req, res) => {
    try {
        const sales = await db.all(`
            SELECT 
                date(date / 1000, 'unixepoch', 'localtime') as date, 
                SUM(total) as revenue,
                COUNT(id) as transactions
            FROM transactions 
            WHERE date(date / 1000, 'unixepoch', 'localtime') >= date('now', '-7 days', 'localtime')
            GROUP BY date(date / 1000, 'unixepoch', 'localtime')
            ORDER BY date
        `);
        res.json(sales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Analytics: Top Products
app.get('/api/analytics/top-products', async (req, res) => {
    try {
        const products = await db.all(`
            SELECT 
                i.name, 
                SUM(ti.quantity) as sold
            FROM transaction_items ti
            JOIN items i ON ti.item_id = i.id
            GROUP BY ti.item_id
            ORDER BY sold DESC
            LIMIT 5
        `);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Analytics: Daily Sales Breakdown
app.get('/api/analytics/daily-sales', async (req, res) => {
    try {
        const sales = await db.all(`
            SELECT 
                payment_method,
                SUM(total) as total,
                COUNT(id) as count
            FROM transactions 
            WHERE date(date / 1000, 'unixepoch', 'localtime') = date('now', 'localtime')
            GROUP BY payment_method
        `);
        res.json(sales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Serve Static Frontend (Production) ---
const path = require('path');
// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// For Vercel, we need to export the app
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
