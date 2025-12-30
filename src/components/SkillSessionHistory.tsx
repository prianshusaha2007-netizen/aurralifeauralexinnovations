import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock, Flame, TrendingUp, Calendar, Dumbbell, Code, Video, Palette, Music, Sparkles, Target } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSkillsProgress, SkillType } from '@/hooks/useSkillsProgress';
import { cn } from '@/lib/utils';

const SKILL_ICONS: Record<SkillType, React.ElementType> = {
  gym: Dumbbell,
  coding: Code,
  video_editing: Video,
  graphic_design: Palette,
  music: Music,
  content_creation: Sparkles,
  self_discipline: Target,
  general: Target,
};

const SKILL_COLORS: Record<SkillType, string> = {
  gym: 'text-red-500 bg-red-500/10',
  coding: 'text-blue-500 bg-blue-500/10',
  video_editing: 'text-purple-500 bg-purple-500/10',
  graphic_design: 'text-pink-500 bg-pink-500/10',
  music: 'text-amber-500 bg-amber-500/10',
  content_creation: 'text-emerald-500 bg-emerald-500/10',
  self_discipline: 'text-orange-500 bg-orange-500/10',
  general: 'text-primary bg-primary/10',
};

interface SessionHistoryEntry {
  skillId: string;
  startedAt: string;
  endedAt?: string;
  energyBefore?: 'low' | 'medium' | 'high';
  notes?: string;
}

interface SkillSessionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SkillSessionHistory: React.FC<SkillSessionHistoryProps> = ({
  open,
  onOpenChange,
}) => {
  const { skills, getActiveSkills } = useSkillsProgress();
  const [sessions, setSessions] = useState<SessionHistoryEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('aurra-skill-sessions');
    if (stored) {
      try {
        setSessions(JSON.parse(stored).reverse()); // Most recent first
      } catch {
        setSessions([]);
      }
    }
  }, [open]);

  const getSkillForSession = (skillId: string) => {
    return skills.find(s => s.id === skillId);
  };

  const getSessionDuration = (session: SessionHistoryEntry) => {
    if (!session.endedAt) return 0;
    const start = new Date(session.startedAt).getTime();
    const end = new Date(session.endedAt).getTime();
    return Math.floor((end - start) / 1000 / 60); // minutes
  };

  const getTotalMinutesToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessions
      .filter(s => new Date(s.startedAt) >= today)
      .reduce((sum, s) => sum + getSessionDuration(s), 0);
  };

  const getTotalSessionsThisWeek = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessions.filter(s => new Date(s.startedAt) >= weekAgo).length;
  };

  const getAverageSessionLength = () => {
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((sum, s) => sum + getSessionDuration(s), 0);
    return Math.round(total / sessions.length);
  };

  const activeSkills = getActiveSkills();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">Session History</SheetTitle>
        </SheetHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 text-center bg-primary/5 border-primary/20">
            <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{getTotalMinutesToday()}</p>
            <p className="text-xs text-muted-foreground">mins today</p>
          </Card>
          <Card className="p-3 text-center bg-amber-500/5 border-amber-500/20">
            <Flame className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold">{getTotalSessionsThisWeek()}</p>
            <p className="text-xs text-muted-foreground">this week</p>
          </Card>
          <Card className="p-3 text-center bg-emerald-500/5 border-emerald-500/20">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-bold">{getAverageSessionLength()}</p>
            <p className="text-xs text-muted-foreground">avg mins</p>
          </Card>
        </div>

        {/* Active Skills Summary */}
        {activeSkills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Active Skills</h3>
            <div className="flex flex-wrap gap-2">
              {activeSkills.map(skill => {
                const Icon = SKILL_ICONS[skill.type];
                const colorClass = SKILL_COLORS[skill.type];
                return (
                  <div
                    key={skill.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                      colorClass
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{skill.displayName}</span>
                    {skill.currentStreak > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Flame className="w-3 h-3" />
                        {skill.currentStreak}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Session History */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Sessions</h3>
          <ScrollArea className="h-[40vh]">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No sessions yet</p>
                <p className="text-sm">Start practicing to see your history!</p>
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {sessions.slice(0, 20).map((session, index) => {
                  const skill = getSkillForSession(session.skillId);
                  if (!skill) return null;
                  
                  const Icon = SKILL_ICONS[skill.type];
                  const colorClass = SKILL_COLORS[skill.type];
                  const duration = getSessionDuration(session);
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn("p-2 rounded-lg", colorClass)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{skill.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-medium">{duration} min</p>
                        {session.energyBefore && (
                          <p className="text-xs text-muted-foreground capitalize">
                            {session.energyBefore} energy
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SkillSessionHistory;
