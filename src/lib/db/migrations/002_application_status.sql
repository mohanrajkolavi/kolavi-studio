-- Add status to partner_applications so approved applications are hidden from the list
-- Run: psql $DATABASE_URL < src/lib/db/migrations/002_application_status.sql
--
-- Note: ADD COLUMN with DEFAULT 'pending' populates all existing rows with 'pending'.
-- Backfill matches status = 'pending' (not IS NULL) for applications whose email
-- already exists in partners (they were approved before status column existed).

ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Backfill: mark applications as approved if email already exists in partners (idempotent)
UPDATE partner_applications pa
SET status = 'approved'
WHERE status = 'pending'
  AND EXISTS (
    SELECT 1 FROM partners p WHERE p.email = pa.email
  );

CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner_applications(status);
