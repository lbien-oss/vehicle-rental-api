require('dotenv').config();
const express = require('express');
const cors = require('cors');


const usersRoutes = require('./backend/users.routes');
const vehiclesRoutes = require('./backend/vechicles.routes');
const vehicleTypesRoutes = require('./backend/vechicleTypes.routes');
const bookingsRoutes = require('./bookings.routes');


const app = express();
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.json({
    message: 'Vehicle Rental Management System API',
    endpoints: ['/api/users', '/api/vehicle-types', '/api/vehicles', '/api/bookings'],
  });
});


app.use('/api/users', usersRoutes);
app.use('/api/vehicle-types', vehicleTypesRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/bookings', bookingsRoutes);


app.use((req, res) => res.status(404).json({ error: 'Route not found' }));


app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Duplicate value', detail: err.sqlMessage });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'Referenced record does not exist', detail: err.sqlMessage });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ error: 'Record is still referenced by other records', detail: err.sqlMessage });
  }
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));