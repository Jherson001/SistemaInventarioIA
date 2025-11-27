SELECT
  p.id AS product_id,
  COALESCE(SUM(inv.stock), 0) AS stock,
  p.price,
  p.category_id AS category,
  COALESCE(SUM(CASE WHEN s.created_at >= NOW() - INTERVAL 7  DAY THEN si.quantity ELSE 0 END), 0) AS sales_7d,
  COALESCE(SUM(CASE WHEN s.created_at >= NOW() - INTERVAL 30 DAY THEN si.quantity ELSE 0 END), 0) AS sales_30d,
  COALESCE(SUM(CASE WHEN s.created_at >= NOW() - INTERVAL 90 DAY THEN si.quantity ELSE 0 END), 0) AS sales_90d,
  COALESCE(DATEDIFF(NOW(), MAX(s.created_at)), 9999) AS days_since_last_sale
FROM products p
LEFT JOIN inventory  inv ON inv.product_id = p.id
LEFT JOIN sale_items si  ON si.product_id = p.id
LEFT JOIN sales      s   ON s.id = si.sale_id
GROUP BY p.id, p.price, p.category_id;
