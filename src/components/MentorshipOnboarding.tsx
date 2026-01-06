import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AuraOrb } from '@/components/AuraOrb';
import { cn } from '@/lib/utils';
import { useMentorship, MentorshipProfile } from '@/hooks/useMentorship';
import { 
  BookOpen, Dumbbell, Code, Brain, Heart, 
  GraduationCap, Users, Sparkles, ArrowRight 
} from 'lucide-react';

interface MentorshipOnboardingProps {
  onComplete: () => void;
  userName?: string;
}

type Step = 'role' | 'style' | 'subjects' | 'practices' | 'level' | 'quiet' | 'complete';

const ROLE_OPTIONS = [
  { id: 'student', label: 'Study & Exams', icon: BookOpen, description: 'Academic subjects, exam prep, concept clarity' },
  { id: 'trainer', label: 'Fitness / Yoga', icon: Dumbbell, description: 'Workout guidance, technique, recovery' },
  { id: 'learner', label: 'Skills', icon: Code, description: 'Coding, design, music, etc.' },
  { id: 'parent', label: 'Daily Life & Focus', icon: Brain, description: 'Routines, focus, mental clarity' },
];

const STYLE_OPTIONS = [
  { id: 'teacher', label: 'Teacher', description: 'Explains concepts directly' },
  { id: 'mentor', label: 'Mentor', description: 'Guides + motivates' },
  { id: 'coach', label: 'Coach', description: 'Keeps me consistent' },
  { id: 'calm_companion', label: 'Calm Companion', description: 'Low pressure, just present' },
];

const SUBJECT_OPTIONS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Economics', 'English', 'Other'];
const PRACTICE_OPTIONS = ['Gym', 'Yoga', 'Martial Arts', 'Coding', 'Design', 'Music', 'Writing', 'Languages', 'Other'];

export const MentorshipOnboarding: React.FC<MentorshipOnboardingProps> = ({
  onComplete,
  userName,
}) => {
  const { saveProfile } = useMentorship();
  const [step, setStep] = useState<Step>('role');
  const [isTyping, setIsTyping] = useState(true);
  const [formData, setFormData] = useState<Partial<MentorshipProfile>>({
    role_types: [],
    mentorship_style: 'mentor',
    subjects: [],
    practices: [],
    level: 'beginner',
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    quiet_during_work: false,
    only_if_user_messages_first: false,
    follow_up_enabled: true,
  });

  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 1500);
    return () => clearTimeout(timer);
  }, [step]);

  const messages: Record<Step, string> = {
    role: `Hey${userName ? ` ${userName}` : ''}! What do you want me to help you with right now?`,
    style: 'How should I support you?',
    subjects: 'What subjects or topics are you focusing on?',
    practices: 'What practices are you working on?',
    level: 'What level are you at?',
    quiet: 'When should I NOT disturb you?',
    complete: "Perfect! I'm ready to be your mentor. Let's begin! 🎯",
  };

  const handleRoleToggle = (roleId: string) => {
    const current = formData.role_types || [];
    const updated = current.includes(roleId)
      ? current.filter(r => r !== roleId)
      : [...current, roleId];
    setFormData({ ...formData, role_types: updated });
  };

  const handleNext = async () => {
    const roles = formData.role_types || [];
    
    if (step === 'role') {
      setStep('style');
    } else if (step === 'style') {
      // Skip to relevant setup based on roles
      if (roles.includes('student')) {
        setStep('subjects');
      } else if (roles.includes('trainer') || roles.includes('learner')) {
        setStep('practices');
      } else {
        setStep('quiet');
      }
    } else if (step === 'subjects') {
      if (roles.includes('trainer') || roles.includes('learner')) {
        setStep('practices');
      } else {
        setStep('level');
      }
    } else if (step === 'practices') {
      setStep('level');
    } else if (step === 'level') {
      setStep('quiet');
    } else if (step === 'quiet') {
      setStep('complete');
      await saveProfile(formData);
      setTimeout(onComplete, 2000);
    }
  };

  const handleSubjectToggle = (subject: string) => {
    const current = formData.subjects || [];
    const updated = current.includes(subject)
      ? current.filter(s => s !== subject)
      : [...current, subject];
    setFormData({ ...formData, subjects: updated });
  };

  const handlePracticeToggle = (practice: string) => {
    const current = formData.practices || [];
    const updated = current.includes(practice)
      ? current.filter(p => p !== practice)
      : [...current, practice];
    setFormData({ ...formData, practices: updated });
  };

  const canProceed = () => {
    if (step === 'role') return (formData.role_types?.length || 0) > 0;
    return true;
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Orb */}
          <div className="flex justify-center mb-6">
            <AuraOrb size="lg" />
          </div>

          {/* Message */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center mb-8"
            >
              <p className="text-lg text-foreground">
                {isTyping ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  messages[step]
                )}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {!isTyping && step === 'role' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-3"
              >
                {ROLE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.role_types?.includes(option.id);
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => handleRoleToggle(option.id)}
                      className={cn(
                        'p-4 rounded-2xl border transition-all flex items-center gap-4',
                        isSelected
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border/50 hover:bg-muted/30'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        isSelected ? 'bg-primary/20' : 'bg-muted'
                      )}>
                        <Icon className={cn('w-5 h-5', isSelected && 'text-primary')} />
                      </div>
                      <div className="text-left flex-1">
                        <p className={cn('font-medium', isSelected && 'text-primary')}>
                          {option.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </motion.button>
                  );
                })}
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Select all that apply
                </p>
              </motion.div>
            )}

            {!isTyping && step === 'style' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-3"
              >
                {STYLE_OPTIONS.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => setFormData({ ...formData, mentorship_style: option.id as MentorshipProfile['mentorship_style'] })}
                    className={cn(
                      'p-4 rounded-2xl border transition-all text-left',
                      formData.mentorship_style === option.id
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border/50 hover:bg-muted/30'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <p className={cn(
                      'font-medium',
                      formData.mentorship_style === option.id && 'text-primary'
                    )}>
                      {option.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {!isTyping && step === 'subjects' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_OPTIONS.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => handleSubjectToggle(subject)}
                      className={cn(
                        'px-4 py-2 rounded-full border transition-all text-sm',
                        formData.subjects?.includes(subject)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted/30'
                      )}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {!isTyping && step === 'practices' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex flex-wrap gap-2">
                  {PRACTICE_OPTIONS.map((practice) => (
                    <button
                      key={practice}
                      onClick={() => handlePracticeToggle(practice)}
                      className={cn(
                        'px-4 py-2 rounded-full border transition-all text-sm',
                        formData.practices?.includes(practice)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted/30'
                      )}
                    >
                      {practice}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {!isTyping && step === 'level' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-3"
              >
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <motion.button
                    key={level}
                    onClick={() => setFormData({ ...formData, level })}
                    className={cn(
                      'p-4 rounded-2xl border transition-all text-left capitalize',
                      formData.level === level
                        ? 'border-primary/50 bg-primary/5 text-primary'
                        : 'border-border/50 hover:bg-muted/30'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {level}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {!isTyping && step === 'quiet' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border/50">
                    <Checkbox
                      checked={formData.quiet_hours_enabled}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, quiet_hours_enabled: checked as boolean })
                      }
                    />
                    <span className="text-sm">Night time (quiet hours)</span>
                  </label>

                  {formData.quiet_hours_enabled && (
                    <div className="flex gap-2 px-3">
                      <Input
                        type="time"
                        value={formData.quiet_hours_start}
                        onChange={(e) => setFormData({ ...formData, quiet_hours_start: e.target.value })}
                        className="flex-1"
                      />
                      <span className="self-center text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={formData.quiet_hours_end}
                        onChange={(e) => setFormData({ ...formData, quiet_hours_end: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border/50">
                    <Checkbox
                      checked={formData.quiet_during_work}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, quiet_during_work: checked as boolean })
                      }
                    />
                    <span className="text-sm">During classes/work</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border/50">
                    <Checkbox
                      checked={formData.only_if_user_messages_first}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, only_if_user_messages_first: checked as boolean })
                      }
                    />
                    <span className="text-sm">Only if I message first</span>
                  </label>
                </div>
              </motion.div>
            )}

            {!isTyping && step === 'complete' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">Setting up your mentor...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next Button */}
          {!isTyping && step !== 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full py-6 rounded-2xl"
              >
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
