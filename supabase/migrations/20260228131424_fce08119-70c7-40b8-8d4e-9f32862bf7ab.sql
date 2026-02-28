
-- Insert super admin profile and role
INSERT INTO public.profiles (id, username, nom, prenoms, email, status)
VALUES ('7da45110-03be-400f-baae-9592b24eb972', 'admin', 'KOFFI', 'Innocent', 'innocentkoffi1@gmail.com', 'actif')
ON CONFLICT (id) DO UPDATE SET username = 'admin', nom = 'KOFFI', prenoms = 'Innocent', status = 'actif';

INSERT INTO public.user_roles (user_id, role)
VALUES ('7da45110-03be-400f-baae-9592b24eb972', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
