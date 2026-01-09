const db = require("../config/db");
const DashboardController = {
  async getStats(req, res, next) {
    try {
      const results = await db.query("SELECT COUNT(*) as total FROM products");
      res.json({ products: results[0].total, today: {total_money: 0}, month: {total_money: 0}, chart: [], topProducts: [] });
    } catch (err) { next(err); }
  },
  async getLowRotation(req, res, next) {
    try {
      const sql = `SELECT id as product_id, sku as product_sku, name as product_name, 0.85 as score, 'low_rotation' as label, 'Sin ventas' as reason, 0 as days_since_last_sale, stock as days_of_inventory, 0 as weekly_90 FROM products WHERE stock > 0 LIMIT 10`;
      const results = await db.query(sql);
      res.json({ rows: results });
    } catch (err) { next(err); }
  }
};
module.exports = DashboardController;