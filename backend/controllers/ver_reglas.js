// backend/ver_reglas.js
const db = require('./config/db');

async function verReglas() {
  console.log("🕵️‍♂️ REVISANDO POR QUÉ SALEN BAJO STOCK...");
  console.log("-------------------------------------------------------");
  console.log("PRODUCTO          |  TIENES  |  TU MÍNIMO  |  ¿ES BAJO?");
  console.log("-------------------------------------------------------");

  const sql = `
    SELECT 
        p.name, 
        COALESCE(v.current_stock, 0) as stock_real,
        p.min_stock,
        CASE 
            WHEN COALESCE(v.current_stock, 0) <= p.min_stock THEN 'SI ⚠️'
            ELSE 'NO ✅'
        END as veredicto
    FROM products p
    LEFT JOIN vw_stock_current v ON p.id = v.product_id
    WHERE COALESCE(v.current_stock, 0) <= p.min_stock AND COALESCE(v.current_stock, 0) > 0
    LIMIT 10;
  `;

  try {
    const rows = await db.query(sql);
    // Imprimimos una tabla bonita
    rows.forEach(r => {
        console.log(`${r.name.padEnd(18)} |    ${String(r.stock_real).padEnd(4)}  |      ${String(r.min_stock).padEnd(5)}    |   ${r.veredicto}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verReglas();