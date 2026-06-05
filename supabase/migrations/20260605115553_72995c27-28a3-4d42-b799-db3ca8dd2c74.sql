
CREATE POLICY "Public read course thumbnails"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Admins upload course thumbnails"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update course thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete course thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'));
