import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Dumbbell, Code, Brain, Save, Clock, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMentorship, MentorshipProfile } from '@/hooks/useMentorship';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ROLE_OPTIONS = [
  { id: 'student', label: 'Study & Exams', icon: BookOpen },
  { id: 'trainer', label: 'Fitness / Yoga', icon: Dumbbell },
  { id: 'learner', label: 'Skills', icon: Code },
  { id: 'parent', label: 'Daily Life', icon: Brain },
];

const STYLE_OPTIONS = [
  { id: 'teacher', label: 'Teacher', description: 'Explains concepts directly' },
  { id: 'mentor', label: 'Mentor', description: 'Guides + motivates' },
  { id: 'coach', label: 'Coach', description: 'Keeps me consistent' },
  { id: 'calm_companion', label: 'Calm Companion', description: 'Low pressure, just present' },
];

const SUBJECT_OPTIONS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Economics', 'English'];
const PRACTICE_OPTIONS = ['Gym', 'Yoga', 'Martial Arts', 'Coding', 'Design', 'Music', 'Writing', 'Languages'];

export const MentorshipSettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile, saveProfile, isLoading } = useMentorship();
  const [formData, setFormData] = useState<Partial<MentorshipProfile>>(profile);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (updates: Partial<MentorshipProfile>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleRoleToggle = (roleId: string) => {
    const current = formData.role_types || [];
    const updated = current.includes(roleId)
      ? current.filter(r => r !== roleId)
      : [...current, roleId];
    handleChange({ role_types: updated });
  };

  const handleSubjectToggle = (subject: string) => {
    const current = formData.subjects || [];
    const updated = current.includes(subject)
      ? current.filter(s => s !== subject)
      : [...current, subject];
    handleChange({ subjects: updated });
  };

  const handlePracticeToggle = (practice: string) => {
    const current = formData.practices || [];
    const updated = current.includes(practice)
      ? current.filter(p => p !== practice)
      : [...current, practice];
    handleChange({ practices: updated });
  };

  const handleSave = async () => {
    const success = await saveProfile(formData);
    if (success) {
      toast.success('Mentorship settings saved');
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">Mentorship Settings</h1>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Role Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">What do you want help with?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = formData.role_types?.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => handleRoleToggle(option.id)}
                  className={cn(
                    'w-full p-3 rounded-xl border transition-all flex items-center gap-3',
                    isSelected
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border/50 hover:bg-muted/30'
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center',
                    isSelected ? 'bg-primary/20' : 'bg-muted'
                  )}>
                    <Icon className={cn('w-4 h-4', isSelected && 'text-primary')} />
                  </div>
                  <span className={cn('font-medium text-sm', isSelected && 'text-primary')}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Mentorship Style */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How should I support you?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {STYLE_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleChange({ mentorship_style: option.id as MentorshipProfile['mentorship_style'] })}
                className={cn(
                  'w-full p-3 rounded-xl border transition-all text-left',
                  formData.mentorship_style === option.id
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/50 hover:bg-muted/30'
                )}
              >
                <p className={cn(
                  'font-medium text-sm',
                  formData.mentorship_style === option.id && 'text-primary'
                )}>
                  {option.label}
                </p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Subjects (if student role) */}
        {formData.role_types?.includes('student') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Study Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map((subject) => (
                  <Badge
                    key={subject}
                    variant={formData.subjects?.includes(subject) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleSubjectToggle(subject)}
                  >
                    {subject}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Practices (if trainer/learner role) */}
        {(formData.role_types?.includes('trainer') || formData.role_types?.includes('learner')) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {PRACTICE_OPTIONS.map((practice) => (
                  <Badge
                    key={practice}
                    variant={formData.practices?.includes(practice) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handlePracticeToggle(practice)}
                  >
                    {practice}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Level */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => handleChange({ level })}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-xl border text-sm capitalize transition-all',
                    formData.level === level
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted/30'
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Injuries/Notes (for fitness) */}
        {formData.role_types?.includes('trainer') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Injuries or Notes (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any injuries or things I should keep in mind..."
                value={formData.injuries_notes || ''}
                onChange={(e) => handleChange({ injuries_notes: e.target.value })}
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>
        )}

        {/* Quiet Hours */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BellOff className="w-4 h-4" />
              Do Not Disturb
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Quiet Hours</p>
                <p className="text-xs text-muted-foreground">No check-ins during these hours</p>
              </div>
              <Switch
                checked={formData.quiet_hours_enabled}
                onCheckedChange={(checked) => handleChange({ quiet_hours_enabled: checked })}
              />
            </div>

            {formData.quiet_hours_enabled && (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={formData.quiet_hours_start}
                  onChange={(e) => handleChange({ quiet_hours_start: e.target.value })}
                  className="flex-1"
                />
                <span className="text-muted-foreground text-sm">to</span>
                <Input
                  type="time"
                  value={formData.quiet_hours_end}
                  onChange={(e) => handleChange({ quiet_hours_end: e.target.value })}
                  className="flex-1"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">During Work/Classes</p>
                <p className="text-xs text-muted-foreground">Don't interrupt during work hours</p>
              </div>
              <Switch
                checked={formData.quiet_during_work}
                onCheckedChange={(checked) => handleChange({ quiet_during_work: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Only When I Message First</p>
                <p className="text-xs text-muted-foreground">I'll initiate conversations</p>
              </div>
              <Switch
                checked={formData.only_if_user_messages_first}
                onCheckedChange={(checked) => handleChange({ only_if_user_messages_first: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Follow-ups */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Gentle Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable Check-ins</p>
                <p className="text-xs text-muted-foreground">Max 1 per hour during active sessions</p>
              </div>
              <Switch
                checked={formData.follow_up_enabled}
                onCheckedChange={(checked) => handleChange({ follow_up_enabled: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MentorshipSettingsScreen;
