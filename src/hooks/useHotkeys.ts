import { useEffect, useCallback } from 'react';

interface HotkeyConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description?: string;
}

export const useHotkeys = (hotkeys: HotkeyConfig[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const hotkey of hotkeys) {
      const ctrlMatch = hotkey.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = hotkey.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = hotkey.alt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === hotkey.key.toLowerCase() || 
                       event.code.toLowerCase() === `key${hotkey.key.toLowerCase()}` ||
                       event.code.toLowerCase() === hotkey.key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        // Don't trigger if user is typing in an input
        const activeElement = document.activeElement;
        const isTyping = activeElement instanceof HTMLInputElement || 
                        activeElement instanceof HTMLTextAreaElement ||
                        (activeElement as HTMLElement)?.isContentEditable;
        
        // For Ctrl+Space, we want to trigger even when in input (it's a voice shortcut)
        if (hotkey.key.toLowerCase() === 'space' && hotkey.ctrl) {
          event.preventDefault();
          hotkey.callback();
          return;
        }
        
        if (!isTyping) {
          event.preventDefault();
          hotkey.callback();
          return;
        }
      }
    }
  }, [hotkeys]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export const HOTKEY_DESCRIPTIONS = {
  voiceInput: 'Ctrl + Space - Trigger voice input',
  newChat: 'Ctrl + N - Start new chat',
  search: 'Ctrl + K - Open search',
};
