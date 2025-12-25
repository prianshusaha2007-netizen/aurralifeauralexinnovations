import React, { useRef, useState } from 'react';
import { 
  Image, Video, Music, FileText, FileSpreadsheet, 
  Wand2, Gamepad2, Laugh, Target, X, Upload, Loader2
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
import { toast } from 'sonner';

interface MediaToolsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: string, message: string) => void;
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

const MEDIA_ITEMS = [
  { id: 'upload-image', icon: Image, label: 'Upload image', accept: 'image/*' },
  { id: 'upload-video', icon: Video, label: 'Upload video', accept: 'video/*' },
  { id: 'upload-audio', icon: Music, label: 'Upload audio', accept: 'audio/*' },
  { id: 'upload-file', icon: FileText, label: 'Upload file', accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt' },
];

const CREATE_ITEMS = [
  { id: 'create-doc', icon: FileText, label: 'Create document', message: 'I want to create a document. What should it be about?' },
  { id: 'create-pdf', icon: FileText, label: 'Create PDF', message: 'I want to create a PDF document. Tell me what it should contain.' },
  { id: 'create-excel', icon: FileSpreadsheet, label: 'Create spreadsheet', message: 'I want to create a spreadsheet. What data should it include?' },
  { id: 'generate-image', icon: Wand2, label: 'Generate image', message: 'I want to generate an image. Describe what you\'re imagining 🎨' },
];

const FUN_ITEMS = [
  { id: 'play-game', icon: Gamepad2, label: 'Play a quick game', message: "Let's play a quick game! What would you like to play? 🎮" },
  { id: 'crack-joke', icon: Laugh, label: 'Crack a joke', message: 'Tell me a joke 😄' },
  { id: 'mini-challenge', icon: Target, label: 'Mini challenge', message: 'Give me a fun mini challenge! 🎯' },
];

export const MediaToolsSheet: React.FC<MediaToolsSheetProps> = ({
  open,
  onOpenChange,
  onAction,
  onFileSelect,
  isUploading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentAccept, setCurrentAccept] = useState('*/*');

  const handleMediaClick = (item: typeof MEDIA_ITEMS[0]) => {
    setCurrentAccept(item.accept);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      onOpenChange(false);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleActionClick = (item: { id: string; message: string }) => {
    onAction(item.id, item.message);
    onOpenChange(false);
  };

  const renderSection = (
    title: string, 
    emoji: string, 
    items: any[],
    isMedia: boolean = false
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
              onClick={() => isMedia ? handleMediaClick(item) : handleActionClick(item)}
              disabled={isUploading}
              className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/40 hover:bg-accent/50 hover:border-primary/30 transition-all text-left group disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                {isUploading && isMedia ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <Icon className="w-4 h-4 text-primary" />
                )}
              </div>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={currentAccept}
        onChange={handleFileChange}
        className="hidden"
      />
      
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
            {renderSection('Media', '📎', MEDIA_ITEMS, true)}
            {renderSection('Create', '🧠', CREATE_ITEMS)}
            {renderSection('Fun & Uplift', '🎮', FUN_ITEMS)}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
