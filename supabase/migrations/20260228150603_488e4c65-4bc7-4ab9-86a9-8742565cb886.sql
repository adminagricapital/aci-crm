
-- Create storage bucket for beneficiary photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('beneficiaire-photos', 'beneficiaire-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload beneficiary photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'beneficiaire-photos');

-- Allow public read access to beneficiary photos
CREATE POLICY "Public can view beneficiary photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'beneficiaire-photos');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update beneficiary photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'beneficiaire-photos');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete beneficiary photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'beneficiaire-photos');
