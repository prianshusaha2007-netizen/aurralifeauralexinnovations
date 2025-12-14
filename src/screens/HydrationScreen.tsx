import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Plus, 
  Minus, 
  Settings, 
  TrendingUp,
  Clock,
  Bell,
  Target,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, startOfDay, isToday, subDays } from 'date-fns';

interface HydrationLog {
  id: string;
  amount_ml: number;
  created_at: string;
}

interface HydrationSettings {
  daily_goal_ml: number;
  reminder_interval_minutes: number;
  reminder_enabled: boolean;
}

const GLASS_SIZE = 250; // ml per glass

export const HydrationScreen: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<HydrationLog[]>([]);
  const [settings, setSettings] = useState<HydrationSettings>({
    daily_goal_ml: 2000,
    reminder_interval_minutes: 60,
    reminder_enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch today's logs
      const todayStart = startOfDay(new Date()).toISOString();
      const { data: logsData, error: logsError } = await supabase
        .from('hydration_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', todayStart)
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;
      setLogs(logsData || []);

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('hydration_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError) throw settingsError;
      
      if (settingsData) {
        setSettings({
          daily_goal_ml: settingsData.daily_goal_ml,
          reminder_interval_minutes: settingsData.reminder_interval_minutes,
          reminder_enabled: settingsData.reminder_enabled
        });
      }

      // Calculate streak
      await calculateStreak();
    } catch (error) {
      console.error('Error fetching hydration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = async () => {
    if (!user) return;
    
    let currentStreak = 0;
    let checkDate = subDays(new Date(), 1);
    
    while (true) {
      const dayStart = startOfDay(checkDate).toISOString();
      const dayEnd = startOfDay(subDays(checkDate, -1)).toISOString();
      
      const { data } = await supabase
        .from('hydration_logs')
        .select('amount_ml')
        .eq('user_id', user.id)
        .gte('created_at', dayStart)
        .lt('created_at', dayEnd);

      const dayTotal = data?.reduce((sum, log) => sum + log.amount_ml, 0) || 0;
      
      if (dayTotal >= settings.daily_goal_ml * 0.8) { // 80% counts as goal met
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
      
      if (currentStreak > 365) break; // Safety limit
    }
    
    // Add today if goal is met
    const todayTotal = logs.reduce((sum, log) => sum + log.amount_ml, 0);
    if (todayTotal >= settings.daily_goal_ml * 0.8) {
      currentStreak++;
    }
    
    setStreak(currentStreak);
  };

  const addWater = async (amount: number = GLASS_SIZE) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('hydration_logs')
        .insert({
          user_id: user.id,
          amount_ml: amount
        });

      if (error) throw error;
      
      fetchData();
      
      const newTotal = logs.reduce((sum, log) => sum + log.amount_ml, 0) + amount;
      if (newTotal >= settings.daily_goal_ml && newTotal - amount < settings.daily_goal_ml) {
        toast.success('🎉 You reached your hydration goal!');
      } else {
        toast.success(`+${amount}ml added!`);
      }
    } catch (error) {
      console.error('Error adding water:', error);
      toast.error('Failed to log water');
    }
  };

  const removeLastLog = async () => {
    if (!user || logs.length === 0) return;

    try {
      const { error } = await supabase
        .from('hydration_logs')
        .delete()
        .eq('id', logs[0].id);

      if (error) throw error;
      fetchData();
      toast.success('Last entry removed');
    } catch (error) {
      console.error('Error removing log:', error);
      toast.error('Failed to remove entry');
    }
  };

  const updateSettings = async (newSettings: Partial<HydrationSettings>) => {
    if (!user) return;

    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      const { error } = await supabase
        .from('hydration_settings')
        .upsert({
          user_id: user.id,
          ...updated
        });

      if (error) throw error;
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const totalToday = logs.reduce((sum, log) => sum + log.amount_ml, 0);
  const progress = Math.min((totalToday / settings.daily_goal_ml) * 100, 100);
  const glasses = Math.floor(totalToday / GLASS_SIZE);
  const goalGlasses = Math.ceil(settings.daily_goal_ml / GLASS_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Droplets className="w-8 h-8 animate-pulse text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Hydration Tracker</h1>
            <p className="text-sm text-muted-foreground">Stay refreshed, stay healthy</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Tabs defaultValue="track" className="p-4">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="track">Track</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="track" className="space-y-4">
            {/* Main Progress Card */}
            <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5">
              <CardContent className="p-6">
                {/* Circular Progress */}
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-muted/30"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="url(#hydrationGradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${progress * 5.53} 553`}
                      className="transition-all duration-500"
                    />
                    <defs>
                      <linearGradient id="hydrationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Droplets className="w-8 h-8 text-cyan-500 mb-1" />
                    <span className="text-3xl font-bold">{totalToday}</span>
                    <span className="text-sm text-muted-foreground">/ {settings.daily_goal_ml} ml</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-500">{glasses}</div>
                    <div className="text-xs text-muted-foreground">Glasses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{Math.round(progress)}%</div>
                    <div className="text-xs text-muted-foreground">Complete</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="text-2xl font-bold text-orange-500">{streak}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Day Streak</div>
                  </div>
                </div>

                {/* Add Water Buttons */}
                <div className="flex gap-3 justify-center mb-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={removeLastLog}
                    disabled={logs.length === 0}
                    className="rounded-full"
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => addWater(250)}
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-8"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    250ml
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => addWater(500)}
                    className="rounded-full"
                  >
                    <Plus className="w-5 h-5 mr-1" />
                    500ml
                  </Button>
                </div>

                {/* Glass Indicators */}
                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from({ length: goalGlasses }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-6 h-8 rounded-md border-2 transition-all duration-300 relative overflow-hidden",
                        i < glasses
                          ? "border-cyan-500"
                          : "border-muted"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500 to-blue-400 transition-all duration-500",
                          i < glasses ? "h-full" : "h-0"
                        )}
                      />
                    </div>
                  ))}
                </div>

                {/* Motivational Message */}
                <div className="text-center mt-4">
                  {progress >= 100 ? (
                    <p className="text-green-500 font-medium">🎉 Amazing! Goal reached!</p>
                  ) : progress >= 75 ? (
                    <p className="text-cyan-500">Almost there! Keep it up! 💧</p>
                  ) : progress >= 50 ? (
                    <p className="text-blue-500">Halfway there! Stay hydrated! 💪</p>
                  ) : progress >= 25 ? (
                    <p className="text-muted-foreground">Good progress! Keep drinking! 🌊</p>
                  ) : (
                    <p className="text-muted-foreground">Let's get started! 💧</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Today's Log */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Today's Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No entries yet. Start tracking!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-cyan-500" />
                          <span className="font-medium">{log.amount_ml}ml</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'h:mm a')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Daily Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={settings.daily_goal_ml.toString()}
                  onValueChange={(value) => updateSettings({ daily_goal_ml: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1500">1.5 Liters (6 glasses)</SelectItem>
                    <SelectItem value="2000">2 Liters (8 glasses)</SelectItem>
                    <SelectItem value="2500">2.5 Liters (10 glasses)</SelectItem>
                    <SelectItem value="3000">3 Liters (12 glasses)</SelectItem>
                    <SelectItem value="3500">3.5 Liters (14 glasses)</SelectItem>
                    <SelectItem value="4000">4 Liters (16 glasses)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reminder-enabled">Enable Reminders</Label>
                  <Switch
                    id="reminder-enabled"
                    checked={settings.reminder_enabled}
                    onCheckedChange={(checked) => updateSettings({ reminder_enabled: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reminder Interval</Label>
                  <Select
                    value={settings.reminder_interval_minutes.toString()}
                    onValueChange={(value) => updateSettings({ reminder_interval_minutes: parseInt(value) })}
                    disabled={!settings.reminder_enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every hour</SelectItem>
                      <SelectItem value="90">Every 1.5 hours</SelectItem>
                      <SelectItem value="120">Every 2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-xs text-muted-foreground">
                  💡 AURA will remind you to drink water at your chosen interval during your waking hours.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
};
