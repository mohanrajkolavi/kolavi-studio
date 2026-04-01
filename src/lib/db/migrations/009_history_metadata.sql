-- Migration 009: Add metadata columns to blog_generation_history
-- Persists pipeline analysis data (audit, EEAT, fact-check, schema, sources)
-- that was previously discarded after generation.

ALTER TABLE blog_generation_history
  ADD COLUMN IF NOT EXISTS schema_markup JSONB,
  ADD COLUMN IF NOT EXISTS audit_result JSONB,
  ADD COLUMN IF NOT EXISTS eeat_feedback JSONB,
  ADD COLUMN IF NOT EXISTS fact_check JSONB,
  ADD COLUMN IF NOT EXISTS source_urls TEXT[],
  ADD COLUMN IF NOT EXISTS token_usage JSONB,
  ADD COLUMN IF NOT EXISTS brief_summary JSONB,
  ADD COLUMN IF NOT EXISTS readability_scores JSONB;
