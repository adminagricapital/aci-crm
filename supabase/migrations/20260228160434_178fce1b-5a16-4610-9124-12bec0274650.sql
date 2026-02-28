
-- Create villages table
CREATE TABLE public.villages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  sous_prefecture_id uuid NOT NULL REFERENCES public.sous_prefectures(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'village', -- 'village', 'quartier', 'ville'
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_villages_sous_prefecture ON public.villages(sous_prefecture_id);
CREATE INDEX idx_villages_nom ON public.villages(nom);

ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read villages" ON public.villages FOR SELECT USING (true);
CREATE POLICY "Admins can manage villages" ON public.villages FOR ALL USING (has_any_admin_role(auth.uid()));

-- Add sous_prefecture_id to beneficiaires for finer location
ALTER TABLE public.beneficiaires ADD COLUMN IF NOT EXISTS sous_prefecture_id uuid REFERENCES public.sous_prefectures(id);
ALTER TABLE public.beneficiaires ADD COLUMN IF NOT EXISTS village_id uuid REFERENCES public.villages(id);
