import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Play, Pause, Square, Check, AlertCircle, 
  ChevronDown, ChevronUp, Settings, Zap, Clock,
  ExternalLink, Loader2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error' | 'awaiting-approval';

export interface ExecutionStep {
  id: string;
  action: string;
  target?: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  timestamp: Date;
  details?: string;
}

export interface AgenticTask {
  id: string;
  title: string;
  description?: string;
  status: ExecutionStatus;
  progress: number;
  steps: ExecutionStep[];
  startedAt?: Date;
  completedAt?: Date;
  autonomyMode: 'approval' | 'auto';
}

interface AgenticExecutionPanelProps {
  task: AgenticTask | null;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onApprove?: (stepId: string) => void;
  onReject?: (stepId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const AgenticExecutionPanel: React.FC<AgenticExecutionPanelProps> = ({
  task,
  onPause,
  onResume,
  onCancel,
  onApprove,
  onReject,
  isExpanded = false,
  onToggleExpand
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!task) return null;

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case 'running': return 'text-blue-500';
      case 'paused': return 'text-amber-500';
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'awaiting-approval': return 'text-violet-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStepIcon = (status: ExecutionStep['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-muted" />;
    }
  };

  const pendingApproval = task.steps.find(s => s.status === 'pending' && task.status === 'awaiting-approval');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-20 left-4 right-4 z-40 max-w-lg mx-auto"
    >
      <Card className="overflow-hidden border-primary/20 shadow-lg bg-background/95 backdrop-blur-sm">
        {/* Header */}
        <div 
          className="p-4 flex items-center justify-between cursor-pointer"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              task.status === 'running' ? "bg-blue-500/20" :
              task.status === 'completed' ? "bg-green-500/20" :
              task.status === 'error' ? "bg-red-500/20" :
              "bg-muted"
            )}>
              {task.status === 'running' ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Bot className="w-5 h-5 text-blue-500" />
                </motion.div>
              ) : (
                <Bot className={cn("w-5 h-5", getStatusColor(task.status))} />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{task.title}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {task.autonomyMode === 'auto' ? 'Auto' : 'Approval'}
                </Badge>
                <span className={cn("text-xs", getStatusColor(task.status))}>
                  {task.status === 'running' ? 'Executing...' :
                   task.status === 'awaiting-approval' ? 'Needs approval' :
                   task.status === 'completed' ? 'Done' :
                   task.status === 'error' ? 'Failed' :
                   task.status === 'paused' ? 'Paused' : 'Idle'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {task.status === 'running' && onPause && (
              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onPause(); }}>
                <Pause className="w-4 h-4" />
              </Button>
            )}
            {task.status === 'paused' && onResume && (
              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onResume(); }}>
                <Play className="w-4 h-4" />
              </Button>
            )}
            {(task.status === 'running' || task.status === 'paused') && onCancel && (
              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onCancel(); }}>
                <Square className="w-4 h-4" />
              </Button>
            )}
            {showDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 pb-2">
          <Progress value={task.progress} className="h-1" />
        </div>

        {/* Approval prompt */}
        {pendingApproval && task.status === 'awaiting-approval' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-4 pb-4"
          >
            <Card className="p-3 bg-violet-500/10 border-violet-500/20">
              <p className="text-sm mb-2">
                <span className="font-medium">Next action:</span> {pendingApproval.action}
                {pendingApproval.target && (
                  <span className="text-muted-foreground"> → {pendingApproval.target}</span>
                )}
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onReject?.(pendingApproval.id)}
                >
                  <X className="w-4 h-4 mr-1" /> Skip
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onApprove?.(pendingApproval.id)}
                >
                  <Check className="w-4 h-4 mr-1" /> Approve
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Execution log */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <ScrollArea className="max-h-48 px-4 pb-4">
                <div className="space-y-2">
                  {task.steps.map((step, i) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 text-sm"
                    >
                      {getStepIcon(step.status)}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          step.status === 'completed' ? 'text-muted-foreground' :
                          step.status === 'running' ? 'text-foreground' :
                          'text-muted-foreground/70'
                        )}>
                          {step.action}
                          {step.target && (
                            <span className="text-primary/80 ml-1">
                              → {step.target}
                            </span>
                          )}
                        </p>
                        {step.details && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {step.details}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {step.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// Demo/test execution
export const useDemoExecution = () => {
  const [task, setTask] = useState<AgenticTask | null>(null);

  const startDemo = () => {
    const demoSteps: ExecutionStep[] = [
      { id: '1', action: 'Opening Instagram', status: 'pending', timestamp: new Date() },
      { id: '2', action: 'Searching', target: 'internships', status: 'pending', timestamp: new Date() },
      { id: '3', action: 'Scrolling results', status: 'pending', timestamp: new Date() },
      { id: '4', action: 'Saving post', status: 'pending', timestamp: new Date() },
      { id: '5', action: 'Closing app', status: 'pending', timestamp: new Date() },
    ];

    setTask({
      id: 'demo-1',
      title: 'Find internship posts',
      description: 'Searching Instagram for internship opportunities',
      status: 'running',
      progress: 0,
      steps: demoSteps,
      startedAt: new Date(),
      autonomyMode: 'auto'
    });
  };

  const clearTask = () => setTask(null);

  return { task, startDemo, clearTask, setTask };
};
