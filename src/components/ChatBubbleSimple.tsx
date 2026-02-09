/**
 * ChatBubbleSimple - Minimal, calm chat bubble
 * 
 * Philosophy: Conversations should breathe.
 * No heavy styling, just clear content.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface ChatBubbleSimpleProps {
  content: string;
  sender: 'user' | 'aura';
  isTyping?: boolean;
}

export const ChatBubbleSimple: React.FC<ChatBubbleSimpleProps> = ({
  content,
  sender,
  isTyping = false,
}) => {
  const isUser = sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar - only for Aurra */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-0.5">
          <img 
            src={auraAvatar} 
            alt="aurra" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] py-3 px-4 rounded-2xl",
          isUser 
            ? "bg-primary text-primary-foreground rounded-br-md" 
            : "bg-muted/40 text-foreground rounded-bl-md"
        )}
      >
        {isTyping ? (
          <div className="flex gap-1 py-1">
            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        )}
      </div>
    </motion.div>
  );
};
