import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Dumbbell, 
  Video, 
  Palette, 
  Music, 
  Code, 
  Target,
  Flame,
  TrendingUp,
  Clock,
  Plus,
  Play,
  Pause,
  Settings,
  ChevronRight,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSkillsProgress, SkillType } from '@/hooks/useSkillsProgress';
import { SkillMilestones, SkillProgressBadges } from '@/components/SkillMilestones';
import { MentorshipProgressTracker } from '@/components/MentorshipProgressTracker';
import { useMentorship } from '@/hooks/useMentorship';

const SKILL_ICONS: Record<SkillType, React.ReactNode> = {
  gym: <Dumbbell className="h-5 w-5" />,
  coding: <Code className="h-5 w-5" />,
  video_editing: <Video className="h-5 w-5" />,
  graphic_design: <Palette className="h-5 w-5" />,
  music: <Music className="h-5 w-5" />,
  content_creation: <Video className="h-5 w-5" />,
  self_discipline: <Target className="h-5 w-5" />,
  general: <TrendingUp className="h-5 w-5" />,
};

const SKILL_COLORS: Record<SkillType, string> = {
  gym: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  coding: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  video_editing: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  graphic_design: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  music: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  content_creation: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  self_discipline: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  general: 'bg-primary/10 text-primary border-primary/20',
};

const AVAILABLE_SKILLS: { type: SkillType; name: string; description: string }[] = [
  { type: 'gym', name: 'Gym / Workout', description: 'Build strength and fitness' },
  { type: 'coding', name: 'Coding / Tech', description: 'Learn programming skills' },
  { type: 'video_editing', name: 'Video Editing', description: 'Create amazing videos' },
  { type: 'graphic_design', name: 'Graphic Design', description: 'Master visual design' },
  { type: 'music', name: 'Music', description: 'Learn an instrument or produce' },
  { type: 'content_creation', name: 'Content Creation', description: 'Build your audience' },
  { type: 'self_discipline', name: 'Self-Discipline', description: 'Build better habits' },
];

export function SkillsDashboardScreen() {
  const navigate = useNavigate();
  const { 
    skills, 
    getActiveSkills, 
    addSkill, 
    removeSkill, 
    startSession, 
    currentSession,
    endSession 
  } = useSkillsProgress();
  const { hasCompletedSetup: hasMentorship } = useMentorship();
  
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [selectedSkillForMilestones, setSelectedSkillForMilestones] = useState<SkillType | null>(null);
  const activeSkills = getActiveSkills();

  const handleAddSkill = (type: SkillType) => {
    addSkill(type, 'casual');
    setShowAddSkill(false);
  };

  const handleStartSession = (type: SkillType) => {
    startSession(type);
  };

  const handleEndSession = () => {
    endSession();
  };

  // Calculate weekly progress (mock for now)
  const weeklyProgress = Math.min(100, (activeSkills.reduce((acc, s) => acc + s.totalSessions, 0) / 7) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Skills & Growth</h1>
            <p className="text-xs text-muted-foreground">Track your progress</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* Mentorship Progress Tracker */}
        {hasMentorship && (
          <MentorshipProgressTracker />
        )}

        {/* Weekly Overview Card */}
        {!hasMentorship && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-primary/20">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">This Week</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {activeSkills.reduce((acc, s) => acc + s.totalSessions, 0)} sessions
                  </Badge>
                </div>
                <Progress value={weeklyProgress} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {weeklyProgress >= 70 ? "Great progress! Keep it up 🔥" : 
                   weeklyProgress >= 40 ? "You're building momentum" : 
                   "Small steps count — start today"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active Skills */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">Active Skills</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddSkill(true)}
              className="text-xs gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Skill
            </Button>
          </div>

          {activeSkills.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <Target className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  No active skills yet. Start your growth journey!
                </p>
                <Button onClick={() => setShowAddSkill(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add First Skill
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {activeSkills.map((skill, index) => (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <SkillCard 
                      skill={skill}
                      isActive={currentSession?.skillId === skill.id}
                      onStart={() => handleStartSession(skill.type)}
                      onEnd={handleEndSession}
                      onRemove={() => removeSkill(skill.type)}
                      onViewMilestones={() => setSelectedSkillForMilestones(skill.type)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Streaks Section */}
        {activeSkills.some(s => s.currentStreak > 0) && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Current Streaks</h2>
            <div className="grid grid-cols-2 gap-3">
              {activeSkills.filter(s => s.currentStreak > 0).map((skill) => (
                <Card key={skill.id} className="bg-card/50">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${SKILL_COLORS[skill.type]}`}>
                      {SKILL_ICONS[skill.type]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="font-bold text-lg">{skill.currentStreak}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">days</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <Card className="bg-muted/30 border-muted">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2">💡 Quick Tip</h3>
            <p className="text-xs text-muted-foreground">
              Consistency beats intensity. Even 15-minute sessions build lasting skills over time.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Skill Modal */}
      <AnimatePresence>
        {showAddSkill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end"
            onClick={() => setShowAddSkill(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full bg-background rounded-t-3xl p-4 pb-8 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-4">Add a Skill</h2>
              <p className="text-sm text-muted-foreground mb-4">
                What do you want to get better at?
              </p>
              
              <div className="space-y-2">
                {AVAILABLE_SKILLS.filter(s => !skills.find(us => us.type === s.type && us.isActive)).map((skill) => (
                  <button
                    key={skill.type}
                    onClick={() => handleAddSkill(skill.type)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className={`p-2 rounded-lg ${SKILL_COLORS[skill.type]}`}>
                      {SKILL_ICONS[skill.type]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{skill.name}</p>
                      <p className="text-xs text-muted-foreground">{skill.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestones Modal */}
      <AnimatePresence>
        {selectedSkillForMilestones && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end"
            onClick={() => setSelectedSkillForMilestones(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full bg-background rounded-t-3xl p-4 pb-8 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Milestones & Achievements</h2>
              </div>
              
              {activeSkills.find(s => s.type === selectedSkillForMilestones) && (
                <SkillMilestones 
                  skill={activeSkills.find(s => s.type === selectedSkillForMilestones)!}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Skill Card Component
interface SkillCardProps {
  skill: ReturnType<typeof useSkillsProgress>['skills'][0];
  isActive: boolean;
  onStart: () => void;
  onEnd: () => void;
  onRemove: () => void;
  onViewMilestones: () => void;
}

function SkillCard({ skill, isActive, onStart, onEnd, onRemove, onViewMilestones }: SkillCardProps) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${SKILL_COLORS[skill.type]}`}>
            {SKILL_ICONS[skill.type]}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm truncate">{skill.displayName}</h3>
              <Badge variant="outline" className="text-[10px] capitalize">
                {skill.intensity}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {skill.totalSessions} sessions
              </span>
              {skill.currentStreak > 0 && (
                <span className="flex items-center gap-1 text-orange-500">
                  <Flame className="h-3 w-3" />
                  {skill.currentStreak} day streak
                </span>
              )}
            </div>
            
            {skill.preferredTimeSlot && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="capitalize">{skill.preferredTimeSlot}</span>
              </div>
            )}

            {/* Progress Badges */}
            <SkillProgressBadges skill={skill} className="mt-2" />
          </div>

          <div className="flex gap-1">
            {isActive ? (
              <Button
                size="sm"
                variant="outline"
                onClick={onEnd}
                className="h-8 px-3 text-xs gap-1"
              >
                <Pause className="h-3 w-3" />
                End
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onStart}
                className="h-8 px-3 text-xs gap-1"
              >
                <Play className="h-3 w-3" />
                Start
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowOptions(!showOptions)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {showOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-border flex gap-2"
          >
            <Button
              size="sm"
              variant="outline"
              className="text-xs flex-1"
              onClick={onViewMilestones}
            >
              <Award className="h-3 w-3 mr-1" />
              Milestones
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs flex-1"
              onClick={onRemove}
            >
              Pause Skill
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs flex-1"
            >
              Change Time
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
