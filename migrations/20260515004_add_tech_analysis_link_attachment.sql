-- Add link_attachment column to lead_technical_analyses
ALTER TABLE public.lead_technical_analyses
  ADD COLUMN IF NOT EXISTS link_attachment text;
