/**
 * DeepFocusOverlay - Fullscreen immersive focus mode
 * 
 * Philosophy: "When focus mode starts, the world quiets down — and AURRA stays."
 * 
 * Features:
 * - Fullscreen API for true immersion
 * - Inline chat (focus-only topics)
 * - Music control through AURRA
 * - Calm timer with no anxiety
 * - Image upload for task-related analysis
 * - Always-available exit (never trap the user)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Pause, Play, Music, Send, Mic, Image,
  BookOpen, Code, Briefcase, Palette, VolumeX, Dumbbell,
  Sparkles, Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FocusType } from '@/hooks/useFocusModeAI';
import { FocusAmbientPicker } from './FocusAmbientPicker';
import { useFocusAmbientMusic } from '@/hooks/useFocusAmbientMusic';
import auraAvatar from '@/assets/aura-avatar.jpeg';

const focusIcons: Record<FocusType, typeof BookOpen> = {
  study: BookOpen,
  coding: Code,
  work: Briefcase,
  creative: Palette,
  quiet: VolumeX,
  gym: Dumbbell,
};

interface FocusMessage {
  id: string;
  content: string;
  sender: 'user' | 'aura';
  timestamp: Date;
  imageUrl?: string;
}

interface DeepFocusOverlayProps {
  isActive: boolean;
  focusType: FocusType | null;
  goal: string;
  remainingTime: number;
  formatTime: (seconds: number) => string;
  duration: number;
  onEnd: () => void;
  onPause: () => void;
  onResume: () => void;
  isPaused: boolean;
  onSendMessage: (message: string) => void;
  onImageAnalysis?: (base64: string) => Promise<string>;
}

export const DeepFocusOverlay: React.FC<DeepFocusOverlayProps> = ({
  isActive,
  focusType,
  goal,
  remainingTime,
  formatTime,
  duration,
  onEnd,
  onPause,
  onResume,
  isPaused,
  onSendMessage,
  onImageAnalysis,
}) => {
  const [focusMessages, setFocusMessages] = useState<FocusMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const ambientMusic = useFocusAmbientMusic();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const Icon = focusType ? focusIcons[focusType] : Sparkles;
  const progress = duration > 0 ? ((duration * 60 - remainingTime) / (duration * 60)) * 100 : 0;

  // Enter fullscreen on mount
  useEffect(() => {
    if (isActive) {
      enterFullscreen();
      // Add initial presence message
      if (focusMessages.length === 0) {
        setFocusMessages([{
          id: 'welcome',
          content: "I'm here. Let's begin.",
          sender: 'aura',
          timestamp: new Date(),
        }]);
      }
    }
    return () => {
      exitFullscreen();
    };
  }, [isActive]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [focusMessages]);

  const enterFullscreen = useCallback(async () => {
    try {
      const el = overlayRef.current || document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (e) {
      console.log('Fullscreen not available:', e);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.log('Exit fullscreen error:', e);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleSendFocusMessage = useCallback(() => {
    const msg = inputValue.trim();
    if (!msg) return;

    // Add user message
    const userMsg: FocusMessage = {
      id: crypto.randomUUID(),
      content: msg,
      sender: 'user',
      timestamp: new Date(),
    };
    setFocusMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Check for non-focus messages and deflect gently
    const isOffTopic = /remind me|text someone|call|email|social media|instagram|twitter/i.test(msg);
    
    if (isOffTopic) {
      setTimeout(() => {
        setFocusMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          content: "Let's finish this focus session first. I'll remind you after.",
          sender: 'aura',
          timestamp: new Date(),
        }]);
      }, 500);
      return;
    }

    // Check for music requests
    const isMusicRequest = /music|song|track|playlist|volume|louder|quieter|change.*music/i.test(msg);
    if (isMusicRequest) {
      setShowMusicPicker(true);
      setTimeout(() => {
        setFocusMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          content: "Here are your music options.",
          sender: 'aura',
          timestamp: new Date(),
        }]);
      }, 300);
      return;
    }

    // Check for end requests
    const isEndRequest = /stop|end|done|quit|i'?m done|wrap up|that'?s enough/i.test(msg);
    if (isEndRequest) {
      setTimeout(() => {
        setFocusMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          content: "Okay. Let's pause. How did that feel?",
          sender: 'aura',
          timestamp: new Date(),
        }]);
        setTimeout(() => onEnd(), 1000);
      }, 300);
      return;
    }

    // Pass to main chat for AI response
    onSendMessage(msg);
    
    // Placeholder response (the real AI response comes through main chat)
    setTimeout(() => {
      setFocusMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        content: "Still here with you.",
        sender: 'aura',
        timestamp: new Date(),
      }]);
    }, 800);
  }, [inputValue, onSendMessage, onEnd]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      
      // Show image in chat
      setFocusMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        content: '',
        sender: 'user',
        timestamp: new Date(),
        imageUrl: base64,
      }]);

      // Analyze if handler provided
      if (onImageAnalysis) {
        setFocusMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          content: "Let me look at this...",
          sender: 'aura',
          timestamp: new Date(),
        }]);

        try {
          const analysis = await onImageAnalysis(base64);
          setFocusMessages(prev => {
            const filtered = prev.filter(m => m.content !== "Let me look at this...");
            return [...filtered, {
              id: crypto.randomUUID(),
              content: analysis,
              sender: 'aura',
              timestamp: new Date(),
            }];
          });
        } catch {
          setFocusMessages(prev => {
            const filtered = prev.filter(m => m.content !== "Let me look at this...");
            return [...filtered, {
              id: crypto.randomUUID(),
              content: "I had trouble analyzing that. Want to try again?",
              sender: 'aura',
              timestamp: new Date(),
            }];
          });
        }
      }
    };
    reader.readAsDataURL(file);
  }, [onImageAnalysis]);

  const handleEnd = useCallback(() => {
    exitFullscreen();
    ambientMusic.stopMusic();
    onEnd();
  }, [exitFullscreen, ambientMusic, onEnd]);

  if (!isActive) return null;

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col"
    >
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Header - Timer + Controls */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {focusType || 'Focus'} Mode
            </p>
            <p className="text-sm font-medium truncate max-w-48">{goal}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timer pill */}
          <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-mono text-sm font-bold">
            {formatTime(remainingTime)}
          </div>
          
          {/* Music */}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9 rounded-full", ambientMusic.isPlaying && "text-primary")}
            onClick={() => setShowMusicPicker(!showMusicPicker)}
          >
            <Music className="w-4 h-4" />
          </Button>

          {/* Pause/Play */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={isPaused ? onResume : onPause}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>

          {/* Exit - always available */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive"
            onClick={handleEnd}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Soft progress bar */}
      <div className="h-0.5 bg-muted/20">
        <motion.div 
          className="h-full bg-primary/40"
          style={{ width: `${progress}%` }}
          transition={{ duration: 1 }}
        />
      </div>

      {/* Music Picker */}
      <AnimatePresence>
        {showMusicPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 border-b border-border/20"
          >
            <div className="p-4">
              <FocusAmbientPicker 
                isOpen={true} 
                onClose={() => setShowMusicPicker(false)} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area - centered calm timer OR chat */}
      <div className="flex-1 relative z-10 flex flex-col">
        {!showChat ? (
          /* Calm centered view */
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {/* Timer ring */}
            <div className="relative w-56 h-56 mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="112" cy="112" r="104" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/10" />
                <circle
                  cx="112" cy="112" r="104" fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 104}`}
                  strokeDashoffset={`${2 * Math.PI * 104 * (1 - progress / 100)}`}
                  className="transition-all duration-1000 opacity-40"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold tracking-tight font-mono">
                  {formatTime(remainingTime)}
                </span>
                <span className="text-sm text-muted-foreground mt-2 max-w-32 truncate text-center">
                  {goal}
                </span>
              </div>
            </div>

            {isPaused && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted-foreground text-sm mb-4"
              >
                Paused — tap play to continue
              </motion.p>
            )}

            {/* Talk to AURRA button */}
            <Button
              variant="outline"
              className="rounded-full gap-2 px-6"
              onClick={() => {
                setShowChat(true);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
            >
              <Send className="w-4 h-4" />
              Talk to AURRA
            </Button>

            {/* Breathing guide */}
            <motion.p
              className="mt-12 text-muted-foreground/40 text-sm"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              Breathe and focus...
            </motion.p>
          </div>
        ) : (
          /* Focus chat view */
          <div className="flex-1 flex flex-col">
            {/* Minimize chat */}
            <div className="px-4 py-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setShowChat(false)}
              >
                <Minimize2 className="w-3 h-3 mr-1" />
                Timer view
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="max-w-lg mx-auto space-y-3">
                {focusMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-2",
                      msg.sender === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.sender === 'aura' && (
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-1">
                        <img src={auraAvatar} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                      msg.sender === 'user' 
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted/30 text-foreground rounded-bl-sm"
                    )}>
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="" className="rounded-lg max-h-40 mb-2" />
                      )}
                      {msg.content && <p className="whitespace-pre-line">{msg.content}</p>}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Focus chat input */}
            <div className="px-4 py-3 border-t border-border/20">
              <div className="max-w-lg mx-auto flex items-center gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full shrink-0 text-muted-foreground"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Image className="w-4 h-4" />
                </Button>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputValue.trim()) {
                      handleSendFocusMessage();
                    }
                  }}
                  placeholder="Ask about your task..."
                  className="flex-1 bg-muted/20 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-full shrink-0"
                  onClick={handleSendFocusMessage}
                  disabled={!inputValue.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom presence text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="relative z-10 text-center text-xs text-muted-foreground/40 pb-4"
      >
        I'm here with you.
      </motion.p>
    </motion.div>
  );
};
