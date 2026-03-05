-- Purge all data except users (profiles + user_roles)
TRUNCATE TABLE public.activity_logs CASCADE;
TRUNCATE TABLE public.sync_logs CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.cartes CASCADE;
TRUNCATE TABLE public.paiements CASCADE;
TRUNCATE TABLE public.beneficiaires CASCADE;
TRUNCATE TABLE public.team_assignments CASCADE;
TRUNCATE TABLE public.zone_assignments CASCADE;

-- Reset matricule sequence
UPDATE public.matricule_sequence SET last_value = 0 WHERE id = 1;

-- Recreate missing triggers
CREATE OR REPLACE TRIGGER trg_updated_at_beneficiaires
  BEFORE UPDATE ON public.beneficiaires
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER trg_updated_at_paiements
  BEFORE UPDATE ON public.paiements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER trg_updated_at_cartes
  BEFORE UPDATE ON public.cartes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER trg_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER trg_notify_new_beneficiaire
  AFTER INSERT ON public.beneficiaires
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_beneficiaire();

CREATE OR REPLACE TRIGGER trg_notify_payment
  AFTER INSERT OR UPDATE ON public.paiements
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_payment();

CREATE OR REPLACE TRIGGER trg_notify_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_user();

CREATE OR REPLACE TRIGGER trg_cascade_district
  AFTER UPDATE ON public.districts
  FOR EACH ROW EXECUTE FUNCTION public.cascade_deactivate_district();

CREATE OR REPLACE TRIGGER trg_cascade_region
  AFTER UPDATE ON public.regions
  FOR EACH ROW EXECUTE FUNCTION public.cascade_deactivate_region();

CREATE OR REPLACE TRIGGER trg_cascade_departement
  AFTER UPDATE ON public.departements
  FOR EACH ROW EXECUTE FUNCTION public.cascade_deactivate_departement();

CREATE OR REPLACE TRIGGER trg_cascade_sous_prefecture
  AFTER UPDATE ON public.sous_prefectures
  FOR EACH ROW EXECUTE FUNCTION public.cascade_deactivate_sous_prefecture();

-- Convert RESTRICTIVE policies to PERMISSIVE for all tables
-- profiles
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "View own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role) OR has_role(auth.uid(), 'responsable_commercial'::app_role));
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE USING (has_any_admin_role(auth.uid()));
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid() OR has_any_admin_role(auth.uid()));

-- user_roles
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "View own role" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins view roles" ON public.user_roles FOR SELECT USING (has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role));
CREATE POLICY "Admins insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'dg'::app_role));
CREATE POLICY "Admins update roles" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'dg'::app_role));
CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'dg'::app_role));

-- beneficiaires
DROP POLICY IF EXISTS "Delete beneficiaires" ON public.beneficiaires;
DROP POLICY IF EXISTS "Insert beneficiaires" ON public.beneficiaires;
DROP POLICY IF EXISTS "Update beneficiaires" ON public.beneficiaires;
DROP POLICY IF EXISTS "View beneficiaires" ON public.beneficiaires;

CREATE POLICY "View beneficiaires" ON public.beneficiaires FOR SELECT USING (
  commercial_id = auth.uid() OR has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role) 
  OR has_role(auth.uid(), 'comptable'::app_role) OR has_role(auth.uid(), 'responsable_commercial'::app_role) OR has_role(auth.uid(), 'chef_equipe'::app_role)
);
CREATE POLICY "Insert beneficiaires" ON public.beneficiaires FOR INSERT WITH CHECK (commercial_id = auth.uid() OR has_any_admin_role(auth.uid()));
CREATE POLICY "Update beneficiaires" ON public.beneficiaires FOR UPDATE USING (commercial_id = auth.uid() OR has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role));
CREATE POLICY "Delete beneficiaires" ON public.beneficiaires FOR DELETE USING (has_role(auth.uid(), 'super_admin'::app_role));

-- paiements
DROP POLICY IF EXISTS "Insert paiements" ON public.paiements;
DROP POLICY IF EXISTS "Update paiements" ON public.paiements;
DROP POLICY IF EXISTS "View paiements" ON public.paiements;

CREATE POLICY "View paiements" ON public.paiements FOR SELECT USING (
  collected_by = auth.uid() OR has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'comptable'::app_role) OR has_role(auth.uid(), 'manager_national'::app_role)
);
CREATE POLICY "Insert paiements" ON public.paiements FOR INSERT WITH CHECK (collected_by = auth.uid() OR has_any_admin_role(auth.uid()));
CREATE POLICY "Update paiements" ON public.paiements FOR UPDATE USING (has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'comptable'::app_role));

-- cartes
DROP POLICY IF EXISTS "Insert cartes" ON public.cartes;
DROP POLICY IF EXISTS "Update cartes" ON public.cartes;
DROP POLICY IF EXISTS "View cartes" ON public.cartes;

CREATE POLICY "View cartes" ON public.cartes FOR SELECT USING (true);
CREATE POLICY "Insert cartes" ON public.cartes FOR INSERT WITH CHECK (
  has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role) OR has_role(auth.uid(), 'commercial'::app_role) OR has_role(auth.uid(), 'chef_equipe'::app_role)
);
CREATE POLICY "Update cartes" ON public.cartes FOR UPDATE USING (
  has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role) OR has_role(auth.uid(), 'commercial'::app_role) OR has_role(auth.uid(), 'chef_equipe'::app_role)
);

-- activity_logs
DROP POLICY IF EXISTS "Admins view all logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users insert own logs" ON public.activity_logs;

CREATE POLICY "View logs" ON public.activity_logs FOR SELECT USING (has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role));
CREATE POLICY "Insert logs" ON public.activity_logs FOR INSERT WITH CHECK (user_id = auth.uid());

-- sync_logs
DROP POLICY IF EXISTS "Users insert own sync logs" ON public.sync_logs;
DROP POLICY IF EXISTS "Users see own sync logs" ON public.sync_logs;

CREATE POLICY "View sync logs" ON public.sync_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Insert sync logs" ON public.sync_logs FOR INSERT WITH CHECK (user_id = auth.uid());

-- notifications
DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;

CREATE POLICY "View notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Update notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- team_assignments
DROP POLICY IF EXISTS "Delete team assignments" ON public.team_assignments;
DROP POLICY IF EXISTS "Manage team assignments" ON public.team_assignments;
DROP POLICY IF EXISTS "Update team assignments" ON public.team_assignments;
DROP POLICY IF EXISTS "View team assignments" ON public.team_assignments;

CREATE POLICY "View team" ON public.team_assignments FOR SELECT USING (
  chef_equipe_id = auth.uid() OR commercial_id = auth.uid() OR has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role) OR has_role(auth.uid(), 'responsable_commercial'::app_role)
);
CREATE POLICY "Insert team" ON public.team_assignments FOR INSERT WITH CHECK (has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role) OR has_role(auth.uid(), 'responsable_commercial'::app_role));
CREATE POLICY "Update team" ON public.team_assignments FOR UPDATE USING (has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role) OR has_role(auth.uid(), 'responsable_commercial'::app_role));
CREATE POLICY "Delete team" ON public.team_assignments FOR DELETE USING (has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role) OR has_role(auth.uid(), 'responsable_commercial'::app_role));

-- zone_assignments
DROP POLICY IF EXISTS "Delete zone assignments" ON public.zone_assignments;
DROP POLICY IF EXISTS "Manage zone assignments" ON public.zone_assignments;
DROP POLICY IF EXISTS "Update zone assignments" ON public.zone_assignments;
DROP POLICY IF EXISTS "View zone assignments" ON public.zone_assignments;

CREATE POLICY "View zones" ON public.zone_assignments FOR SELECT USING (
  user_id = auth.uid() OR has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role) OR has_role(auth.uid(), 'responsable_commercial'::app_role)
);
CREATE POLICY "Insert zones" ON public.zone_assignments FOR INSERT WITH CHECK (has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role) OR has_role(auth.uid(), 'responsable_commercial'::app_role));
CREATE POLICY "Update zones" ON public.zone_assignments FOR UPDATE USING (has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role) OR has_role(auth.uid(), 'responsable_commercial'::app_role));
CREATE POLICY "Delete zones" ON public.zone_assignments FOR DELETE USING (has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'manager_national'::app_role) OR has_role(auth.uid(), 'responsable_commercial'::app_role));
