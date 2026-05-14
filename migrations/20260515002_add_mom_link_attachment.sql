-- Add link_attachment column to lead_mom for external meeting links (Zoom, etc.)
ALTER TABLE public.lead_mom
  ADD COLUMN IF NOT EXISTS link_attachment text;
