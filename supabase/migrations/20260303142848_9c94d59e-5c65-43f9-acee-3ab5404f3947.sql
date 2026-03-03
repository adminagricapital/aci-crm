-- 1. Create team_assignments table for chef_equipe -> commercial mapping
CREATE TABLE IF NOT EXISTS public.team_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_equipe_id uuid NOT NULL,
  commercial_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid,
  UNIQUE(chef_equipe_id, commercial_id)
);

ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage team assignments" ON public.team_assignments
FOR ALL TO authenticated
USING (has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role) OR has_role(auth.uid(), 'responsable_commercial'::app_role));

CREATE POLICY "Users view own team" ON public.team_assignments
FOR SELECT TO authenticated
USING (chef_equipe_id = auth.uid() OR commercial_id = auth.uid());

-- 2. Create zone_assignments table for assigning zones to users
CREATE TABLE IF NOT EXISTS public.zone_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  district_id uuid REFERENCES public.districts(id),
  region_id uuid REFERENCES public.regions(id),
  departement_id uuid REFERENCES public.departements(id),
  sous_prefecture_id uuid REFERENCES public.sous_prefectures(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid
);

ALTER TABLE public.zone_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage zone assignments" ON public.zone_assignments
FOR ALL TO authenticated
USING (has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role) OR has_role(auth.uid(), 'responsable_commercial'::app_role));

CREATE POLICY "Users view own zones" ON public.zone_assignments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 3. Add payment proof columns to paiements
ALTER TABLE public.paiements ADD COLUMN IF NOT EXISTS preuve_url text;
ALTER TABLE public.paiements ADD COLUMN IF NOT EXISTS id_transaction text;

-- 4. Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload payment proofs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Authenticated view payment proofs" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs');

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_team_assignments_chef ON public.team_assignments(chef_equipe_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_commercial ON public.team_assignments(commercial_id);
CREATE INDEX IF NOT EXISTS idx_zone_assignments_user ON public.zone_assignments(user_id);