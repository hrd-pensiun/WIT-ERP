-- Table: commercial_lead_status
-- Master data for lead statuses with ISO 27001 audit fields

CREATE TABLE IF NOT EXISTS public.commercial_lead_status (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  color         VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,

  -- ISO 27001 audit fields
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID,
  updated_by    UUID,
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_commercial_lead_status_tenant
  ON public.commercial_lead_status(tenant_id);

CREATE INDEX IF NOT EXISTS idx_commercial_lead_status_active
  ON public.commercial_lead_status(is_active)
  WHERE is_active = TRUE;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_commercial_lead_status_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_commercial_lead_status_updated_at
  ON public.commercial_lead_status;

CREATE TRIGGER trg_commercial_lead_status_updated_at
  BEFORE UPDATE ON public.commercial_lead_status
  FOR EACH ROW EXECUTE FUNCTION public.update_commercial_lead_status_updated_at();

-- RLS
ALTER TABLE public.commercial_lead_status ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.commercial_lead_status TO authenticated;

-- Seed data
INSERT INTO public.commercial_lead_status (tenant_id, name, description, color, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000000', 'New',         'Lead baru masuk',                    '#3b82f6', 1),
  ('00000000-0000-0000-0000-000000000000', 'Contacted',   'Sudah dihubungi',                    '#f59e0b', 2),
  ('00000000-0000-0000-0000-000000000000', 'Qualified',   'Memenuhi kualifikasi',               '#8b5cf6', 3),
  ('00000000-0000-0000-0000-000000000000', 'Proposal',    'Proposal dikirim',                   '#6366f1', 4),
  ('00000000-0000-0000-0000-000000000000', 'Negotiation', 'Dalam negosiasi',                    '#f97316', 5),
  ('00000000-0000-0000-0000-000000000000', 'Closed Won',  'Berhasil menjadi project',           '#10b981', 6),
  ('00000000-0000-0000-0000-000000000000', 'Closed Lost', 'Tidak jadi',                         '#ef4444', 7)
ON CONFLICT DO NOTHING;
