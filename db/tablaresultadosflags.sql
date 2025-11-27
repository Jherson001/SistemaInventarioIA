CREATE TABLE IF NOT EXISTS low_rotation_flags (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  score DECIMAL(5,3) NOT NULL,
  label ENUM('normal','low_rotation') NOT NULL,
  reason VARCHAR(255) NULL,
  used ENUM('rules','model') NOT NULL DEFAULT 'rules',
  weekly_90 DECIMAL(10,2) NULL,
  days_since_last_sale INT NULL,
  days_of_inventory DECIMAL(10,1) NULL,
  run_id VARCHAR(50) NOT NULL,
  flagged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_flagged (product_id, flagged_at)
);
