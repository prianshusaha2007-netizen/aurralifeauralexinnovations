import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, X, Check } from 'lucide-react';
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
      toast.success("I'll remember this 💫", { duration: 2000 });
      onClose();
    } catch {
      toast.error('Could not save memory');
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = () => {
    onClose();
  };

  const handleNeverAsk = () => {
    localStorage.setItem('aura-no-memory-prompts', 'true');
    toast.info("Got it, I won't ask about saving things", { duration: 2000 });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-2xl max-w-md"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground mb-2">
            Should I remember this for you? 💭
          </p>
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            "{content}"
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="h-7 rounded-full text-xs"
              onClick={handleSave}
              disabled={saving}
            >
              <Check className="w-3 h-3 mr-1" />
              Yes, remember
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-full text-xs"
              onClick={handleDismiss}
            >
              Not now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 rounded-full text-xs text-muted-foreground"
              onClick={handleNeverAsk}
            >
              <X className="w-3 h-3 mr-1" />
              Don't ask
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
