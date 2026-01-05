// backend/diagnostico.js
const db = require('./config/db');

async function diagnosticar() {
  console.log("🏥 INICIANDO DIAGNÓSTICO DE LEJÍA...");

  // Esta es la consulta EXACTA que debería hacer el controlador
  const sql = `
    SELECT 
        p.sku, 
        p.name, 
        COALESCE(v.current_stock, 0) as stock_real,
        p.min_stock,
        (p.min_stock - COALESCE(v.current_stock, 0)) as faltante,
        CASE 
            WHEN COALESCE(v.current_stock, 0) < p.min_stock THEN '✅ SÍ, DEBE SALIR EN LA LISTA'
            ELSE '❌ NO, EL SISTEMA LA OCULTA'
        END as veredicto
    FROM products p
    LEFT JOIN vw_stock_current v ON p.id = v.product_id
    WHERE p.sku LIKE '%LEJIA%';
  `;

  try {
    const [rows] = await db.query(sql);
    console.table(rows);
    console.log("Si la columna 'veredicto' dice ✅, el problema es 100% el archivo del controlador.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

diagnosticar();