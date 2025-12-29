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
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex w-full gap-3 group',
        isUser ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onTouchStart={() => setShowActions(true)}
    >
      {/* AURRA Avatar - Friendly, approachable */}
      {!isUser && (
        <div className="flex-shrink-0 mt-auto">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm ring-1 ring-border/30">
            <img 
              src={auraAvatar} 
              alt="AURRA" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col max-w-[88%] sm:max-w-[78%]">
        {/* Message Bubble - Soft, rounded, warm */}
        <div 
          className={cn(
            'relative px-4 py-3.5',
            isUser 
              ? 'bg-primary text-primary-foreground rounded-3xl rounded-br-lg shadow-sm' 
              : 'bg-card border border-border/50 text-foreground rounded-3xl rounded-bl-lg shadow-sm'
          )}
        >
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {renderContent(content)}
          </p>
        </div>

        {/* Meta & Actions - Minimal, non-intrusive */}
        <div className={cn(
          "flex items-center gap-2 mt-1.5 px-2",
          isUser ? "justify-end" : "justify-start"
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
    </motion.div>
  );
};