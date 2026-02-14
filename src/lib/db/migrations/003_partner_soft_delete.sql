-- Soft delete for partners: keep records for audit (e.g. 3+ months)
ALTER TABLE partners ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
-- Index on deleted_at for both active (WHERE deleted_at IS NULL) and deleted queries
CREATE INDEX IF NOT EXISTS idx_partners_deleted_at ON partners(deleted_at);
