const mysql = require('mysql2');
const util = require('util');

const useSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'inventorydb',
  port: Number(process.env.DB_PORT) || 3306,
  connectionLimit: 10,
};

if (useSsl) {
  dbConfig.ssl = { rejectUnauthorized: false };
}

console.log('--- Diagnóstico de Conexión ---');
console.log('Host:', dbConfig.host);
console.log('Usuario:', dbConfig.user);
console.log('Puerto:', dbConfig.port);
console.log('SSL:', useSsl ? 'SI' : 'NO');
console.log('Password cargado:', dbConfig.password ? 'SI (largo: ' + dbConfig.password.length + ')' : 'NO');
console.log('-------------------------------');

const pool = mysql.createPool(dbConfig);

pool.on('connection', (connection) => {
  connection.query("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
});

const query = util.promisify(pool.query).bind(pool);

function getConnection() {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
  });
}

async function testConnection() {
  try {
    await query("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
    await query('SELECT 1 + 1 AS result');
    console.log('✅ Conexión exitosa a MySQL y SQL_MODE ajustado');
  } catch (err) {
    console.error('❌ Error crítico en testConnection:', err.message);
  }
}

module.exports = { pool, query, getConnection, testConnection };
