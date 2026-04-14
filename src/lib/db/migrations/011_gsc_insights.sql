-- Migration 011: page_insights table for Google Search Console data and AI suggestions.
-- Stores per-page GSC performance snapshots and ranked Claude-generated improvement
-- suggestions. Keyed by page_path so it covers both blog posts and static pages
-- without depending on the WordPress slug shape.

CREATE TABLE IF NOT EXISTS page_insights (
  page_path TEXT PRIMARY KEY,
  page_type VARCHAR(20) NOT NULL,
  post_slug VARCHAR(255),
  gsc_data JSONB,
  ai_suggestions JSONB,
  last_synced_at TIMESTAMPTZ,
  suggestion_generated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_insights_type ON page_insights(page_type);
CREATE INDEX IF NOT EXISTS idx_page_insights_slug ON page_insights(post_slug);
CREATE INDEX IF NOT EXISTS idx_page_insights_synced ON page_insights(last_synced_at DESC NULLS LAST);
