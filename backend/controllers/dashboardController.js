// backend/controllers/dashboardController.js
const db = require("../config/db");

const DashboardController = {
  async getStats(req, res, next) {
    try {
      const fechaHoy = new Date().toLocaleDateString('en-CA');
      const todayStats = await db.query(`
        SELECT IFNULL(SUM(grand_total), 0) as total_money, COUNT(id) as total_count
        FROM sales WHERE sold_at LIKE '${fechaHoy}%' AND status = 'CONFIRMED'
      `);
      const mesActual = fechaHoy.substring(0, 7);
      const monthStats = await db.query(`
        SELECT IFNULL(SUM(grand_total), 0) as total_money
        FROM sales WHERE sold_at LIKE '${mesActual}%' AND status = 'CONFIRMED'
      `);
      const productStats = await db.query(`SELECT COUNT(id) as total FROM products WHERE is_active = 1`);
      const chartStats = await db.query(`
        SELECT ANY_VALUE(DATE_FORMAT(sold_at, '%d/%m')) as date, SUM(grand_total) as total
        FROM sales WHERE status = 'CONFIRMED'
        GROUP BY DATE(sold_at) 
        ORDER BY DATE(sold_at) DESC LIMIT 7
      `);
      const topProductsStats = await db.query(`
        SELECT ANY_VALUE(p.name) as name, SUM(si.quantity) as quantity
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.status = 'CONFIRMED'
        GROUP BY p.id
        ORDER BY quantity DESC LIMIT 5
      `);

      res.json({
        today: todayStats[0] || { total_money: 0, total_count: 0 },
        month: monthStats[0] || { total_money: 0 },
        products: productStats[0] ? productStats[0].total : 0,
        chart: (chartStats || []).reverse(),
        topProducts: topProductsStats || []
      });
    } catch (err) { next(err); }
  },

  async getLowRotation(req, res, next) {
    try {
      const sql = `
        SELECT 
          p.id as product_id,
          p.sku as product_sku, 
          p.name as product_name, 
          0.850 as score, 
          'low_rotation' as label,
          'Sin ventas en 15 días' as reason,
          DATEDIFF(NOW(), IFNULL(MAX(s.sold_at), p.created_at)) as days_since_last_sale,
          p.stock as days_of_inventory,
          0 as weekly_90
        FROM products p
        LEFT JOIN sale_items si ON p.id = si.product_id
        LEFT JOIN sales s ON si.sale_id = s.id
        WHERE p.is_active = 1 AND p.stock > 0
        GROUP BY p.id
        HAVING days_since_last_sale > 15 OR MAX(s.sold_at) IS NULL
        ORDER BY days_since_last_sale DESC
        LIMIT 20
      `;
      const results = await db.query(sql);
      res.json({ rows: results }); // Formato correcto para el Frontend
    } catch (err) {
      next(err);
    }
  }
};

module.exports = DashboardController;