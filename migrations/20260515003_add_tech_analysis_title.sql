-- Add title column to lead_technical_analyses
ALTER TABLE public.lead_technical_analyses
  ADD COLUMN IF NOT EXISTS title character varying(200);

-- Update existing rows with a default title based on content
UPDATE public.lead_technical_analyses
  SET title = LEFT(NULLIF(content, ''), 100)
  WHERE title IS NULL;
