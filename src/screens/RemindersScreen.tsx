import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Plus, Clock, Trash2, Edit2, 
  Phone, Droplets, Pill, Dumbbell, BookOpen,
  AlarmClock, RotateCcw, Calendar, Menu,
  ChevronRight, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReminders, Reminder, ReminderCategory } from '@/hooks/useReminders';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RemindersScreenProps {
  onMenuClick?: () => void;
}

const categoryIcons: Record<ReminderCategory, React.ElementType> = {
  'one-time': Phone,
  'alarm': AlarmClock,
  'repeating': RotateCcw,
  'health': Pill,
  'productivity': BookOpen,
};

const categoryLabels: Record<ReminderCategory, string> = {
  'one-time': 'One-time',
  'alarm': 'Alarm',
  'repeating': 'Repeating',
  'health': 'Health',
  'productivity': 'Productivity',
};

const quickReminders = [
  { text: 'Drink water in 1 hour', icon: '💧' },
  { text: 'Take a break in 30 minutes', icon: '☕' },
  { text: 'Stand up and stretch in 45 minutes', icon: '🧘' },
  { text: 'Check messages in 15 minutes', icon: '📱' },
];

export const RemindersScreen: React.FC<RemindersScreenProps> = ({ onMenuClick }) => {
  const { 
    reminders, 
    addReminder, 
    addFromNaturalLanguage,
    updateReminder, 
    deleteReminder, 
    toggleReminder 
  } = useReminders();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [newReminderText, setNewReminderText] = useState('');
  
  // Form state for manual creation
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formCategory, setFormCategory] = useState<ReminderCategory>('one-time');
  const [formRepeat, setFormRepeat] = useState('none');

  const activeReminders = reminders.filter(r => r.isActive && !r.completedAt);
  const completedReminders = reminders.filter(r => r.completedAt);

  const handleQuickReminder = (text: string) => {
    const reminder = addFromNaturalLanguage(text);
    if (reminder) {
      toast.success(`Got it. I'll remind you.`);
    }
  };

  const handleNaturalLanguageAdd = () => {
    if (!newReminderText.trim()) return;
    
    const reminder = addFromNaturalLanguage(newReminderText);
    if (reminder) {
      toast.success(`Done. I've set that.`);
      setNewReminderText('');
    }
  };

  const handleManualAdd = () => {
    if (!formTitle.trim() || !formTime) return;

    const [hours, minutes] = formTime.split(':').map(Number);
    const time = formDate ? new Date(formDate) : new Date();
    time.setHours(hours, minutes, 0, 0);

    if (time < new Date() && !formDate) {
      time.setDate(time.getDate() + 1);
    }

    addReminder({
      title: formTitle,
      time,
      category: formCategory,
      icon: getCategoryEmoji(formCategory),
      repeatPattern: formRepeat as any,
      isActive: true,
    });

    toast.success('Reminder set!');
    setShowAddDialog(false);
    resetForm();
  };

  const getCategoryEmoji = (category: ReminderCategory): string => {
    const emojis: Record<ReminderCategory, string> = {
      'one-time': '🔔',
      'alarm': '⏰',
      'repeating': '🔁',
      'health': '💊',
      'productivity': '📚',
    };
    return emojis[category];
  };

  const resetForm = () => {
    setFormTitle('');
    setFormTime('');
    setFormDate('');
    setFormCategory('one-time');
    setFormRepeat('none');
  };

  const handleDelete = (id: string) => {
    deleteReminder(id);
    toast.success('Reminder deleted');
  };

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
              <h1 className="text-xl font-bold">Reminders & Alarms</h1>
              <p className="text-sm text-muted-foreground">
                {activeReminders.length} active
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

        {/* Natural Language Input */}
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <Input
              value={newReminderText}
              onChange={(e) => setNewReminderText(e.target.value)}
              placeholder="Type naturally... e.g., 'Remind me to call mom in 30 minutes'"
              className="flex-1 rounded-xl"
              onKeyDown={(e) => e.key === 'Enter' && handleNaturalLanguageAdd()}
            />
            <Button 
              onClick={handleNaturalLanguageAdd}
              disabled={!newReminderText.trim()}
              className="rounded-xl"
            >
              Set
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 pb-24">
        <div className="p-4 space-y-6">
          {/* Quick Reminders */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Reminders</h3>
            <div className="flex flex-wrap gap-2">
              {quickReminders.map((qr, index) => (
                <motion.button
                  key={index}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickReminder(qr.text)}
                  className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-full text-sm hover:bg-secondary/80 transition-colors"
                >
                  <span>{qr.icon}</span>
                  <span>{qr.text.split(' in ')[0]}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Active Reminders */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Active Reminders ({activeReminders.length})
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {activeReminders.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Bell className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">No active reminders</p>
                    <p className="text-sm text-muted-foreground/70">
                      Type above or tap + to add one
                    </p>
                  </Card>
                ) : (
                  activeReminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onToggle={() => toggleReminder(reminder.id)}
                      onEdit={() => setEditingReminder(reminder)}
                      onDelete={() => handleDelete(reminder.id)}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Browse by Category</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(categoryLabels).map(([key, label]) => {
                const Icon = categoryIcons[key as ReminderCategory];
                const count = reminders.filter(r => r.category === key).length;
                
                return (
                  <Card 
                    key={key}
                    className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{count} reminders</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Completed */}
          {completedReminders.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Completed ({completedReminders.length})
              </h3>
              <div className="space-y-2">
                {completedReminders.slice(0, 5).map((reminder) => (
                  <Card 
                    key={reminder.id}
                    className="p-3 flex items-center gap-3 opacity-60"
                  >
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm line-through">{reminder.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(reminder.completedAt!, 'MMM d')}
                    </span>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add Reminder Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Reminder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>What to remind?</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., Call mom, Take medicine"
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
                <Label>Date (optional)</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={formCategory} onValueChange={(v) => setFormCategory(v as ReminderCategory)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Repeat</Label>
              <Select value={formRepeat} onValueChange={setFormRepeat}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Don't repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleManualAdd} className="w-full aura-gradient">
              Set Reminder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Reminder Card Component
interface ReminderCardProps {
  reminder: Reminder;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onToggle,
  onEdit,
  onDelete,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
    >
      <Card className={cn(
        "p-4 transition-all duration-200",
        !reminder.isActive && "opacity-50"
      )}>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
            {reminder.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{reminder.title}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{format(reminder.time, 'h:mm a')}</span>
              {reminder.repeatPattern !== 'none' && (
                <>
                  <span>•</span>
                  <RotateCcw className="w-3 h-3" />
                  <span className="capitalize">{reminder.repeatPattern}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={reminder.isActive}
              onCheckedChange={onToggle}
            />
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
