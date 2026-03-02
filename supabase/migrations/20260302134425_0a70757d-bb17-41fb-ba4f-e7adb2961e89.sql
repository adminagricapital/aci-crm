
-- FOREIGN KEYS (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'beneficiaires_district_id_fkey') THEN
    ALTER TABLE public.beneficiaires ADD CONSTRAINT beneficiaires_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'beneficiaires_region_id_fkey') THEN
    ALTER TABLE public.beneficiaires ADD CONSTRAINT beneficiaires_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'beneficiaires_departement_id_fkey') THEN
    ALTER TABLE public.beneficiaires ADD CONSTRAINT beneficiaires_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES public.departements(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'beneficiaires_sous_prefecture_id_fkey') THEN
    ALTER TABLE public.beneficiaires ADD CONSTRAINT beneficiaires_sous_prefecture_id_fkey FOREIGN KEY (sous_prefecture_id) REFERENCES public.sous_prefectures(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'beneficiaires_village_id_fkey') THEN
    ALTER TABLE public.beneficiaires ADD CONSTRAINT beneficiaires_village_id_fkey FOREIGN KEY (village_id) REFERENCES public.villages(id);
  END IF;
END $$;

-- Signature columns for delivery
ALTER TABLE public.cartes ADD COLUMN IF NOT EXISTS signature_commercial TEXT;
ALTER TABLE public.cartes ADD COLUMN IF NOT EXISTS signature_beneficiaire TEXT;

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_beneficiaires_commercial_id ON public.beneficiaires(commercial_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaires_status ON public.beneficiaires(status);
CREATE INDEX IF NOT EXISTS idx_beneficiaires_district_id ON public.beneficiaires(district_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaires_region_id ON public.beneficiaires(region_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaires_created_at ON public.beneficiaires(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beneficiaires_matricule ON public.beneficiaires(matricule);
CREATE INDEX IF NOT EXISTS idx_paiements_beneficiaire_id ON public.paiements(beneficiaire_id);
CREATE INDEX IF NOT EXISTS idx_paiements_status ON public.paiements(status);
CREATE INDEX IF NOT EXISTS idx_paiements_type ON public.paiements(type_paiement);
CREATE INDEX IF NOT EXISTS idx_paiements_created_at ON public.paiements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cartes_beneficiaire_id ON public.cartes(beneficiaire_id);
CREATE INDEX IF NOT EXISTS idx_cartes_status ON public.cartes(status);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_regions_district_id ON public.regions(district_id);
CREATE INDEX IF NOT EXISTS idx_departements_region_id ON public.departements(region_id);
CREATE INDEX IF NOT EXISTS idx_sous_prefectures_departement_id ON public.sous_prefectures(departement_id);
CREATE INDEX IF NOT EXISTS idx_villages_sous_prefecture_id ON public.villages(sous_prefecture_id);

-- TRIGGERS for notifications
DROP TRIGGER IF EXISTS trg_notify_new_beneficiaire ON public.beneficiaires;
CREATE TRIGGER trg_notify_new_beneficiaire AFTER INSERT ON public.beneficiaires FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_beneficiaire();

DROP TRIGGER IF EXISTS trg_notify_payment ON public.paiements;
CREATE TRIGGER trg_notify_payment AFTER INSERT OR UPDATE ON public.paiements FOR EACH ROW EXECUTE FUNCTION public.notify_on_payment();

DROP TRIGGER IF EXISTS trg_notify_new_user ON public.profiles;
CREATE TRIGGER trg_notify_new_user AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_user();

-- Updated_at triggers
DROP TRIGGER IF EXISTS trg_update_beneficiaires ON public.beneficiaires;
CREATE TRIGGER trg_update_beneficiaires BEFORE UPDATE ON public.beneficiaires FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_update_cartes ON public.cartes;
CREATE TRIGGER trg_update_cartes BEFORE UPDATE ON public.cartes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_update_paiements ON public.paiements;
CREATE TRIGGER trg_update_paiements BEFORE UPDATE ON public.paiements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_update_profiles ON public.profiles;
CREATE TRIGGER trg_update_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- CASCADE DEACTIVATION
CREATE OR REPLACE FUNCTION public.cascade_deactivate_district()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actif = false AND OLD.actif = true THEN
    UPDATE public.regions SET actif = false WHERE district_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cascade_deactivate_region()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actif = false AND OLD.actif = true THEN
    UPDATE public.departements SET actif = false WHERE region_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cascade_deactivate_departement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actif = false AND OLD.actif = true THEN
    UPDATE public.sous_prefectures SET actif = false WHERE departement_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cascade_deactivate_sous_prefecture()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actif = false AND OLD.actif = true THEN
    UPDATE public.villages SET actif = false WHERE sous_prefecture_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_cascade_district ON public.districts;
CREATE TRIGGER trg_cascade_district AFTER UPDATE OF actif ON public.districts FOR EACH ROW EXECUTE FUNCTION public.cascade_deactivate_district();

DROP TRIGGER IF EXISTS trg_cascade_region ON public.regions;
CREATE TRIGGER trg_cascade_region AFTER UPDATE OF actif ON public.regions FOR EACH ROW EXECUTE FUNCTION public.cascade_deactivate_region();

DROP TRIGGER IF EXISTS trg_cascade_departement ON public.departements;
CREATE TRIGGER trg_cascade_departement AFTER UPDATE OF actif ON public.departements FOR EACH ROW EXECUTE FUNCTION public.cascade_deactivate_departement();

DROP TRIGGER IF EXISTS trg_cascade_sous_prefecture ON public.sous_prefectures;
CREATE TRIGGER trg_cascade_sous_prefecture AFTER UPDATE OF actif ON public.sous_prefectures FOR EACH ROW EXECUTE FUNCTION public.cascade_deactivate_sous_prefecture();

-- Realtime (only add tables not already present)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'beneficiaires') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.beneficiaires;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'paiements') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.paiements;
  END IF;
END $$;
