ALTER TABLE low_rotation_flags
ADD COLUMN admin_feedback TEXT NULL AFTER reason,
ADD COLUMN is_reviewed TINYINT(1) DEFAULT 0 AFTER admin_feedback;