// Cargar .env del backend (IMPORTANTE: antes de leer process.env)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mysql = require("mysql2/promise");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const {
  DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME,
  AI_URL = "http://localhost:9000",
  AI_TIMEOUT_MS = 10000
} = process.env;

// ✅ Función fetchFeatures modificada con vw_stock_current
async function fetchFeatures(conn) {
  const [rows] = await conn.query(`
    SELECT
      p.id AS product_id,
      v.stock, p.price, p.category_id AS category,

      COALESCE(SUM(CASE WHEN s.created_at >= NOW() - INTERVAL 7 DAY  THEN si.quantity END), 0) AS sales_7d,
      COALESCE(SUM(CASE WHEN s.created_at >= NOW() - INTERVAL 30 DAY THEN si.quantity END), 0) AS sales_30d,
      COALESCE(SUM(CASE WHEN s.created_at >= NOW() - INTERVAL 90 DAY THEN si.quantity END), 0) AS sales_90d,
      COALESCE(DATEDIFF(NOW(), MAX(s.created_at)), 9999) AS days_since_last_sale
    FROM products p
    JOIN vw_stock_current v ON v.product_id = p.id
    LEFT JOIN sale_items si ON si.product_id = p.id
    LEFT JOIN sales s ON s.id = si.sale_id
    GROUP BY p.id, v.stock, p.price, p.category_id
  `);
  return rows;
}

async function savePredictions(conn, runId, preds) {
  if (!preds.length) return;
  const values = preds.map(p => [
    p.product_id, p.score, p.label, p.reason || null, p.used || 'rules',
    p.weekly_90 ?? null, p.days_since_last_sale ?? null, p.days_of_inventory ?? null,
    runId
  ]);
  await conn.query(`
    INSERT INTO low_rotation_flags
      (product_id, score, label, reason, used, weekly_90, days_since_last_sale, days_of_inventory, run_id)
    VALUES ?
  `, [values]);
}

async function callAI(products) {
  console.log(`[AI MOCK] simulando predicciones para ${products.length} productos`);
  return {
    predictions: products.map(p => ({
      product_id: p.product_id,
      score: Math.random(),
      label: Math.random() > 0.5 ? 'LOW' : 'NORMAL',
      reason: 'Simulación local'
    }))
  };
}


async function runOnce() {
  const runId = uuidv4().slice(0, 8);
  const conn = await mysql.createConnection({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASS, database: DB_NAME
  });

  try {
    const features = await fetchFeatures(conn);
    const { predictions } = await callAI(features);
    await savePredictions(conn, runId, predictions);
    console.log(`[AI][${runId}] guardadas ${predictions.length} predicciones`);
  } catch (error) {
    console.error('LowRotation job error:', error.message);
    console.error(error.stack);
  } finally {
    await conn.end();
  }
}

if (require.main === module) runOnce();
module.exports = { runOnce };
