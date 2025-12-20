import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  Download, Share2, Copy, Check, Volume2, VolumeX, ImageIcon, 
  CornerUpLeft, Smile, Heart, ThumbsUp, Laugh, Sparkles, 
  MoreHorizontal, Bookmark, Trash2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface EnhancedChatBubbleProps {
  id: string;
  content: string;
  sender: 'user' | 'aura';
  timestamp: Date;
  className?: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  onSpeak?: (text: string) => void;
  onStopSpeaking?: () => void;
  isSpeaking?: boolean;
  onReply?: () => void;
  replyTo?: { content: string; sender: string } | null;
  reactions?: string[];
  onReact?: (emoji: string) => void;
  onPin?: () => void;
  onDelete?: () => void;
  isPinned?: boolean;
}

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

export const EnhancedChatBubble: React.FC<EnhancedChatBubbleProps> = ({
  id,
  content,
  sender,
  timestamp,
  className,
  imageUrl,
  isGeneratingImage,
  onSpeak,
  onStopSpeaking,
  isSpeaking = false,
  onReply,
  replyTo,
  reactions = [],
  onReact,
  onPin,
  onDelete,
  isPinned = false,
}) => {
  const isUser = sender === 'user';
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  // Swipe to reply
  const x = useMotionValue(0);
  const replyOpacity = useTransform(x, [0, 50, 80], [0, 0.5, 1]);
  const replyScale = useTransform(x, [0, 50, 80], [0.5, 0.8, 1]);
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 60 && onReply) {
      onReply();
      toast.info('Swipe right to reply! ↩️');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied! 📋');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  const handleDownload = async () => {
    const url = imageUrl || extractedImageUrl;
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `aura-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('Image saved! 📥');
    } catch {
      toast.error('Could not download');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'AURA Chat', text: content });
      } else {
        await navigator.clipboard.writeText(content);
        toast.success('Copied to share! 📋');
      }
    } catch {
      // User cancelled
    }
  };

  const handleReaction = (emoji: string) => {
    onReact?.(emoji);
    setShowReactions(false);
  };

  const handleSpeakClick = () => {
    if (isSpeaking) {
      onStopSpeaking?.();
    } else {
      onSpeak?.(textContent);
    }
  };

  // Extract image URL from markdown
  const extractedImageUrl = imageUrl || (content.match(/!\[.*?\]\((data:image\/[^)]+)\)/)?.[1]);
  const textContent = content.replace(/!\[.*?\]\(data:image\/[^)]+\)/g, '').trim();

  // Parse markdown
  const renderContent = (text: string) => {
    if (isUser) return text;
    
    // Bold text
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
      className={cn(
        'flex w-full gap-2 group relative',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); setShowMoreMenu(false); }}
    >
      {/* Swipe Reply Indicator */}
      {!isUser && (
        <motion.div
          style={{ opacity: replyOpacity, scale: replyScale }}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 bg-primary/20 rounded-full p-2"
        >
          <CornerUpLeft className="w-4 h-4 text-primary" />
        </motion.div>
      )}

      {/* AURA Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-auto">
          <div className="w-9 h-9 rounded-full overflow-hidden shadow-lg shadow-primary/20 ring-2 ring-primary/30">
            <img src={auraAvatar} alt="AURA" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      <motion.div 
        drag={!isUser ? "x" : false}
        dragConstraints={{ left: 0, right: 80 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="flex flex-col max-w-[85%] sm:max-w-[75%] relative"
      >
        {/* Reply Preview */}
        {replyTo && (
          <div className={cn(
            "mb-1 px-3 py-1.5 rounded-lg text-xs border-l-2",
            isUser 
              ? "bg-primary/20 border-primary/50 text-primary-foreground/70" 
              : "bg-muted/50 border-muted-foreground/30 text-muted-foreground"
          )}>
            <span className="font-medium">{replyTo.sender === 'user' ? 'You' : 'AURA'}</span>
            <p className="truncate">{replyTo.content.slice(0, 50)}...</p>
          </div>
        )}

        {/* Message Bubble */}
        <div 
          className={cn(
            'relative px-4 py-3 shadow-sm',
            isUser 
              ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-br-sm' 
              : 'bg-card border border-border/50 text-card-foreground rounded-2xl rounded-bl-sm',
            isPinned && 'ring-2 ring-amber-500/30'
          )}
        >
          {/* Pin indicator */}
          {isPinned && (
            <Bookmark className="absolute -top-2 -right-2 w-5 h-5 text-amber-500 fill-amber-500" />
          )}

          {/* Image Loading */}
          {isGeneratingImage && (
            <div className="flex items-center gap-3 mb-3 p-3 bg-primary/10 rounded-xl">
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
              <span className="text-sm text-primary font-medium">Creating magic... ✨</span>
            </div>
          )}

          {/* Generated Image */}
          {extractedImageUrl && (
            <div className="mb-3 space-y-2">
              <div className="relative rounded-xl overflow-hidden bg-muted/30">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 animate-pulse">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                )}
                <img 
                  src={extractedImageUrl} 
                  alt="Generated"
                  className={cn(
                    "w-full max-w-sm rounded-xl transition-all duration-500",
                    imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  )}
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 px-2 text-xs rounded-full">
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={handleShare} className="h-7 px-2 text-xs rounded-full">
                  <Share2 className="w-3.5 h-3.5 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          )}

          {/* Text Content */}
          {textContent && (
            <p className={cn(
              "text-[15px] leading-relaxed whitespace-pre-wrap",
              !isUser && "text-foreground"
            )}>
              {renderContent(textContent)}
            </p>
          )}

          {/* Reactions Display */}
          {reactions.length > 0 && (
            <div className={cn(
              "absolute -bottom-3 flex gap-0.5 px-1.5 py-0.5 rounded-full bg-card border border-border shadow-sm",
              isUser ? "right-2" : "left-2"
            )}>
              {[...new Set(reactions)].map((emoji, i) => (
                <span key={i} className="text-sm">{emoji}</span>
              ))}
              {reactions.length > 1 && (
                <span className="text-xs text-muted-foreground ml-0.5">{reactions.length}</span>
              )}
            </div>
          )}
        </div>

        {/* Reaction Picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className={cn(
                "absolute -top-12 z-50 flex gap-1 p-1.5 rounded-full bg-card border border-border shadow-xl",
                isUser ? "right-0" : "left-0"
              )}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-all hover:scale-125 active:scale-95"
                >
                  <span className="text-lg">{emoji}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* More Menu */}
        <AnimatePresence>
          {showMoreMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "absolute top-0 z-50 p-1 rounded-xl bg-card border border-border shadow-xl min-w-[140px]",
                isUser ? "right-full mr-2" : "left-full ml-2"
              )}
            >
              {onPin && (
                <button
                  onClick={() => { onPin(); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                >
                  <Bookmark className={cn("w-4 h-4", isPinned && "fill-amber-500 text-amber-500")} />
                  {isPinned ? 'Unpin' : 'Pin'}
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onDelete(); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Meta & Actions */}
        <div className={cn(
          "flex items-center gap-1.5 mt-1 px-1",
          isUser ? "justify-end" : "justify-start",
          reactions.length > 0 && "mt-4"
        )}>
          <span className="text-[11px] text-muted-foreground/70">
            {format(new Date(timestamp), 'h:mm a')}
          </span>

          {/* Actions - show on hover */}
          <AnimatePresence>
            {showActions && (
              <motion.div 
                initial={{ opacity: 0, x: isUser ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isUser ? 10 : -10 }}
                className="flex items-center gap-0.5"
              >
                {/* Reply */}
                {onReply && (
                  <Button variant="ghost" size="icon" onClick={onReply} className="h-6 w-6 rounded-full" title="Reply">
                    <CornerUpLeft className="w-3 h-3" />
                  </Button>
                )}

                {/* React */}
                {onReact && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowReactions(!showReactions)} 
                    className="h-6 w-6 rounded-full"
                  >
                    <Smile className="w-3 h-3" />
                  </Button>
                )}

                {/* Copy */}
                {!isUser && (
                  <Button variant="ghost" size="icon" onClick={handleCopy} className="h-6 w-6 rounded-full">
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </Button>
                )}

                {/* Speak */}
                {!isUser && onSpeak && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleSpeakClick} 
                    className={cn("h-6 w-6 rounded-full", isSpeaking && "text-primary bg-primary/10")}
                  >
                    {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </Button>
                )}

                {/* More */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowMoreMenu(!showMoreMenu)} 
                  className="h-6 w-6 rounded-full"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 mt-auto">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xs font-bold text-secondary-foreground shadow-lg">
            U
          </div>
        </div>
      )}
    </motion.div>
  );
};
