-- Add phone to partner_applications and partners
-- Run: psql $DATABASE_URL -f src/lib/db/migrations/006_partner_phone.sql

ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
