import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileAnalysisResult {
  analysis: string;
  fileName: string;
  fileType: string;
}

interface ImageGenerationResult {
  imageUrl: string;
  textContent: string;
  prompt: string;
}

interface DocumentResult {
  title: string;
  content: string;
  htmlDocument: string;
  textDocument: string;
  format: string;
}

export const useMediaActions = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  // Analyze uploaded file
  const analyzeFile = useCallback(async (file: File): Promise<FileAnalysisResult | null> => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', file.type.startsWith('image/') ? 'image' : 'document');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-file`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: formData,
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze file');
      }
      
      const result = await response.json();
      return result as FileAnalysisResult;
      
    } catch (err) {
      console.error('File analysis error:', err);
      toast.error('Failed to analyze file');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Generate image
  const generateImage = useCallback(async (prompt: string): Promise<ImageGenerationResult | null> => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('aura-generate-image', {
        body: { prompt }
      });
      
      if (error) throw error;
      
      if (!data?.imageUrl) {
        throw new Error('No image generated');
      }
      
      return data as ImageGenerationResult;
      
    } catch (err) {
      console.error('Image generation error:', err);
      toast.error('Failed to generate image');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Create document
  const createDocument = useCallback(async (
    title: string, 
    content: string, 
    format: 'doc' | 'pdf' | 'txt' = 'doc',
    sections?: string[]
  ): Promise<DocumentResult | null> => {
    setIsCreatingDoc(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-document', {
        body: { title, content, format, sections }
      });
      
      if (error) throw error;
      
      return data as DocumentResult;
      
    } catch (err) {
      console.error('Document creation error:', err);
      toast.error('Failed to create document');
      return null;
    } finally {
      setIsCreatingDoc(false);
    }
  }, []);

  // Download document
  const downloadDocument = useCallback((
    base64Content: string, 
    filename: string, 
    mimeType: string
  ) => {
    try {
      const content = decodeURIComponent(escape(atob(base64Content)));
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download file');
    }
  }, []);

  // Download image
  const downloadImage = useCallback(async (imageUrl: string, filename: string = 'aura-generated.png') => {
    try {
      // Handle base64 data URLs
      if (imageUrl.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Fetch and download external URLs
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast.success('Image downloaded');
    } catch (err) {
      console.error('Image download error:', err);
      toast.error('Failed to download image');
    }
  }, []);

  // Analyze image inline (conversational style for chat)
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  
  const analyzeImageInline = useCallback(async (base64Image: string): Promise<string | null> => {
    setIsAnalyzingImage(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-image-general', {
        body: { image: base64Image }
      });
      
      if (error) throw error;
      
      // Build a conversational response from the structured data
      let response = data.summary || 'I can see the image.';
      
      // Add text detection info conversationally
      if (data.text_detected?.length > 0) {
        const textSnippet = data.text_detected.slice(0, 3).join(', ');
        response += `\n\nI can see some text: "${textSnippet}"`;
        if (data.text_detected.length > 3) {
          response += ` and more.`;
        }
        response += `\nWant me to help you understand or summarize it?`;
      }
      
      // Add object context
      if (data.objects?.length > 0 && !data.text_detected?.length) {
        const topObjects = data.objects.slice(0, 3).map((o: any) => o.name).join(', ');
        response += `\n\nI notice: ${topObjects}.`;
      }
      
      return response;
    } catch (err) {
      console.error('Image analysis error:', err);
      return null;
    } finally {
      setIsAnalyzingImage(false);
    }
  }, []);

  return {
    analyzeFile,
    generateImage,
    createDocument,
    downloadDocument,
    downloadImage,
    analyzeImageInline,
    isUploading,
    isGenerating,
    isCreatingDoc,
    isAnalyzingImage,
  };
};
