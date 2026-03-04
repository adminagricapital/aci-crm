
-- Fix ALL RLS policies: drop restrictive ones, recreate as permissive

-- ============ PROFILES ============
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national') OR public.has_role(auth.uid(), 'responsable_commercial'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_any_admin_role(auth.uid()) OR id = auth.uid());

-- ============ USER_ROLES ============
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'dg'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'dg'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'dg'));

-- ============ BENEFICIAIRES ============
DROP POLICY IF EXISTS "Commerciaux can view own beneficiaires" ON public.beneficiaires;
DROP POLICY IF EXISTS "Commerciaux can insert beneficiaires" ON public.beneficiaires;
DROP POLICY IF EXISTS "Only super_admin can delete beneficiaires" ON public.beneficiaires;
DROP POLICY IF EXISTS "Super admin can update beneficiaires" ON public.beneficiaires;

CREATE POLICY "View beneficiaires" ON public.beneficiaires FOR SELECT USING (
  commercial_id = auth.uid() 
  OR public.has_any_admin_role(auth.uid()) 
  OR public.has_role(auth.uid(), 'manager_national')
  OR public.has_role(auth.uid(), 'comptable')
  OR public.has_role(auth.uid(), 'responsable_commercial')
  OR public.has_role(auth.uid(), 'chef_equipe')
);
CREATE POLICY "Insert beneficiaires" ON public.beneficiaires FOR INSERT WITH CHECK (
  commercial_id = auth.uid() OR public.has_any_admin_role(auth.uid())
);
CREATE POLICY "Update beneficiaires" ON public.beneficiaires FOR UPDATE USING (
  commercial_id = auth.uid() OR public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national')
);
CREATE POLICY "Delete beneficiaires" ON public.beneficiaires FOR DELETE USING (
  public.has_role(auth.uid(), 'super_admin')
);

-- ============ PAIEMENTS ============
DROP POLICY IF EXISTS "View paiements" ON public.paiements;
DROP POLICY IF EXISTS "Insert paiements" ON public.paiements;
DROP POLICY IF EXISTS "Update paiements" ON public.paiements;

CREATE POLICY "View paiements" ON public.paiements FOR SELECT USING (
  collected_by = auth.uid() OR public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'comptable') OR public.has_role(auth.uid(), 'manager_national')
);
CREATE POLICY "Insert paiements" ON public.paiements FOR INSERT WITH CHECK (
  collected_by = auth.uid() OR public.has_any_admin_role(auth.uid())
);
CREATE POLICY "Update paiements" ON public.paiements FOR UPDATE USING (
  public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'comptable')
);

-- ============ CARTES ============
DROP POLICY IF EXISTS "View cartes" ON public.cartes;
DROP POLICY IF EXISTS "Manage cartes" ON public.cartes;

CREATE POLICY "View cartes" ON public.cartes FOR SELECT USING (true);
CREATE POLICY "Insert cartes" ON public.cartes FOR INSERT WITH CHECK (
  public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national') OR public.has_role(auth.uid(), 'commercial') OR public.has_role(auth.uid(), 'chef_equipe')
);
CREATE POLICY "Update cartes" ON public.cartes FOR UPDATE USING (
  public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national') OR public.has_role(auth.uid(), 'commercial') OR public.has_role(auth.uid(), 'chef_equipe')
);

-- ============ ACTIVITY_LOGS ============
DROP POLICY IF EXISTS "Admins view all logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users insert own logs" ON public.activity_logs;

CREATE POLICY "Admins view all logs" ON public.activity_logs FOR SELECT USING (
  public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national')
);
CREATE POLICY "Users insert own logs" ON public.activity_logs FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============ NOTIFICATIONS ============
DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;

CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- ============ SYNC_LOGS ============
DROP POLICY IF EXISTS "Users see own sync logs" ON public.sync_logs;
DROP POLICY IF EXISTS "Users insert own sync logs" ON public.sync_logs;

CREATE POLICY "Users see own sync logs" ON public.sync_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own sync logs" ON public.sync_logs FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============ TEAM_ASSIGNMENTS ============
DROP POLICY IF EXISTS "Admins manage team assignments" ON public.team_assignments;
DROP POLICY IF EXISTS "Users view own team" ON public.team_assignments;

CREATE POLICY "View team assignments" ON public.team_assignments FOR SELECT USING (
  chef_equipe_id = auth.uid() OR commercial_id = auth.uid() OR public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national') OR public.has_role(auth.uid(), 'responsable_commercial')
);
CREATE POLICY "Manage team assignments" ON public.team_assignments FOR INSERT WITH CHECK (
  public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national') OR public.has_role(auth.uid(), 'responsable_commercial')
);
CREATE POLICY "Update team assignments" ON public.team_assignments FOR UPDATE USING (
  public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national') OR public.has_role(auth.uid(), 'responsable_commercial')
);
CREATE POLICY "Delete team assignments" ON public.team_assignments FOR DELETE USING (
  public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national') OR public.has_role(auth.uid(), 'responsable_commercial')
);

-- ============ ZONE_ASSIGNMENTS ============
DROP POLICY IF EXISTS "Admins manage zone assignments" ON public.zone_assignments;
DROP POLICY IF EXISTS "Users view own zones" ON public.zone_assignments;

CREATE POLICY "View zone assignments" ON public.zone_assignments FOR SELECT USING (
  user_id = auth.uid() OR public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national') OR public.has_role(auth.uid(), 'responsable_commercial')
);
CREATE POLICY "Manage zone assignments" ON public.zone_assignments FOR INSERT WITH CHECK (
  public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national') OR public.has_role(auth.uid(), 'responsable_commercial')
);
CREATE POLICY "Update zone assignments" ON public.zone_assignments FOR UPDATE USING (
  public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national') OR public.has_role(auth.uid(), 'responsable_commercial')
);
CREATE POLICY "Delete zone assignments" ON public.zone_assignments FOR DELETE USING (
  public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national') OR public.has_role(auth.uid(), 'responsable_commercial')
);

-- ============ GEO TABLES ============
DROP POLICY IF EXISTS "Authenticated can read districts" ON public.districts;
DROP POLICY IF EXISTS "Admins can manage districts" ON public.districts;
DROP POLICY IF EXISTS "Authenticated can read regions" ON public.regions;
DROP POLICY IF EXISTS "Admins can manage regions" ON public.regions;
DROP POLICY IF EXISTS "Authenticated can read departements" ON public.departements;
DROP POLICY IF EXISTS "Admins can manage departements" ON public.departements;
DROP POLICY IF EXISTS "Authenticated can read sous_prefectures" ON public.sous_prefectures;
DROP POLICY IF EXISTS "Admins can manage sous_prefectures" ON public.sous_prefectures;
DROP POLICY IF EXISTS "Authenticated can read villages" ON public.villages;
DROP POLICY IF EXISTS "Admins can manage villages" ON public.villages;
DROP POLICY IF EXISTS "Authenticated can read sequence" ON public.matricule_sequence;

CREATE POLICY "Read districts" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Manage districts" ON public.districts FOR ALL USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Read regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Manage regions" ON public.regions FOR ALL USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Read departements" ON public.departements FOR SELECT USING (true);
CREATE POLICY "Manage departements" ON public.departements FOR ALL USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Read sous_prefectures" ON public.sous_prefectures FOR SELECT USING (true);
CREATE POLICY "Manage sous_prefectures" ON public.sous_prefectures FOR ALL USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Read villages" ON public.villages FOR SELECT USING (true);
CREATE POLICY "Manage villages" ON public.villages FOR ALL USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Read sequence" ON public.matricule_sequence FOR SELECT USING (true);

-- ============ Add missing triggers ============
DROP TRIGGER IF EXISTS trg_cascade_district ON public.districts;
CREATE TRIGGER trg_cascade_district AFTER UPDATE ON public.districts FOR EACH ROW EXECUTE FUNCTION cascade_deactivate_district();

DROP TRIGGER IF EXISTS trg_cascade_region ON public.regions;
CREATE TRIGGER trg_cascade_region AFTER UPDATE ON public.regions FOR EACH ROW EXECUTE FUNCTION cascade_deactivate_region();

DROP TRIGGER IF EXISTS trg_cascade_departement ON public.departements;
CREATE TRIGGER trg_cascade_departement AFTER UPDATE ON public.departements FOR EACH ROW EXECUTE FUNCTION cascade_deactivate_departement();

DROP TRIGGER IF EXISTS trg_cascade_sous_prefecture ON public.sous_prefectures;
CREATE TRIGGER trg_cascade_sous_prefecture AFTER UPDATE ON public.sous_prefectures FOR EACH ROW EXECUTE FUNCTION cascade_deactivate_sous_prefecture();

DROP TRIGGER IF EXISTS trg_notify_beneficiaire ON public.beneficiaires;
CREATE TRIGGER trg_notify_beneficiaire AFTER INSERT ON public.beneficiaires FOR EACH ROW EXECUTE FUNCTION notify_on_new_beneficiaire();

DROP TRIGGER IF EXISTS trg_notify_payment ON public.paiements;
CREATE TRIGGER trg_notify_payment AFTER INSERT OR UPDATE ON public.paiements FOR EACH ROW EXECUTE FUNCTION notify_on_payment();

DROP TRIGGER IF EXISTS trg_notify_new_user ON public.profiles;
CREATE TRIGGER trg_notify_new_user AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION notify_on_new_user();

DROP TRIGGER IF EXISTS trg_updated_at_beneficiaires ON public.beneficiaires;
CREATE TRIGGER trg_updated_at_beneficiaires BEFORE UPDATE ON public.beneficiaires FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_cartes ON public.cartes;
CREATE TRIGGER trg_updated_at_cartes BEFORE UPDATE ON public.cartes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_paiements ON public.paiements;
CREATE TRIGGER trg_updated_at_paiements BEFORE UPDATE ON public.paiements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_profiles ON public.profiles;
CREATE TRIGGER trg_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
