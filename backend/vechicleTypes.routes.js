const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM VehicleType ORDER BY type_id');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM VehicleType WHERE type_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Vehicle type not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { type_name, description, daily_rate, weekly_rate, seating_capacity, has_aircon } = req.body;
    if (!type_name || daily_rate === undefined || seating_capacity === undefined) {
      return res.status(400).json({ error: 'type_name, daily_rate and seating_capacity are required' });
    }
    const [result] = await pool.query(
      `INSERT INTO VehicleType (type_name, description, daily_rate, weekly_rate, seating_capacity, has_aircon)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [type_name, description || null, daily_rate, weekly_rate || null, seating_capacity,
       has_aircon !== undefined ? has_aircon : 1]
    );
    res.status(201).json({ message: 'Vehicle type created', type_id: result.insertId });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['type_name', 'description', 'daily_rate', 'weekly_rate', 'seating_capacity', 'has_aircon'];
    const fields = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) { fields.push(`${key} = ?`); values.push(req.body[key]); }
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE VehicleType SET ${fields.join(', ')} WHERE type_id = ?`,
      values
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vehicle type not found' });
    res.json({ message: 'Vehicle type updated' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM VehicleType WHERE type_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vehicle type not found' });
    res.json({ message: 'Vehicle type deleted' });
  } catch (err) { next(err); }
});

module.exports = router;