const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');

const router = express.Router();

const SAFE_COLUMNS =
  'customer_id, first_name, last_name, email, phone, address, city, status, license_number, is_verified, created_at';

// LOGIN  ->  POST /api/users/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const [rows] = await pool.query(
      'SELECT customer_id, first_name, last_name, email, status, password_hash FROM Customer WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const customer = rows[0];
    const match = await bcrypt.compare(password, customer.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      customer: {
        customer_id: customer.customer_id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        status: customer.status
      }
    });
  } catch (err) { next(err); }
});

// GET ALL  ->  GET /api/users
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT ${SAFE_COLUMNS} FROM Customer ORDER BY customer_id`);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET BY ID  ->  GET /api/users/:id
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

// REGISTER / CREATE  ->  POST /api/users
router.post('/', async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, address, city, status, license_number, password } = req.body;
    if (!first_name || !last_name || !email || !phone || !password) {
      return res.status(400).json({ error: 'first_name, last_name, email, phone and password are required' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO Customer (first_name, last_name, email, phone, address, city, status, license_number, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, phone, address || null, city || null,
       status || 'Active', license_number || null, password_hash]
    );
    res.status(201).json({ message: 'Customer created', customer_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    next(err);
  }
});

// UPDATE  ->  PUT /api/users/:id
router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['first_name', 'last_name', 'email', 'phone', 'address', 'city',
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
      return res.status(409).json({ error: 'Email already registered' });
    }
    next(err);
  }
});

// DELETE  ->  DELETE /api/users/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM Customer WHERE customer_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (err) { next(err); }
});

module.exports = router;