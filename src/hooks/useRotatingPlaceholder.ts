import { useState, useEffect, useCallback } from 'react';

const PLACEHOLDERS = [
  "What's on your mind?",
  "Tell me anything...",
  "What should we think about today?",
  "How are you feeling?",
  "What's happening?",
  "I'm here to listen...",
  "Share your thoughts...",
];

export const useRotatingPlaceholder = (intervalMs = 5000) => {
  const [index, setIndex] = useState(0);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => {
        const next = (prev + 1) % PLACEHOLDERS.length;
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  useEffect(() => {
    setPlaceholder(PLACEHOLDERS[index]);
  }, [index]);

  const getRandomPlaceholder = useCallback(() => {
    return PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
  }, []);

  return { placeholder, getRandomPlaceholder };
};
