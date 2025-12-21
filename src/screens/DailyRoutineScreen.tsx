import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Sunset, Moon, Plus, Check, Clock, 
  Menu, Trash2, Edit2, GripVertical, 
  AlarmClock, Droplets, Dumbbell, BookOpen, Coffee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DailyRoutineScreenProps {
  onMenuClick?: () => void;
}

type TimeBlock = 'morning' | 'afternoon' | 'night';

interface RoutineItem {
  id: string;
  title: string;
  time: string;
  block: TimeBlock;
  icon: string;
  type: 'alarm' | 'reminder' | 'habit';
  completed: boolean;
}

const STORAGE_KEY = 'aura-daily-routine';

const blockIcons: Record<TimeBlock, React.ElementType> = {
  morning: Sun,
  afternoon: Sunset,
  night: Moon,
};

const blockLabels: Record<TimeBlock, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  night: 'Night',
};

const blockColors: Record<TimeBlock, string> = {
  morning: 'from-amber-500/20 to-orange-500/20',
  afternoon: 'from-blue-500/20 to-cyan-500/20',
  night: 'from-purple-500/20 to-indigo-500/20',
};

const itemIcons = [
  { value: '⏰', label: 'Alarm' },
  { value: '💧', label: 'Water' },
  { value: '💪', label: 'Workout' },
  { value: '📚', label: 'Study' },
  { value: '☕', label: 'Coffee' },
  { value: '🍳', label: 'Breakfast' },
  { value: '🧘', label: 'Meditation' },
  { value: '💊', label: 'Medicine' },
  { value: '🚿', label: 'Shower' },
  { value: '🛏️', label: 'Sleep' },
  { value: '📱', label: 'Check phone' },
  { value: '🏃', label: 'Run' },
];

const defaultRoutine: RoutineItem[] = [
  { id: '1', title: 'Wake up', time: '07:00', block: 'morning', icon: '⏰', type: 'alarm', completed: false },
  { id: '2', title: 'Drink water', time: '07:10', block: 'morning', icon: '💧', type: 'habit', completed: false },
  { id: '3', title: 'Morning workout', time: '07:30', block: 'morning', icon: '💪', type: 'habit', completed: false },
  { id: '4', title: 'Lunch break', time: '13:00', block: 'afternoon', icon: '🍳', type: 'reminder', completed: false },
  { id: '5', title: 'Afternoon focus', time: '14:00', block: 'afternoon', icon: '📚', type: 'reminder', completed: false },
  { id: '6', title: 'Evening walk', time: '18:00', block: 'afternoon', icon: '🏃', type: 'habit', completed: false },
  { id: '7', title: 'Wind down', time: '21:00', block: 'night', icon: '🧘', type: 'habit', completed: false },
  { id: '8', title: 'Sleep', time: '23:00', block: 'night', icon: '🛏️', type: 'alarm', completed: false },
];

export const DailyRoutineScreen: React.FC<DailyRoutineScreenProps> = ({ onMenuClick }) => {
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formBlock, setFormBlock] = useState<TimeBlock>('morning');
  const [formIcon, setFormIcon] = useState('⏰');
  const [formType, setFormType] = useState<'alarm' | 'reminder' | 'habit'>('reminder');

  // Load routine
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRoutine(JSON.parse(stored));
      } catch {
        setRoutine(defaultRoutine);
      }
    } else {
      setRoutine(defaultRoutine);
    }
  }, []);

  // Save routine
  useEffect(() => {
    if (routine.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routine));
    }
  }, [routine]);

  // Reset completions at midnight
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setRoutine(prev => prev.map(item => ({ ...item, completed: false })));
      }
    };

    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleComplete = (id: string) => {
    setRoutine(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
    const item = routine.find(r => r.id === id);
    if (item && !item.completed) {
      toast.success('Nice! ✨');
    }
  };

  const handleAddItem = () => {
    if (!formTitle.trim() || !formTime) {
      toast.error('Please fill all fields');
      return;
    }

    const newItem: RoutineItem = {
      id: crypto.randomUUID(),
      title: formTitle,
      time: formTime,
      block: formBlock,
      icon: formIcon,
      type: formType,
      completed: false,
    };

    setRoutine(prev => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));
    toast.success('Added to routine!');
    setShowAddDialog(false);
    resetForm();
  };

  const handleDeleteItem = (id: string) => {
    setRoutine(prev => prev.filter(item => item.id !== id));
    toast.success('Removed from routine');
  };

  const resetForm = () => {
    setFormTitle('');
    setFormTime('');
    setFormBlock('morning');
    setFormIcon('⏰');
    setFormType('reminder');
  };

  const getBlockItems = (block: TimeBlock) => 
    routine.filter(item => item.block === block).sort((a, b) => a.time.localeCompare(b.time));

  const getBlockProgress = (block: TimeBlock) => {
    const items = getBlockItems(block);
    if (items.length === 0) return 0;
    return Math.round((items.filter(i => i.completed).length / items.length) * 100);
  };

  const blocks: TimeBlock[] = ['morning', 'afternoon', 'night'];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="rounded-full">
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Daily Routine</h1>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <Button 
            size="icon" 
            className="rounded-full aura-gradient"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Block Tabs */}
        <div className="flex gap-2 px-4 pb-4">
          {blocks.map((block) => {
            const Icon = blockIcons[block];
            const progress = getBlockProgress(block);
            
            return (
              <button
                key={block}
                onClick={() => setSelectedBlock(selectedBlock === block ? null : block)}
                className={cn(
                  'flex-1 p-3 rounded-xl transition-all',
                  'bg-gradient-to-br',
                  blockColors[block],
                  selectedBlock === block && 'ring-2 ring-primary'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{blockLabels[block]}</span>
                </div>
                <div className="mt-2 h-1 bg-muted/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="flex-1 pb-24">
        <div className="p-4 space-y-6">
          {blocks.filter(b => !selectedBlock || selectedBlock === b).map((block) => {
            const Icon = blockIcons[block];
            const items = getBlockItems(block);
            
            return (
              <div key={block}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
                    blockColors[block]
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold">{blockLabels[block]}</h3>
                  <span className="text-sm text-muted-foreground">
                    ({items.filter(i => i.completed).length}/{items.length})
                  </span>
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {items.length === 0 ? (
                      <Card className="p-4 text-center text-muted-foreground">
                        <p className="text-sm">No items yet</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setFormBlock(block);
                            setShowAddDialog(true);
                          }}
                          className="mt-2"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add item
                        </Button>
                      </Card>
                    ) : (
                      items.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <Card 
                            className={cn(
                              "p-3 transition-all",
                              item.completed && "opacity-60"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleComplete(item.id)}
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                  "border-2",
                                  item.completed 
                                    ? "bg-primary border-primary text-primary-foreground" 
                                    : "border-muted-foreground/30 hover:border-primary"
                                )}
                              >
                                {item.completed && <Check className="w-4 h-4" />}
                              </button>

                              <span className="text-xl">{item.icon}</span>

                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "font-medium",
                                  item.completed && "line-through text-muted-foreground"
                                )}>
                                  {item.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{item.time}</span>
                                  <span className="capitalize">• {item.type}</span>
                                </div>
                              </div>

                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteItem(item.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Routine</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Activity</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., Morning yoga, Take vitamins"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Block</Label>
                <Select value={formBlock} onValueChange={(v) => setFormBlock(v as TimeBlock)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {blocks.map((b) => (
                      <SelectItem key={b} value={b}>
                        {blockLabels[b]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {itemIcons.map((icon) => (
                  <button
                    key={icon.value}
                    onClick={() => setFormIcon(icon.value)}
                    className={cn(
                      "w-10 h-10 rounded-lg text-xl transition-all",
                      "border-2",
                      formIcon === icon.value 
                        ? "border-primary bg-primary/10" 
                        : "border-transparent bg-muted hover:bg-muted/80"
                    )}
                  >
                    {icon.value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Type</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alarm">Alarm</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="habit">Habit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAddItem} className="w-full aura-gradient">
              Add to Routine
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
