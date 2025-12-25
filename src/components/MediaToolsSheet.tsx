import React from 'react';
import { 
  Image, Video, Music, FileText, FileSpreadsheet, 
  Wand2, Gamepad2, Laugh, Target, X
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface MediaToolsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: string, message: string) => void;
}

const MEDIA_ITEMS = [
  { id: 'upload-image', icon: Image, label: 'Upload image', message: 'I want to upload an image for you to analyze' },
  { id: 'upload-video', icon: Video, label: 'Upload video', message: 'I want to upload a video' },
  { id: 'upload-audio', icon: Music, label: 'Upload audio', message: 'I want to upload an audio file' },
  { id: 'upload-file', icon: FileText, label: 'Upload file', message: 'I want to upload a file (PDF, DOC, XLS)' },
];

const CREATE_ITEMS = [
  { id: 'create-doc', icon: FileText, label: 'Create document', message: 'Help me create a document' },
  { id: 'create-pdf', icon: FileText, label: 'Create PDF', message: 'Help me create a PDF' },
  { id: 'create-excel', icon: FileSpreadsheet, label: 'Create spreadsheet', message: 'Help me create a spreadsheet' },
  { id: 'generate-image', icon: Wand2, label: 'Generate image', message: 'Generate an image for me' },
];

const FUN_ITEMS = [
  { id: 'play-game', icon: Gamepad2, label: 'Play a quick game', message: "Let's play a quick game!" },
  { id: 'crack-joke', icon: Laugh, label: 'Crack a joke', message: 'Tell me a joke 😄' },
  { id: 'mini-challenge', icon: Target, label: 'Mini challenge', message: 'Give me a fun mini challenge!' },
];

export const MediaToolsSheet: React.FC<MediaToolsSheetProps> = ({
  open,
  onOpenChange,
  onAction,
}) => {
  const handleItemClick = (item: { id: string; message: string }) => {
    onAction(item.id, item.message);
    onOpenChange(false);
  };

  const renderSection = (
    title: string, 
    emoji: string, 
    items: typeof MEDIA_ITEMS
  ) => (
    <div className="mb-6">
      <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <span>{emoji}</span> {title}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleItemClick(item)}
              className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/40 hover:bg-accent/50 hover:border-primary/30 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="relative pb-2">
          <DrawerTitle className="text-lg font-semibold">Media & Tools</DrawerTitle>
          <DrawerClose asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4 h-8 w-8 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        
        <div className="px-4 pb-8 overflow-y-auto">
          {renderSection('Media', '📎', MEDIA_ITEMS)}
          {renderSection('Create', '🧠', CREATE_ITEMS)}
          {renderSection('Fun & Uplift', '🎮', FUN_ITEMS)}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
