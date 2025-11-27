const db = require("../config/db");

// 1. Función para el Semáforo de Stock
exports.stockHealth = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.id AS product_id,
        p.sku,
        p.name,
        p.stock,
        p.lead_time_days,
        CASE 
            WHEN p.stock = 0 THEN 'Agotado'
            WHEN p.stock <= p.min_stock THEN 'Bajo Stock'
            ELSE 'Normal'
        END AS stock_status,
        0 AS days_of_cover
      FROM products p
    `);

    res.json(rows);
  } catch (error) {
    console.log("Error en stockHealth:", error);
    res.status(500).json({ error: "Error obteniendo stock health" });
  }
};

// 2. Función para la Lista de Reposición Sugerida
exports.reorderList = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.id AS product_id,
        p.sku,
        p.name,
        p.stock,
        0 AS avg_daily_sales,
        p.lead_time_days,
        (p.min_stock - p.stock) AS suggested_qty
      FROM products p
      WHERE p.stock < p.min_stock
    `);

    res.json(rows);
  } catch (error) {
    console.log("Error en reorderList:", error);
    res.status(500).json({ error: "Error obteniendo reorder list" });
  }
};