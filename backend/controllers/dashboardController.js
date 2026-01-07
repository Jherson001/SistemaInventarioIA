const db = require("../config/db");

const DashboardController = {
  async getStats(req, res, next) {
    try {
      const fechaHoy = new Date().toLocaleDateString('en-CA'); // Formato YYYY-MM-DD

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

      // 4. Gráfico - CORREGIDO CON ANY_VALUE PARA MYSQL 8
      const chartStats = await db.query(`
        SELECT ANY_VALUE(DATE_FORMAT(sold_at, '%d/%m')) as date, SUM(grand_total) as total
        FROM sales WHERE status = 'CONFIRMED'
        GROUP BY DATE(sold_at) 
        ORDER BY DATE(sold_at) DESC LIMIT 7
      `);

      // 5. Top 5 Productos - CORREGIDO CON ANY_VALUE
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
      // Como usas util.promisify, los resultados son directamente los arrays
      const todayData = todayStats[0] || { total_money: 0, total_count: 0 };
      const monthData = monthStats[0] || { total_money: 0 };
      const productsCount = productStats[0] ? productStats[0].total : 0;
      
      let chartData = [];
      if (Array.isArray(chartStats)) {
        chartData = [...chartStats].reverse(); // Invertir para orden cronológico
      }

      res.json({
        today: todayData,
        month: monthData,
        products: productsCount,
        chart: chartData,
        topProducts: topProductsStats || []
      });

    } catch (err) {
      console.error("❌ Error Dashboard:", err);
      next(err);
    }
  }
};

module.exports = DashboardController;