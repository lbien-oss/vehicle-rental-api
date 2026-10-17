const express = require('express');
const pool = require('../db');

const router = express.Router();

const SELECT_WITH_TYPE = `
  SELECT v.*, t.type_name, t.daily_rate, t.seating_capacity,
         b.branch_name
  FROM Vehicle v
  JOIN VehicleType t ON v.type_id = t.type_id
  LEFT JOIN Branch b ON v.branch_id = b.branch_id`;

router.get('/', async (req, res, next) => {
  try {
    let sql = SELECT_WITH_TYPE;
    const params = [];
    if (req.query.status) {
      sql += ' WHERE v.status = ?';
      params.push(req.query.status);
    }
    sql += ' ORDER BY v.vehicle_id';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `${SELECT_WITH_TYPE} WHERE v.vehicle_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { plate_number, brand, model, year, color, mileage, status, type_id, branch_id } = req.body;
    if (!plate_number || !brand || !model || !year || !type_id) {
      return res.status(400).json({ error: 'plate_number, brand, model, year and type_id are required' });
    }
    const [result] = await pool.query(
      `INSERT INTO Vehicle (plate_number, brand, model, year, color, mileage, status, type_id, branch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [plate_number, brand, model, year, color || null, mileage || 0,
       status || 'Available', type_id, branch_id || null]
    );
    res.status(201).json({ message: 'Vehicle created', vehicle_id: result.insertId });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['plate_number', 'brand', 'model', 'year', 'color', 'mileage',
                     'status', 'type_id', 'branch_id'];
    const fields = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) { fields.push(`${key} = ?`); values.push(req.body[key]); }
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE Vehicle SET ${fields.join(', ')} WHERE vehicle_id = ?`,
      values
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Vehicle updated' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM Vehicle WHERE vehicle_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) { next(err); }
});

module.exports = router;