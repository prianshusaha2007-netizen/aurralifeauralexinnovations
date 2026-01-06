import React from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Dumbbell, 
  Code, 
  Music, 
  Palette,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Flame,
  Award,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSkillsProgress, SkillType } from '@/hooks/useSkillsProgress';
import { useMentorship } from '@/hooks/useMentorship';
import { SkillProgressBadges } from './SkillMilestones';
import { cn } from '@/lib/utils';

const ROLE_ICONS: Record<string, React.ReactNode> = {
  student: <GraduationCap className="h-5 w-5" />,
  trainer: <Dumbbell className="h-5 w-5" />,
  learner: <Code className="h-5 w-5" />,
  parent: <GraduationCap className="h-5 w-5" />,
};

const ROLE_COLORS: Record<string, string> = {
  student: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  trainer: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  learner: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  parent: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

interface MentorshipProgressTrackerProps {
  compact?: boolean;
  className?: string;
}

export const MentorshipProgressTracker: React.FC<MentorshipProgressTrackerProps> = ({
  compact = false,
  className
}) => {
  const { profile, hasCompletedSetup } = useMentorship();
  const { skills, getActiveSkills } = useSkillsProgress();

  if (!hasCompletedSetup) return null;

  const activeSkills = getActiveSkills();
  const primaryRole = profile.role_types[0] || 'learner';
  
  // Calculate overall stats
  const totalSessions = activeSkills.reduce((acc, s) => acc + s.totalSessions, 0);
  const longestStreak = Math.max(...activeSkills.map(s => s.currentStreak), 0);
  const activeCount = activeSkills.length;

  // Weekly progress calculation
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  
  // Determine level based on total sessions
  const getLevel = (): { level: string; progress: number; next: string } => {
    if (totalSessions < 5) return { level: 'Beginner', progress: (totalSessions / 5) * 100, next: '5 sessions' };
    if (totalSessions < 15) return { level: 'Explorer', progress: ((totalSessions - 5) / 10) * 100, next: '15 sessions' };
    if (totalSessions < 30) return { level: 'Builder', progress: ((totalSessions - 15) / 15) * 100, next: '30 sessions' };
    if (totalSessions < 50) return { level: 'Achiever', progress: ((totalSessions - 30) / 20) * 100, next: '50 sessions' };
    if (totalSessions < 100) return { level: 'Master', progress: ((totalSessions - 50) / 50) * 100, next: '100 sessions' };
    return { level: 'Legend', progress: 100, next: 'Mastered!' };
  };

  const levelInfo = getLevel();

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex items-center gap-3", className)}
      >
        <div className={cn("p-2 rounded-lg", ROLE_COLORS[primaryRole])}>
          {ROLE_ICONS[primaryRole]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium capitalize">{primaryRole} Mode</span>
            <Badge variant="secondary" className="text-[10px]">{levelInfo.level}</Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {totalSessions} sessions
            </span>
            {longestStreak > 0 && (
              <span className="flex items-center gap-1 text-orange-500">
                <Flame className="h-3 w-3" />
                {longestStreak} day streak
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-4", className)}
    >
      {/* Main Progress Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", ROLE_COLORS[primaryRole])}>
                {ROLE_ICONS[primaryRole]}
              </div>
              <div>
                <CardTitle className="text-base capitalize">{primaryRole} Journey</CardTitle>
                <p className="text-xs text-muted-foreground">{profile.mentorship_style} style</p>
              </div>
            </div>
            <Badge className="bg-primary/20 text-primary border-0">
              {levelInfo.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Level Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Progress to next level</span>
              <span className="font-medium">{levelInfo.next}</span>
            </div>
            <Progress value={levelInfo.progress} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-1 text-lg font-bold">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {totalSessions}
              </div>
              <p className="text-[10px] text-muted-foreground">Sessions</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-1 text-lg font-bold">
                <Flame className="h-4 w-4 text-orange-500" />
                {longestStreak}
              </div>
              <p className="text-[10px] text-muted-foreground">Best Streak</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-1 text-lg font-bold">
                <Award className="h-4 w-4 text-amber-500" />
                {activeCount}
              </div>
              <p className="text-[10px] text-muted-foreground">Active Skills</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Skills with Milestones */}
      {activeSkills.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Skill Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeSkills.map((skill) => (
              <div key={skill.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{skill.displayName}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{skill.totalSessions} sessions</span>
                    {skill.currentStreak > 0 && (
                      <span className="flex items-center gap-0.5 text-orange-500">
                        <Flame className="h-3 w-3" />
                        {skill.currentStreak}
                      </span>
                    )}
                  </div>
                </div>
                <SkillProgressBadges skill={skill} showNext={true} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Practices & Subjects */}
      {(profile.practices.length > 0 || profile.subjects.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Focus Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {profile.subjects.map((subject) => (
                <Badge key={subject} variant="secondary" className="text-xs">
                  📚 {subject}
                </Badge>
              ))}
              {profile.practices.map((practice) => (
                <Badge key={practice} variant="secondary" className="text-xs">
                  🎯 {practice}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default MentorshipProgressTracker;
