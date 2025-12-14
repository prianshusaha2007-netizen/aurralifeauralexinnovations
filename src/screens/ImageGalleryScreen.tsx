import React, { useState, useEffect } from 'react';
import { Images, Trash2, Share2, Download, Loader2, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface GalleryImage {
  id: string;
  original_image_url: string;
  transformed_image_url: string | null;
  analysis_data: {
    confidence?: number;
    outfitScore?: number;
    aesthetic?: number;
    mood?: string;
    vibe?: string;
    compliment?: string;
  } | null;
  annotations: string[] | null;
  transformation_type: string | null;
  created_at: string;
}

export const ImageGalleryScreen: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('analyzed_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages((data as GalleryImage[]) || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from('analyzed_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setImages(prev => prev.filter(img => img.id !== id));
      toast.success('Image deleted');
      if (selectedImage?.id === id) setSelectedImage(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    } finally {
      setDeleting(null);
    }
  };

  const handleShare = async (image: GalleryImage) => {
    const imageUrl = image.transformed_image_url || image.original_image_url;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AURA Analyzed Image',
          text: image.analysis_data?.compliment || 'Check out my AURA analysis!',
          url: imageUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await copyToClipboard(imageUrl);
        }
      }
    } else {
      await copyToClipboard(imageUrl);
    }
  };

  const copyToClipboard = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleDownload = (image: GalleryImage) => {
    const imageUrl = image.transformed_image_url || image.original_image_url;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `aura-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading image...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-4">
            <Images className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Image Gallery</span>
          </div>
          <h1 className="text-2xl font-bold">My Analyzed Images</h1>
          <p className="text-muted-foreground mt-1">
            {images.length} images saved
          </p>
        </div>

        {images.length === 0 ? (
          <Card className="p-8 text-center">
            <Images className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No images yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Analyze and save images to see them here
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {images.map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <Card className="overflow-hidden">
                  <img
                    src={image.transformed_image_url || image.original_image_url}
                    alt="Analyzed"
                    className="w-full h-32 object-cover cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  />
                  {image.transformation_type && (
                    <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                      {image.transformation_type}
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => setSelectedImage(image)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => handleShare(image)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => handleDownload(image)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
                {image.analysis_data?.mood && (
                  <p className="text-xs text-muted-foreground mt-1 truncate px-1">
                    {image.analysis_data.mood} • {image.analysis_data.vibe?.slice(0, 15)}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Image Detail Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <img
                    src={selectedImage.transformed_image_url || selectedImage.original_image_url}
                    alt="Selected"
                    className="w-full max-h-64 object-cover rounded-t-2xl"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                    onClick={() => setSelectedImage(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-4 space-y-4">
                  {selectedImage.analysis_data?.compliment && (
                    <p className="font-medium text-lg">{selectedImage.analysis_data.compliment}</p>
                  )}

                  {selectedImage.analysis_data && (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedImage.analysis_data.confidence && (
                        <div className="p-2 rounded-lg bg-muted text-center">
                          <p className="text-xs text-muted-foreground">Confidence</p>
                          <p className="font-bold text-primary">{selectedImage.analysis_data.confidence}</p>
                        </div>
                      )}
                      {selectedImage.analysis_data.outfitScore && (
                        <div className="p-2 rounded-lg bg-muted text-center">
                          <p className="text-xs text-muted-foreground">Outfit</p>
                          <p className="font-bold text-primary">{selectedImage.analysis_data.outfitScore}</p>
                        </div>
                      )}
                      {selectedImage.analysis_data.aesthetic && (
                        <div className="p-2 rounded-lg bg-muted text-center">
                          <p className="text-xs text-muted-foreground">Aesthetic</p>
                          <p className="font-bold text-primary">{selectedImage.analysis_data.aesthetic}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedImage.annotations && selectedImage.annotations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Annotations</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedImage.annotations.map((note, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {note}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Saved {new Date(selectedImage.created_at).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => handleShare(selectedImage)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" onClick={() => handleDownload(selectedImage)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(selectedImage.id)}
                      disabled={deleting === selectedImage.id}
                    >
                      {deleting === selectedImage.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
