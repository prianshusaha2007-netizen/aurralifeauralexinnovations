/**
 * ChatImageUpload - Inline image upload for chat with preview
 * 
 * Allows users to upload/capture images directly in chat.
 * AURRA responds conversationally about the image content.
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatImageUploadProps {
  onImageSelected: (file: File, base64: string) => void;
  isAnalyzing?: boolean;
  className?: string;
}

export const ChatImageUpload: React.FC<ChatImageUploadProps> = ({
  onImageSelected,
  isAnalyzing = false,
  className,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) return; // 10MB limit

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      onImageSelected(file, base64);
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Image action buttons for media sheet */}
      <div className={cn("flex gap-2", className)}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 flex-1"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Image className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">Photo</p>
            <p className="text-xs text-muted-foreground">Upload image</p>
          </div>
        </button>
        
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={isAnalyzing}
          className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 flex-1"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">Camera</p>
            <p className="text-xs text-muted-foreground">Take photo</p>
          </div>
        </button>
      </div>

      {/* Inline preview in chat */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative inline-block"
          >
            <img 
              src={preview} 
              alt="Upload preview" 
              className="rounded-xl max-h-48 max-w-64 object-cover border border-border/30"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Looking at this...
                </div>
              </div>
            )}
            {!isAnalyzing && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80"
                onClick={clearPreview}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * ChatImageBubble - Displays an analyzed image in the chat stream
 */
export const ChatImageBubble: React.FC<{
  imageUrl: string;
  analysis: string;
  isLoading?: boolean;
}> = ({ imageUrl, analysis, isLoading }) => {
  return (
    <div className="space-y-2">
      <img 
        src={imageUrl} 
        alt="Shared image" 
        className="rounded-xl max-h-56 max-w-full object-cover border border-border/30"
      />
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Let me look at this...
        </div>
      )}
    </div>
  );
};
