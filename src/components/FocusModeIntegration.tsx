import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  FocusTypeSelection,
  FocusGoalInput,
  FocusActiveBanner,
  FocusReflection,
  StruggleSupport,
} from './FocusModeChat';
import { useFocusModeAI, FocusType } from '@/hooks/useFocusModeAI';
import { toast } from 'sonner';

interface FocusModeIntegrationProps {
  onSendMessage: (message: string) => void;
  lastUserMessage?: string;
}

export const useFocusModeIntegration = () => {
  const focusModeAI = useFocusModeAI();
  const [showStruggleSupport, setShowStruggleSupport] = useState(false);
  const [pendingStruggleResponse, setPendingStruggleResponse] = useState<{
    message: string;
    buttons?: string[];
  } | null>(null);

  // Detect focus intent from user message
  const detectFocusIntent = (message: string): {
    isIntent: boolean;
    action: 'start' | 'end' | 'status' | null;
  } => {
    const lowerMessage = message.toLowerCase();
    
    const startPatterns = [
      /^let'?s?\s+focus/i,
      /^start\s+(?:focus|coding|studying|working)/i,
      /^focus\s+(?:mode|time|session)/i,
      /^(?:study|coding|work)\s+time/i,
      /^(?:i\s+)?(?:want|need)\s+to\s+focus/i,
      /^focus\s+for\s+\d+/i,
    ];
    
    const endPatterns = [
      /^(?:end|stop|done|finish)\s+focus/i,
      /^i'?m?\s+done/i,
      /^that'?s?\s+enough/i,
      /^wrap\s+up/i,
    ];
    
    const statusPatterns = [
      /^(?:how\s+much|what'?s?)\s+(?:time\s+)?(?:left|remaining)/i,
      /^focus\s+status/i,
    ];
    
    if (startPatterns.some(p => p.test(lowerMessage))) {
      return { isIntent: true, action: 'start' };
    }
    if (endPatterns.some(p => p.test(lowerMessage))) {
      return { isIntent: true, action: 'end' };
    }
    if (statusPatterns.some(p => p.test(lowerMessage))) {
      return { isIntent: true, action: 'status' };
    }
    
    return { isIntent: false, action: null };
  };

  // Handle user message during focus mode
  const handleFocusMessage = (message: string): {
    handled: boolean;
    response?: string;
    showComponent?: 'type_selection' | 'goal_input' | 'reflection';
  } => {
    const intent = detectFocusIntent(message);
    
    // Handle focus start
    if (intent.action === 'start' && !focusModeAI.isActive) {
      focusModeAI.initiateFocusMode();
      return {
        handled: true,
        response: "Alright.\nWhat are we focusing on right now?",
        showComponent: 'type_selection',
      };
    }
    
    // Handle focus end
    if (intent.action === 'end' && focusModeAI.isActive) {
      focusModeAI.endFocusSession(true);
      return {
        handled: true,
        response: "That was solid focus.\nWant to wrap up or continue a bit more?",
        showComponent: 'reflection',
      };
    }
    
    // Handle status check
    if (intent.action === 'status' && focusModeAI.isActive) {
      const minutes = Math.ceil(focusModeAI.remainingTime / 60);
      return {
        handled: true,
        response: `You've got ${minutes} minutes left.\nStay with it — you're doing great.`,
      };
    }
    
    // If in focus mode, check for struggles
    if (focusModeAI.isActive) {
      focusModeAI.handleFocusInteraction(message);
      
      const struggle = focusModeAI.detectStruggle(message);
      if (struggle) {
        focusModeAI.logStruggle(struggle);
        const response = focusModeAI.getStruggleResponse();
        if (response) {
          setPendingStruggleResponse(response);
          setShowStruggleSupport(true);
        }
      }
    }
    
    return { handled: false };
  };

  // Handle struggle support response
  const handleStruggleResponse = (response: string) => {
    setShowStruggleSupport(false);
    setPendingStruggleResponse(null);
    
    if (response === 'Short break' || response === 'Take a break' || response === '5-minute reset') {
      focusModeAI.pauseSession();
      toast('Taking a 5-minute break. I\'ll let you know when it\'s time.', { duration: 3000 });
      
      // Auto-resume after 5 minutes
      setTimeout(() => {
        focusModeAI.resumeSession();
        toast('Break\'s over. Ready to continue?', { duration: 3000 });
      }, 5 * 60 * 1000);
    } else if (response === 'Stop focus') {
      focusModeAI.endFocusSession(false);
    }
  };

  // Get focus context for AI prompts
  const getFocusContextForAI = (): string | null => {
    const context = focusModeAI.getFocusContext();
    if (!context) return null;
    
    let promptContext = `[FOCUS MODE ACTIVE]
- Type: ${context.type}
- Goal: ${context.goal || 'General focus'}
- Time remaining: ${context.remainingMinutes} minutes
- Persona: ${context.persona}`;
    
    if (context.struggledRecently) {
      promptContext += `\n- User showed signs of struggle recently. Be extra supportive.`;
    }
    
    promptContext += `\n\nBEHAVIOR GUIDELINES:
- Keep responses SHORT and PRECISE
- No routine nudges or upsells
- ${context.persona === 'mentor' ? 'Guide step-by-step, don\'t dump information' : ''}
- ${context.persona === 'silent' ? 'Only respond when directly asked' : ''}
- ${context.persona === 'guide' ? 'Help with clarity, don\'t over-explain' : ''}`;
    
    return promptContext;
  };

  return {
    ...focusModeAI,
    detectFocusIntent,
    handleFocusMessage,
    handleStruggleResponse,
    getFocusContextForAI,
    showStruggleSupport,
    pendingStruggleResponse,
    setShowStruggleSupport,
  };
};

// Component to render focus mode UI elements in chat
export const FocusModeUIElements: React.FC<{
  focusMode: ReturnType<typeof useFocusModeIntegration>;
  onSendMessage: (message: string) => void;
}> = ({ focusMode, onSendMessage }) => {
  const handleTypeSelect = (type: FocusType) => {
    focusMode.selectFocusType(type);
    
    // Generate appropriate response based on type
    if (type === 'quiet') {
      onSendMessage(''); // Will trigger goal-less start
    }
  };

  const handleGoalSubmit = (goal: string, duration: number) => {
    focusMode.setFocusGoal(goal, duration);
  };

  const handleReflection = (result: 'yes' | 'almost' | 'not_today') => {
    focusMode.recordReflection(result);
    
    // Show appropriate response
    const responses = {
      yes: "Nice work. That counts.",
      almost: "Still progress. We can finish later.",
      not_today: "That's okay. Showing up matters.",
    };
    
    // This will be shown as AURRA's response
    setTimeout(() => {
      onSendMessage(`__AURRA_RESPONSE__${responses[result]}`);
    }, 300);
  };

  return (
    <>
      {/* Focus Type Selection */}
      <AnimatePresence>
        {focusMode.awaitingTypeSelection && (
          <FocusTypeSelection
            onSelect={handleTypeSelect}
            onDismiss={() => focusMode.selectFocusType('quiet')}
          />
        )}
      </AnimatePresence>

      {/* Goal Input */}
      <AnimatePresence>
        {focusMode.awaitingGoal && focusMode.focusType && (
          <FocusGoalInput
            focusType={focusMode.focusType}
            onSubmit={handleGoalSubmit}
            onBack={() => focusMode.initiateFocusMode()}
          />
        )}
      </AnimatePresence>

      {/* Post-Session Reflection */}
      <AnimatePresence>
        {focusMode.sessionComplete && (
          <FocusReflection
            goal={focusMode.goal?.description || ''}
            onReflect={handleReflection}
          />
        )}
      </AnimatePresence>

      {/* Struggle Support */}
      <AnimatePresence>
        {focusMode.showStruggleSupport && focusMode.pendingStruggleResponse && (
          <StruggleSupport
            message={focusMode.pendingStruggleResponse.message}
            buttons={focusMode.pendingStruggleResponse.buttons}
            onResponse={focusMode.handleStruggleResponse}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Active focus banner for header area
export const FocusModeHeaderBanner: React.FC<{
  focusMode: ReturnType<typeof useFocusModeIntegration>;
}> = ({ focusMode }) => {
  if (!focusMode.isActive || !focusMode.focusType) return null;

  return (
    <FocusActiveBanner
      focusType={focusMode.focusType}
      goal={focusMode.goal?.description || 'Focus session'}
      remainingTime={focusMode.remainingTime}
      formatTime={focusMode.formatTime}
      onEnd={() => focusMode.endFocusSession(true)}
    />
  );
};
