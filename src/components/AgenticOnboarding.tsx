import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, Bell, Mic, Zap, MessageSquare, AudioLines, 
  Brain, Heart, Sparkles, Check, ChevronRight, Shield,
  Volume2, Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type OnboardingStep = 
  | 'welcome' 
  | 'install' 
  | 'notifications' 
  | 'microphone' 
  | 'wake-mode'
  | 'interaction' 
  | 'style' 
  | 'autonomy'
  | 'complete';

interface AgenticOnboardingProps {
  onComplete: () => void;
  userName?: string;
}

export const AgenticOnboarding: React.FC<AgenticOnboardingProps> = ({ 
  onComplete, 
  userName = 'there' 
}) => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [preferences, setPreferences] = useState({
    installed: false,
    notifications: false,
    microphone: false,
    wakeMode: 'manual' as 'always' | 'manual' | 'scheduled',
    interaction: 'hybrid' as 'voice' | 'chat' | 'hybrid',
    style: 'hybrid' as 'companion' | 'mentor' | 'hybrid',
    autonomy: 'help-when-asked' as 'do-as-told' | 'help-when-asked' | 'help-proactively' | 'full-optimization'
  });

  const steps: OnboardingStep[] = [
    'welcome', 'install', 'notifications', 'microphone', 
    'wake-mode', 'interaction', 'style', 'autonomy', 'complete'
  ];
  
  const currentIndex = steps.indexOf(step);
  const progress = ((currentIndex) / (steps.length - 1)) * 100;

  const nextStep = () => {
    const next = steps[currentIndex + 1];
    if (next) setStep(next);
  };

  const skipStep = () => nextStep();

  const handleComplete = () => {
    localStorage.setItem('aura_onboarding_complete', 'true');
    localStorage.setItem('aura_preferences', JSON.stringify(preferences));
    onComplete();
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
                Your ambient AI companion that listens, understands, remembers, guides, and grows with you.
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
            <Button onClick={nextStep} className="w-full" size="lg">
              Let's Begin <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'install':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                <Download className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Add to Home Screen</h2>
              <p className="text-sm text-muted-foreground">
                Install AURRA for instant access, offline support, and a native app experience.
              </p>
            </div>
            
            <Card className="p-4 bg-muted/30 border-dashed">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Why install?</p>
                  <ul className="text-muted-foreground mt-1 space-y-1">
                    <li>• Works offline</li>
                    <li>• Faster loading</li>
                    <li>• Background sync</li>
                    <li>• Push notifications</li>
                  </ul>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={skipStep} className="flex-1">
                Skip for now
              </Button>
              <Button 
                onClick={() => {
                  setPreferences(p => ({ ...p, installed: true }));
                  nextStep();
                }} 
                className="flex-1"
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        );

      case 'notifications':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Enable Notifications</h2>
              <p className="text-sm text-muted-foreground">
                Get gentle reminders, mood check-ins, and proactive guidance when you need it.
              </p>
            </div>
            
            <Card className="p-4 bg-muted/30 border-dashed">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">What you'll receive:</p>
                  <ul className="text-muted-foreground mt-1 space-y-1">
                    <li>• Morning planning nudges</li>
                    <li>• Mood & energy check-ins</li>
                    <li>• Habit reminders</li>
                    <li>• Night reflection prompts</li>
                  </ul>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={skipStep} className="flex-1">
                Maybe later
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    const permission = await Notification.requestPermission();
                    setPreferences(p => ({ ...p, notifications: permission === 'granted' }));
                  } catch {}
                  nextStep();
                }} 
                className="flex-1"
              >
                Enable <Bell className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        );

      case 'microphone':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                <Mic className="w-8 h-8 text-violet-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Enable Voice</h2>
              <p className="text-sm text-muted-foreground">
                Talk naturally with AURRA. Voice makes conversations feel more human and alive.
              </p>
            </div>
            
            <Card className="p-4 bg-muted/30 border-dashed">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Voice enables:</p>
                  <ul className="text-muted-foreground mt-1 space-y-1">
                    <li>• Natural conversations</li>
                    <li>• Hands-free interaction</li>
                    <li>• Emotional tone detection</li>
                    <li>• Voice journaling</li>
                  </ul>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={skipStep} className="flex-1">
                Use text only
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    setPreferences(p => ({ ...p, microphone: true }));
                  } catch {}
                  nextStep();
                }} 
                className="flex-1"
              >
                Enable <Mic className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        );

      case 'wake-mode':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                <Volume2 className="w-8 h-8 text-cyan-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Wake Mode</h2>
              <p className="text-sm text-muted-foreground">
                Choose how AURRA listens for your voice.
              </p>
            </div>
            
            <div className="space-y-3">
              {[
                { value: 'manual', label: 'Push to Talk', desc: 'Tap the mic to speak' },
                { value: 'scheduled', label: 'Scheduled', desc: 'Listen during set hours' },
                { value: 'always', label: 'Always On', desc: 'Continuous listening (battery impact)' },
              ].map((mode) => (
                <Card 
                  key={mode.value}
                  className={cn(
                    "p-4 cursor-pointer transition-all",
                    preferences.wakeMode === mode.value 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-muted-foreground/30"
                  )}
                  onClick={() => setPreferences(p => ({ ...p, wakeMode: mode.value as any }))}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{mode.label}</p>
                      <p className="text-sm text-muted-foreground">{mode.desc}</p>
                    </div>
                    {preferences.wakeMode === mode.value && (
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

      case 'interaction':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">How do you prefer to interact?</h2>
              <p className="text-sm text-muted-foreground">
                You can change this anytime.
              </p>
            </div>
            
            <div className="space-y-3">
              {[
                { value: 'voice', icon: AudioLines, label: 'Voice First', desc: 'Speak naturally, like talking to a friend' },
                { value: 'chat', icon: MessageSquare, label: 'Chat First', desc: 'Type your thoughts and feelings' },
                { value: 'hybrid', icon: Zap, label: 'Hybrid', desc: 'Best of both - switch seamlessly' },
              ].map((mode) => (
                <Card 
                  key={mode.value}
                  className={cn(
                    "p-4 cursor-pointer transition-all",
                    preferences.interaction === mode.value 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-muted-foreground/30"
                  )}
                  onClick={() => setPreferences(p => ({ ...p, interaction: mode.value as any }))}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <mode.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{mode.label}</p>
                      <p className="text-sm text-muted-foreground">{mode.desc}</p>
                    </div>
                    {preferences.interaction === mode.value && (
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

      case 'style':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Choose AURRA's Style</h2>
              <p className="text-sm text-muted-foreground">
                How should AURRA show up for you?
              </p>
            </div>
            
            <div className="space-y-3">
              {[
                { value: 'companion', icon: Heart, label: 'Companion', desc: 'Warm, supportive, emotionally present', color: 'text-rose-500' },
                { value: 'mentor', icon: Brain, label: 'Mentor', desc: 'Focused, strategic, growth-oriented', color: 'text-violet-500' },
                { value: 'hybrid', icon: Sparkles, label: 'Adaptive', desc: 'Shifts based on your mood and needs', color: 'text-primary' },
              ].map((style) => (
                <Card 
                  key={style.value}
                  className={cn(
                    "p-4 cursor-pointer transition-all",
                    preferences.style === style.value 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-muted-foreground/30"
                  )}
                  onClick={() => setPreferences(p => ({ ...p, style: style.value as any }))}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <style.icon className={cn("w-6 h-6", style.color)} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{style.label}</p>
                      <p className="text-sm text-muted-foreground">{style.desc}</p>
                    </div>
                    {preferences.style === style.value && (
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

      case 'autonomy':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Autonomy Level</h2>
              <p className="text-sm text-muted-foreground">
                How proactive should AURRA be?
              </p>
            </div>
            
            <div className="space-y-3">
              {[
                { value: 'do-as-told', label: 'Do as told', desc: 'Only act when explicitly asked' },
                { value: 'help-when-asked', label: 'Help when asked', desc: 'Offer suggestions when you ask' },
                { value: 'help-proactively', label: 'Help proactively', desc: 'Suggest actions based on patterns' },
                { value: 'full-optimization', label: 'Full optimization', desc: 'Actively optimize your life cadence' },
              ].map((mode, i) => (
                <Card 
                  key={mode.value}
                  className={cn(
                    "p-4 cursor-pointer transition-all",
                    preferences.autonomy === mode.value 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-muted-foreground/30"
                  )}
                  onClick={() => setPreferences(p => ({ ...p, autonomy: mode.value as any }))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium">{mode.label}</p>
                        <p className="text-sm text-muted-foreground">{mode.desc}</p>
                      </div>
                    </div>
                    {preferences.autonomy === mode.value && (
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

      case 'complete':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <motion.div 
              className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-12 h-12 text-primary-foreground" />
            </motion.div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">You're all set, {userName}!</h2>
              <p className="text-muted-foreground">
                AURRA is ready to be your ambient AI companion.
              </p>
            </div>

            <Card className="p-4 bg-muted/30 text-left">
              <p className="text-sm font-medium mb-2">Your preferences:</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>Style: <span className="text-foreground capitalize">{preferences.style}</span></div>
                <div>Interaction: <span className="text-foreground capitalize">{preferences.interaction}</span></div>
                <div>Autonomy: <span className="text-foreground capitalize">{preferences.autonomy.replace(/-/g, ' ')}</span></div>
                <div>Wake: <span className="text-foreground capitalize">{preferences.wakeMode}</span></div>
              </div>
            </Card>

            <Button onClick={handleComplete} className="w-full" size="lg">
              Start with AURRA <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      {step !== 'welcome' && step !== 'complete' && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
