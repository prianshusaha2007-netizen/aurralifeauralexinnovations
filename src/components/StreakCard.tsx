import React, { useRef, useState } from 'react';
import { Flame, Trophy, Star, Zap, Download, Share2, Palette, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface StreakCardProps {
  userName: string;
  streak: number;
  score: number;
  rank: number;
  habitsCompleted: number;
  moodLogs: number;
  isOpen: boolean;
  onClose: () => void;
}

type CardTheme = 'aurora' | 'sunset' | 'ocean' | 'forest' | 'cosmic' | 'minimal';

const themes: Record<CardTheme, { bg: string; accent: string; text: string; name: string }> = {
  aurora: {
    bg: 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700',
    accent: 'text-violet-200',
    text: 'text-white',
    name: 'Aurora'
  },
  sunset: {
    bg: 'bg-gradient-to-br from-orange-500 via-pink-500 to-rose-600',
    accent: 'text-orange-200',
    text: 'text-white',
    name: 'Sunset'
  },
  ocean: {
    bg: 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600',
    accent: 'text-cyan-200',
    text: 'text-white',
    name: 'Ocean'
  },
  forest: {
    bg: 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600',
    accent: 'text-emerald-200',
    text: 'text-white',
    name: 'Forest'
  },
  cosmic: {
    bg: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
    accent: 'text-purple-300',
    text: 'text-white',
    name: 'Cosmic'
  },
  minimal: {
    bg: 'bg-gradient-to-br from-gray-100 to-gray-200',
    accent: 'text-gray-600',
    text: 'text-gray-900',
    name: 'Minimal'
  }
};

export const StreakCard: React.FC<StreakCardProps> = ({
  userName,
  streak,
  score,
  rank,
  habitsCompleted,
  moodLogs,
  isOpen,
  onClose
}) => {
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('aurora');
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const theme = themes[selectedTheme];

  const exportCard = async () => {
    if (!cardRef.current) return;
    
    setIsExporting(true);
    
    try {
      // Create a canvas from the card
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Set canvas size
      canvas.width = 400;
      canvas.height = 500;

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (selectedTheme === 'aurora') {
        gradient.addColorStop(0, '#7c3aed');
        gradient.addColorStop(0.5, '#9333ea');
        gradient.addColorStop(1, '#4338ca');
      } else if (selectedTheme === 'sunset') {
        gradient.addColorStop(0, '#f97316');
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(1, '#e11d48');
      } else if (selectedTheme === 'ocean') {
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#3b82f6');
        gradient.addColorStop(1, '#4f46e5');
      } else if (selectedTheme === 'forest') {
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(0.5, '#22c55e');
        gradient.addColorStop(1, '#14b8a6');
      } else if (selectedTheme === 'cosmic') {
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.5, '#581c87');
        gradient.addColorStop(1, '#0f172a');
      } else {
        gradient.addColorStop(0, '#f3f4f6');
        gradient.addColorStop(1, '#e5e7eb');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add decorative elements
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(350, 50, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-20, 450, 150, 0, Math.PI * 2);
      ctx.fill();

      const textColor = selectedTheme === 'minimal' ? '#111827' : '#ffffff';
      const accentColor = selectedTheme === 'minimal' ? '#6b7280' : 'rgba(255,255,255,0.8)';

      // Draw AURA logo
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 16px system-ui';
      ctx.fillText('AURA', 30, 40);

      // Draw streak flame icon area
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(200, 120, 50, 0, Math.PI * 2);
      ctx.fill();

      // Draw streak number
      ctx.fillStyle = textColor;
      ctx.font = 'bold 48px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`🔥 ${streak}`, 200, 135);

      // Draw "Day Streak" label
      ctx.font = '18px system-ui';
      ctx.fillStyle = accentColor;
      ctx.fillText('Day Streak', 200, 165);

      // Draw user name
      ctx.fillStyle = textColor;
      ctx.font = 'bold 28px system-ui';
      ctx.fillText(userName, 200, 220);

      // Draw rank
      ctx.fillStyle = accentColor;
      ctx.font = '16px system-ui';
      ctx.fillText(`Rank #${rank}`, 200, 250);

      // Draw stats boxes
      const boxY = 290;
      const boxWidth = 100;
      const boxHeight = 80;
      const gap = 20;
      const startX = (canvas.width - (boxWidth * 3 + gap * 2)) / 2;

      const stats = [
        { value: score, label: 'Points', icon: '⚡' },
        { value: habitsCompleted, label: 'Habits', icon: '⭐' },
        { value: moodLogs, label: 'Logs', icon: '💜' }
      ];

      stats.forEach((stat, i) => {
        const x = startX + i * (boxWidth + gap);
        
        // Box background
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.roundRect(x, boxY, boxWidth, boxHeight, 12);
        ctx.fill();

        // Icon
        ctx.font = '20px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(stat.icon, x + boxWidth / 2, boxY + 28);

        // Value
        ctx.fillStyle = textColor;
        ctx.font = 'bold 22px system-ui';
        ctx.fillText(String(stat.value), x + boxWidth / 2, boxY + 52);

        // Label
        ctx.fillStyle = accentColor;
        ctx.font = '12px system-ui';
        ctx.fillText(stat.label, x + boxWidth / 2, boxY + 70);
      });

      // Draw motivational quote
      ctx.fillStyle = accentColor;
      ctx.font = 'italic 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('"Consistency is the key to success"', 200, 420);

      // Draw footer
      ctx.fillStyle = accentColor;
      ctx.font = '12px system-ui';
      ctx.fillText('Made with AURA 💜', 200, 470);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to export card');
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `aura-streak-${userName.toLowerCase().replace(/\s/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Streak card saved! 📸');
      }, 'image/png');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export card');
    } finally {
      setIsExporting(false);
    }
  };

  const shareCard = async () => {
    const shareText = `🔥 ${streak} Day Streak on AURA!\n⚡ ${score} Points | Rank #${rank}\n\nJoin me on AURA - Your AI Companion!\n#AURA #Productivity #StreakGoals`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My AURA Streak',
          text: shareText,
        });
        toast.success('Shared successfully! 🎉');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareText);
          toast.success('Copied to clipboard! 📋');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('Copied to clipboard! 📋');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Your Streak
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 pt-0 space-y-4">
          {/* Theme Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Palette className="w-4 h-4 text-muted-foreground shrink-0" />
            {(Object.keys(themes) as CardTheme[]).map((themeKey) => (
              <Button
                key={themeKey}
                variant={selectedTheme === themeKey ? "default" : "outline"}
                size="sm"
                className={`shrink-0 ${selectedTheme === themeKey ? themes[themeKey].bg : ''}`}
                onClick={() => setSelectedTheme(themeKey)}
              >
                {themes[themeKey].name}
              </Button>
            ))}
          </div>

          {/* Preview Card */}
          <div
            ref={cardRef}
            className={`relative ${theme.bg} rounded-2xl p-6 overflow-hidden`}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className={`text-sm font-medium ${theme.accent} mb-6`}>
                AURA
              </div>

              {/* Streak Display */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/15 mb-3">
                  <div className="flex items-center gap-1">
                    <Flame className={`w-8 h-8 ${selectedTheme === 'minimal' ? 'text-orange-500' : 'text-orange-300'}`} />
                    <span className={`text-3xl font-bold ${theme.text}`}>{streak}</span>
                  </div>
                </div>
                <p className={`text-lg ${theme.accent}`}>Day Streak</p>
              </div>

              {/* User Info */}
              <div className="text-center mb-6">
                <h3 className={`text-2xl font-bold ${theme.text}`}>{userName}</h3>
                <p className={theme.accent}>Rank #{rank}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/15 rounded-xl p-3 text-center">
                  <Zap className={`w-5 h-5 mx-auto mb-1 ${selectedTheme === 'minimal' ? 'text-yellow-500' : 'text-yellow-300'}`} />
                  <p className={`text-xl font-bold ${theme.text}`}>{score}</p>
                  <p className={`text-xs ${theme.accent}`}>Points</p>
                </div>
                <div className="bg-white/15 rounded-xl p-3 text-center">
                  <Star className={`w-5 h-5 mx-auto mb-1 ${selectedTheme === 'minimal' ? 'text-purple-500' : 'text-purple-300'}`} />
                  <p className={`text-xl font-bold ${theme.text}`}>{habitsCompleted}</p>
                  <p className={`text-xs ${theme.accent}`}>Habits</p>
                </div>
                <div className="bg-white/15 rounded-xl p-3 text-center">
                  <Trophy className={`w-5 h-5 mx-auto mb-1 ${selectedTheme === 'minimal' ? 'text-pink-500' : 'text-pink-300'}`} />
                  <p className={`text-xl font-bold ${theme.text}`}>{moodLogs}</p>
                  <p className={`text-xs ${theme.accent}`}>Logs</p>
                </div>
              </div>

              {/* Quote */}
              <p className={`text-center text-sm italic ${theme.accent} mt-4`}>
                "Consistency is the key to success"
              </p>

              {/* Footer */}
              <p className={`text-center text-xs ${theme.accent} mt-4`}>
                Made with AURA 💜
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={shareCard}
              className="h-12"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              onClick={exportCard}
              disabled={isExporting}
              className="h-12 aura-gradient"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Saving...' : 'Save Image'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
