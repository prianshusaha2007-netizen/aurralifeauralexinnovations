import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Clock, Play, Pause, X, ChevronRight,
  Zap, Brain, Dumbbell, BookOpen, DollarSign,
  Users, Sparkles, Calendar, MessageSquare, Music2,
  Timer, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alarm, AlarmAction, ExecutionMode, TaskCategory } from '@/hooks/useAlarmSystem';
import { useNativeCapabilities } from '@/hooks/useNativeCapabilities';

interface AlarmTriggerModalProps {
  alarm: Alarm | null;
  adaptiveMode: ExecutionMode;
  onApprove: () => void;
  onSnooze: (minutes: number) => void;
  onSkip: () => void;
  onClose: () => void;
}

const categoryIcons: Record<TaskCategory, React.ReactNode> = {
  fitness: <Dumbbell className="w-5 h-5" />,
  study: <BookOpen className="w-5 h-5" />,
  finance: <DollarSign className="w-5 h-5" />,
  social: <Users className="w-5 h-5" />,
  reflection: <Brain className="w-5 h-5" />,
  routine: <Calendar className="w-5 h-5" />,
  networking: <Users className="w-5 h-5" />,
  outreach: <MessageSquare className="w-5 h-5" />,
  wellness: <Sparkles className="w-5 h-5" />,
};

const actionTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  send_message: { label: 'Send Message', icon: <MessageSquare className="w-4 h-4" /> },
  open_app: { label: 'Open App', icon: <Play className="w-4 h-4" /> },
  play_music: { label: 'Play Music', icon: <Music2 className="w-4 h-4" /> },
  start_workflow: { label: 'Start Workflow', icon: <Zap className="w-4 h-4" /> },
  calendar_event: { label: 'Calendar Event', icon: <Calendar className="w-4 h-4" /> },
  trigger_reminder: { label: 'Reminder', icon: <Bell className="w-4 h-4" /> },
  create_note: { label: 'Create Note', icon: <BookOpen className="w-4 h-4" /> },
  log_activity: { label: 'Log Activity', icon: <Timer className="w-4 h-4" /> },
};

const modeDescriptions: Record<ExecutionMode, string> = {
  ring_ask_execute: 'Will ask for approval before executing',
  ring_execute: 'Will execute immediately',
  silent_execute: 'Will execute silently',
  silent_execute_report: 'Will execute silently and report',
  suppress: 'Suppressed due to current state',
  delay: 'Suggested to delay due to low energy',
};

const snoozeOptions = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
];

const AlarmTriggerModal: React.FC<AlarmTriggerModalProps> = ({
  alarm,
  adaptiveMode,
  onApprove,
  onSnooze,
  onSkip,
  onClose,
}) => {
  const [snoozeMinutes, setSnoozeMinutes] = useState(10);
  const [isAnimating, setIsAnimating] = useState(true);
  const { hapticNotification, isNative } = useNativeCapabilities();

  useEffect(() => {
    if (alarm && isNative) {
      hapticNotification('warning');
    }
  }, [alarm, isNative, hapticNotification]);

  useEffect(() => {
    if (alarm) {
      const interval = setInterval(() => {
        setIsAnimating(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [alarm]);

  if (!alarm) return null;

  const isSuppressed = adaptiveMode === 'suppress';
  const isDelayed = adaptiveMode === 'delay';

  return (
    <Dialog open={!!alarm} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-primary/20">
        {/* Animated header */}
        <div className="relative">
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent"
            animate={{
              opacity: isAnimating ? 1 : 0.5,
            }}
            transition={{ duration: 0.5 }}
          />
          
          <div className="relative p-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
                  animate={{
                    scale: isAnimating ? [1, 1.1, 1] : 1,
                    boxShadow: isAnimating 
                      ? ['0 0 0 0 rgba(139, 92, 246, 0.4)', '0 0 0 20px rgba(139, 92, 246, 0)', '0 0 0 0 rgba(139, 92, 246, 0)']
                      : '0 0 0 0 rgba(139, 92, 246, 0)',
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Bell className="w-6 h-6 text-primary" />
                </motion.div>
                <div>
                  <p className="text-xs text-muted-foreground">Alarm Triggered</p>
                  <p className="text-sm font-medium">
                    {new Date(alarm.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              
              <Badge 
                variant="outline" 
                className={`${
                  alarm.category ? 'border-primary/50' : 'border-muted'
                }`}
              >
                <span className="mr-1">{alarm.category && categoryIcons[alarm.category]}</span>
                {alarm.category || 'General'}
              </Badge>
            </div>

            <DialogHeader className="text-left p-0">
              <DialogTitle className="text-xl">{alarm.title}</DialogTitle>
              {alarm.description && (
                <p className="text-sm text-muted-foreground mt-1">{alarm.description}</p>
              )}
            </DialogHeader>
          </div>
        </div>

        {/* Adaptive mode indicator */}
        <div className="px-6 pb-4">
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            isSuppressed ? 'bg-yellow-500/10 text-yellow-600' :
            isDelayed ? 'bg-orange-500/10 text-orange-600' :
            'bg-muted/50'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{modeDescriptions[adaptiveMode]}</span>
          </div>
        </div>

        {/* Actions to execute */}
        {alarm.actions.length > 0 && (
          <div className="px-6 pb-4">
            <p className="text-xs text-muted-foreground mb-2">Actions to execute:</p>
            <div className="space-y-2">
              {alarm.actions.map((action, index) => (
                <ActionPreview key={index} action={action} />
              ))}
            </div>
          </div>
        )}

        {/* Priority & Urgency */}
        <div className="px-6 pb-4 flex gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Priority:</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-3 rounded-full ${
                    i < (alarm.priority || 5) ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Urgency:</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-3 rounded-full ${
                    i < (alarm.urgency || 5) ? 'bg-orange-500' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-6 pt-2 space-y-3 bg-muted/30">
          {!isSuppressed && (
            <Button 
              onClick={onApprove} 
              className="w-full h-12 text-base gap-2"
              size="lg"
            >
              <Play className="w-5 h-5" />
              Execute Now
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          )}

          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <Select
                value={snoozeMinutes.toString()}
                onValueChange={(v) => setSnoozeMinutes(parseInt(v))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {snoozeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="secondary" 
                onClick={() => onSnooze(snoozeMinutes)}
                className="flex-1 gap-2"
              >
                <Pause className="w-4 h-4" />
                Snooze
              </Button>
            </div>
            <Button 
              variant="outline" 
              onClick={onSkip}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Skip
            </Button>
          </div>

          {isSuppressed && (
            <p className="text-xs text-center text-muted-foreground">
              This alarm was suppressed based on your current state. You can still execute it manually.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Action preview component
const ActionPreview: React.FC<{ action: AlarmAction }> = ({ action }) => {
  const actionInfo = actionTypeLabels[action.type] || { 
    label: action.type, 
    icon: <Zap className="w-4 h-4" /> 
  };

  return (
    <Card className="p-3 bg-card/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {actionInfo.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{actionInfo.label}</p>
          {action.target && (
            <p className="text-xs text-muted-foreground truncate">
              To: {action.target}
            </p>
          )}
          {action.content && (
            <p className="text-xs text-muted-foreground truncate">
              "{action.content}"
            </p>
          )}
          {action.appId && (
            <p className="text-xs text-muted-foreground">
              App: {action.appId}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AlarmTriggerModal;
