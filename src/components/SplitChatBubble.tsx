import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Copy, Check, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface SplitChatBubbleProps {
  content: string;
  sender: 'user' | 'aura';
  timestamp: Date;
  onSpeak?: (text: string) => void;
  isLatest?: boolean;
}

// Split message into WhatsApp-style bubbles
const splitMessage = (content: string): string[] => {
  // Split on double newlines or single newlines
  const parts = content
    .split(/\n{2,}|\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  // If no splits found, return original
  if (parts.length <= 1) return [content];
  
  return parts;
};

// Single bubble component
const MessageBubble: React.FC<{
  content: string;
  isUser: boolean;
  showAvatar: boolean;
  isFirst: boolean;
  isLast: boolean;
  delay: number;
}> = ({ content, isUser, showAvatar, isFirst, isLast, delay }) => {
  // Parse basic markdown for AURRA responses
  const renderContent = (text: string) => {
    if (isUser) return text;
    
    // Convert **bold** to styled text
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut', delay }}
      className={cn(
        'flex w-full gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* AURRA Avatar - only show on first bubble */}
      {!isUser && (
        <div className="flex-shrink-0 mt-auto">
          {showAvatar ? (
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm ring-1 ring-border/30">
              <img 
                src={auraAvatar} 
                alt="AURRA" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10" /> // Spacer for alignment
          )}
        </div>
      )}

      <div className="flex flex-col max-w-[88%] sm:max-w-[78%]">
        <div 
          className={cn(
            'relative px-4 py-3',
            isUser 
              ? cn(
                  'bg-primary text-primary-foreground shadow-sm',
                  isFirst && isLast ? 'rounded-3xl rounded-br-lg' :
                  isFirst ? 'rounded-3xl rounded-br-lg rounded-bl-2xl' :
                  isLast ? 'rounded-2xl rounded-br-lg' :
                  'rounded-2xl'
                )
              : cn(
                  'bg-card border border-border/50 text-foreground shadow-sm',
                  isFirst && isLast ? 'rounded-3xl rounded-bl-lg' :
                  isFirst ? 'rounded-3xl rounded-bl-lg rounded-br-2xl' :
                  isLast ? 'rounded-2xl rounded-bl-lg' :
                  'rounded-2xl'
                )
          )}
        >
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {renderContent(content)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export const SplitChatBubble: React.FC<SplitChatBubbleProps> = ({
  content,
  sender,
  timestamp,
  onSpeak,
  isLatest = false,
}) => {
  const isUser = sender === 'user';
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  // Split AURRA messages into multiple bubbles
  const messageParts = isUser ? [content] : splitMessage(content);
  const isSplit = messageParts.length > 1;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied', { duration: 1500 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <div 
      className="space-y-1.5"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onTouchStart={() => setShowActions(true)}
    >
      {messageParts.map((part, index) => (
        <MessageBubble
          key={index}
          content={part}
          isUser={isUser}
          showAvatar={index === 0}
          isFirst={index === 0}
          isLast={index === messageParts.length - 1}
          delay={isLatest && !isUser ? index * 0.1 : 0}
        />
      ))}

      {/* Meta & Actions - show after last bubble */}
      <div className={cn(
        "flex items-center gap-2 px-2",
        isUser ? "justify-end mr-1" : "justify-start ml-14"
      )}>
        {/* Timestamp - Subtle */}
        <span className="text-[11px] text-muted-foreground/50 font-medium">
          {format(new Date(timestamp), 'h:mm a')}
        </span>

        {/* Actions - appear on interaction */}
        {!isUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: showActions ? 1 : 0 }}
            className="flex items-center gap-0.5"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-7 w-7 rounded-xl hover:bg-muted/60"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </Button>
            {onSpeak && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSpeak(content)}
                className="h-7 w-7 rounded-xl hover:bg-muted/60"
              >
                <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
