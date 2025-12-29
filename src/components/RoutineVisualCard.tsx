import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RoutineVisualCardProps {
  imageUrl: string;
  isVisible: boolean;
  isGenerating?: boolean;
  onDismiss: () => void;
  onRegenerate?: () => void;
  onDownload?: () => void;
  className?: string;
}

export const RoutineVisualCard: React.FC<RoutineVisualCardProps> = ({
  imageUrl,
  isVisible,
  isGenerating = false,
  onDismiss,
  onRegenerate,
  onDownload,
  className,
}) => {
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }

    // Default download behavior
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `routine-visual-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn("w-full", className)}
        >
          <Card className="overflow-hidden bg-card/95 backdrop-blur-sm border-border/50">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Your Daily Routine</span>
              </div>
              <div className="flex items-center gap-1">
                {onRegenerate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRegenerate}
                    disabled={isGenerating}
                    className="h-8 w-8 rounded-full hover:bg-muted"
                  >
                    <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="h-8 w-8 rounded-full hover:bg-muted"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDismiss}
                  className="h-8 w-8 rounded-full hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Image */}
            <div className="relative">
              {isGenerating ? (
                <div className="flex items-center justify-center h-64 bg-muted/30">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground">Creating your visual...</span>
                  </div>
                </div>
              ) : (
                <motion.img
                  src={imageUrl}
                  alt="Your daily routine visualization"
                  className="w-full h-auto max-h-[60vh] object-contain bg-background"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                />
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Floating button to open saved visual
interface RoutineVisualButtonProps {
  hasVisual: boolean;
  onClick: () => void;
  className?: string;
}

export const RoutineVisualButton: React.FC<RoutineVisualButtonProps> = ({
  hasVisual,
  onClick,
  className,
}) => {
  if (!hasVisual) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-full",
        "bg-primary/10 hover:bg-primary/20 text-primary",
        "border border-primary/20 transition-colors",
        className
      )}
    >
      <Eye className="w-4 h-4" />
      <span className="text-sm font-medium">View Routine</span>
    </motion.button>
  );
};
