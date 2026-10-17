const express = require('express');
const pool = require('./db');

const router = express.Router();

const SELECT_FULL = `
  SELECT b.*, CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
         v.plate_number, v.brand, v.model,
         CONCAT(s.first_name, ' ', s.last_name) AS staff_name
  FROM Booking b
  JOIN Customer c ON b.customer_id = c.customer_id
  JOIN Vehicle v  ON b.vehicle_id = v.vehicle_id
  LEFT JOIN Staff s ON b.staff_id = s.staff_id
`;

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${SELECT_FULL} ORDER BY b.booking_id`);
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${SELECT_FULL} WHERE b.booking_id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { customer_id, vehicle_id, staff_id, pickup_date, return_date,
            pickup_location, return_location, total_amount, notes } = req.body;

    if (!customer_id || !vehicle_id || !pickup_date || !return_date || total_amount === undefined) {
      return res.status(400).json({
        error: 'customer_id, vehicle_id, pickup_date, return_date and total_amount are required'
      });
    }

    if (new Date(return_date) <= new Date(pickup_date)) {
      return res.status(400).json({ error: 'return_date must be after pickup_date' });
    }

    const [conflicts] = await pool.query(
      `SELECT booking_id FROM Booking
       WHERE vehicle_id = ? AND status IN ('Pending', 'Confirmed')
       AND pickup_date < ? AND return_date > ?`,
      [vehicle_id, return_date, pickup_date]
    );

    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'Vehicle is already booked for the selected dates' });
    }

    const [result] = await pool.query(
      `INSERT INTO Booking (customer_id, vehicle_id, staff_id, pickup_date, return_date,
                            pickup_location, return_location, total_amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, vehicle_id, staff_id || null, pickup_date, return_date,
       pickup_location || null, return_location || null, total_amount, notes || null]
    );
    res.status(201).json({ message: 'Booking created', booking_id: result.insertId });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['staff_id', 'pickup_date', 'return_date', 'pickup_location',
                     'return_location', 'total_amount', 'status', 'notes'];
    const fields = [];
    const values = [];

    for (const key of allowed) {
      if (req.body[key] !== undefined) { fields.push(`${key} = ?`); values.push(req.body[key]); }
    }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE Booking SET ${fields.join(', ')} WHERE booking_id = ?`,
      values
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking updated' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM Booking WHERE booking_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking deleted' });
  } catch (err) { next(err); }
});

module.exports = router;