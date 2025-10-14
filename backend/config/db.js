// backend/config/db.js
const mysql = require('mysql');
const util = require('util');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'inventorydb',
  multipleStatements: false
});

// Verifica que el pool se crea sin errores
pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ Error creando el pool MySQL:', err.code || err.message);
    return;
  }
  conn.release();
});

const query = util.promisify(pool.query).bind(pool);

// 👉 NUEVO: helper para obtener una conexión del pool (para transacciones)
function getConnection() {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
  });
}

async function testConnection() {
  const rows2 = await query('SELECT DATABASE() AS db');
  console.log('📦 DB seleccionada:', rows2[0]?.db || '(ninguna)');
}

module.exports = { pool, query, getConnection, testConnection };