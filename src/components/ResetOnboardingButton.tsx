/**
 * AURRA Reset Onboarding Button
 * 
 * Allows testing the onboarding flow by resetting all stored state
 * Only visible in development or when explicitly enabled
 */

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ResetOnboardingButtonProps {
  className?: string;
}

export const ResetOnboardingButton: React.FC<ResetOnboardingButtonProps> = ({ 
  className 
}) => {
  const handleReset = () => {
    // Clear all onboarding-related localStorage keys
    const keysToRemove = [
      'aurra-life-rhythm',
      'aurra-routine-onboarding-complete',
      'aurra-onboarding-complete',
      'aurra-smart-hydration',
      'aurra-burnout-detection',
      'aurra-focus-sessions',
      'aurra-focus-ai-state',
      'aurra-user-state-data',
      'aurra-smart-routine-settings',
      'aurra-routine-blocks',
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    toast.success('Onboarding reset! Refresh to start fresh.', {
      duration: 3000,
      action: {
        label: 'Refresh',
        onClick: () => window.location.reload(),
      },
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReset}
      className={className}
    >
      <RotateCcw className="w-4 h-4 mr-2" />
      Reset Onboarding
    </Button>
  );
};

// Quick reset function for console/testing
export const resetAurraOnboarding = () => {
  const keysToRemove = [
    'aurra-life-rhythm',
    'aurra-routine-onboarding-complete',
    'aurra-onboarding-complete',
    'aurra-smart-hydration',
    'aurra-burnout-detection',
    'aurra-focus-sessions',
    'aurra-focus-ai-state',
    'aurra-user-state-data',
    'aurra-smart-routine-settings',
    'aurra-routine-blocks',
  ];

  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('AURRA onboarding reset. Refresh the page to see changes.');
  return 'Reset complete. Refresh the page.';
};

// Expose to window for easy testing
if (typeof window !== 'undefined') {
  (window as any).resetAurraOnboarding = resetAurraOnboarding;
}
