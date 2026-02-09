import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAura } from '@/contexts/AuraContext';
import { toast } from 'sonner';

interface MemorySavePromptProps {
  content: string;
  category?: string;
  onClose: () => void;
}

export const MemorySavePrompt: React.FC<MemorySavePromptProps> = ({
  content,
  category = 'notes',
  onClose,
}) => {
  const { addMemory } = useAura();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await addMemory({ category, content });
      toast("I'll keep this in mind", { duration: 2000 });
      onClose();
    } catch {
      toast.error('Could not save');
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = () => {
    onClose();
  };

  const handleNeverAsk = () => {
    localStorage.setItem('aura-no-memory-prompts', 'true');
    toast("I won't ask again", { duration: 2000 });
    onClose();
  };

  // Truncate content for display
  const displayContent = content.length > 80 
    ? content.slice(0, 80) + '...' 
    : content;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="flex flex-col gap-3 p-4 bg-muted/30 rounded-2xl max-w-sm"
      >
        {/* Gentle question */}
        <p className="text-sm text-foreground">
          Should I remember this?
        </p>
        
        {/* Content preview - subtle */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {displayContent}
        </p>
        
        {/* Actions - simple, clear */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="default"
            className="h-8 rounded-full text-xs px-4"
            onClick={handleSave}
            disabled={saving}
          >
            <Check className="w-3 h-3 mr-1.5" />
            Yes
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-full text-xs px-3 text-muted-foreground"
            onClick={handleDismiss}
          >
            No
          </Button>
          <button
            onClick={handleNeverAsk}
            className="ml-auto text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            Don't ask
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
