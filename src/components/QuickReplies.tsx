/**
 * QuickReplies - Simple, conversational prompts
 * 
 * Philosophy: Guide without overwhelming.
 * Suggestions should feel natural, not like buttons.
 */

import React from 'react';
import { motion } from 'framer-motion';

interface QuickRepliesProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({
  suggestions,
  onSelect,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex flex-wrap gap-2 mb-4"
    >
      {suggestions.map((suggestion, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 * i }}
          onClick={() => onSelect(suggestion)}
          className="px-4 py-2 bg-muted/30 hover:bg-muted/50 text-foreground/80 hover:text-foreground text-sm rounded-full transition-colors"
        >
          {suggestion}
        </motion.button>
      ))}
    </motion.div>
  );
};

// Default contextual suggestions based on time
export const getDefaultSuggestions = (): string[] => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 10) {
    return [
      "What's my day looking like?",
      "I'm feeling stressed",
      "Help me focus",
    ];
  } else if (hour >= 10 && hour < 14) {
    return [
      "I need a break",
      "Remind me later",
      "What should I prioritize?",
    ];
  } else if (hour >= 14 && hour < 18) {
    return [
      "How's my day going?",
      "I'm losing focus",
      "What's left today?",
    ];
  } else if (hour >= 18 && hour < 22) {
    return [
      "How did today go?",
      "I need to unwind",
      "Plan tomorrow",
    ];
  } else {
    return [
      "I can't sleep",
      "Clear my mind",
      "Tomorrow's plan",
    ];
  }
};
