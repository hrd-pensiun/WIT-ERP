-- Add BANT detail text fields to crm_leads for per-item input values

ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS budget_value text,
  ADD COLUMN IF NOT EXISTS authority_detail text,
  ADD COLUMN IF NOT EXISTS need_detail text,
  ADD COLUMN IF NOT EXISTS timeline_detail text;
