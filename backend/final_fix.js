// backend/final_fix.js
const db = require('./config/db'); // Esta ruta funciona si ejecutas desde la carpeta 'backend'

async function repararVista() {
  console.log("🔌 Conectando a la base de datos...");

  // Definimos la vista con el nombre EXACTO 'current_stock' y la lógica de SUMA
  const sql = `
    CREATE VIEW vw_stock_current AS
    SELECT 
        product_id, 
        SUM(
            CASE 
                WHEN move_type = 'IN' THEN quantity 
                WHEN move_type = 'ADJUST' THEN quantity 
                ELSE -quantity 
            END
        ) AS current_stock 
    FROM stock_moves
    GROUP BY product_id;
  `;

  try {
    console.log("1️⃣ Borrando vista obsoleta...");
    await db.query("DROP VIEW IF EXISTS vw_stock_current");

    console.log("2️⃣ Creando vista nueva con columna 'current_stock'...");
    await db.query(sql);

    console.log("✅ ¡ÉXITO TOTAL! La base de datos ahora coincide con el código.");
    process.exit(0);

  } catch (error) {
    console.error("❌ ERROR:", error);
    process.exit(1);
  }
}

repararVista();