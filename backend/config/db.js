const mysql = require('mysql2');
const util = require('util');
const dotenv = require('dotenv');

dotenv.config();

// 1. Crear el pool primero
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false // REQUERIDO PARA AIVEN
  },
  multipleStatements: false
});

// 2. Después de crear el pool, definimos query usando promisify
// Usamos util.promisify para mantener compatibilidad con tu código actual
const query = util.promisify(pool.query).bind(pool);

// Verifica la conexión inicial
pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ Error creando el pool MySQL:', err.code || err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('👉 REVISA: El usuario o la contraseña (DB_PASS) en Render son incorrectos.');
    }
    return;
  }
  console.log('✅ Conexión al pool de MySQL establecida correctamente.');
  conn.release();
});

// Helper para obtener conexión (transacciones)
function getConnection() {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
  });
}

// Función de prueba para el inicio del servidor
async function testConnection() {
  try {
    const rows = await query('SELECT DATABASE() AS db');
    console.log('📦 DB en la nube seleccionada:', rows[0]?.db || '(ninguna)');
  } catch (error) {
    console.error('❌ Fallo en testConnection:', error.message);
  }
}

module.exports = { pool, query, getConnection, testConnection };