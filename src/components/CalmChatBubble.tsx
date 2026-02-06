import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Copy, Check, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface CalmChatBubbleProps {
  content: string;
  sender: 'user' | 'aura';
  timestamp: Date;
  onSpeak?: (text: string) => void;
  isLatest?: boolean;
}

// Calmer, more natural message splitting
const splitIntoThoughts = (content: string): string[] => {
  // Split on double newlines first (paragraph breaks)
  const paragraphs = content.split(/\n{2,}/);
  
  // For short messages, don't split
  if (content.length < 80) return [content];
  
  // For medium messages with paragraphs, use paragraph splits
  if (paragraphs.length > 1) {
    return paragraphs.map(p => p.trim()).filter(p => p.length > 0);
  }
  
  // For long single paragraphs, split on sentence boundaries
  if (content.length > 200) {
    const sentences = content.split(/(?<=[.!?])\s+(?=[A-Z])/);
    if (sentences.length > 3) {
      // Group sentences into 2-3 sentence chunks
      const chunks: string[] = [];
      for (let i = 0; i < sentences.length; i += 2) {
        chunks.push(sentences.slice(i, i + 2).join(' '));
      }
      return chunks;
    }
  }
  
  return [content];
};

// Parse markdown-like formatting
const renderFormattedText = (text: string, isUser: boolean) => {
  if (isUser) return text;
  
  // Convert **bold** and *italic* to styled text
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

// Single thought bubble - calmer, softer design
const ThoughtBubble: React.FC<{
  content: string;
  isUser: boolean;
  showAvatar: boolean;
  isFirst: boolean;
  isLast: boolean;
  delay: number;
}> = ({ content, isUser, showAvatar, isFirst, isLast, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.25, 
        ease: [0.25, 0.1, 0.25, 1],
        delay 
      }}
      className={cn(
        'flex w-full gap-2.5',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* AURRA Avatar - only show on first bubble, softer */}
      {!isUser && (
        <div className="flex-shrink-0 mt-auto mb-1">
          {showAvatar ? (
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm ring-1 ring-border/20">
              <img 
                src={auraAvatar} 
                alt="AURRA" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>
      )}

      <div className="flex flex-col max-w-[85%] sm:max-w-[75%]">
        <div 
          className={cn(
            'relative px-4 py-2.5 transition-colors',
            isUser 
              ? cn(
                  'bg-primary/90 text-primary-foreground',
                  isFirst && isLast ? 'rounded-2xl rounded-br-md' :
                  isFirst ? 'rounded-2xl rounded-br-md rounded-bl-xl' :
                  isLast ? 'rounded-xl rounded-br-md' :
                  'rounded-xl'
                )
              : cn(
                  'bg-muted/50 text-foreground border border-border/30',
                  isFirst && isLast ? 'rounded-2xl rounded-bl-md' :
                  isFirst ? 'rounded-2xl rounded-bl-md rounded-br-xl' :
                  isLast ? 'rounded-xl rounded-bl-md' :
                  'rounded-xl'
                )
          )}
        >
          <p className={cn(
            "text-[15px] leading-[1.55] whitespace-pre-wrap",
            !isUser && "text-foreground/90"
          )}>
            {renderFormattedText(content, isUser)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export const CalmChatBubble: React.FC<CalmChatBubbleProps> = ({
  content,
  sender,
  timestamp,
  onSpeak,
  isLatest = false,
}) => {
  const isUser = sender === 'user';
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  // Split AURRA messages into natural thought bubbles
  const thoughts = isUser ? [content] : splitIntoThoughts(content);
  const hasMultipleThoughts = thoughts.length > 1;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied', { duration: 1200 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <div 
      className={cn(
        "space-y-1",
        hasMultipleThoughts && "space-y-1.5"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onTouchStart={() => setShowActions(true)}
    >
      {thoughts.map((thought, index) => (
        <ThoughtBubble
          key={index}
          content={thought}
          isUser={isUser}
          showAvatar={index === 0}
          isFirst={index === 0}
          isLast={index === thoughts.length - 1}
          delay={isLatest && !isUser ? index * 0.08 : 0}
        />
      ))}

      {/* Timestamp & Actions - minimal, subtle */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: isLatest ? 0.3 : 0 }}
        className={cn(
          "flex items-center gap-1.5 px-1",
          isUser ? "justify-end mr-1" : "justify-start ml-11"
        )}
      >
        <span className="text-[10px] text-muted-foreground/40 font-medium tracking-tight">
          {format(new Date(timestamp), 'h:mm a')}
        </span>

        {!isUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: showActions ? 1 : 0 }}
            className="flex items-center"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-6 w-6 rounded-lg hover:bg-muted/80"
            >
              {copied ? (
                <Check className="w-3 h-3 text-primary" />
              ) : (
                <Copy className="w-3 h-3 text-muted-foreground/60" />
              )}
            </Button>
            {onSpeak && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSpeak(content)}
                className="h-6 w-6 rounded-lg hover:bg-muted/80"
              >
                <Volume2 className="w-3 h-3 text-muted-foreground/60" />
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
