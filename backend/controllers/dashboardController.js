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

  // Lógica de Baja Rotación profesional: Filtra productos que ya tienen feedback
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
          IFNULL(DATEDIFF(NOW(), (SELECT MAX(s.sold_at) FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE si.product_id = p.id)), DATEDIFF(NOW(), p.created_at)) as days_since_last_sale, 
          p.stock as days_of_inventory, 
          0 as weekly_90 
        FROM products p 
        WHERE p.stock > 0 
        AND p.id NOT IN (SELECT product_id FROM low_rotation_feedback)
        ORDER BY days_since_last_sale DESC
        LIMIT 10
      `;
      const results = await db.query(sql);
      res.json({ rows: results });
    } catch (err) {
      console.error("❌ Error Low Rotation:", err);
      next(err);
    }
  },

  // Registro de Feedback: Robusto y previene duplicados
  async postFeedback(req, res, next) {
    try {
      // El ID puede venir de la URL o del body dependiendo de cómo lo envíe tu frontend
      const product_id = req.params.id || req.body.product_id;
      const { is_correct, note } = req.body;

      if (!product_id) {
        return res.status(400).json({ error: "Falta el ID del producto" });
      }

      await db.query(
        `INSERT INTO low_rotation_feedback (product_id, is_correct, note) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE is_correct = VALUES(is_correct), note = VALUES(note)`,
        [product_id, is_correct ? 1 : 0, note || ""]
      );

      res.json({ ok: true, message: "Feedback procesado" });
    } catch (err) {
      console.error("❌ Error Post Feedback:", err);
      res.status(500).json({ error: "No se pudo guardar el feedback" });
    }
  }
};

module.exports = DashboardController;