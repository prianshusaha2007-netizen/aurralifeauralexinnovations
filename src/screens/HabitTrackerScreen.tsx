import React, { useState, useEffect } from 'react';
import { Plus, Flame, Check, Trash2, Trophy, Sparkles, Bell, BarChart3, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { HabitAnalytics } from '@/components/HabitAnalytics';

interface Habit {
  id: string;
  name: string;
  icon: string;
  frequency: string;
  target_count: number;
  reminder_time: string | null;
  reminder_enabled: boolean;
  streak: number;
  completedToday: boolean;
}

const HABIT_ICONS = ['💧', '🏃', '📚', '🧘', '💪', '🍎', '💊', '😴', '✍️', '🎯', '🌅', '🧠'];

const STREAK_CELEBRATIONS = [
  { streak: 3, message: "3 days strong! 🔥 You're building momentum!" },
  { streak: 7, message: "One week streak! 🎉 You're on fire!" },
  { streak: 14, message: "Two weeks! 💪 This is becoming a real habit!" },
  { streak: 21, message: "21 days! 🏆 Scientists say you've officially formed a habit!" },
  { streak: 30, message: "One month! 🌟 You're unstoppable!" },
  { streak: 50, message: "50 days! 👑 You're a habit master!" },
  { streak: 100, message: "100 DAYS! 🚀 Legendary status achieved!" },
];

export const HabitTrackerScreen: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('✨');
  const [newReminderTime, setNewReminderTime] = useState('09:00');
  const [newReminderEnabled, setNewReminderEnabled] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { scheduleNotification, requestPermission } = useNotifications();

  useEffect(() => {
    if (user) {
      fetchHabits();
    }
  }, [user]);

  // Schedule habit reminders
  useEffect(() => {
    const scheduleReminders = () => {
      habits.forEach((habit) => {
        if (habit.reminder_enabled && habit.reminder_time && !habit.completedToday) {
          const [hours, minutes] = habit.reminder_time.split(':').map(Number);
          const now = new Date();
          const reminderDate = new Date();
          reminderDate.setHours(hours, minutes, 0, 0);

          // If time has passed today, skip
          if (reminderDate <= now) return;

          const delayMs = reminderDate.getTime() - now.getTime();

          // Only schedule if within next hour to avoid too many timers
          if (delayMs > 0 && delayMs < 60 * 60 * 1000) {
            scheduleNotification({
              title: `${habit.icon} Habit Reminder`,
              body: `Time to complete: ${habit.name}`,
              tag: `habit-${habit.id}`,
            }, delayMs);
          }
        }
      });
    };

    if (habits.length > 0) {
      scheduleReminders();
    }
  }, [habits, scheduleNotification]);

  const fetchHabits = async () => {
    try {
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      const today = new Date().toISOString().split('T')[0];
      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('habit_id, completed_at')
        .gte('completed_at', today);

      if (completionsError) throw completionsError;

      const habitsWithStreaks = await Promise.all(
        (habitsData || []).map(async (habit: any) => {
          const streak = await calculateStreak(habit.id);
          const completedToday = completionsData?.some(
            (c: any) => c.habit_id === habit.id && c.completed_at === today
          ) || false;

          return {
            ...habit,
            streak,
            completedToday,
          };
        })
      );

      setHabits(habitsWithStreaks);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast({
        title: "Error",
        description: "Failed to load habits",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStreak = async (habitId: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('completed_at')
        .eq('habit_id', habitId)
        .order('completed_at', { ascending: false })
        .limit(100);

      if (error || !data) return 0;

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 100; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        if (data.some((c: any) => c.completed_at === dateStr)) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      return streak;
    } catch {
      return 0;
    }
  };

  const addHabit = async () => {
    if (!newHabitName.trim() || !user) return;

    try {
      if (newReminderEnabled) {
        await requestPermission();
      }

      const { error } = await supabase.from('habits').insert({
        user_id: user.id,
        name: newHabitName.trim(),
        icon: selectedIcon,
        frequency: 'daily',
        target_count: 1,
        reminder_time: newReminderEnabled ? newReminderTime : null,
        reminder_enabled: newReminderEnabled,
      });

      if (error) throw error;

      setNewHabitName('');
      setSelectedIcon('✨');
      setNewReminderTime('09:00');
      setNewReminderEnabled(false);
      setShowAddDialog(false);
      fetchHabits();

      toast({
        title: "Habit Created! 🎯",
        description: `"${newHabitName}" added to your tracker`,
      });
    } catch (error) {
      console.error('Error adding habit:', error);
      toast({
        title: "Error",
        description: "Failed to create habit",
        variant: "destructive",
      });
    }
  };

  const updateHabitReminder = async (habit: Habit, enabled: boolean, time: string) => {
    try {
      if (enabled) {
        await requestPermission();
      }

      const { error } = await supabase
        .from('habits')
        .update({
          reminder_enabled: enabled,
          reminder_time: enabled ? time : null,
        })
        .eq('id', habit.id);

      if (error) throw error;

      fetchHabits();
      setEditingHabit(null);

      toast({
        title: enabled ? "Reminder Set! ⏰" : "Reminder Disabled",
        description: enabled 
          ? `You'll be reminded at ${time} daily` 
          : "Reminder turned off",
      });
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive",
      });
    }
  };

  const toggleHabit = async (habit: Habit) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      if (habit.completedToday) {
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('habit_id', habit.id)
          .eq('completed_at', today);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('habit_completions').insert({
          habit_id: habit.id,
          user_id: user.id,
          completed_at: today,
        });

        if (error) throw error;

        const newStreak = habit.streak + 1;
        const celebration = STREAK_CELEBRATIONS.find(c => c.streak === newStreak);
        
        if (celebration) {
          setCelebrationMessage(celebration.message);
          setTimeout(() => setCelebrationMessage(null), 4000);
        }
      }

      fetchHabits();
    } catch (error) {
      console.error('Error toggling habit:', error);
      toast({
        title: "Error",
        description: "Failed to update habit",
        variant: "destructive",
      });
    }
  };

  const deleteHabit = async (habitId: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);

      if (error) throw error;

      fetchHabits();
      toast({
        title: "Habit Deleted",
        description: "Habit removed from your tracker",
      });
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: "Error",
        description: "Failed to delete habit",
        variant: "destructive",
      });
    }
  };

  const completedToday = habits.filter(h => h.completedToday).length;
  const totalHabits = habits.length;
  const completionPercentage = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  return (
    <div className="flex flex-col h-full p-4 pb-24">
      {/* Celebration Overlay */}
      <AnimatePresence>
        {celebrationMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed inset-x-4 top-20 z-50 bg-gradient-to-r from-primary/90 to-accent/90 text-white rounded-2xl p-6 text-center shadow-2xl"
          >
            <Trophy className="w-12 h-12 mx-auto mb-2 animate-bounce" />
            <p className="text-lg font-bold">{celebrationMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold aura-gradient-text flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          Habit Tracker
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build better habits, one day at a time
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="habits" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="habits" className="gap-2">
            <Check className="w-4 h-4" />
            Habits
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="habits" className="flex-1 overflow-y-auto space-y-4">
          {/* Progress Card */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Today's Progress</span>
              <span className="text-2xl font-bold aura-gradient-text">{completionPercentage}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {completedToday} of {totalHabits} habits completed
            </p>
          </Card>

          {/* Habits List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading habits...</div>
            ) : habits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No habits yet. Start building better habits!</p>
                <Button onClick={() => setShowAddDialog(true)} className="rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Habit
                </Button>
              </div>
            ) : (
              habits.map((habit) => (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className={cn(
                      'p-4 transition-all duration-300',
                      habit.completedToday && 'bg-primary/10 border-primary/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleHabit(habit)}
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all',
                          habit.completedToday
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        )}
                      >
                        {habit.completedToday ? <Check className="w-6 h-6" /> : habit.icon}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-medium',
                          habit.completedToday && 'line-through text-muted-foreground'
                        )}>
                          {habit.name}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Flame className={cn(
                            'w-4 h-4',
                            habit.streak > 0 ? 'text-orange-500' : 'text-muted-foreground'
                          )} />
                          <span className={cn(
                            habit.streak > 0 ? 'text-orange-500 font-medium' : 'text-muted-foreground'
                          )}>
                            {habit.streak} day streak
                          </span>
                          {habit.reminder_enabled && habit.reminder_time && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{habit.reminder_time}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'rounded-full',
                              habit.reminder_enabled ? 'text-primary' : 'text-muted-foreground'
                            )}
                            onClick={() => setEditingHabit(habit)}
                          >
                            <Bell className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Reminder Settings</DialogTitle>
                          </DialogHeader>
                          {editingHabit && (
                            <ReminderSettings
                              habit={editingHabit}
                              onSave={updateHabitReminder}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteHabit(habit.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 overflow-y-auto">
          <HabitAnalytics />
        </TabsContent>
      </Tabs>

      {/* Add Habit FAB */}
      {habits.length > 0 && (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="fixed bottom-24 right-4 rounded-full w-14 h-14 shadow-lg"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Habit</DialogTitle>
            </DialogHeader>
            <AddHabitForm
              name={newHabitName}
              setName={setNewHabitName}
              icon={selectedIcon}
              setIcon={setSelectedIcon}
              reminderTime={newReminderTime}
              setReminderTime={setNewReminderTime}
              reminderEnabled={newReminderEnabled}
              setReminderEnabled={setNewReminderEnabled}
              onSubmit={addHabit}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Initial Add Dialog for empty state */}
      <Dialog open={showAddDialog && habits.length === 0} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Your First Habit</DialogTitle>
          </DialogHeader>
          <AddHabitForm
            name={newHabitName}
            setName={setNewHabitName}
            icon={selectedIcon}
            setIcon={setSelectedIcon}
            reminderTime={newReminderTime}
            setReminderTime={setNewReminderTime}
            reminderEnabled={newReminderEnabled}
            setReminderEnabled={setNewReminderEnabled}
            onSubmit={addHabit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Add Habit Form Component
const AddHabitForm: React.FC<{
  name: string;
  setName: (name: string) => void;
  icon: string;
  setIcon: (icon: string) => void;
  reminderTime: string;
  setReminderTime: (time: string) => void;
  reminderEnabled: boolean;
  setReminderEnabled: (enabled: boolean) => void;
  onSubmit: () => void;
}> = ({ name, setName, icon, setIcon, reminderTime, setReminderTime, reminderEnabled, setReminderEnabled, onSubmit }) => {
  return (
    <div className="space-y-4">
      <Input
        placeholder="Habit name (e.g., Drink water)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-xl"
      />
      <div>
        <p className="text-sm font-medium mb-2">Choose an icon</p>
        <div className="flex flex-wrap gap-2">
          {HABIT_ICONS.map((habitIcon) => (
            <button
              key={habitIcon}
              onClick={() => setIcon(habitIcon)}
              className={cn(
                'w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all',
                icon === habitIcon
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {habitIcon}
            </button>
          ))}
        </div>
      </div>

      {/* Reminder Settings */}
      <div className="space-y-3 p-3 bg-muted/50 rounded-xl">
        <div className="flex items-center justify-between">
          <Label htmlFor="reminder" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Daily Reminder
          </Label>
          <Switch
            id="reminder"
            checked={reminderEnabled}
            onCheckedChange={setReminderEnabled}
          />
        </div>
        {reminderEnabled && (
          <Input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="rounded-lg"
          />
        )}
      </div>

      <Button
        onClick={onSubmit}
        disabled={!name.trim()}
        className="w-full rounded-xl"
      >
        Add Habit
      </Button>
    </div>
  );
};

// Reminder Settings Component
const ReminderSettings: React.FC<{
  habit: Habit;
  onSave: (habit: Habit, enabled: boolean, time: string) => void;
}> = ({ habit, onSave }) => {
  const [enabled, setEnabled] = useState(habit.reminder_enabled);
  const [time, setTime] = useState(habit.reminder_time || '09:00');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
        <span className="text-2xl">{habit.icon}</span>
        <span className="font-medium">{habit.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="edit-reminder" className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Enable Reminder
        </Label>
        <Switch
          id="edit-reminder"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>

      {enabled && (
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            Remind me at
          </Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-lg"
          />
        </div>
      )}

      <Button
        onClick={() => onSave(habit, enabled, time)}
        className="w-full rounded-xl"
      >
        Save Reminder
      </Button>
    </div>
  );
};
