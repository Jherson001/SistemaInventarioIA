const db = require("../config/db");

const DashboardController = {
  async getStats(req, res, next) {
    try {
      // Formato YYYY-MM-DD
      const fechaHoy = new Date().toLocaleDateString('en-CA');

      // 1. Ventas de HOY
      const todayStats = await db.query(`
        SELECT IFNULL(SUM(grand_total), 0) as total_money, COUNT(id) as total_count
        FROM sales WHERE sold_at LIKE '${fechaHoy}%' AND status = 'CONFIRMED'
      `);

      // 2. Ventas del MES
      const mesActual = fechaHoy.substring(0, 7);
      const monthStats = await db.query(`
        SELECT IFNULL(SUM(grand_total), 0) as total_money
        FROM sales WHERE sold_at LIKE '${mesActual}%' AND status = 'CONFIRMED'
      `);

      // 3. Productos activos
      const productStats = await db.query(`SELECT COUNT(id) as total FROM products WHERE is_active = 1`);

      // 4. Gráfico (CORREGIDO PARA MYSQL 8)
      const chartStats = await db.query(`
        SELECT ANY_VALUE(DATE_FORMAT(sold_at, '%d/%m')) as date, SUM(grand_total) as total
        FROM sales WHERE status = 'CONFIRMED'
        GROUP BY DATE(sold_at) 
        ORDER BY DATE(sold_at) DESC LIMIT 7
      `);

      // 5. Top 5 Productos (Asegurado para MySQL 8)
      const topProductsStats = await db.query(`
        SELECT 
            ANY_VALUE(p.name) as name, 
            SUM(si.quantity) as quantity
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.status = 'CONFIRMED'
        GROUP BY p.id
        ORDER BY quantity DESC
        LIMIT 5
      `);

      // --- Procesamiento de resultados ---
      // IMPORTANTE: db.query en mysql2 suele devolver [rows, fields]. 
      // Si tu db.js ya devuelve solo las filas (promisified), lo dejamos así:
      const rowsToday = todayStats[0] || todayStats; 
      const rowsMonth = monthStats[0] || monthStats;
      const rowsProducts = productStats[0] || productStats;
      const rowsChart = chartStats[0] || chartStats;
      const rowsTop = topProductsStats[0] || topProductsStats;

      res.json({
        today: Array.isArray(rowsToday) ? rowsToday[0] : rowsToday,
        month: Array.isArray(rowsMonth) ? rowsMonth[0] : rowsMonth,
        products: Array.isArray(rowsProducts) ? rowsProducts[0].total : rowsProducts.total,
        chart: Array.isArray(rowsChart) ? rowsChart.reverse() : [],
        topProducts: Array.isArray(rowsTop) ? rowsTop : []
      });

    } catch (err) {
      console.error("❌ Error Dashboard:", err);
      next(err);
    }
  }
};

module.exports = DashboardController;