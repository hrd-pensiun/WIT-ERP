-- Kantor pusat: satu tenant bisa menandai entity sebagai HQ (logika unik di aplikasi)
ALTER TABLE entities
  ADD COLUMN IF NOT EXISTS is_headquarters BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_entities_tenant_hq ON entities (tenant_id, is_headquarters)
  WHERE is_headquarters = TRUE;

COMMENT ON COLUMN entities.is_headquarters IS 'True = kantor pusat (referensi copy-on-create & kebijakan default)';
