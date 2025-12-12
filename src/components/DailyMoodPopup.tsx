import React, { useState, useEffect } from 'react';
import { Heart, Smile, Meh, Frown, Zap, Battery, BatteryLow, BatteryMedium, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DailyMoodPopupProps {
  userName: string;
}

const moods = [
  { id: 'great', label: 'Great', emoji: '😊', icon: Smile, color: 'text-green-500' },
  { id: 'good', label: 'Good', emoji: '🙂', icon: Smile, color: 'text-emerald-400' },
  { id: 'okay', label: 'Okay', emoji: '😐', icon: Meh, color: 'text-yellow-500' },
  { id: 'low', label: 'Low', emoji: '😔', icon: Frown, color: 'text-orange-500' },
  { id: 'stressed', label: 'Stressed', emoji: '😰', icon: Frown, color: 'text-red-500' },
];

const energyLevels = [
  { id: 'high', label: 'High', icon: Zap },
  { id: 'medium', label: 'Medium', icon: BatteryMedium },
  { id: 'low', label: 'Low', icon: BatteryLow },
];

export const DailyMoodPopup: React.FC<DailyMoodPopupProps> = ({ userName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'mood' | 'energy' | 'done'>('mood');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastCheckIn = localStorage.getItem('aura_last_mood_checkin');
    
    if (lastCheckIn !== today) {
      // Small delay to let the app load first
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
    setStep('energy');
  };

  const handleEnergySelect = (energyId: string) => {
    setSelectedEnergy(energyId);
    
    // Save the check-in
    const today = new Date().toDateString();
    localStorage.setItem('aura_last_mood_checkin', today);
    
    const moodHistory = JSON.parse(localStorage.getItem('aura_mood_history') || '[]');
    moodHistory.push({
      date: new Date().toISOString(),
      mood: selectedMood,
      energy: energyId,
    });
    localStorage.setItem('aura_mood_history', JSON.stringify(moodHistory));
    
    setStep('done');
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep('mood');
    setSelectedMood(null);
    setSelectedEnergy(null);
  };

  const handleSkip = () => {
    const today = new Date().toDateString();
    localStorage.setItem('aura_last_mood_checkin', today);
    handleClose();
  };

  const getMoodMessage = () => {
    const mood = moods.find(m => m.id === selectedMood);
    const energy = energyLevels.find(e => e.id === selectedEnergy);
    
    if (mood?.id === 'great' && energy?.id === 'high') {
      return `Amazing! You're feeling ${mood.label.toLowerCase()} with ${energy.label.toLowerCase()} energy. Let's make today count! 🚀`;
    }
    if (mood?.id === 'stressed' || mood?.id === 'low') {
      return `I'm here for you. Take things one step at a time today. You've got this! 💜`;
    }
    if (energy?.id === 'low') {
      return `Feeling ${mood?.label.toLowerCase()} but energy is low? Remember to take breaks and stay hydrated! 💧`;
    }
    return `Thanks for checking in! Have a wonderful day ahead. I'm always here when you need me! ✨`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-card">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary animate-pulse" />
              Daily Check-In
            </DialogTitle>
          </div>
        </DialogHeader>

        {step === 'mood' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-center text-muted-foreground">
              {getGreeting()}, <span className="font-semibold text-foreground">{userName}</span>! 
              <br />How are you feeling today?
            </p>
            
            <div className="grid grid-cols-5 gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200',
                    'hover:bg-primary/10 hover:scale-105 active:scale-95',
                    'border border-transparent hover:border-primary/30'
                  )}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs text-muted-foreground">{mood.label}</span>
                </button>
              ))}
            </div>

            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground" 
              onClick={handleSkip}
            >
              Skip for today
            </Button>
          </div>
        )}

        {step === 'energy' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-center text-muted-foreground">
              And how's your energy level?
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              {energyLevels.map((energy) => {
                const Icon = energy.icon;
                return (
                  <button
                    key={energy.id}
                    onClick={() => handleEnergySelect(energy.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200',
                      'hover:bg-primary/10 hover:scale-105 active:scale-95',
                      'border border-muted hover:border-primary/50'
                    )}
                  >
                    <Icon className={cn(
                      'w-8 h-8',
                      energy.id === 'high' && 'text-green-500',
                      energy.id === 'medium' && 'text-yellow-500',
                      energy.id === 'low' && 'text-orange-500'
                    )} />
                    <span className="text-sm font-medium">{energy.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4 animate-fade-in text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            
            <p className="text-muted-foreground px-4">
              {getMoodMessage()}
            </p>
            
            <Button onClick={handleClose} className="w-full">
              Let's go! ✨
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
