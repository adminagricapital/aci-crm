
-- Fix: Enable realtime without IF NOT EXISTS
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.beneficiaires;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.paiements;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cartes;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Storage policies (the first migration dropped+created everything except these and realtime)
-- beneficiaire-photos
CREATE POLICY "ben_photos_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'beneficiaire-photos');
CREATE POLICY "ben_photos_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'beneficiaire-photos');
CREATE POLICY "ben_photos_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'beneficiaire-photos');
CREATE POLICY "ben_photos_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'beneficiaire-photos');

-- user-avatars
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'user-avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-avatars');
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'user-avatars');
CREATE POLICY "avatars_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'user-avatars');

-- user-documents (private)
CREATE POLICY "docs_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'user-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_any_admin_role(auth.uid())));
CREATE POLICY "docs_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-documents');
CREATE POLICY "docs_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- payment-proofs (private)
CREATE POLICY "proofs_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-proofs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'comptable'::public.app_role)));
CREATE POLICY "proofs_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-proofs');

-- Updated_at triggers
DROP TRIGGER IF EXISTS trg_updated_at_beneficiaires ON public.beneficiaires;
CREATE TRIGGER trg_updated_at_beneficiaires BEFORE UPDATE ON public.beneficiaires FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_profiles ON public.profiles;
CREATE TRIGGER trg_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_paiements ON public.paiements;
CREATE TRIGGER trg_updated_at_paiements BEFORE UPDATE ON public.paiements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_cartes ON public.cartes;
CREATE TRIGGER trg_updated_at_cartes BEFORE UPDATE ON public.cartes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Notification triggers
DROP TRIGGER IF EXISTS trg_notify_new_beneficiaire ON public.beneficiaires;
CREATE TRIGGER trg_notify_new_beneficiaire AFTER INSERT ON public.beneficiaires FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_beneficiaire();

DROP TRIGGER IF EXISTS trg_notify_payment ON public.paiements;
CREATE TRIGGER trg_notify_payment AFTER INSERT OR UPDATE ON public.paiements FOR EACH ROW EXECUTE FUNCTION public.notify_on_payment();

DROP TRIGGER IF EXISTS trg_notify_new_user ON public.profiles;
CREATE TRIGGER trg_notify_new_user AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_user();

-- Cascade deactivation triggers
DROP TRIGGER IF EXISTS trg_cascade_district ON public.districts;
CREATE TRIGGER trg_cascade_district AFTER UPDATE ON public.districts FOR EACH ROW EXECUTE FUNCTION public.cascade_deactivate_district();

DROP TRIGGER IF EXISTS trg_cascade_region ON public.regions;
CREATE TRIGGER trg_cascade_region AFTER UPDATE ON public.regions FOR EACH ROW EXECUTE FUNCTION public.cascade_deactivate_region();

DROP TRIGGER IF EXISTS trg_cascade_departement ON public.departements;
CREATE TRIGGER trg_cascade_departement AFTER UPDATE ON public.departements FOR EACH ROW EXECUTE FUNCTION public.cascade_deactivate_departement();

DROP TRIGGER IF EXISTS trg_cascade_sous_prefecture ON public.sous_prefectures;
CREATE TRIGGER trg_cascade_sous_prefecture AFTER UPDATE ON public.sous_prefectures FOR EACH ROW EXECUTE FUNCTION public.cascade_deactivate_sous_prefecture();

-- Foreign keys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'beneficiaires_commercial_id_fkey') THEN
    ALTER TABLE public.beneficiaires ADD CONSTRAINT beneficiaires_commercial_id_fkey FOREIGN KEY (commercial_id) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'paiements_collected_by_fkey') THEN
    ALTER TABLE public.paiements ADD CONSTRAINT paiements_collected_by_fkey FOREIGN KEY (collected_by) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cartes_livre_par_fkey') THEN
    ALTER TABLE public.cartes ADD CONSTRAINT cartes_livre_par_fkey FOREIGN KEY (livre_par) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cartes_confirme_par_fkey') THEN
    ALTER TABLE public.cartes ADD CONSTRAINT cartes_confirme_par_fkey FOREIGN KEY (confirme_par) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'activity_logs_user_id_fkey') THEN
    ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'team_assignments_chef_equipe_id_fkey') THEN
    ALTER TABLE public.team_assignments ADD CONSTRAINT team_assignments_chef_equipe_id_fkey FOREIGN KEY (chef_equipe_id) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'team_assignments_commercial_id_fkey') THEN
    ALTER TABLE public.team_assignments ADD CONSTRAINT team_assignments_commercial_id_fkey FOREIGN KEY (commercial_id) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'zone_assignments_user_id_fkey') THEN
    ALTER TABLE public.zone_assignments ADD CONSTRAINT zone_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_roles_user_id_fkey') THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notifications_user_id_fkey') THEN
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sync_logs_user_id_fkey') THEN
    ALTER TABLE public.sync_logs ADD CONSTRAINT sync_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;
