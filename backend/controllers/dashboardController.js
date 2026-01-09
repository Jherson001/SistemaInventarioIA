const db = require("../config/db");

const DashboardController = {
  async getStats(req, res, next) {
    try {
      // 1. Ventas de HOY
      const todayStats = await db.query(`
        SELECT IFNULL(SUM(grand_total), 0) as total_money, COUNT(id) as total_count
        FROM sales 
        WHERE DATE(sold_at) = CURDATE() AND status = 'CONFIRMED'
      `);

      // 2. Ventas del MES
      const monthStats = await db.query(`
        SELECT IFNULL(SUM(grand_total), 0) as total_money
        FROM sales 
        WHERE MONTH(sold_at) = MONTH(CURDATE()) 
        AND YEAR(sold_at) = YEAR(CURDATE()) 
        AND status = 'CONFIRMED'
      `);

      // 3. Productos activos
      const productStats = await db.query(`SELECT COUNT(id) as total FROM products WHERE is_active = 1`);

      // 4. Gráfico de tendencia - SOLUCIÓN DEFINITIVA PARA MYSQL 8
      // Agrupamos por la fecha real y por el formato para que no haya ambigüedad
      const chartStats = await db.query(`
        SELECT DATE_FORMAT(sold_at, '%d/%m') as date, SUM(grand_total) as total
        FROM sales 
        WHERE status = 'CONFIRMED'
        GROUP BY DATE(sold_at), DATE_FORMAT(sold_at, '%d/%m')
        ORDER BY DATE(sold_at) ASC 
        LIMIT 7
      `);

      // 5. Top 5 Productos - SOLUCIÓN DEFINITIVA PARA MYSQL 8
      // Incluimos p.name en el GROUP BY para cumplir con la regla strict
      const topProductsStats = await db.query(`
        SELECT p.name, SUM(si.quantity) as quantity
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.status = 'CONFIRMED'
        GROUP BY p.id, p.name
        ORDER BY quantity DESC
        LIMIT 5
      `);

      res.json({
        today: todayStats[0] || { total_money: 0, total_count: 0 },
        month: monthStats[0] || { total_money: 0 },
        products: productStats[0]?.total || 0,
        chart: chartStats || [],
        topProducts: topProductsStats || []
      });

    } catch (err) {
      console.error("❌ Error Dashboard:", err);
      next(err);
    }
  },

  async getLowRotation(req, res, next) {
    try {
      const sql = `
        SELECT 
          p.id as product_id, 
          p.sku as product_sku, 
          p.name as product_name, 
          0.85 as score, 
          'low_rotation' as label, 
          'Sin ventas recientes' as reason, 
          DATEDIFF(NOW(), p.created_at) as days_since_last_sale, 
          p.stock as days_of_inventory, 
          0 as weekly_90 
        FROM products p 
        WHERE p.stock > 0 LIMIT 10
      `;
      const results = await db.query(sql);
      res.json({ rows: results });
    } catch (err) { next(err); }
  },

  async postFeedback(req, res, next) {
    try {
      const { id } = req.params;
      const { is_correct, note } = req.body;
      await db.query(`INSERT INTO low_rotation_feedback (product_id, is_correct, note) VALUES (?, ?, ?)`, [id, is_correct ? 1 : 0, note || '']);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Error interno" });
    }
  }
};

module.exports = DashboardController;