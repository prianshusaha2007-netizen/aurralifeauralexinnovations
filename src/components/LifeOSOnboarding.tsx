import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Calendar, Briefcase, Moon, Sun, Dumbbell, Wallet,
  BookOpen, Heart, Users, Sparkles, Zap, ChevronRight, Check,
  Brain, Hand, Rocket, MessageSquare, AudioLines, Bot, Bell,
  Mic, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Types
type OnboardingStep = 
  | 'welcome'
  | 'basics'          // Name, Age, Gender, Occupation
  | 'routines'        // Wake, Sleep, Study, Gym times
  | 'goals'           // Fitness, Finance, Study/Work goals
  | 'personality'     // Emotional default, Social bandwidth, Motivation style
  | 'autonomy'        // A/B/C mode
  | 'interaction'     // Voice/Chat/Hybrid
  | 'permissions'     // Notifications, Microphone, etc.
  | 'complete';

interface UserProfile {
  name: string;
  age: string;
  gender: string;
  occupation: string;
  wakeTime: string;
  sleepTime: string;
  studyTime: string;
  gymTime: string;
  fitnessGoals: string[];
  financeHabits: string[];
  studyContext: string;
  emotionalDefault: string;
  socialBandwidth: string;
  motivationStyle: string;
  autonomyMode: 'A' | 'B' | 'C';
  interactionMode: 'voice' | 'chat' | 'hybrid';
}

interface LifeOSOnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const defaultProfile: UserProfile = {
  name: '',
  age: '',
  gender: '',
  occupation: '',
  wakeTime: '07:00',
  sleepTime: '23:00',
  studyTime: '',
  gymTime: '',
  fitnessGoals: [],
  financeHabits: [],
  studyContext: '',
  emotionalDefault: '',
  socialBandwidth: '',
  motivationStyle: '',
  autonomyMode: 'B',
  interactionMode: 'hybrid',
};

export const LifeOSOnboarding: React.FC<LifeOSOnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [permissions, setPermissions] = useState({
    notifications: false,
    microphone: false,
  });

  const steps: OnboardingStep[] = [
    'welcome', 'basics', 'routines', 'goals', 
    'personality', 'autonomy', 'interaction', 'permissions', 'complete'
  ];
  
  const currentIndex = steps.indexOf(step);
  const progress = ((currentIndex) / (steps.length - 1)) * 100;

  const nextStep = () => {
    const next = steps[currentIndex + 1];
    if (next === 'complete') {
      handleComplete();
    } else if (next) {
      setStep(next);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('aurra_life_os_profile', JSON.stringify(profile));
    localStorage.setItem('aurra_onboarding_complete', 'true');
    onComplete(profile);
  };

  const updateProfile = (key: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: keyof UserProfile, item: string) => {
    setProfile(prev => {
      const arr = prev[key] as string[];
      if (arr.includes(item)) {
        return { ...prev, [key]: arr.filter(i => i !== item) };
      }
      return { ...prev, [key]: [...arr, item] };
    });
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Welcome to AURRA
              </h1>
              <p className="text-muted-foreground">
                Your ambient Life OS that listens, understands, remembers, guides, and grows with you.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="p-3 rounded-xl bg-muted/50">
                <Heart className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Companion</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <Brain className="w-6 h-6 text-violet-500 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Mentor</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <Bot className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Agent</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic">
              Not a chatbot. Not a productivity app. A Life OS.
            </p>
            <Button onClick={nextStep} className="w-full" size="lg">
              Let's Begin <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'basics':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div className="text-center">
              <User className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-semibold mb-1">Let's get to know you</h2>
              <p className="text-sm text-muted-foreground">Basic info helps AURRA personalize your experience</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">What should I call you?</label>
                <Input
                  placeholder="Your name"
                  value={profile.name}
                  onChange={(e) => updateProfile('name', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Age</label>
                  <Input
                    type="number"
                    placeholder="Age"
                    value={profile.age}
                    onChange={(e) => updateProfile('age', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Gender (optional)</label>
                  <div className="flex gap-1.5">
                    {['M', 'F', 'O'].map((g) => (
                      <Button
                        key={g}
                        variant={profile.gender === g ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateProfile('gender', g)}
                        className="flex-1"
                      >
                        {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Occupation</label>
                <Input
                  placeholder="Student, Engineer, Freelancer..."
                  value={profile.occupation}
                  onChange={(e) => updateProfile('occupation', e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={nextStep} 
              className="w-full" 
              disabled={!profile.name}
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        );

      case 'routines':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div className="text-center">
              <Calendar className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-semibold mb-1">Your Daily Rhythm</h2>
              <p className="text-sm text-muted-foreground">When do your days typically flow?</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-500" /> Wake time
                  </label>
                  <Input
                    type="time"
                    value={profile.wakeTime}
                    onChange={(e) => updateProfile('wakeTime', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-500" /> Sleep time
                  </label>
                  <Input
                    type="time"
                    value={profile.sleepTime}
                    onChange={(e) => updateProfile('sleepTime', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-500" /> Study/Work hours (optional)
                </label>
                <Input
                  placeholder="e.g., 9 AM - 5 PM or 4 hours/day"
                  value={profile.studyTime}
                  onChange={(e) => updateProfile('studyTime', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4 text-green-500" /> Gym/Workout time (optional)
                </label>
                <Input
                  placeholder="e.g., 6 AM or evenings"
                  value={profile.gymTime}
                  onChange={(e) => updateProfile('gymTime', e.target.value)}
                />
              </div>
            </div>

            <Button onClick={nextStep} className="w-full">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        );

      case 'goals':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div className="text-center">
              <Zap className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-semibold mb-1">Your Focus Areas</h2>
              <p className="text-sm text-muted-foreground">What matters most to you right now?</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4 text-green-500" /> Fitness Goals
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Weight loss', 'Muscle gain', 'Stay active', 'Flexibility', 'Endurance', 'Mental health'].map((goal) => (
                    <Badge
                      key={goal}
                      variant={profile.fitnessGoals.includes(goal) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem('fitnessGoals', goal)}
                    >
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-500" /> Finance Habits
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Save more', 'Track spending', 'Invest', 'Budget', 'Reduce debt', 'Side income'].map((habit) => (
                    <Badge
                      key={habit}
                      variant={profile.financeHabits.includes(habit) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem('financeHabits', habit)}
                    >
                      {habit}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-500" /> Study/Work Context
                </label>
                <Textarea
                  placeholder="What are you studying or working on? Any exams, projects, deadlines?"
                  value={profile.studyContext}
                  onChange={(e) => updateProfile('studyContext', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <Button onClick={nextStep} className="w-full">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        );

      case 'personality':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div className="text-center">
              <Heart className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <h2 className="text-xl font-semibold mb-1">Your Personality</h2>
              <p className="text-sm text-muted-foreground">Help AURRA understand how to support you best</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">How do you usually feel?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'optimistic', label: '☀️ Optimistic' },
                    { value: 'calm', label: '🌊 Calm' },
                    { value: 'anxious', label: '😰 Anxious' },
                    { value: 'driven', label: '🔥 Driven' },
                    { value: 'fluctuating', label: '🎢 Varies' },
                    { value: 'tired', label: '😴 Often tired' },
                  ].map((opt) => (
                    <Card
                      key={opt.value}
                      className={cn(
                        "p-3 cursor-pointer text-center transition-all",
                        profile.emotionalDefault === opt.value
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/30"
                      )}
                      onClick={() => updateProfile('emotionalDefault', opt.value)}
                    >
                      <p className="text-sm">{opt.label}</p>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Social energy</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'introvert', label: 'Introvert' },
                    { value: 'ambivert', label: 'Ambivert' },
                    { value: 'extrovert', label: 'Extrovert' },
                  ].map((opt) => (
                    <Card
                      key={opt.value}
                      className={cn(
                        "p-3 cursor-pointer text-center transition-all",
                        profile.socialBandwidth === opt.value
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/30"
                      )}
                      onClick={() => updateProfile('socialBandwidth', opt.value)}
                    >
                      <p className="text-sm">{opt.label}</p>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">What motivates you?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'gentle', label: 'Gentle encouragement' },
                    { value: 'tough', label: 'Tough love' },
                    { value: 'data', label: 'Data & progress' },
                    { value: 'accountability', label: 'Accountability' },
                  ].map((opt) => (
                    <Card
                      key={opt.value}
                      className={cn(
                        "p-3 cursor-pointer text-center transition-all",
                        profile.motivationStyle === opt.value
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/30"
                      )}
                      onClick={() => updateProfile('motivationStyle', opt.value)}
                    >
                      <p className="text-sm">{opt.label}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={nextStep} className="w-full">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        );

      case 'autonomy':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div className="text-center">
              <Bot className="w-10 h-10 text-cyan-500 mx-auto mb-3" />
              <h2 className="text-xl font-semibold mb-1">Autonomy Mode</h2>
              <p className="text-sm text-muted-foreground">How proactive should AURRA be?</p>
            </div>
            
            <div className="space-y-3">
              {[
                { 
                  value: 'A' as const, 
                  icon: Hand, 
                  label: 'Mode A: You Command → AURRA Executes', 
                  desc: 'Full control. AURRA only acts when you ask.',
                  color: 'text-slate-500'
                },
                { 
                  value: 'B' as const, 
                  icon: Brain, 
                  label: 'Mode B: AURRA Suggests → You Approve', 
                  desc: 'AURRA proposes workflows. You tap to approve.',
                  color: 'text-amber-500'
                },
                { 
                  value: 'C' as const, 
                  icon: Rocket, 
                  label: 'Mode C: AURRA Predicts → You Confirm', 
                  desc: 'AURRA anticipates needs. Confirm once, auto-execute.',
                  color: 'text-violet-500'
                },
              ].map((mode) => (
                <Card
                  key={mode.value}
                  className={cn(
                    "p-4 cursor-pointer transition-all",
                    profile.autonomyMode === mode.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/30"
                  )}
                  onClick={() => updateProfile('autonomyMode', mode.value)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <mode.icon className={cn("w-5 h-5", mode.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{mode.label}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{mode.desc}</p>
                    </div>
                    {profile.autonomyMode === mode.value && (
                      <Check className="w-5 h-5 text-primary shrink-0" />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <Button onClick={nextStep} className="w-full">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        );

      case 'interaction':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div className="text-center">
              <MessageSquare className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-semibold mb-1">Interaction Style</h2>
              <p className="text-sm text-muted-foreground">How do you prefer to communicate?</p>
            </div>
            
            <div className="space-y-3">
              {[
                { value: 'voice' as const, icon: AudioLines, label: 'Voice First', desc: 'Speak naturally, like talking to a friend' },
                { value: 'chat' as const, icon: MessageSquare, label: 'Chat First', desc: 'Type your thoughts and feelings' },
                { value: 'hybrid' as const, icon: Zap, label: 'Hybrid', desc: 'Best of both - switch seamlessly' },
              ].map((mode) => (
                <Card
                  key={mode.value}
                  className={cn(
                    "p-4 cursor-pointer transition-all",
                    profile.interactionMode === mode.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/30"
                  )}
                  onClick={() => updateProfile('interactionMode', mode.value)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <mode.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{mode.label}</p>
                      <p className="text-sm text-muted-foreground">{mode.desc}</p>
                    </div>
                    {profile.interactionMode === mode.value && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <Button onClick={nextStep} className="w-full">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        );

      case 'permissions':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div className="text-center">
              <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-semibold mb-1">Enable Features</h2>
              <p className="text-sm text-muted-foreground">These help AURRA support you better</p>
            </div>
            
            <div className="space-y-3">
              <Card className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Morning nudges, reminders, mood check-ins
                    </p>
                    <Button
                      size="sm"
                      variant={permissions.notifications ? 'secondary' : 'default'}
                      onClick={async () => {
                        try {
                          const permission = await Notification.requestPermission();
                          setPermissions(p => ({ ...p, notifications: permission === 'granted' }));
                        } catch {}
                      }}
                      className="h-7"
                    >
                      {permissions.notifications ? (
                        <>
                          <Check className="w-3 h-3 mr-1" /> Enabled
                        </>
                      ) : 'Enable'}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5 text-violet-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Microphone</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Voice conversations, hands-free interaction
                    </p>
                    <Button
                      size="sm"
                      variant={permissions.microphone ? 'secondary' : 'default'}
                      onClick={async () => {
                        try {
                          await navigator.mediaDevices.getUserMedia({ audio: true });
                          setPermissions(p => ({ ...p, microphone: true }));
                        } catch {}
                      }}
                      className="h-7"
                    >
                      {permissions.microphone ? (
                        <>
                          <Check className="w-3 h-3 mr-1" /> Enabled
                        </>
                      ) : 'Enable'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <Button onClick={nextStep} className="w-full">
              Finish Setup <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Progress */}
      {step !== 'welcome' && (
        <div className="p-4 border-b">
          <Progress value={progress} className="h-1" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Step {currentIndex} of {steps.length - 1}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
