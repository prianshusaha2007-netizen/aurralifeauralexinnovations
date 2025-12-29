import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, BookOpen, Dumbbell, Music, Code, 
  Plus, Trash2, Clock, Bell, Focus, Edit2,
  ChevronRight, Sparkles, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useRoutineBlocks, RoutineBlockType, RoutineBlock } from '@/hooks/useRoutineBlocks';

const BLOCK_ICONS: Record<RoutineBlockType, React.ElementType> = {
  morning: Sun,
  study: BookOpen,
  gym: Dumbbell,
  music: Music,
  coding: Code,
  night: Moon,
  meal: () => <span className="text-lg">🍽️</span>,
  hydration: () => <span className="text-lg">💧</span>,
  custom: Sparkles,
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface RoutineBlockEditorProps {
  className?: string;
}

export const RoutineBlockEditor: React.FC<RoutineBlockEditorProps> = ({ className }) => {
  const { 
    blocks, 
    activeBlock,
    addBlock, 
    updateBlock, 
    deleteBlock, 
    toggleBlockActive,
    createDefaultBlocks,
    DEFAULT_BLOCK_CONFIGS 
  } = useRoutineBlocks();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBlock, setEditingBlock] = useState<RoutineBlock | null>(null);
  
  // Form state
  const [formType, setFormType] = useState<RoutineBlockType>('study');
  const [formTitle, setFormTitle] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formDays, setFormDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [formFocusMode, setFormFocusMode] = useState(true);
  const [formNotifications, setFormNotifications] = useState(true);

  const resetForm = () => {
    setFormType('study');
    setFormTitle('');
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormDays([1, 2, 3, 4, 5]);
    setFormFocusMode(true);
    setFormNotifications(true);
    setEditingBlock(null);
  };

  const handleTypeChange = (type: RoutineBlockType) => {
    setFormType(type);
    const config = DEFAULT_BLOCK_CONFIGS[type];
    if (config && !formTitle) {
      setFormTitle(config.title);
    }
  };

  const toggleDay = (day: number) => {
    setFormDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleSubmit = () => {
    const config = DEFAULT_BLOCK_CONFIGS[formType];
    
    if (editingBlock) {
      updateBlock(editingBlock.id, {
        type: formType,
        title: formTitle || config.title,
        startTime: formStartTime,
        endTime: formEndTime,
        days: formDays,
        focusModeEnabled: formFocusMode,
        notificationsEnabled: formNotifications,
        color: config.color,
        icon: config.icon,
      });
    } else {
      addBlock({
        type: formType,
        title: formTitle || config.title,
        startTime: formStartTime,
        endTime: formEndTime,
        days: formDays,
        isActive: true,
        focusModeEnabled: formFocusMode,
        notificationsEnabled: formNotifications,
        color: config.color,
        icon: config.icon,
      });
    }
    
    setShowAddDialog(false);
    resetForm();
  };

  const handleEdit = (block: RoutineBlock) => {
    setEditingBlock(block);
    setFormType(block.type);
    setFormTitle(block.title);
    setFormStartTime(block.startTime);
    setFormEndTime(block.endTime);
    setFormDays(block.days);
    setFormFocusMode(block.focusModeEnabled);
    setFormNotifications(block.notificationsEnabled);
    setShowAddDialog(true);
  };

  const blockTypes = Object.keys(DEFAULT_BLOCK_CONFIGS) as RoutineBlockType[];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Routine Blocks</h2>
          <p className="text-sm text-muted-foreground">
            Set up your daily routine structure
          </p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="rounded-full aura-gradient"
          size="icon"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Active Block Indicator */}
      <AnimatePresence>
        {activeBlock && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4"
          >
            <Card className={cn(
              'p-4 border-2 border-primary bg-gradient-to-r',
              activeBlock.block.color
            )}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center">
                  <span className="text-xl">{activeBlock.block.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Currently Active</p>
                  <p className="text-sm text-foreground/80">{activeBlock.block.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{activeBlock.remainingMinutes}m</p>
                  <p className="text-xs text-foreground/70">remaining</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {blocks.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <Clock className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-2">No routine blocks yet</p>
          <p className="text-sm text-muted-foreground/70 mb-4 text-center">
            Create blocks for different parts of your day
          </p>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddDialog(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Block
            </Button>
            <Button onClick={createDefaultBlocks} className="aura-gradient">
              <Sparkles className="w-4 h-4 mr-2" />
              Use Template
            </Button>
          </div>
        </div>
      )}

      {/* Block List */}
      {blocks.length > 0 && (
        <ScrollArea className="flex-1">
          <div className="space-y-3 pb-4">
            <AnimatePresence>
              {blocks
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((block) => {
                  const Icon = BLOCK_ICONS[block.type];
                  const isCurrentlyActive = activeBlock?.block.id === block.id;
                  
                  return (
                    <motion.div
                      key={block.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <Card 
                        className={cn(
                          'p-4 transition-all',
                          !block.isActive && 'opacity-50',
                          isCurrentlyActive && 'ring-2 ring-primary'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
                            block.color
                          )}>
                            {typeof Icon === 'function' && Icon.length === 0 ? (
                              <span className="text-xl">{block.icon}</span>
                            ) : (
                              <Icon className="w-6 h-6 text-white" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">{block.title}</p>
                              {block.focusModeEnabled && (
                                <Focus className="w-4 h-4 text-primary" />
                              )}
                              {block.notificationsEnabled && (
                                <Bell className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {block.startTime} - {block.endTime}
                            </p>
                            <div className="flex gap-1 mt-2">
                              {DAY_LABELS.map((label, idx) => (
                                <span
                                  key={label}
                                  className={cn(
                                    'w-6 h-6 rounded-full text-xs flex items-center justify-center',
                                    block.days.includes(idx)
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground'
                                  )}
                                >
                                  {label[0]}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={block.isActive}
                              onCheckedChange={() => toggleBlockActive(block.id)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(block)}
                              className="h-8 w-8"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteBlock(block.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBlock ? 'Edit Block' : 'Add Routine Block'}
            </DialogTitle>
            <DialogDescription>
              Configure when and how this block should work
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Block Type Selector */}
            <div>
              <Label>Block Type</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {blockTypes.filter(t => t !== 'custom').map((type) => {
                  const config = DEFAULT_BLOCK_CONFIGS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleTypeChange(type)}
                      className={cn(
                        'p-3 rounded-xl text-center transition-all border-2',
                        formType === type
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent bg-muted hover:bg-muted/80'
                      )}
                    >
                      <span className="text-2xl block mb-1">{config.icon}</span>
                      <span className="text-xs capitalize">{type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label>Title</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={DEFAULT_BLOCK_CONFIGS[formType].title}
                className="mt-1"
              />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Days */}
            <div>
              <Label>Active Days</Label>
              <div className="flex gap-2 mt-2">
                {DAY_LABELS.map((label, idx) => (
                  <button
                    key={label}
                    onClick={() => toggleDay(idx)}
                    className={cn(
                      'w-10 h-10 rounded-full font-medium transition-all',
                      formDays.includes(idx)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {label[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Focus Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Reduce distractions during this block
                  </p>
                </div>
                <Switch
                  checked={formFocusMode}
                  onCheckedChange={setFormFocusMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Get reminded when block starts
                  </p>
                </div>
                <Switch
                  checked={formNotifications}
                  onCheckedChange={setFormNotifications}
                />
              </div>
            </div>

            {/* Submit */}
            <Button onClick={handleSubmit} className="w-full aura-gradient">
              {editingBlock ? 'Save Changes' : 'Add Block'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
