-- Add performed_by to admin_action_logs for existing installations
-- Run: psql $DATABASE_URL < src/lib/db/migrations/004_admin_logs_performed_by.sql

ALTER TABLE admin_action_logs ADD COLUMN IF NOT EXISTS performed_by VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON admin_action_logs(entity_type, entity_id);
