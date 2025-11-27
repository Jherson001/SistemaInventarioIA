const express = require("express");
const router = express.Router();
const mysql = require("mysql2/promise");
require('dotenv').config(); // Aseguramos que lea las variables de entorno

// Configuración de conexión
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'inventorydb'
};

// 1. RUTA LEER DATOS (GET)
router.get("/low-rotation", async (req, res) => {
  const { min_score = 0.6, limit = 100 } = req.query;
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.query(`
      SELECT t.*
      FROM low_rotation_flags t
      JOIN (
        SELECT product_id, MAX(flagged_at) AS max_date
        FROM low_rotation_flags
        GROUP BY product_id
      ) last ON t.product_id = last.product_id AND t.flagged_at = last.max_date
      WHERE t.score >= ?
      ORDER BY t.score DESC
      LIMIT ?
    `, [Number(min_score), Number(limit)]);
    res.json({ rows });
  } catch (e) {
    console.error("Error en GET low-rotation:", e);
    res.status(500).json({ error: e.message });
  } finally {
    if (conn) await conn.end();
  }
});

// 2. RUTA GUARDAR FEEDBACK (POST) - Botones Promo/OK/X
router.post("/low-rotation/:id/feedback", async (req, res) => {
  const { id } = req.params;
  const { is_correct, note } = req.body;
  let conn;

  try {
    conn = await mysql.createConnection(dbConfig);
    
    // Guardamos el feedback en la última alerta generada para este producto
    await conn.query(`
      UPDATE low_rotation_flags 
      SET admin_feedback = ?, is_reviewed = 1 
      WHERE product_id = ? 
      ORDER BY flagged_at DESC LIMIT 1
    `, [note || (is_correct ? 'CORRECTO' : 'INCORRECTO'), id]);

    res.json({ ok: true });
  } catch (e) {
    console.error("Error en POST feedback:", e);
    res.status(500).json({ error: e.message });
  } finally {
    if (conn) await conn.end();
  }
});

module.exports = router;