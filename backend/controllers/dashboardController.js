const db = require("../config/db");

const DashboardController = {
  async getStats(req, res, next) {
    try {
      const todayStats = await db.query(`SELECT IFNULL(SUM(grand_total), 0) as total_money, COUNT(id) as total_count FROM sales WHERE DATE(sold_at) = CURDATE() AND status = 'CONFIRMED'`);
      const monthStats = await db.query(`SELECT IFNULL(SUM(grand_total), 0) as total_money FROM sales WHERE MONTH(sold_at) = MONTH(CURDATE()) AND YEAR(sold_at) = YEAR(CURDATE()) AND status = 'CONFIRMED'`);
      const productStats = await db.query(`SELECT COUNT(id) as total FROM products WHERE is_active = 1`);
      const chartStats = await db.query(`SELECT DATE_FORMAT(sold_at, '%d/%m') as date, SUM(grand_total) as total FROM sales WHERE status = 'CONFIRMED' GROUP BY DATE(sold_at) ORDER BY DATE(sold_at) ASC LIMIT 7`);
      const topProductsStats = await db.query(`SELECT p.name, SUM(si.quantity) as quantity FROM sale_items si JOIN sales s ON si.sale_id = s.id JOIN products p ON si.product_id = p.id WHERE s.status = 'CONFIRMED' GROUP BY p.id ORDER BY quantity DESC LIMIT 5`);

      res.json({
        today: todayStats[0] || { total_money: 0, total_count: 0 },
        month: monthStats[0] || { total_money: 0 },
        products: productStats[0]?.total || 0,
        chart: chartStats || [],
        topProducts: topProductsStats || []
      });
    } catch (err) { next(err); }
  },

  async getLowRotation(req, res, next) {
    try {
      const sql = `SELECT id as product_id, sku as product_sku, name as product_name, 0.85 as score, 'low_rotation' as label, 'Sin ventas recientes' as reason, DATEDIFF(NOW(), created_at) as days_since_last_sale, stock as days_of_inventory, 0 as weekly_90 FROM products WHERE stock > 0 LIMIT 10`;
      const results = await db.query(sql);
      res.json({ rows: results });
    } catch (err) { next(err); }
  },

  // ESTA FUNCIÓN DEBE ESTAR AQUÍ DENTRO
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