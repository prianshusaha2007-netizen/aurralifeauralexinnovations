import React, { useState, useEffect } from 'react';
import { Globe, Pin, PinOff, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useCulturalContext } from '@/hooks/useCulturalContext';

interface LanguagePreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALL_LANGUAGES = [
  { code: 'en', label: 'English', region: 'Global', flag: '🇬🇧' },
  { code: 'hindi-english', label: 'Hindi / Hinglish', region: 'North Indian', flag: '🇮🇳' },
  { code: 'bengali', label: 'Bengali', region: 'Bengali', flag: '🇮🇳' },
  { code: 'tamil', label: 'Tamil', region: 'Tamil', flag: '🇮🇳' },
  { code: 'telugu', label: 'Telugu', region: 'Telugu', flag: '🇮🇳' },
  { code: 'marathi', label: 'Marathi', region: 'Marathi', flag: '🇮🇳' },
  { code: 'gujarati', label: 'Gujarati', region: 'Gujarati', flag: '🇮🇳' },
  { code: 'kannada', label: 'Kannada', region: 'Kannada', flag: '🇮🇳' },
  { code: 'malayalam', label: 'Malayalam', region: 'Malayalam', flag: '🇮🇳' },
  { code: 'punjabi', label: 'Punjabi', region: 'Punjabi', flag: '🇮🇳' },
  { code: 'odia', label: 'Odia', region: 'Odia', flag: '🇮🇳' },
  { code: 'arabic', label: 'Arabic', region: 'Arabic', flag: '🇸🇦' },
  { code: 'chinese', label: 'Chinese', region: 'Chinese', flag: '🇨🇳' },
  { code: 'french', label: 'French', region: 'French', flag: '🇫🇷' },
  { code: 'russian', label: 'Russian', region: 'Russian', flag: '🇷🇺' },
  { code: 'spanish', label: 'Spanish', region: 'Spanish', flag: '🇪🇸' },
  { code: 'japanese', label: 'Japanese', region: 'Japanese', flag: '🇯🇵' },
  { code: 'korean', label: 'Korean', region: 'Korean', flag: '🇰🇷' },
  { code: 'portuguese', label: 'Portuguese', region: 'Portuguese', flag: '🇧🇷' },
  { code: 'german', label: 'German', region: 'German', flag: '🇩🇪' },
  { code: 'italian', label: 'Italian', region: 'Italian', flag: '🇮🇹' },
  { code: 'turkish', label: 'Turkish', region: 'Turkish', flag: '🇹🇷' },
];

const PINNED_LANG_KEY = 'aurra-pinned-language';

export const LanguagePreferencesDialog: React.FC<LanguagePreferencesDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { culturalProfile, correctProfile, resetProfile } = useCulturalContext();
  
  const [pinnedLang, setPinnedLang] = useState<string | null>(() => {
    return localStorage.getItem(PINNED_LANG_KEY);
  });

  const detectedLang = culturalProfile.language || null;
  const detectedRegion = culturalProfile.region || null;

  const handlePin = (langCode: string) => {
    if (pinnedLang === langCode) {
      // Unpin
      setPinnedLang(null);
      localStorage.removeItem(PINNED_LANG_KEY);
    } else {
      setPinnedLang(langCode);
      localStorage.setItem(PINNED_LANG_KEY, langCode);
      // Also update cultural profile
      const lang = ALL_LANGUAGES.find(l => l.code === langCode);
      if (lang) {
        correctProfile({ language: lang.code, region: lang.region });
      }
    }
  };

  const handleReset = () => {
    setPinnedLang(null);
    localStorage.removeItem(PINNED_LANG_KEY);
    resetProfile();
  };

  const detectedLangInfo = ALL_LANGUAGES.find(l => l.code === detectedLang);
  const pinnedLangInfo = ALL_LANGUAGES.find(l => l.code === pinnedLang);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Language Preferences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground">Detected Language</p>
                <p className="text-sm font-medium">
                  {detectedLangInfo ? `${detectedLangInfo.flag} ${detectedLangInfo.label}` : 'None yet'}
                </p>
              </div>
              {detectedLangInfo && (
                <Badge variant="outline" className="text-xs">
                  Auto
                </Badge>
              )}
            </div>

            {pinnedLangInfo && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div>
                  <p className="text-xs text-muted-foreground">Pinned Language</p>
                  <p className="text-sm font-medium">
                    {pinnedLangInfo.flag} {pinnedLangInfo.label}
                  </p>
                </div>
                <Badge className="text-xs bg-primary/20 text-primary border-0">
                  <Pin className="w-3 h-3 mr-1" />
                  Pinned
                </Badge>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            AURA auto-detects your language from chat. Pin a language to always respond in it.
          </p>

          {/* Language list */}
          <ScrollArea className="h-[280px] -mx-2 px-2">
            <div className="space-y-1">
              {ALL_LANGUAGES.map((lang) => {
                const isDetected = detectedLang === lang.code;
                const isPinned = pinnedLang === lang.code;

                return (
                  <button
                    key={lang.code}
                    onClick={() => handlePin(lang.code)}
                    className={cn(
                      'flex items-center gap-3 w-full p-2.5 rounded-xl text-left transition-colors',
                      isPinned
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-muted/50 border border-transparent'
                    )}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{lang.label}</p>
                      <p className="text-xs text-muted-foreground">{lang.region}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isDetected && !isPinned && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          detected
                        </Badge>
                      )}
                      {isPinned ? (
                        <PinOff className="w-4 h-4 text-primary" />
                      ) : (
                        <Pin className="w-4 h-4 text-muted-foreground/40" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="rounded-xl gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl flex-1"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
