-- Create analyzed_images table to store gallery items
CREATE TABLE public.analyzed_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_image_url TEXT NOT NULL,
  transformed_image_url TEXT,
  analysis_data JSONB,
  annotations TEXT[],
  transformation_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analyzed_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own images" ON public.analyzed_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own images" ON public.analyzed_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own images" ON public.analyzed_images FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for analyzed images
INSERT INTO storage.buckets (id, name, public) VALUES ('analyzed-images', 'analyzed-images', true);

-- Storage policies
CREATE POLICY "Anyone can view analyzed images" ON storage.objects FOR SELECT USING (bucket_id = 'analyzed-images');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'analyzed-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their images" ON storage.objects FOR DELETE USING (bucket_id = 'analyzed-images' AND auth.uid()::text = (storage.foldername(name))[1]);