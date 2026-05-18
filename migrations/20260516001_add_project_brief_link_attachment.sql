-- Add link_attachment column to lead_project_briefs
ALTER TABLE public.lead_project_briefs
  ADD COLUMN IF NOT EXISTS link_attachment text;
