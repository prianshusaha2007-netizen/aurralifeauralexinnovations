import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Mic, 
  Bell, 
  MapPin, 
  Camera,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMobilePermissions } from '@/hooks/useMobilePermissions';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PermissionsOnboardingModalProps {
  onComplete?: () => void;
}

export const PermissionsOnboardingModal: React.FC<PermissionsOnboardingModalProps> = ({ 
  onComplete 
}) => {
  const { 
    permissions, 
    isChecking,
    requestMicrophone,
    requestCamera,
    requestNotifications,
    requestGeolocation,
    checkAllPermissions
  } = useMobilePermissions();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  const permissionSteps = [
    { 
      key: 'microphone' as const, 
      name: 'Microphone', 
      icon: Mic, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
      description: 'Enables voice commands and conversations with AURA',
      request: requestMicrophone
    },
    { 
      key: 'notifications' as const, 
      name: 'Notifications', 
      icon: Bell, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/20',
      description: 'Get reminders, morning briefings, and important updates',
      request: requestNotifications
    },
    { 
      key: 'geolocation' as const, 
      name: 'Location', 
      icon: MapPin, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      description: 'Personalized weather and location-based suggestions',
      request: requestGeolocation
    },
    { 
      key: 'camera' as const, 
      name: 'Camera', 
      icon: Camera, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/20',
      description: 'Analyze images and scan documents',
      request: requestCamera
    },
  ];

  // Check if we should show the modal on mount
  useEffect(() => {
    const checkAndShow = async () => {
      // Check if user has already completed onboarding
      const completed = localStorage.getItem('aura-permissions-onboarding-complete');
      const lastShown = localStorage.getItem('aura-permissions-onboarding-shown');
      
      // Don't show if completed
      if (completed === 'true') {
        return;
      }

      // Don't show more than once per session
      if (lastShown === 'true') {
        return;
      }

      // Wait for permissions to be checked
      await checkAllPermissions();
      
      // Check if any critical permissions are missing
      const hasMissingPermissions = 
        permissions.microphone !== 'granted' || 
        permissions.notifications !== 'granted';

      if (hasMissingPermissions && !hasShown) {
        // Small delay for better UX after app loads
        setTimeout(() => {
          setIsOpen(true);
          setHasShown(true);
          localStorage.setItem('aura-permissions-onboarding-shown', 'true');
        }, 1500);
      }
    };

    if (!isChecking) {
      checkAndShow();
    }
  }, [isChecking, permissions, hasShown, checkAllPermissions]);

  const handleRequestPermission = async () => {
    const step = permissionSteps[currentStep];
    setIsRequesting(true);
    
    await step.request();
    await checkAllPermissions();
    
    setIsRequesting(false);
    
    // Move to next step or complete
    if (currentStep < permissionSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    if (currentStep < permissionSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('aura-permissions-onboarding-complete', 'true');
    setIsOpen(false);
    onComplete?.();
  };

  const handleSkipAll = () => {
    localStorage.setItem('aura-permissions-onboarding-complete', 'true');
    setIsOpen(false);
    onComplete?.();
  };

  const currentPermission = permissionSteps[currentStep];
  const CurrentIcon = currentPermission?.icon;
  const currentStatus = permissions[currentPermission?.key];

  const getStatusForPermission = (key: keyof typeof permissions) => {
    const status = permissions[key];
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'pending';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background border-border/50">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-background p-6 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/20 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-1">Enable AURA's Powers</h2>
          <p className="text-sm text-muted-foreground">
            Grant permissions for the best experience
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 py-3 border-b border-border/50">
          {permissionSteps.map((step, index) => {
            const status = getStatusForPermission(step.key);
            return (
              <div
                key={step.key}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  index === currentStep && "w-6 bg-primary",
                  index !== currentStep && status === 'granted' && "bg-green-500",
                  index !== currentStep && status === 'denied' && "bg-destructive",
                  index !== currentStep && status === 'pending' && "bg-muted-foreground/30"
                )}
              />
            );
          })}
        </div>

        {/* Current Permission */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            <div className="text-center mb-6">
              <div className={cn(
                "inline-flex items-center justify-center p-4 rounded-2xl mb-4",
                currentPermission.bgColor
              )}>
                <CurrentIcon className={cn("w-10 h-10", currentPermission.color)} />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {currentPermission.name} Access
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentPermission.description}
              </p>
            </div>

            {/* Status indicator */}
            {currentStatus === 'granted' && (
              <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 rounded-xl mb-4">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">Already granted!</span>
              </div>
            )}

            {currentStatus === 'denied' && (
              <div className="flex items-center justify-center gap-2 p-3 bg-destructive/10 rounded-xl mb-4">
                <X className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Blocked. Enable in browser/device settings.
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {currentStatus !== 'granted' && (
                <Button
                  onClick={handleRequestPermission}
                  disabled={isRequesting}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Allow {currentPermission.name}
                    </>
                  )}
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  {currentStatus === 'granted' ? 'Next' : 'Skip'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                
                {currentStep === 0 && (
                  <Button
                    variant="ghost"
                    onClick={handleSkipAll}
                    className="text-muted-foreground"
                  >
                    Skip all
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Permission summary footer */}
        <div className="px-6 pb-6">
          <div className="flex justify-center gap-4 pt-4 border-t border-border/50">
            {permissionSteps.map((step) => {
              const Icon = step.icon;
              const status = getStatusForPermission(step.key);
              return (
                <div
                  key={step.key}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    status === 'granted' && "bg-green-500/10",
                    status === 'denied' && "bg-destructive/10",
                    status === 'pending' && "bg-muted/50"
                  )}
                >
                  <Icon className={cn(
                    "w-4 h-4",
                    status === 'granted' && "text-green-500",
                    status === 'denied' && "text-destructive",
                    status === 'pending' && "text-muted-foreground"
                  )} />
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
