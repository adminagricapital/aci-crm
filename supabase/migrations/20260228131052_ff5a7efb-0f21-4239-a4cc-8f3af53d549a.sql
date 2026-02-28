
-- =============================================
-- MIGRATION COMPLÈTE ACI - Base de données
-- =============================================

-- 1. Enum pour les rôles applicatifs
CREATE TYPE public.app_role AS ENUM (
  'super_admin', 'dg', 'assistante_dg', 'comptable', 
  'manager_national', 'responsable_commercial', 'chef_equipe', 'commercial'
);

-- 2. Enum statut utilisateur
CREATE TYPE public.user_status AS ENUM ('actif', 'en_attente', 'suspendu', 'refuse');

-- 3. Enum statut bénéficiaire
CREATE TYPE public.beneficiaire_status AS ENUM ('enregistre', 'en_production', 'livre');

-- 4. Enum statut paiement
CREATE TYPE public.payment_status AS ENUM ('en_attente', 'paye', 'echoue', 'rembourse');

-- 5. Enum statut carte
CREATE TYPE public.card_status AS ENUM ('en_production', 'pret', 'en_livraison', 'livre', 'confirme');

-- 6. Enum notification type
CREATE TYPE public.notification_type AS ENUM (
  'nouvel_enregistrement', 'paiement_recu', 'validation_compte', 
  'carte_prete', 'carte_livree', 'nouveau_utilisateur', 'system'
);

-- =============================================
-- TABLE: profiles (infos utilisateurs)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL DEFAULT '',
  prenoms TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  telephone TEXT DEFAULT '',
  photo_url TEXT,
  district TEXT,
  region TEXT,
  departement TEXT,
  sous_prefecture TEXT,
  status user_status NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABLE: user_roles 
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- =============================================
-- TABLE: zones géographiques
-- =============================================
CREATE TABLE public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  district_id UUID REFERENCES public.districts(id) ON DELETE CASCADE NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.departements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sous_prefectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  departement_id UUID REFERENCES public.departements(id) ON DELETE CASCADE NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABLE: beneficiaires
-- =============================================
CREATE TABLE public.beneficiaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenoms TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  lieu_naissance TEXT NOT NULL,
  sexe TEXT NOT NULL DEFAULT 'M',
  nationalite TEXT NOT NULL DEFAULT 'Ivoirienne',
  taille NUMERIC(3,2),
  profession TEXT NOT NULL,
  categorie_metier TEXT,
  domicile TEXT NOT NULL,
  telephone TEXT NOT NULL,
  numero_mobile_money TEXT,
  operateur_mobile_money TEXT,
  rccm TEXT,
  photo_url TEXT,
  status beneficiaire_status NOT NULL DEFAULT 'enregistre',
  commercial_id UUID REFERENCES auth.users(id),
  district_id UUID REFERENCES public.districts(id),
  region_id UUID REFERENCES public.regions(id),
  departement_id UUID REFERENCES public.departements(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced BOOLEAN NOT NULL DEFAULT false,
  local_id TEXT
);

-- =============================================
-- TABLE: paiements
-- =============================================
CREATE TABLE public.paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiaire_id UUID REFERENCES public.beneficiaires(id) ON DELETE CASCADE NOT NULL,
  montant INTEGER NOT NULL,
  type_paiement TEXT NOT NULL DEFAULT 'paiement_1',
  status payment_status NOT NULL DEFAULT 'en_attente',
  methode TEXT DEFAULT 'wave',
  reference_wave TEXT,
  telephone_payeur TEXT,
  collected_by UUID REFERENCES auth.users(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABLE: cartes (suivi production/livraison)
-- =============================================
CREATE TABLE public.cartes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiaire_id UUID REFERENCES public.beneficiaires(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status card_status NOT NULL DEFAULT 'en_production',
  numero_carte TEXT,
  date_production TIMESTAMPTZ,
  date_expedition TIMESTAMPTZ,
  date_livraison TIMESTAMPTZ,
  date_confirmation TIMESTAMPTZ,
  livre_par UUID REFERENCES auth.users(id),
  confirme_par UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABLE: notifications
-- =============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABLE: sync_log (suivi des synchronisations)
-- =============================================
CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  records_synced INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABLE: sequence matricule
-- =============================================
CREATE TABLE public.matricule_sequence (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_value INTEGER NOT NULL DEFAULT 0
);
INSERT INTO public.matricule_sequence (id, last_value) VALUES (1, 8);

-- =============================================
-- FUNCTION: generate matricule
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_matricule()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val INTEGER;
BEGIN
  UPDATE public.matricule_sequence SET last_value = last_value + 1 WHERE id = 1 RETURNING last_value INTO next_val;
  RETURN 'ACI-' || LPAD(next_val::TEXT, 4, '0');
END;
$$;

-- =============================================
-- FUNCTION: has_role (security definer)
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =============================================
-- FUNCTION: has_any_admin_role
-- =============================================
CREATE OR REPLACE FUNCTION public.has_any_admin_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('super_admin', 'dg', 'assistante_dg')
  )
$$;

-- =============================================
-- FUNCTION: get_user_role
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'dg' THEN 2
      WHEN 'assistante_dg' THEN 3
      WHEN 'comptable' THEN 4
      WHEN 'manager_national' THEN 5
      WHEN 'responsable_commercial' THEN 6
      WHEN 'chef_equipe' THEN 7
      WHEN 'commercial' THEN 8
    END
  LIMIT 1
$$;

-- =============================================
-- TRIGGER: auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, nom, prenoms, email, telephone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenoms', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'telephone', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER: update timestamps
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_beneficiaires_updated_at BEFORE UPDATE ON public.beneficiaires FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_paiements_updated_at BEFORE UPDATE ON public.paiements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_cartes_updated_at BEFORE UPDATE ON public.cartes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- FUNCTION: send notification
-- =============================================
CREATE OR REPLACE FUNCTION public.send_notification(
  _user_id UUID,
  _type notification_type,
  _title TEXT,
  _message TEXT,
  _data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (_user_id, _type, _title, _message, _data)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- =============================================
-- FUNCTION: notify admins on new registration
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_on_new_beneficiaire()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN 
    SELECT ur.user_id FROM public.user_roles ur
    WHERE ur.role IN ('super_admin', 'dg', 'assistante_dg', 'manager_national')
  LOOP
    PERFORM public.send_notification(
      admin_record.user_id,
      'nouvel_enregistrement',
      'Nouveau bénéficiaire',
      'Nouveau bénéficiaire enregistré: ' || NEW.nom || ' ' || NEW.prenoms || ' (' || NEW.matricule || ')',
      jsonb_build_object('beneficiaire_id', NEW.id, 'matricule', NEW.matricule)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_beneficiaire
  AFTER INSERT ON public.beneficiaires
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_beneficiaire();

-- =============================================
-- FUNCTION: notify on payment received
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  ben RECORD;
BEGIN
  IF NEW.status = 'paye' AND (OLD IS NULL OR OLD.status <> 'paye') THEN
    SELECT nom, prenoms, matricule INTO ben FROM public.beneficiaires WHERE id = NEW.beneficiaire_id;
    FOR admin_record IN 
      SELECT ur.user_id FROM public.user_roles ur
      WHERE ur.role IN ('super_admin', 'dg', 'assistante_dg', 'comptable')
    LOOP
      PERFORM public.send_notification(
        admin_record.user_id,
        'paiement_recu',
        'Paiement reçu',
        'Paiement de ' || NEW.montant || ' FCFA reçu pour ' || ben.nom || ' ' || ben.prenoms,
        jsonb_build_object('paiement_id', NEW.id, 'beneficiaire_id', NEW.beneficiaire_id, 'montant', NEW.montant)
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_payment_update
  AFTER INSERT OR UPDATE ON public.paiements
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_payment();

-- =============================================
-- FUNCTION: notify admins on new user signup
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_on_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN 
    SELECT ur.user_id FROM public.user_roles ur
    WHERE ur.role IN ('super_admin', 'dg', 'assistante_dg')
  LOOP
    PERFORM public.send_notification(
      admin_record.user_id,
      'nouveau_utilisateur',
      'Nouvelle inscription',
      'Nouvel utilisateur inscrit: ' || NEW.nom || ' ' || NEW.prenoms || ' (' || NEW.username || ')',
      jsonb_build_object('profile_id', NEW.id, 'username', NEW.username)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_user();

-- =============================================
-- RLS: Enable on all tables
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sous_prefectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matricule_sequence ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: profiles
-- =============================================
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_any_admin_role(auth.uid()) OR id = auth.uid());

-- =============================================
-- RLS POLICIES: user_roles
-- =============================================
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- =============================================
-- RLS POLICIES: zones (read all for authenticated)
-- =============================================
CREATE POLICY "Authenticated can read districts" ON public.districts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage districts" ON public.districts FOR ALL TO authenticated USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Authenticated can read regions" ON public.regions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage regions" ON public.regions FOR ALL TO authenticated USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Authenticated can read departements" ON public.departements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage departements" ON public.departements FOR ALL TO authenticated USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Authenticated can read sous_prefectures" ON public.sous_prefectures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage sous_prefectures" ON public.sous_prefectures FOR ALL TO authenticated USING (public.has_any_admin_role(auth.uid()));

-- =============================================
-- RLS POLICIES: beneficiaires
-- =============================================
CREATE POLICY "Commerciaux can view own beneficiaires" ON public.beneficiaires FOR SELECT TO authenticated 
  USING (commercial_id = auth.uid() OR public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national') OR public.has_role(auth.uid(), 'comptable'));
CREATE POLICY "Commerciaux can insert beneficiaires" ON public.beneficiaires FOR INSERT TO authenticated 
  WITH CHECK (commercial_id = auth.uid() OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "Admins can update beneficiaires" ON public.beneficiaires FOR UPDATE TO authenticated 
  USING (commercial_id = auth.uid() OR public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national'));

-- =============================================
-- RLS POLICIES: paiements
-- =============================================
CREATE POLICY "View paiements" ON public.paiements FOR SELECT TO authenticated 
  USING (collected_by = auth.uid() OR public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'comptable') OR public.has_role(auth.uid(), 'manager_national'));
CREATE POLICY "Insert paiements" ON public.paiements FOR INSERT TO authenticated 
  WITH CHECK (collected_by = auth.uid() OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "Update paiements" ON public.paiements FOR UPDATE TO authenticated 
  USING (public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'comptable'));

-- =============================================
-- RLS POLICIES: cartes
-- =============================================
CREATE POLICY "View cartes" ON public.cartes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage cartes" ON public.cartes FOR ALL TO authenticated 
  USING (public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'manager_national'));

-- =============================================
-- RLS POLICIES: notifications
-- =============================================
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- =============================================
-- RLS POLICIES: sync_logs
-- =============================================
CREATE POLICY "Users see own sync logs" ON public.sync_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own sync logs" ON public.sync_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- =============================================
-- RLS POLICIES: matricule_sequence
-- =============================================
CREATE POLICY "Authenticated can read sequence" ON public.matricule_sequence FOR SELECT TO authenticated USING (true);

-- =============================================
-- Enable Realtime for notifications
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =============================================
-- Insert initial zone data
-- =============================================
INSERT INTO public.districts (nom, actif) VALUES
  ('District Autonome d''Abidjan', true),
  ('District Autonome de Yamoussoukro', true),
  ('District des Lagunes', true),
  ('District de la Vallée du Bandama', false);

INSERT INTO public.regions (nom, district_id, actif) VALUES
  ('Région des Lagunes', (SELECT id FROM public.districts WHERE nom = 'District Autonome d''Abidjan'), true),
  ('Région de l''Agnéby-Tiassa', (SELECT id FROM public.districts WHERE nom = 'District Autonome d''Abidjan'), true),
  ('Région du Bélier', (SELECT id FROM public.districts WHERE nom = 'District Autonome de Yamoussoukro'), true);

INSERT INTO public.departements (nom, region_id, actif) VALUES
  ('Département d''Abidjan', (SELECT id FROM public.regions WHERE nom = 'Région des Lagunes'), true),
  ('Département de Bingerville', (SELECT id FROM public.regions WHERE nom = 'Région des Lagunes'), true),
  ('Département d''Agboville', (SELECT id FROM public.regions WHERE nom = 'Région de l''Agnéby-Tiassa'), true);

INSERT INTO public.sous_prefectures (nom, departement_id, actif) VALUES
  ('Sous-préfecture d''Abobo', (SELECT id FROM public.departements WHERE nom = 'Département d''Abidjan'), true),
  ('Sous-préfecture de Cocody', (SELECT id FROM public.departements WHERE nom = 'Département d''Abidjan'), true),
  ('Sous-préfecture de Yopougon', (SELECT id FROM public.departements WHERE nom = 'Département d''Abidjan'), true);
