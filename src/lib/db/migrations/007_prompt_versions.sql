-- Prompt versioning for Opus The Writer (separate from Content Writer pipeline tables)

CREATE TABLE IF NOT EXISTS prompt_versions (
  id BIGSERIAL PRIMARY KEY,
  step VARCHAR(20) NOT NULL CHECK (step IN ('step2', 'step3', 'step4', 'step5b')),
  version INTEGER NOT NULL,
  prompt_text TEXT NOT NULL,
  change_note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(step, version)
);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_step_created_at
  ON prompt_versions(step, created_at DESC);
