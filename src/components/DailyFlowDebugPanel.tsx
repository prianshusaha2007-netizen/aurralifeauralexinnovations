import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Bug, X, Sun, Moon, Sparkles, RotateCcw, Clock } from 'lucide-react';

interface DailyFlowDebugPanelProps {
  onTriggerMorning: () => void;
  onTriggerNight: () => void;
  onTriggerFirstTime: () => void;
  onResetFlow: () => void;
  flowState: {
    showPreferences: boolean;
    showMorningFlow: boolean;
    showWindDown: boolean;
    isFirstTimeUser: boolean;
  };
}

export const DailyFlowDebugPanel: React.FC<DailyFlowDebugPanelProps> = ({
  onTriggerMorning,
  onTriggerNight,
  onTriggerFirstTime,
  onResetFlow,
  flowState,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <>
      {/* Floating Debug Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-32 left-4 z-50 w-10 h-10 rounded-full bg-amber-500/90 text-white shadow-lg flex items-center justify-center hover:bg-amber-600 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        title="Daily Flow Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </motion.button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -20, y: 20 }}
            className="fixed bottom-44 left-4 z-50 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-amber-500/10 border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-sm">24-Hour Flow Debug</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current State */}
            <div className="p-3 border-b border-border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Current State:</p>
              <div className="flex flex-wrap gap-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full ${flowState.isFirstTimeUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  First Time: {flowState.isFirstTimeUser ? 'Yes' : 'No'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${flowState.showPreferences ? 'bg-violet-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  Prefs: {flowState.showPreferences ? 'On' : 'Off'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${flowState.showMorningFlow ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  Morning: {flowState.showMorningFlow ? 'On' : 'Off'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${flowState.showWindDown ? 'bg-indigo-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  Night: {flowState.showWindDown ? 'On' : 'Off'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-2">
              <p className="text-xs text-muted-foreground mb-2">Simulate Flow:</p>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={onTriggerMorning}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Morning Briefing</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={onTriggerNight}
              >
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>Night Wind-Down</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={onTriggerFirstTime}
              >
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span>First Time Setup</span>
              </Button>

              <div className="pt-2 border-t border-border mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
                  onClick={onResetFlow}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All Flow State</span>
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-3 py-2 bg-muted/30 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                Dev only • Hidden in production
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
