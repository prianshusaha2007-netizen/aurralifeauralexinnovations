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
      toast.success('Copied 📋', { duration: 1500 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  // Parse basic markdown for AURA responses
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'flex w-full gap-3 group',
        isUser ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* AURA Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-auto">
          <div className="w-9 h-9 rounded-full overflow-hidden shadow-md ring-2 ring-primary/10">
            <img 
              src={auraAvatar} 
              alt="AURA" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col max-w-[85%] sm:max-w-[75%]">
        {/* Message Bubble */}
        <div 
          className={cn(
            'relative px-4 py-3',
            isUser 
              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm' 
              : 'bg-card/80 backdrop-blur-sm border border-border/40 text-foreground rounded-2xl rounded-bl-sm'
          )}
        >
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {renderContent(content)}
          </p>
        </div>

        {/* Meta & Actions */}
        <div className={cn(
          "flex items-center gap-2 mt-1.5 px-1",
          isUser ? "justify-end" : "justify-start"
        )}>
          {/* Timestamp */}
          <span className="text-[11px] text-muted-foreground/60">
            {format(new Date(timestamp), 'h:mm a')}
          </span>

          {/* Actions - show on hover for AURA messages */}
          {!isUser && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: showActions ? 1 : 0 }}
              className="flex items-center gap-1"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-6 w-6 rounded-full hover:bg-muted/80"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground" />
                )}
              </Button>
              {onSpeak && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSpeak(content)}
                  className="h-6 w-6 rounded-full hover:bg-muted/80"
                >
                  <Volume2 className="w-3 h-3 text-muted-foreground" />
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
