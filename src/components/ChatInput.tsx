/**
 * ChatInput - Calm, presence-like input experience
 * 
 * Philosophy: The input should feel inviting, not demanding.
 * Minimal chrome, gentle animations, human-first.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Send, Mic, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onVoiceClick: () => void;
  onMediaClick: () => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onVoiceClick,
  onMediaClick,
  placeholder = "What's on your mind?",
  isLoading = false,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSend();
      }
    }
  };

  const hasContent = value.trim().length > 0;

  return (
    <div className="relative">
      <motion.div
        className={cn(
          "flex items-end gap-2 p-3 bg-muted/30 rounded-2xl transition-colors",
          isFocused && "bg-muted/40",
          disabled && "opacity-50"
        )}
        layout
      >
        {/* Media button - subtle */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground shrink-0"
          onClick={onMediaClick}
          disabled={disabled}
        >
          <Plus className="w-5 h-5" />
        </Button>

        {/* Textarea - grows naturally */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 bg-transparent border-0 resize-none text-foreground placeholder:text-muted-foreground/60",
            "focus:outline-none focus:ring-0 py-2 px-1",
            "text-[16px] leading-relaxed" // 16px prevents iOS zoom
          )}
          style={{ minHeight: '36px', maxHeight: '120px' }}
        />

        {/* Action button - send or voice */}
        <AnimatePresence mode="wait">
          {hasContent ? (
            <motion.div
              key="send"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                type="button"
                size="icon"
                className="h-9 w-9 rounded-full shrink-0"
                onClick={onSend}
                disabled={isLoading || disabled}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="voice"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground shrink-0"
                onClick={onVoiceClick}
                disabled={disabled}
              >
                <Mic className="w-5 h-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
