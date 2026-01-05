const db = require("../config/db");

// 1. Semáforo
exports.stockHealth = async (req, res) => {
  try {
    // CORREGIDO: Quitamos los corchetes [] para recibir TODA la lista
    const rows = await db.query(`
      SELECT 
        p.id AS product_id,
        p.sku,
        p.name,
        COALESCE(v.current_stock, 0) AS stock,
        p.lead_time_days,
        CASE 
            WHEN COALESCE(v.current_stock, 0) <= 0 THEN 'Agotado'
            WHEN COALESCE(v.current_stock, 0) <= p.min_stock THEN 'Bajo Stock'
            ELSE 'Normal'
        END AS stock_status,
        0 AS days_of_cover
      FROM products p
      LEFT JOIN vw_stock_current v ON p.id = v.product_id
    `);
    
    res.json(rows);
  } catch (error) {
    console.error("Error stockHealth:", error);
    res.status(500).json({ error: error.message });
  }
};

// 2. Lista de Reposición
exports.reorderList = async (req, res) => {
  try {
    // CORREGIDO: Quitamos los corchetes [] aquí también
    const rows = await db.query(`
      SELECT 
        p.id AS product_id,
        p.sku,
        p.name,
        COALESCE(v.current_stock, 0) AS stock,
        0 AS avg_daily_sales,
        p.lead_time_days,
        (p.min_stock - COALESCE(v.current_stock, 0)) AS suggested_qty
      FROM products p
      LEFT JOIN vw_stock_current v ON p.id = v.product_id
      WHERE COALESCE(v.current_stock, 0) < p.min_stock
    `);
    
    // Ahora sí mostrará el número correcto en la terminal
    console.log("📢 REPORTE GENERADO. CANTIDAD DE PRODUCTOS:", rows.length);
    console.log("📦 Detalle:", rows);
    
    res.json(rows);
  } catch (error) {
    console.error("Error reorderList:", error);
    res.status(500).json({ error: error.message });
  }
};