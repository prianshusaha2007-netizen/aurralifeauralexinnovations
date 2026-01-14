import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Play, Pause, X, Check, ChevronDown, ChevronUp,
  Smartphone, Globe, Music, MessageCircle, Search, Navigation,
  Calendar, Camera, Settings, ExternalLink, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AutonomyMode, useAutonomyMode } from './AutonomyModeSelector';

interface AgentAction {
  id: string;
  type: 'app' | 'browser' | 'system';
  app?: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'awaiting';
  details?: string;
  timestamp: Date;
}

interface AgentTask {
  id: string;
  title: string;
  description?: string;
  actions: AgentAction[];
  status: 'pending' | 'running' | 'awaiting' | 'completed' | 'cancelled';
  progress: number;
  autonomyMode: AutonomyMode;
}

interface AgentActionPanelProps {
  task?: AgentTask | null;
  onApprove?: () => void;
  onReject?: () => void;
  onPause?: () => void;
  onCancel?: () => void;
}

const appIcons: Record<string, React.ElementType> = {
  spotify: Music,
  whatsapp: MessageCircle,
  instagram: Search,
  chrome: Globe,
  maps: Navigation,
  calendar: Calendar,
  camera: Camera,
  settings: Settings,
  default: Smartphone,
};

const getAppIcon = (app?: string) => {
  if (!app) return Smartphone;
  return appIcons[app.toLowerCase()] || Smartphone;
};

export const AgentActionPanel: React.FC<AgentActionPanelProps> = ({
  task,
  onApprove,
  onReject,
  onPause,
  onCancel,
}) => {
  const [expanded, setExpanded] = useState(true);
  const { mode } = useAutonomyMode();

  if (!task) return null;

  const needsApproval = task.status === 'awaiting' && mode !== 'A';
  const isRunning = task.status === 'running';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto"
      >
        <Card className="overflow-hidden shadow-xl border-2 border-primary/20">
          {/* Header */}
          <div className="p-3 bg-primary/5 border-b flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isRunning ? "bg-primary animate-pulse" : "bg-muted"
            )}>
              <Bot className={cn("w-4 h-4", isRunning ? "text-primary-foreground" : "text-muted-foreground")} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{task.title}</p>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  Mode {task.autonomyMode}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Progress value={task.progress} className="h-1 flex-1" />
                <span className="text-[10px] text-muted-foreground">
                  {task.progress}%
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Actions List */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <ScrollArea className="max-h-48">
                  <div className="p-3 space-y-2">
                    {task.actions.map((action, index) => {
                      const Icon = getAppIcon(action.app);
                      return (
                        <div
                          key={action.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg text-sm",
                            action.status === 'running' && "bg-primary/5",
                            action.status === 'completed' && "text-muted-foreground",
                            action.status === 'failed' && "bg-destructive/5 text-destructive"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded flex items-center justify-center shrink-0",
                            action.status === 'running' ? "bg-primary/20" : "bg-muted"
                          )}>
                            {action.status === 'running' ? (
                              <Loader2 className="w-3 h-3 animate-spin text-primary" />
                            ) : action.status === 'completed' ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : action.status === 'failed' ? (
                              <X className="w-3 h-3 text-destructive" />
                            ) : (
                              <Icon className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{action.action}</p>
                            {action.details && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {action.details}
                              </p>
                            )}
                          </div>
                          {action.app && (
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {action.app}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Action Buttons */}
                <div className="p-3 border-t bg-muted/30">
                  {needsApproval ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onReject}
                        className="flex-1 h-9"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={onApprove}
                        className="flex-1 h-9"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  ) : isRunning ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onPause}
                        className="flex-1 h-9"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={onCancel}
                        className="flex-1 h-9"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-muted-foreground">
                      {task.status === 'completed' && '✓ Task completed'}
                      {task.status === 'cancelled' && '✕ Task cancelled'}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

// Demo/mock task for testing
export const createMockTask = (): AgentTask => ({
  id: Date.now().toString(),
  title: 'Morning Routine',
  description: 'Starting your usual morning workflow',
  autonomyMode: 'B',
  status: 'running',
  progress: 45,
  actions: [
    { id: '1', type: 'app', app: 'Spotify', action: 'Playing Morning Focus playlist', status: 'completed', timestamp: new Date() },
    { id: '2', type: 'app', app: 'Calendar', action: 'Checking today\'s schedule', status: 'completed', timestamp: new Date() },
    { id: '3', type: 'browser', action: 'Opening productivity dashboard', status: 'running', timestamp: new Date() },
    { id: '4', type: 'app', app: 'WhatsApp', action: 'Send good morning to Mom', status: 'pending', timestamp: new Date() },
  ],
});
