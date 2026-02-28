-- Add CNI storage columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cni_recto_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cni_verso_url text;

-- Create user-documents bucket for CNI uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-documents
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all user documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-documents' AND public.has_any_admin_role(auth.uid()));

-- Create user-avatars bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);