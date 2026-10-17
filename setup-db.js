require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');


(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true,
    connectTimeout: 60000,
  });


  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await conn.query(sql);


  const [rows] = await conn.query('SHOW TABLES FROM vehicle_rental_db');
  console.log('Tables created:', rows.map(r => Object.values(r)[0]));
  
  await conn.end();
})().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});