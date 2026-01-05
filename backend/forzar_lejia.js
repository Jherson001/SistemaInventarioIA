// backend/forzar_lejia.js
const db = require('./config/db');

async function forzarCambio() {
  console.log("🔌 Conectando a la base de datos...");

  try {
    // 1. Verificamos cómo está ahora
    const [antes] = await db.query("SELECT sku, stock, min_stock FROM products WHERE sku LIKE '%LEJIA%'");
    console.log("❌ ANTES DEL CAMBIO:", antes);

    // 2. Ejecutamos el cambio (Usamos LIKE por si hay espacios invisibles)
    console.log("🛠️  Actualizando min_stock a 30...");
    await db.query("UPDATE products SET min_stock = 30 WHERE sku LIKE '%LEJIA%'");

    // 3. Verificamos cómo quedó
    const [despues] = await db.query("SELECT sku, stock, min_stock FROM products WHERE sku LIKE '%LEJIA%'");
    console.log("✅ DESPUÉS DEL CAMBIO:", despues);

    console.log("Listo. Si ahora dice 'min_stock: 30', ya saldrá en la lista.");
    process.exit(0);

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

forzarCambio();