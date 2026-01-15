import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Clock, Calendar, MessageSquare, Mail, Music2, Play,
  Dumbbell, BookOpen, DollarSign, Users, Heart, Zap, ChevronRight,
  Plus, X, Check, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useAlarmSystem, 
  AlarmType, 
  TaskCategory, 
  ExecutionMode, 
  AutonomyLevel,
  AlarmAction 
} from '@/hooks/useAlarmSystem';
import { ScrollArea } from '@/components/ui/scroll-area';

const alarmTypeOptions: { value: AlarmType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'time_based', label: 'Time-Based', icon: <Clock className="w-4 h-4" />, description: 'Trigger at specific time' },
  { value: 'purpose', label: 'Purpose Alarm', icon: <Zap className="w-4 h-4" />, description: 'Fitness, study, networking' },
  { value: 'batch_task', label: 'Batch Task', icon: <Users className="w-4 h-4" />, description: 'Send to multiple people' },
  { value: 'follow_up', label: 'Follow-Up', icon: <MessageSquare className="w-4 h-4" />, description: 'Sales, networking outreach' },
  { value: 'calendar_autopilot', label: 'Calendar Autopilot', icon: <Calendar className="w-4 h-4" />, description: 'Auto-schedule events' },
  { value: 'reminder_chain', label: 'Reminder Chain', icon: <Bell className="w-4 h-4" />, description: 'Linked reminders' },
];

const categoryOptions: { value: TaskCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'fitness', label: 'Fitness', icon: <Dumbbell className="w-4 h-4" /> },
  { value: 'study', label: 'Study', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'finance', label: 'Finance', icon: <DollarSign className="w-4 h-4" /> },
  { value: 'social', label: 'Social', icon: <Users className="w-4 h-4" /> },
  { value: 'reflection', label: 'Reflection', icon: <Heart className="w-4 h-4" /> },
  { value: 'networking', label: 'Networking', icon: <Users className="w-4 h-4" /> },
  { value: 'wellness', label: 'Wellness', icon: <Heart className="w-4 h-4" /> },
];

const executionModeOptions: { value: ExecutionMode; label: string; description: string }[] = [
  { value: 'ring_ask_execute', label: 'Ring + Ask + Execute', description: 'Notify, get approval, then execute' },
  { value: 'ring_execute', label: 'Ring + Execute', description: 'Notify and execute immediately' },
  { value: 'silent_execute', label: 'Silent Execute', description: 'Execute without notification' },
  { value: 'silent_execute_report', label: 'Silent + Report', description: 'Execute silently, report after' },
  { value: 'suppress', label: 'Suppress', description: 'Skip if conditions not met' },
  { value: 'delay', label: 'Delay', description: 'Postpone execution' },
];

interface AlarmCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const AlarmCreator: React.FC<AlarmCreatorProps> = ({ open, onOpenChange, onCreated }) => {
  const { createAlarm } = useAlarmSystem();
  
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [alarmType, setAlarmType] = useState<AlarmType>('time_based');
  const [category, setCategory] = useState<TaskCategory | undefined>();
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [repeatPattern, setRepeatPattern] = useState<string>('');
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('ring_ask_execute');
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>('B');
  const [priority, setPriority] = useState(5);
  const [urgency, setUrgency] = useState(5);
  const [actions, setActions] = useState<AlarmAction[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Action builder state
  const [newActionType, setNewActionType] = useState<AlarmAction['type']>('send_message');
  const [newActionTarget, setNewActionTarget] = useState('');
  const [newActionContent, setNewActionContent] = useState('');
  const [newActionPlatform, setNewActionPlatform] = useState<string>('whatsapp');

  const addAction = () => {
    const action: AlarmAction = {
      type: newActionType,
      target: newActionTarget,
      content: newActionContent,
      platform: newActionPlatform as AlarmAction['platform'],
    };
    setActions(prev => [...prev, action]);
    setNewActionTarget('');
    setNewActionContent('');
  };

  const removeAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!title || !scheduledDate || !scheduledTime) return;

    setIsCreating(true);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      
      await createAlarm({
        title,
        description,
        alarm_type: alarmType,
        category,
        scheduled_at: scheduledAt,
        repeat_pattern: repeatPattern || undefined,
        is_active: true,
        execution_mode: executionMode,
        autonomy_level: autonomyLevel,
        priority,
        urgency,
        actions,
        conditions: {},
      });

      onOpenChange(false);
      onCreated?.();
      resetForm();
    } catch (error) {
      console.error('Error creating alarm:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setAlarmType('time_based');
    setCategory(undefined);
    setScheduledDate('');
    setScheduledTime('');
    setRepeatPattern('');
    setExecutionMode('ring_ask_execute');
    setAutonomyLevel('B');
    setPriority(5);
    setUrgency(5);
    setActions([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            Create Alarm
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <ScrollArea className="flex-1 pr-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-medium">Basic Info</h3>
                
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g., Morning workout reminder"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="Add details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alarm Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {alarmTypeOptions.map((opt) => (
                      <Card
                        key={opt.value}
                        className={`p-3 cursor-pointer transition-all ${
                          alarmType === opt.value ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setAlarmType(opt.value)}
                      >
                        <div className="flex items-center gap-2">
                          {opt.icon}
                          <div>
                            <p className="text-sm font-medium">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.description}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-medium">Schedule</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Repeat</Label>
                  <Select value={repeatPattern} onValueChange={setRepeatPattern}>
                    <SelectTrigger>
                      <SelectValue placeholder="No repeat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekdays">Weekdays</SelectItem>
                      <SelectItem value="weekends">Weekends</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={category === opt.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCategory(opt.value)}
                      >
                        {opt.icon}
                        <span className="ml-1">{opt.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority (1-10)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={priority}
                      onChange={(e) => setPriority(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Urgency (1-10)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={urgency}
                      onChange={(e) => setUrgency(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-medium">Execution Mode</h3>

                <div className="space-y-2">
                  {executionModeOptions.map((opt) => (
                    <Card
                      key={opt.value}
                      className={`p-3 cursor-pointer transition-all ${
                        executionMode === opt.value ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setExecutionMode(opt.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.description}</p>
                        </div>
                        {executionMode === opt.value && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Autonomy Level</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['A', 'B', 'C'] as AutonomyLevel[]).map((level) => (
                      <Card
                        key={level}
                        className={`p-3 cursor-pointer text-center transition-all ${
                          autonomyLevel === level ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setAutonomyLevel(level)}
                      >
                        <p className="font-bold text-lg">{level}</p>
                        <p className="text-xs text-muted-foreground">
                          {level === 'A' ? 'Command' : level === 'B' ? 'Approve' : 'Confirm'}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-medium">Actions</h3>

                {/* Existing actions */}
                {actions.length > 0 && (
                  <div className="space-y-2">
                    {actions.map((action, index) => (
                      <Card key={index} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium capitalize">{action.type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {action.platform && `via ${action.platform}`}
                            {action.target && ` to ${action.target}`}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeAction(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Add new action */}
                <Card className="p-4 space-y-3">
                  <p className="text-sm font-medium">Add Action</p>
                  
                  <Select value={newActionType} onValueChange={(v) => setNewActionType(v as AlarmAction['type'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_message">Send Message</SelectItem>
                      <SelectItem value="send_email">Send Email</SelectItem>
                      <SelectItem value="open_app">Open App</SelectItem>
                      <SelectItem value="play_music">Play Music</SelectItem>
                      <SelectItem value="start_workflow">Start Workflow</SelectItem>
                      <SelectItem value="calendar_event">Calendar Event</SelectItem>
                    </SelectContent>
                  </Select>

                  {(newActionType === 'send_message' || newActionType === 'send_email') && (
                    <>
                      <Select value={newActionPlatform} onValueChange={setNewActionPlatform}>
                        <SelectTrigger>
                          <SelectValue placeholder="Platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Recipient (name or number)"
                        value={newActionTarget}
                        onChange={(e) => setNewActionTarget(e.target.value)}
                      />
                      <Textarea
                        placeholder="Message content..."
                        value={newActionContent}
                        onChange={(e) => setNewActionContent(e.target.value)}
                        rows={2}
                      />
                    </>
                  )}

                  {newActionType === 'play_music' && (
                    <Input
                      placeholder="Search query (e.g., focus music)"
                      value={newActionContent}
                      onChange={(e) => setNewActionContent(e.target.value)}
                    />
                  )}

                  <Button variant="secondary" size="sm" onClick={addAction} className="w-full">
                    <Plus className="w-4 h-4 mr-1" /> Add Action
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Navigation */}
        <div className="flex gap-2 pt-4 border-t border-border">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !title}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isCreating || !title || !scheduledDate || !scheduledTime}>
              {isCreating ? 'Creating...' : 'Create Alarm'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlarmCreator;
