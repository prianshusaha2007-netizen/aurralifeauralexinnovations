import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  BookOpen, 
  Briefcase, 
  Coffee, 
  Moon,
  Dumbbell,
  UtensilsCrossed,
  Sparkles,
  Bell,
  Droplets
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAura } from '@/contexts/AuraContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { WaterTracker } from '@/components/WaterTracker';

const blockTypes = [
  { id: 'study', label: 'Study', icon: BookOpen, color: 'text-blue-500 bg-blue-500/10' },
  { id: 'work', label: 'Work', icon: Briefcase, color: 'text-orange-500 bg-orange-500/10' },
  { id: 'rest', label: 'Rest', icon: Coffee, color: 'text-green-500 bg-green-500/10' },
  { id: 'sleep', label: 'Sleep', icon: Moon, color: 'text-purple-500 bg-purple-500/10' },
  { id: 'exercise', label: 'Exercise', icon: Dumbbell, color: 'text-red-500 bg-red-500/10' },
  { id: 'meal', label: 'Meal', icon: UtensilsCrossed, color: 'text-yellow-500 bg-yellow-500/10' },
  { id: 'water', label: 'Water', icon: Droplets, color: 'text-cyan-500 bg-cyan-500/10' },
];

const sampleSchedule = [
  { time: '07:00', title: 'Wake up & Morning routine', type: 'rest' as const },
  { time: '08:00', title: 'Breakfast', type: 'meal' as const },
  { time: '09:00', title: 'Deep work session', type: 'work' as const },
  { time: '12:00', title: 'Lunch break', type: 'meal' as const },
  { time: '13:00', title: 'Light tasks & emails', type: 'work' as const },
  { time: '15:00', title: 'Study / Learning', type: 'study' as const },
  { time: '17:00', title: 'Exercise', type: 'exercise' as const },
  { time: '19:00', title: 'Dinner', type: 'meal' as const },
  { time: '20:00', title: 'Relaxation', type: 'rest' as const },
  { time: '23:00', title: 'Sleep', type: 'sleep' as const },
];

const WATER_STORAGE_KEY = 'aura_water_intake';
const WATER_DATE_KEY = 'aura_water_date';

export const RoutineScreen: React.FC = () => {
  const { 
    routineBlocks, 
    addRoutineBlock, 
    toggleRoutineComplete, 
    deleteRoutineBlock,
    reminders,
    addReminder,
    toggleReminder,
    deleteReminder 
  } = useAura();
  const { toast } = useToast();
  
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [newBlock, setNewBlock] = useState({ title: '', time: '', type: 'work' as const });
  const [newReminder, setNewReminder] = useState({ text: '', time: '' });
  
  // Water tracking state
  const [waterGlasses, setWaterGlasses] = useState(0);
  const waterGoal = 8;

  // Load water data from localStorage and reset daily
  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem(WATER_DATE_KEY);
    
    if (savedDate === today) {
      const savedWater = localStorage.getItem(WATER_STORAGE_KEY);
      if (savedWater) {
        setWaterGlasses(parseInt(savedWater, 10));
      }
    } else {
      // New day, reset counter
      localStorage.setItem(WATER_DATE_KEY, today);
      localStorage.setItem(WATER_STORAGE_KEY, '0');
      setWaterGlasses(0);
    }
  }, []);

  // Save water data to localStorage
  useEffect(() => {
    localStorage.setItem(WATER_STORAGE_KEY, waterGlasses.toString());
  }, [waterGlasses]);

  const handleAddWater = () => {
    if (waterGlasses < waterGoal) {
      setWaterGlasses(prev => prev + 1);
      if (waterGlasses + 1 === waterGoal) {
        toast({
          title: "Hydration Goal Complete! 🎉",
          description: "Amazing! You've reached your daily water intake goal!",
        });
      }
    } else {
      setWaterGlasses(prev => prev + 1);
      toast({
        title: "Extra hydration! 💧",
        description: "Going above and beyond - great job!",
      });
    }
  };

  const handleRemoveWater = () => {
    if (waterGlasses > 0) {
      setWaterGlasses(prev => prev - 1);
    }
  };

  const handleResetWater = () => {
    setWaterGlasses(0);
    toast({
      title: "Water tracker reset",
      description: "Starting fresh! Remember to stay hydrated.",
    });
  };

  const handleAddHydrationReminder = () => {
    addReminder({ text: 'Drink water! Stay hydrated 💧', time: '', active: true });
    toast({
      title: "Hydration Reminder Added",
      description: "AURA will remind you to drink water regularly!",
    });
  };

  const handleAddBlock = () => {
    if (!newBlock.title.trim() || !newBlock.time) return;
    addRoutineBlock({ ...newBlock, completed: false });
    setNewBlock({ title: '', time: '', type: 'work' });
    setIsBlockDialogOpen(false);
  };

  const handleAddReminder = () => {
    if (!newReminder.text.trim() || !newReminder.time) return;
    addReminder({ ...newReminder, active: true });
    setNewReminder({ text: '', time: '' });
    setIsReminderDialogOpen(false);
  };

  const handleGenerateSchedule = () => {
    sampleSchedule.forEach((block) => {
      addRoutineBlock({ ...block, completed: false });
    });
    toast({
      title: "Schedule Generated",
      description: "AURA has created a balanced daily routine for you.",
    });
  };

  const getBlockIcon = (type: string) => {
    const blockType = blockTypes.find(b => b.id === type);
    return blockType?.icon || Clock;
  };

  const getBlockColor = (type: string) => {
    const blockType = blockTypes.find(b => b.id === type);
    return blockType?.color || 'text-primary bg-primary/10';
  };

  return (
    <div className="flex flex-col h-full p-4 pb-24 overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold aura-gradient-text">Routine</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your daily schedule & hydration
        </p>
      </div>

      {/* Water Tracker */}
      <div className="mb-4">
        <WaterTracker
          glasses={waterGlasses}
          goal={waterGoal}
          onAdd={handleAddWater}
          onRemove={handleRemoveWater}
          onReset={handleResetWater}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddHydrationReminder}
          className="mt-2 text-xs text-cyan-500 hover:text-cyan-600"
        >
          <Bell className="w-3 h-3 mr-1" />
          Add hydration reminder
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-6">
        <Button 
          onClick={handleGenerateSchedule}
          className="flex-1 rounded-xl aura-gradient"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Schedule
        </Button>
        
        <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 rounded-xl">
              <Bell className="w-4 h-4 mr-2" />
              Set Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>New Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                value={newReminder.text}
                onChange={(e) => setNewReminder({ ...newReminder, text: e.target.value })}
                placeholder="Reminder text..."
                className="rounded-xl"
              />
              <Input
                type="time"
                value={newReminder.time}
                onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                className="rounded-xl"
              />
              <Button onClick={handleAddReminder} className="w-full rounded-xl aura-gradient">
                Add Reminder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">REMINDERS</h2>
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={cn(
                  'flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50',
                  !reminder.active && 'opacity-50'
                )}
              >
                <Bell className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{reminder.text}</p>
                  <p className="text-xs text-muted-foreground">{reminder.time}</p>
                </div>
                <Switch
                  checked={reminder.active}
                  onCheckedChange={() => toggleReminder(reminder.id)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteReminder(reminder.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Block Button */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="mb-4 rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Add Routine Block
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>New Routine Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              value={newBlock.title}
              onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
              placeholder="What's the activity?"
              className="rounded-xl"
            />
            <Input
              type="time"
              value={newBlock.time}
              onChange={(e) => setNewBlock({ ...newBlock, time: e.target.value })}
              className="rounded-xl"
            />
            <Select 
              value={newBlock.type} 
              onValueChange={(value: any) => setNewBlock({ ...newBlock, type: value })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {blockTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddBlock} className="w-full rounded-xl aura-gradient">
              Add Block
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Routine Blocks */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">TODAY'S SCHEDULE</h2>
        
        {routineBlocks.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No routine set</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add blocks or generate a schedule
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {routineBlocks
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((block) => {
                const Icon = getBlockIcon(block.type);
                const colorClass = getBlockColor(block.type);
                
                return (
                  <div
                    key={block.id}
                    className={cn(
                      'flex items-center gap-3 p-4 bg-card rounded-xl border border-border/50',
                      block.completed && 'opacity-60'
                    )}
                  >
                    <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium',
                        block.completed && 'line-through'
                      )}>
                        {block.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{block.time}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'shrink-0',
                        block.completed ? 'text-primary' : 'text-muted-foreground'
                      )}
                      onClick={() => toggleRoutineComplete(block.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteRoutineBlock(block.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
