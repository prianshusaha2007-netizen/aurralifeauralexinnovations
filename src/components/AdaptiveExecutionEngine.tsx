import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Play, Pause, X, Check, Clock, AlertTriangle, Volume2, VolumeX,
  Loader2, ChevronRight, RefreshCw, SkipForward
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAlarmSystem, Alarm, ExecutionMode, AlarmAction } from '@/hooks/useAlarmSystem';
import { useNativeCapabilities } from '@/hooks/useNativeCapabilities';

interface ExecutionStep {
  action: AlarmAction;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
  message?: string;
  timestamp?: Date;
}

interface AdaptiveExecutionEngineProps {
  alarm: Alarm | null;
  onComplete: () => void;
  onCancel: () => void;
}

const AdaptiveExecutionEngine: React.FC<AdaptiveExecutionEngineProps> = ({
  alarm,
  onComplete,
  onCancel,
}) => {
  const { executeAlarm, determineAdaptiveMode, userContext } = useAlarmSystem();
  const { hapticFeedback, hapticNotification, isNative } = useNativeCapabilities();

  const [executionMode, setExecutionMode] = useState<ExecutionMode | null>(null);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [progress, setProgress] = useState(0);

  // Initialize execution when alarm changes
  useEffect(() => {
    if (alarm) {
      const mode = determineAdaptiveMode(alarm);
      setExecutionMode(mode);
      
      // Initialize steps
      const initialSteps: ExecutionStep[] = alarm.actions.map(action => ({
        action,
        status: 'pending',
      }));
      setSteps(initialSteps);
      setCurrentStepIndex(-1);
      setProgress(0);

      // Determine if we need approval
      if (mode === 'ring_ask_execute') {
        setAwaitingApproval(true);
      } else if (mode === 'ring_execute' || mode === 'silent_execute' || mode === 'silent_execute_report') {
        // Auto-start execution
        startExecution();
      }
    }
  }, [alarm, determineAdaptiveMode]);

  const startExecution = async () => {
    if (!alarm) return;
    
    setAwaitingApproval(false);
    setIsExecuting(true);
    
    if (isNative) {
      await hapticNotification('success');
    }

    // Execute the alarm
    await executeAlarm(alarm, true);
    
    // Simulate step-by-step execution for UI
    for (let i = 0; i < steps.length; i++) {
      if (isPaused) {
        await new Promise(resolve => {
          const checkPause = setInterval(() => {
            if (!isPaused) {
              clearInterval(checkPause);
              resolve(true);
            }
          }, 100);
        });
      }

      setCurrentStepIndex(i);
      setSteps(prev => prev.map((step, idx) => 
        idx === i ? { ...step, status: 'executing', timestamp: new Date() } : step
      ));

      await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));

      setSteps(prev => prev.map((step, idx) => 
        idx === i ? { ...step, status: 'completed', timestamp: new Date() } : step
      ));

      setProgress(((i + 1) / steps.length) * 100);

      if (isNative) {
        await hapticFeedback('light');
      }
    }

    setIsExecuting(false);
    setTimeout(onComplete, 1500);
  };

  const handleApprove = () => {
    startExecution();
  };

  const handleReject = () => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'skipped' })));
    onCancel();
  };

  const handlePause = () => {
    setIsPaused(true);
    if (isNative) hapticFeedback('medium');
  };

  const handleResume = () => {
    setIsPaused(false);
    if (isNative) hapticFeedback('light');
  };

  const handleSkipStep = () => {
    setSteps(prev => prev.map((step, idx) => 
      idx === currentStepIndex ? { ...step, status: 'skipped' } : step
    ));
    setCurrentStepIndex(prev => prev + 1);
  };

  if (!alarm) return null;

  const getActionIcon = (type: AlarmAction['type']) => {
    switch (type) {
      case 'send_message': return '💬';
      case 'send_email': return '📧';
      case 'open_app': return '📱';
      case 'play_music': return '🎵';
      case 'start_workflow': return '⚡';
      case 'calendar_event': return '📅';
      case 'trigger_reminder': return '🔔';
      default: return '🎯';
    }
  };

  const getModeDescription = (mode: ExecutionMode) => {
    switch (mode) {
      case 'ring_ask_execute': return 'Awaiting your approval to proceed';
      case 'ring_execute': return 'Executing with notification';
      case 'silent_execute': return 'Running silently in background';
      case 'silent_execute_report': return 'Silent execution with report';
      case 'suppress': return 'Task suppressed based on context';
      case 'delay': return 'Task delayed due to current conditions';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-md p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{alarm.title}</h3>
              <p className="text-xs text-muted-foreground">
                {executionMode && getModeDescription(executionMode)}
              </p>
            </div>
          </div>
          <Badge variant="outline">
            {executionMode?.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Context indicators */}
        <div className="flex gap-2 flex-wrap">
          {userContext.current_mood && (
            <Badge variant="secondary" className="text-xs">
              Mood: {userContext.current_mood}
            </Badge>
          )}
          {userContext.current_energy && (
            <Badge variant="secondary" className="text-xs">
              Energy: {userContext.current_energy}
            </Badge>
          )}
          {userContext.active_focus_session && (
            <Badge variant="secondary" className="text-xs">
              Focus Active
            </Badge>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Execution steps */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                step.status === 'executing' ? 'bg-primary/10' :
                step.status === 'completed' ? 'bg-green-500/10' :
                step.status === 'failed' ? 'bg-red-500/10' :
                step.status === 'skipped' ? 'bg-muted' : ''
              }`}
            >
              {/* Status icon */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg">
                {step.status === 'executing' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : step.status === 'completed' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : step.status === 'failed' ? (
                  <X className="w-4 h-4 text-red-500" />
                ) : step.status === 'skipped' ? (
                  <SkipForward className="w-4 h-4 text-muted-foreground" />
                ) : (
                  getActionIcon(step.action.type)
                )}
              </div>

              {/* Action info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize">
                  {step.action.type.replace(/_/g, ' ')}
                </p>
                {step.action.target && (
                  <p className="text-xs text-muted-foreground truncate">
                    {step.action.platform && `via ${step.action.platform} • `}
                    {step.action.target}
                  </p>
                )}
              </div>

              {/* Timestamp */}
              {step.timestamp && (
                <span className="text-[10px] text-muted-foreground">
                  {step.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-2 pt-2">
          {awaitingApproval ? (
            <>
              <Button variant="outline" onClick={handleReject} className="flex-1">
                <X className="w-4 h-4 mr-1" /> Reject
              </Button>
              <Button onClick={handleApprove} className="flex-1">
                <Check className="w-4 h-4 mr-1" /> Approve
              </Button>
            </>
          ) : isExecuting ? (
            <>
              {isPaused ? (
                <Button onClick={handleResume} className="flex-1">
                  <Play className="w-4 h-4 mr-1" /> Resume
                </Button>
              ) : (
                <Button variant="outline" onClick={handlePause} className="flex-1">
                  <Pause className="w-4 h-4 mr-1" /> Pause
                </Button>
              )}
              <Button variant="ghost" onClick={handleSkipStep}>
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button variant="destructive" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button onClick={onComplete} className="w-full">
              <Check className="w-4 h-4 mr-1" /> Done
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default AdaptiveExecutionEngine;
