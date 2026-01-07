const mysql = require('mysql2');
const util = require('util');

// NO usamos dotenv.config() aquí, Render ya las tiene en process.env

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS, // <--- Render tiene DB_PASS, esto es correcto
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 23280, // Forzamos que sea un número
  ssl: {
    rejectUnauthorized: false // Vital para Aiven
  },
  connectionLimit: 10
};

// Log de diagnóstico (seguro, no muestra la clave completa)
console.log('--- Diagnóstico de Conexión ---');
console.log('Host:', dbConfig.host);
console.log('Usuario:', dbConfig.user);
console.log('Puerto:', dbConfig.port);
console.log('Password cargado:', dbConfig.password ? 'SI (largo: ' + dbConfig.password.length + ')' : 'NO');
console.log('-------------------------------');

const pool = mysql.createPool(dbConfig);
const query = util.promisify(pool.query).bind(pool);

function getConnection() {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
  });
}

// ... (mismo código de arriba del pool)

async function testConnection() {
  try {
    // ESTA LÍNEA ES LA MAGIA: Desactiva el modo estricto para esta sesión
    await query("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
    
    const rows = await query('SELECT 1 + 1 AS result');
    console.log('✅ Conexión exitosa a Aiven MySQL y SQL_MODE ajustado');
  } catch (err) {
    console.error('❌ Error crítico en testConnection:', err.message);
  }
}
module.exports = { pool, query, getConnection, testConnection };