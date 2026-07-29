const db = require("../config/db");

const DashboardController = {
  // Mantenemos getStats exactamente como está porque ya funciona bien
  async getStats(req, res, next) {
    try {
      const todayStats = await db.query(`
        SELECT IFNULL(SUM(grand_total), 0) as total_money, COUNT(id) as total_count
        FROM sales 
        WHERE DATE(sold_at) = CURDATE() AND status = 'CONFIRMED'
      `);

      const monthStats = await db.query(`
        SELECT IFNULL(SUM(grand_total), 0) as total_money
        FROM sales 
        WHERE MONTH(sold_at) = MONTH(CURDATE()) 
        AND YEAR(sold_at) = YEAR(CURDATE()) 
        AND status = 'CONFIRMED'
      `);

      const productStats = await db.query(`
        SELECT COUNT(id) as total 
        FROM products 
        WHERE is_active = 1
      `);

      const chartStats = await db.query(`
        SELECT DATE_FORMAT(sold_at, '%d/%m') as date, SUM(grand_total) as total
        FROM sales 
        WHERE status = 'CONFIRMED'
        GROUP BY date
        ORDER BY MIN(sold_at) ASC 
        LIMIT 7
      `);

      const topProductsStats = await db.query(`
        SELECT p.name, SUM(si.quantity) as quantity
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.status = 'CONFIRMED'
        GROUP BY p.name
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
      console.error("❌ Error Dashboard Stats:", err);
      next(err);
    }
  },

  // Usa low_rotation_flags (tabla real) + datos del producto
  async getLowRotation(req, res, next) {
    try {
      const minScore = Number(req.query.min_score ?? 0.6);
      const limit = Math.min(Number(req.query.limit ?? 100) || 100, 500);

      const results = await db.query(
        `
        SELECT
          t.product_id,
          p.sku AS product_sku,
          p.name AS product_name,
          t.score,
          t.label,
          t.reason,
          t.days_since_last_sale,
          t.days_of_inventory,
          t.weekly_90,
          t.admin_feedback,
          t.is_reviewed,
          t.flagged_at
        FROM low_rotation_flags t
        JOIN (
          SELECT product_id, MAX(flagged_at) AS max_date
          FROM low_rotation_flags
          GROUP BY product_id
        ) last
          ON t.product_id = last.product_id AND t.flagged_at = last.max_date
        LEFT JOIN products p ON p.id = t.product_id
        WHERE t.score >= ?
          AND IFNULL(t.is_reviewed, 0) = 0
        ORDER BY t.score DESC
        LIMIT ?
        `,
        [minScore, limit]
      );

      res.json({ rows: results });
    } catch (err) {
      console.error("❌ Error Low Rotation:", err);
      next(err);
    }
  },

  async postFeedback(req, res, next) {
    try {
      const product_id = req.params.id || req.body.product_id;
      const { is_correct, note } = req.body;

      if (!product_id) {
        return res.status(400).json({ error: "Falta el ID del producto" });
      }

      await db.query(
        `
        UPDATE low_rotation_flags
        SET admin_feedback = ?, is_reviewed = 1
        WHERE product_id = ?
        ORDER BY flagged_at DESC
        LIMIT 1
        `,
        [note || (is_correct ? "CORRECTO" : "INCORRECTO"), product_id]
      );

      res.json({ ok: true, message: "Feedback procesado" });
    } catch (err) {
      console.error("❌ Error Post Feedback:", err);
      res.status(500).json({ error: "No se pudo guardar el feedback" });
    }
  }
};

module.exports = DashboardController;