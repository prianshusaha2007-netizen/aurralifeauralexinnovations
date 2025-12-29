import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Download, Share2, Copy, Check, Volume2, ImageIcon, CornerUpLeft, Smile, Trash2, Pencil, X, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface ChatBubbleProps {
  content: string;
  sender: 'user' | 'aura';
  timestamp: Date;
  className?: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  onSpeak?: (text: string) => void;
  onReply?: () => void;
  onDelete?: () => void;
  onEdit?: (newContent: string) => void;
  onPin?: () => void;
  isPinned?: boolean;
  replyTo?: { content: string; sender: string } | null;
  reactions?: string[];
  onReact?: (emoji: string) => void;
  searchHighlight?: string;
}

const REACTION_EMOJIS = [
  { emoji: '❤️', label: 'love' },
  { emoji: '👍', label: 'like' },
  { emoji: '😂', label: 'laugh' },
  { emoji: '😮', label: 'wow' },
  { emoji: '😢', label: 'sad' },
  { emoji: '😠', label: 'angry' },
];

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  sender,
  timestamp,
  className,
  imageUrl,
  isGeneratingImage,
  onSpeak,
  onReply,
  onDelete,
  onEdit,
  onPin,
  isPinned,
  replyTo,
  reactions = [],
  onReact,
  searchHighlight
}) => {
  const isUser = sender === 'user';
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  
  // Swipe gesture
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    ['rgba(239,68,68,0.3)', 'rgba(0,0,0,0)', 'rgba(239,68,68,0.3)']
  );
  const deleteIconOpacity = useTransform(x, [-100, -50, 0, 50, 100], [1, 0.5, 0, 0.5, 1]);

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
    if (!imageUrl && !extractedImageUrl) return;
    const url = imageUrl || extractedImageUrl;
    try {
      const response = await fetch(url!);
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
        await navigator.share({
          title: 'AURA Chat',
          text: content,
        });
      } else {
        await navigator.clipboard.writeText(content);
        toast.success('Copied to share! 📋');
      }
    } catch {
      // User cancelled share
    }
  };

  const handleReaction = (emoji: string) => {
    onReact?.(emoji);
    setShowReactions(false);
  };

  const handleDelete = () => {
    onDelete?.();
    toast.success('Message deleted');
  };

  const handleDragEnd = () => {
    const xValue = x.get();
    if (Math.abs(xValue) > 80) {
      handleDelete();
    }
  };

  const handleEditSave = () => {
    if (editValue.trim() && editValue !== content) {
      onEdit?.(editValue.trim());
      toast.success('Message updated');
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(content);
    setIsEditing(false);
  };

  // Extract image URL from markdown format
  const extractedImageUrl = imageUrl || (content.match(/!\[.*?\]\((data:image\/[^)]+)\)/)?.[1]);
  const textContent = content.replace(/!\[.*?\]\(data:image\/[^)]+\)/g, '').trim();

  // Parse basic markdown and highlight search matches
  const renderContent = (text: string) => {
    // First handle search highlighting
    if (searchHighlight && searchHighlight.trim()) {
      const regex = new RegExp(`(${searchHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) => {
        if (part.toLowerCase() === searchHighlight.toLowerCase()) {
          return <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded">{part}</mark>;
        }
        if (!isUser && part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    }
    
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
    <div className="relative">
      {/* Delete indicator background */}
      <motion.div 
        style={{ background }}
        className="absolute inset-0 rounded-2xl flex items-center justify-between px-4"
      >
        <motion.div style={{ opacity: deleteIconOpacity }}>
          <Trash2 className="w-5 h-5 text-destructive" />
        </motion.div>
        <motion.div style={{ opacity: deleteIconOpacity }}>
          <Trash2 className="w-5 h-5 text-destructive" />
        </motion.div>
      </motion.div>

      <motion.div 
        style={{ x }}
        drag={onDelete ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'flex w-full gap-2 group relative bg-background',
          isUser ? 'justify-end' : 'justify-start',
          className
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
      >
      {/* AURA Avatar with Logo */}
      {!isUser && (
        <div className="flex-shrink-0 mt-auto">
          <div className="w-8 h-8 rounded-full overflow-hidden shadow-lg shadow-primary/20 ring-2 ring-primary/20">
            <img 
              src={auraAvatar} 
              alt="Auralex" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col max-w-[80%] sm:max-w-[75%] relative">
        {/* Pinned Indicator */}
        {isPinned && (
          <div className="flex items-center gap-1 text-xs text-primary mb-1">
            <Pin className="w-3 h-3 fill-primary" />
            <span>Pinned</span>
          </div>
        )}

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
              ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-br-md' 
              : 'bg-card border border-border/50 text-card-foreground rounded-2xl rounded-bl-md'
          )}
        >
          {/* Image Generation Loading */}
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
                  alt="Generated by AURA"
                  className={cn(
                    "w-full max-w-sm rounded-xl transition-all duration-500",
                    imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  )}
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
              {/* Image Actions */}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-7 px-2 text-xs hover:bg-primary/10 rounded-full"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-7 px-2 text-xs hover:bg-primary/10 rounded-full"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          )}

          {/* Text Content or Edit Mode */}
          {isEditing && isUser ? (
            <div className="flex gap-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSave();
                  if (e.key === 'Escape') handleEditCancel();
                }}
              />
              <Button size="icon" className="h-8 w-8" onClick={handleEditSave}>
                <Check className="w-3 h-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleEditCancel}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : textContent ? (
            <p className={cn(
              "text-[15px] leading-relaxed whitespace-pre-wrap",
              !isUser && "text-foreground"
            )}>
              {renderContent(textContent)}
            </p>
          ) : null}

          {/* Reactions Display */}
          {reactions.length > 0 && (
            <div className={cn(
              "absolute -bottom-3 flex gap-0.5 px-1.5 py-0.5 rounded-full bg-card border border-border shadow-sm",
              isUser ? "right-2" : "left-2"
            )}>
              {reactions.map((emoji, i) => (
                <span key={i} className="text-sm">{emoji}</span>
              ))}
            </div>
          )}

          {/* Bubble Tail Effect */}
          <div 
            className={cn(
              "absolute bottom-0 w-3 h-3",
              isUser 
                ? "right-0 translate-x-1/2 bg-primary" 
                : "left-0 -translate-x-1/2 bg-card border-l border-b border-border/50",
              "transform rotate-45 -z-10"
            )}
            style={{ 
              clipPath: isUser ? 'polygon(0 0, 100% 0, 100% 100%)' : 'polygon(0 0, 0 100%, 100% 100%)'
            }}
          />
        </div>

        {/* Reaction Picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className={cn(
                "absolute -top-12 z-50 flex gap-1 p-1.5 rounded-full bg-card border border-border shadow-lg",
                isUser ? "right-0" : "left-0"
              )}
            >
              {REACTION_EMOJIS.map(({ emoji }) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-all hover:scale-125"
                >
                  <span className="text-lg">{emoji}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Meta & Actions */}
        <div className={cn(
          "flex items-center gap-2 mt-1 px-1",
          isUser ? "justify-end" : "justify-start",
          reactions.length > 0 && "mt-4"
        )}>
          {/* Timestamp */}
          <span className="text-[11px] text-muted-foreground">
            {format(new Date(timestamp), 'h:mm a')}
          </span>

          {/* Quick Actions - show on hover */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: showActions ? 1 : 0 }}
            className="flex items-center gap-0.5"
          >
            {/* Edit Button - for user messages */}
            {isUser && onEdit && !isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 rounded-full hover:bg-muted"
                title="Edit"
              >
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </Button>
            )}

            {/* Reply Button */}
            {onReply && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onReply}
                className="h-6 w-6 rounded-full hover:bg-muted"
                title="Reply"
              >
                <CornerUpLeft className="w-3 h-3 text-muted-foreground" />
              </Button>
            )}

            {/* Pin Button */}
            {onPin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPin}
                className={cn("h-6 w-6 rounded-full hover:bg-muted", isPinned && "text-primary")}
                title={isPinned ? "Unpin" : "Pin"}
              >
                <Pin className={cn("w-3 h-3", isPinned ? "text-primary fill-primary" : "text-muted-foreground")} />
              </Button>
            )}

            {/* React Button */}
            {onReact && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowReactions(!showReactions)}
                className="h-6 w-6 rounded-full hover:bg-muted"
                title="React"
              >
                <Smile className="w-3 h-3 text-muted-foreground" />
              </Button>
            )}

            {/* Delete Button */}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="h-6 w-6 rounded-full hover:bg-destructive/10"
                title="Delete"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            )}

            {/* Copy Button - for AI messages */}
            {!isUser && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-6 w-6 rounded-full hover:bg-muted"
                title="Copy message"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground" />
                )}
              </Button>
            )}

            {/* Speak Button - for AI messages */}
            {!isUser && onSpeak && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSpeak(textContent)}
                className="h-6 w-6 rounded-full hover:bg-muted"
                title="Listen"
              >
                <Volume2 className="w-3 h-3 text-muted-foreground" />
              </Button>
            )}
          </motion.div>
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 mt-auto">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xs font-semibold text-secondary-foreground">
            U
          </div>
        </div>
      )}
      </motion.div>
    </div>
  );
};
