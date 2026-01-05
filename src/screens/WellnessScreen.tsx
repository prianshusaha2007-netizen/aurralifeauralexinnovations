import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WeeklyWellnessSummary } from '@/components/WeeklyWellnessSummary';

interface WellnessScreenProps {
  onBack?: () => void;
}

export const WellnessScreen: React.FC<WellnessScreenProps> = ({ onBack }) => {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold">Wellness</h1>
          <p className="text-sm text-muted-foreground">Your weekly overview</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <WeeklyWellnessSummary />
      </div>
    </div>
  );
};
