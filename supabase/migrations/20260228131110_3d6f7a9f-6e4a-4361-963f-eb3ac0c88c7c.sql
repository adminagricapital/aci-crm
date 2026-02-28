
-- Fix search_path for functions missing it
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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
