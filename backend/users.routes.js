const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');

const router = express.Router();

const SAFE_COLUMNS =
  'customer_id, username, first_name, last_name, email, phone, address, city, status, license_number, is_verified, created_at';

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const [rows] = await pool.query(
      'SELECT customer_id, username, first_name, last_name, email, status, password_hash FROM Customer WHERE username = ?',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const customer = rows[0];
    const match = await bcrypt.compare(password, customer.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        sub: customer.customer_id,
        username: customer.username,
        name: customer.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      access_token: token,
      customer: {
        customer_id: customer.customer_id,
        username: customer.username,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        status: customer.status
      }
    });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT ${SAFE_COLUMNS} FROM Customer ORDER BY customer_id`);
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM Customer WHERE customer_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// Register: username and password are required, everything else is optional.
// Works for both POST /  and  POST /register
router.post(['/', '/register'], async (req, res, next) => {
  try {
    const { username, password, first_name, last_name, email, phone,
            address, city, status, license_number } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const [existing] = await pool.query(
      'SELECT customer_id FROM Customer WHERE username = ?',
      [username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO Customer (username, first_name, last_name, email, phone, address, city, status, license_number, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, first_name || null, last_name || null, email || null, phone || null,
       address || null, city || null, status || 'Active', license_number || null, password_hash]
    );
    res.status(201).json({ message: 'Customer created', customer_id: result.insertId, username });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already registered' });
    }
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['username', 'first_name', 'last_name', 'email', 'phone', 'address', 'city',
                     'status', 'license_number', 'is_verified'];
    const fields = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) { fields.push(`${key} = ?`); values.push(req.body[key]); }
    }
    if (req.body.password) {
      fields.push('password_hash = ?');
      values.push(await bcrypt.hash(req.body.password, 10));
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE Customer SET ${fields.join(', ')} WHERE customer_id = ?`,
      values
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already registered' });
    }
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM Customer WHERE customer_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (err) { next(err); }
});

module.exports = router;