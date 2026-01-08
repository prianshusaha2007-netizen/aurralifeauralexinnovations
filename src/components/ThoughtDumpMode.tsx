/**
 * Thought Dump Mode - Wind-down Enhancement
 * 
 * Safe space to dump thoughts before sleep without judgment.
 * No responses, just listening. Optional reflection at the end.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, X, CheckCircle, Sparkles, Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface ThoughtDumpModeProps {
  onDismiss: () => void;
  onSaveThoughts?: (thoughts: string[]) => void;
  onReflect?: (thoughts: string) => void;
}

export const ThoughtDumpMode: React.FC<ThoughtDumpModeProps> = ({
  onDismiss,
  onSaveThoughts,
  onReflect,
}) => {
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [currentThought, setCurrentThought] = useState('');
  const [step, setStep] = useState<'intro' | 'dumping' | 'done'>('intro');
  const [isTyping, setIsTyping] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsTyping(false), 1000);
    return () => clearTimeout(timer);
  }, [step]);

  const handleAddThought = () => {
    if (!currentThought.trim()) return;
    
    setThoughts(prev => [...prev, currentThought.trim()]);
    setCurrentThought('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddThought();
    }
  };

  const handleDone = () => {
    if (thoughts.length > 0) {
      onSaveThoughts?.(thoughts);
    }
    setStep('done');
  };

  const handleReflect = () => {
    const allThoughts = thoughts.join('\n');
    onReflect?.(allThoughts);
    onDismiss();
  };

  const getIntroMessage = () => {
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 5) {
      return "Before you sleep, dump whatever's on your mind.\nNo judgment, no fixing. Just emptying.";
    }
    return "Need to get things off your chest?\nJust type. I'm just listening.";
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-4"
      >
        {/* AURRA Message */}
        <div className="flex gap-3 mb-4">
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-indigo-500/20 shrink-0">
            <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-1">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]"
            >
              {isTyping ? (
                <div className="flex gap-1.5 py-1">
                  <span className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <>
                  {step === 'intro' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Moon className="w-4 h-4" />
                        <span className="text-xs font-medium">Thought Dump</span>
                      </div>
                      <p className="text-foreground whitespace-pre-line">
                        {getIntroMessage()}
                      </p>
                    </div>
                  )}
                  
                  {step === 'dumping' && (
                    <p className="text-foreground text-sm">
                      {thoughts.length === 0 
                        ? "Just type whatever comes to mind..."
                        : `${thoughts.length} thought${thoughts.length > 1 ? 's' : ''} dumped. Keep going or hit done.`
                      }
                    </p>
                  )}
                  
                  {step === 'done' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Done</span>
                      </div>
                      <p className="text-foreground">
                        {thoughts.length > 0 
                          ? `${thoughts.length} thoughts emptied. Your mind's a bit lighter now. 🌙`
                          : "No pressure. Rest well. 🌙"
                        }
                      </p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full shrink-0 self-start"
            onClick={onDismiss}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Thought Input Area */}
        <AnimatePresence mode="wait">
          {step === 'intro' && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="ml-12 flex gap-2"
            >
              <Button
                onClick={() => setStep('dumping')}
                className="rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Start dumping
              </Button>
              <Button
                variant="ghost"
                onClick={onDismiss}
                className="rounded-full text-muted-foreground"
              >
                Not now
              </Button>
            </motion.div>
          )}

          {step === 'dumping' && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="ml-12 space-y-3"
            >
              {/* Previous thoughts */}
              {thoughts.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {thoughts.map((thought, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-muted/50 rounded-xl px-3 py-2 text-sm text-muted-foreground"
                    >
                      {thought}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  value={currentThought}
                  onChange={(e) => setCurrentThought(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Whatever's on your mind..."
                  className="min-h-[60px] rounded-xl bg-background/50 border-border/50 resize-none"
                  autoFocus
                />
                <div className="flex flex-col gap-2">
                  <Button
                    size="icon"
                    onClick={handleAddThought}
                    disabled={!currentThought.trim()}
                    className="rounded-xl h-10 w-10"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDone}
                    className="rounded-xl text-xs"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'done' && !isTyping && thoughts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="ml-12 flex gap-2"
            >
              <Button
                onClick={handleReflect}
                variant="outline"
                className="rounded-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Reflect on these
              </Button>
              <Button
                variant="ghost"
                onClick={onDismiss}
                className="rounded-full text-muted-foreground"
              >
                Just sleep
              </Button>
            </motion.div>
          )}

          {step === 'done' && !isTyping && thoughts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-12"
            >
              <Button
                variant="ghost"
                onClick={onDismiss}
                className="rounded-full text-muted-foreground"
              >
                Goodnight 🌙
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
