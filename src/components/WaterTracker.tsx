import React from 'react';
import { Droplets, Plus, Minus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WaterTrackerProps {
  glasses: number;
  goal: number;
  onAdd: () => void;
  onRemove: () => void;
  onReset: () => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  glasses,
  goal,
  onAdd,
  onRemove,
  onReset,
}) => {
  const percentage = Math.min((glasses / goal) * 100, 100);
  const isComplete = glasses >= goal;

  return (
    <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Water Intake</h3>
              <p className="text-xs text-muted-foreground">Stay hydrated!</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onReset}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="relative h-6 bg-muted/50 rounded-full overflow-hidden mb-3">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
              isComplete
                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                : "bg-gradient-to-r from-cyan-400 to-blue-500"
            )}
            style={{ width: `${percentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "text-xs font-semibold",
              percentage > 50 ? "text-white" : "text-foreground"
            )}>
              {glasses} / {goal} glasses
            </span>
          </div>
        </div>

        {/* Glass Indicators */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Array.from({ length: goal }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-6 h-8 rounded-md border-2 transition-all duration-300",
                i < glasses
                  ? "bg-cyan-500/30 border-cyan-500"
                  : "bg-muted/30 border-muted"
              )}
            >
              <div
                className={cn(
                  "w-full rounded-b-sm transition-all duration-500",
                  i < glasses ? "bg-cyan-500 h-full" : "h-0"
                )}
                style={{
                  animationDelay: `${i * 50}ms`
                }}
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={glasses <= 0}
            className="rounded-full"
          >
            <Minus className="w-4 h-4" />
          </Button>
          
          <div className="text-center">
            {isComplete ? (
              <p className="text-xs text-green-500 font-medium">
                🎉 Goal reached! Great job!
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {goal - glasses} more to go
              </p>
            )}
          </div>
          
          <Button
            variant="default"
            size="sm"
            onClick={onAdd}
            className="rounded-full bg-cyan-500 hover:bg-cyan-600"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Motivational Messages */}
        {glasses > 0 && glasses < goal && (
          <p className="text-xs text-center text-muted-foreground mt-3 italic">
            {glasses <= 2 && "Good start! Keep it up! 💧"}
            {glasses > 2 && glasses <= 5 && "You're doing great! Stay consistent! 💪"}
            {glasses > 5 && glasses < goal && "Almost there! Just a few more! 🌊"}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
