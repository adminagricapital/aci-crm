
-- ============ ACTIVITY LOGS TABLE ============
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text, -- 'beneficiaire', 'user', 'carte', 'paiement', etc.
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_target ON public.activity_logs(target_type, target_id);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins and DG can view all logs
CREATE POLICY "Admins view all logs" ON public.activity_logs
FOR SELECT USING (
  public.has_any_admin_role(auth.uid()) OR 
  public.has_role(auth.uid(), 'manager_national')
);

-- Any authenticated user can insert their own logs
CREATE POLICY "Users insert own logs" ON public.activity_logs
FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============ FIX BENEFICIAIRES RLS: only super_admin can delete ============
CREATE POLICY "Only super_admin can delete beneficiaires"
ON public.beneficiaires FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Fix update policy: only super_admin can update (not commercial_id owner)
DROP POLICY IF EXISTS "Admins can update beneficiaires" ON public.beneficiaires;
CREATE POLICY "Super admin can update beneficiaires"
ON public.beneficiaires FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Commercials can still view their own
-- (existing SELECT policy is fine)

-- ============ PERFORMANCE INDEXES ============
CREATE INDEX IF NOT EXISTS idx_beneficiaires_commercial ON public.beneficiaires(commercial_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaires_status ON public.beneficiaires(status);
CREATE INDEX IF NOT EXISTS idx_beneficiaires_district ON public.beneficiaires(district_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaires_created ON public.beneficiaires(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paiements_beneficiaire ON public.paiements(beneficiaire_id);
CREATE INDEX IF NOT EXISTS idx_paiements_status ON public.paiements(status);
CREATE INDEX IF NOT EXISTS idx_paiements_type ON public.paiements(type_paiement);
CREATE INDEX IF NOT EXISTS idx_cartes_beneficiaire ON public.cartes(beneficiaire_id);
CREATE INDEX IF NOT EXISTS idx_cartes_status ON public.cartes(status);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_villages_sp ON public.villages(sous_prefecture_id);
CREATE INDEX IF NOT EXISTS idx_sous_prefectures_dept ON public.sous_prefectures(departement_id);
CREATE INDEX IF NOT EXISTS idx_departements_region ON public.departements(region_id);
CREATE INDEX IF NOT EXISTS idx_regions_district ON public.regions(district_id);

-- ============ ADD contact_secondaire TO beneficiaires ============
ALTER TABLE public.beneficiaires ADD COLUMN IF NOT EXISTS contact_secondaire text;
