const mysql = require('mysql2');
const util = require('util');

// Configuración leída desde las variables de entorno de Render
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 23280,
  ssl: {
    rejectUnauthorized: false // Vital para Aiven
  },
  connectionLimit: 10
};

// Log de diagnóstico para Render
console.log('--- Diagnóstico de Conexión ---');
console.log('Host:', dbConfig.host);
console.log('Usuario:', dbConfig.user);
console.log('Puerto:', dbConfig.port);
console.log('Password cargado:', dbConfig.password ? 'SI (largo: ' + dbConfig.password.length + ')' : 'NO');
console.log('-------------------------------');

// 1. Crear el pool (UNA SOLA VEZ)
const pool = mysql.createPool(dbConfig);

// 2. LA MAGIA: Desactivar ONLY_FULL_GROUP_BY para cada nueva conexión
pool.on('connection', (connection) => {
    connection.query("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
});

// 3. Promisificar para usar async/await
const query = util.promisify(pool.query).bind(pool);

function getConnection() {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
  });
}

// 4. Función de prueba inicial
async function testConnection() {
  try {
    // Probamos la conexión y el ajuste de sql_mode
    await query("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
    const rows = await query('SELECT 1 + 1 AS result');
    console.log('✅ Conexión exitosa a Aiven MySQL y SQL_MODE ajustado');
  } catch (err) {
    console.error('❌ Error crítico en testConnection:', err.message);
  }
}

module.exports = { pool, query, getConnection, testConnection };