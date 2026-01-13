import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, startOfDay, isSameDay } from 'date-fns';
import {
  Calendar, Heart, Brain, Zap, Coffee, Moon, Sun,
  Target, Dumbbell, DollarSign, BookOpen, Bot,
  ChevronLeft, ChevronRight, MoreHorizontal, Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  type: 'mood' | 'task' | 'workout' | 'spending' | 'reflection' | 'agent' | 'habit' | 'focus' | 'journal';
  title: string;
  description?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface LifeTimelineProps {
  events?: TimelineEvent[];
  onDateChange?: (date: Date) => void;
}

const eventTypeConfig: Record<TimelineEvent['type'], { 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  mood: { icon: Heart, color: 'text-rose-500', bgColor: 'bg-rose-500/10', label: 'Mood' },
  task: { icon: Target, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Task' },
  workout: { icon: Dumbbell, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Workout' },
  spending: { icon: DollarSign, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Spending' },
  reflection: { icon: Brain, color: 'text-violet-500', bgColor: 'bg-violet-500/10', label: 'Reflection' },
  agent: { icon: Bot, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', label: 'Agent' },
  habit: { icon: Zap, color: 'text-orange-500', bgColor: 'bg-orange-500/10', label: 'Habit' },
  focus: { icon: BookOpen, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', label: 'Focus' },
  journal: { icon: Moon, color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Journal' },
};

// Demo events for display
const generateDemoEvents = (date: Date): TimelineEvent[] => {
  const events: TimelineEvent[] = [
    {
      id: '1',
      type: 'mood',
      title: 'Morning check-in',
      description: 'Feeling energized and ready for the day',
      timestamp: new Date(date.setHours(7, 30)),
      sentiment: 'positive',
      metadata: { energy: 'high', mood: 'happy' }
    },
    {
      id: '2',
      type: 'habit',
      title: 'Meditation completed',
      description: '10 minutes of mindfulness',
      timestamp: new Date(date.setHours(7, 45)),
      sentiment: 'positive'
    },
    {
      id: '3',
      type: 'focus',
      title: 'Deep work session',
      description: 'Worked on project proposal',
      timestamp: new Date(date.setHours(9, 0)),
      metadata: { duration: 90 }
    },
    {
      id: '4',
      type: 'agent',
      title: 'AURRA searched LinkedIn',
      description: 'Found 5 relevant job postings',
      timestamp: new Date(date.setHours(10, 30)),
      metadata: { actions: ['search', 'filter', 'save'] }
    },
    {
      id: '5',
      type: 'workout',
      title: 'Morning run',
      description: '5km in 28 minutes',
      timestamp: new Date(date.setHours(12, 0)),
      sentiment: 'positive',
      metadata: { distance: 5, duration: 28 }
    },
    {
      id: '6',
      type: 'spending',
      title: 'Lunch expense',
      description: '₹150 at Café Coffee Day',
      timestamp: new Date(date.setHours(13, 0)),
      metadata: { amount: 150, category: 'food' }
    },
    {
      id: '7',
      type: 'task',
      title: 'Completed: Send proposal',
      description: 'Sent to 3 clients',
      timestamp: new Date(date.setHours(16, 0)),
      sentiment: 'positive'
    },
    {
      id: '8',
      type: 'reflection',
      title: 'Evening reflection',
      description: 'Grateful for productive day',
      timestamp: new Date(date.setHours(21, 0)),
      sentiment: 'positive'
    },
  ];
  return events;
};

export const LifeTimeline: React.FC<LifeTimelineProps> = ({
  events: propEvents,
  onDateChange
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState<TimelineEvent['type'] | 'all'>('all');

  const events = propEvents || generateDemoEvents(new Date(selectedDate));

  const filteredEvents = events
    .filter(e => selectedFilter === 'all' || e.type === selectedFilter)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const goToPrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
    onDateChange?.(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
    onDateChange?.(next);
  };

  const getDateLabel = () => {
    if (isToday(selectedDate)) return 'Today';
    if (isYesterday(selectedDate)) return 'Yesterday';
    return format(selectedDate, 'EEEE, MMM d');
  };

  // Group events by time periods
  const periods = [
    { label: 'Morning', start: 5, end: 12, icon: Sun },
    { label: 'Afternoon', start: 12, end: 17, icon: Coffee },
    { label: 'Evening', start: 17, end: 21, icon: Moon },
    { label: 'Night', start: 21, end: 24, icon: Moon },
  ];

  const getEventsForPeriod = (start: number, end: number) => {
    return filteredEvents.filter(e => {
      const hour = e.timestamp.getHours();
      return hour >= start && hour < end;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goToPrevDay}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold">{getDateLabel()}</h2>
          <p className="text-sm text-muted-foreground">
            {filteredEvents.length} events
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={goToNextDay}
          disabled={isToday(selectedDate)}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Filter chips */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Badge
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setSelectedFilter('all')}
          >
            All
          </Badge>
          {Object.entries(eventTypeConfig).map(([type, config]) => (
            <Badge
              key={type}
              variant={selectedFilter === type ? 'default' : 'outline'}
              className={cn("cursor-pointer whitespace-nowrap", selectedFilter === type && config.bgColor)}
              onClick={() => setSelectedFilter(type as TimelineEvent['type'])}
            >
              <config.icon className={cn("w-3 h-3 mr-1", config.color)} />
              {config.label}
            </Badge>
          ))}
        </div>
      </ScrollArea>

      {/* Timeline */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-6 pr-4">
          {periods.map((period) => {
            const periodEvents = getEventsForPeriod(period.start, period.end);
            if (periodEvents.length === 0) return null;

            return (
              <div key={period.label}>
                {/* Period header */}
                <div className="flex items-center gap-2 mb-3">
                  <period.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {period.label}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Events */}
                <div className="space-y-3 ml-6 border-l-2 border-muted pl-4">
                  <AnimatePresence>
                    {periodEvents.map((event, index) => {
                      const config = eventTypeConfig[event.type];
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className={cn(
                            "p-3 relative",
                            event.sentiment === 'positive' && "border-l-2 border-l-green-500",
                            event.sentiment === 'negative' && "border-l-2 border-l-red-500"
                          )}>
                            {/* Timeline dot */}
                            <div className={cn(
                              "absolute -left-[1.35rem] top-4 w-2.5 h-2.5 rounded-full border-2 border-background",
                              config.bgColor.replace('/10', '')
                            )} />

                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                config.bgColor
                              )}>
                                <config.icon className={cn("w-4 h-4", config.color)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-medium text-sm">{event.title}</p>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {format(event.timestamp, 'h:mm a')}
                                  </span>
                                </div>
                                {event.description && (
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {event.description}
                                  </p>
                                )}
                                {event.metadata && (
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    {Object.entries(event.metadata).map(([key, value]) => (
                                      <Badge 
                                        key={key} 
                                        variant="secondary" 
                                        className="text-xs"
                                      >
                                        {key}: {String(value)}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}

          {filteredEvents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No events for this day</p>
              <p className="text-sm">Your activities will appear here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
