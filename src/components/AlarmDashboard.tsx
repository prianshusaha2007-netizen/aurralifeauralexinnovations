import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Clock, Play, Pause, Trash2, Edit, Plus, ChevronRight,
  Zap, AlertTriangle, Check, X, Loader2, Calendar, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAlarmSystem, Alarm, ExecutionMode } from '@/hooks/useAlarmSystem';
import AlarmCreator from './AlarmCreator';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';

const executionModeLabels: Record<ExecutionMode, { label: string; color: string }> = {
  ring_ask_execute: { label: 'Ring+Ask', color: 'bg-blue-500' },
  ring_execute: { label: 'Ring+Exec', color: 'bg-green-500' },
  silent_execute: { label: 'Silent', color: 'bg-gray-500' },
  silent_execute_report: { label: 'Silent+Report', color: 'bg-purple-500' },
  suppress: { label: 'Suppress', color: 'bg-red-500' },
  delay: { label: 'Delay', color: 'bg-yellow-500' },
};

const categoryColors: Record<string, string> = {
  fitness: 'bg-orange-500',
  study: 'bg-blue-500',
  finance: 'bg-green-500',
  social: 'bg-pink-500',
  reflection: 'bg-purple-500',
  networking: 'bg-cyan-500',
  wellness: 'bg-emerald-500',
  routine: 'bg-indigo-500',
  outreach: 'bg-amber-500',
};

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onExecute: (alarm: Alarm) => void;
}

const AlarmCard: React.FC<AlarmCardProps> = ({ alarm, onToggle, onDelete, onExecute }) => {
  const scheduledDate = new Date(alarm.scheduled_at);
  const isUpcoming = isFuture(scheduledDate);
  const isPastDue = isPast(scheduledDate);

  return (
    <Card className={`p-4 transition-all ${!alarm.is_active ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUpcoming ? 'bg-primary/10' : isPastDue ? 'bg-muted' : 'bg-green-500/10'
        }`}>
          {isUpcoming ? (
            <Clock className="w-5 h-5 text-primary" />
          ) : (
            <Check className="w-5 h-5 text-green-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{alarm.title}</h4>
            {alarm.category && (
              <Badge className={`${categoryColors[alarm.category]} text-white text-[10px]`}>
                {alarm.category}
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-2">
            {format(scheduledDate, 'MMM d, yyyy')} at {format(scheduledDate, 'h:mm a')}
            {isUpcoming && (
              <span className="text-primary ml-1">
                ({formatDistanceToNow(scheduledDate, { addSuffix: true })})
              </span>
            )}
          </p>

          {/* Actions count */}
          {alarm.actions.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="w-3 h-3" />
              {alarm.actions.length} action{alarm.actions.length > 1 ? 's' : ''}
            </div>
          )}

          {/* Execution mode badge */}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px]">
              <div className={`w-2 h-2 rounded-full mr-1 ${executionModeLabels[alarm.execution_mode].color}`} />
              {executionModeLabels[alarm.execution_mode].label}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              Mode {alarm.autonomy_level}
            </Badge>
            {alarm.repeat_pattern && (
              <Badge variant="outline" className="text-[10px]">
                {alarm.repeat_pattern}
              </Badge>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-end gap-2">
          <Switch
            checked={alarm.is_active}
            onCheckedChange={(checked) => onToggle(alarm.id, checked)}
          />
          <div className="flex gap-1">
            {isUpcoming && alarm.is_active && (
              <Button variant="ghost" size="sm" onClick={() => onExecute(alarm)}>
                <Play className="w-3 h-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onDelete(alarm.id)}>
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

interface AlarmDashboardProps {
  onClose?: () => void;
}

const AlarmDashboard: React.FC<AlarmDashboardProps> = ({ onClose }) => {
  const { alarms, pendingAlarms, isLoading, updateAlarm, deleteAlarm, executeAlarm } = useAlarmSystem();
  const [showCreator, setShowCreator] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  const upcomingAlarms = alarms.filter(a => isFuture(new Date(a.scheduled_at)) && a.is_active);
  const pastAlarms = alarms.filter(a => isPast(new Date(a.scheduled_at)));
  const inactiveAlarms = alarms.filter(a => !a.is_active);

  const handleToggle = async (id: string, active: boolean) => {
    await updateAlarm(id, { is_active: active });
  };

  const handleDelete = async (id: string) => {
    await deleteAlarm(id);
  };

  const handleExecute = async (alarm: Alarm) => {
    await executeAlarm(alarm, true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Alarms & Tasks</h2>
            <p className="text-xs text-muted-foreground">
              {upcomingAlarms.length} upcoming • {alarms.length} total
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreator(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Alarm
        </Button>
      </div>

      {/* Pending alarms alert */}
      <AnimatePresence>
        {pendingAlarms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-primary/10 border-b border-primary/20"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {pendingAlarms.length} alarm{pendingAlarms.length > 1 ? 's' : ''} coming up soon
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 grid grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming ({upcomingAlarms.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastAlarms.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveAlarms.length})</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="upcoming" className="m-0 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingAlarms.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No upcoming alarms</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowCreator(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Create your first alarm
                </Button>
              </div>
            ) : (
              upcomingAlarms.map((alarm) => (
                <AlarmCard
                  key={alarm.id}
                  alarm={alarm}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onExecute={handleExecute}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="m-0 space-y-3">
            {pastAlarms.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No past alarms</p>
              </div>
            ) : (
              pastAlarms.map((alarm) => (
                <AlarmCard
                  key={alarm.id}
                  alarm={alarm}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onExecute={handleExecute}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="inactive" className="m-0 space-y-3">
            {inactiveAlarms.length === 0 ? (
              <div className="text-center py-8">
                <Pause className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No inactive alarms</p>
              </div>
            ) : (
              inactiveAlarms.map((alarm) => (
                <AlarmCard
                  key={alarm.id}
                  alarm={alarm}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onExecute={handleExecute}
                />
              ))
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Creator modal */}
      <AlarmCreator
        open={showCreator}
        onOpenChange={setShowCreator}
      />
    </div>
  );
};

export default AlarmDashboard;
