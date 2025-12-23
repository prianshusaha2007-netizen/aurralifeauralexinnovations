import React, { useState, useEffect } from 'react';
import { Volume2, Gauge, AudioWaveform, Play } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export interface VoiceSettings {
  voiceName: string;
  speed: number;
  pitch: number;
  volume: number;
}

interface VoiceSettingsPanelProps {
  settings?: VoiceSettings;
  onChange?: (settings: VoiceSettings) => void;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  voiceName: '',
  speed: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

export const VoiceSettingsPanel: React.FC<VoiceSettingsPanelProps> = ({
  settings: propSettings,
  onChange,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem('aura-voice-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return propSettings || DEFAULT_SETTINGS;
      }
    }
    return propSettings || DEFAULT_SETTINGS;
  });
  const [isTesting, setIsTesting] = useState(false);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      // Filter to English voices for better UX
      const englishVoices = availableVoices.filter(v => 
        v.lang.startsWith('en') || v.lang.startsWith('hi')
      );
      setVoices(englishVoices.length > 0 ? englishVoices : availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const updateSettings = (newSettings: Partial<VoiceSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('aura-voice-settings', JSON.stringify(updated));
    onChange?.(updated);
  };

  const testVoice = () => {
    if (isTesting) {
      window.speechSynthesis.cancel();
      setIsTesting(false);
      return;
    }

    setIsTesting(true);
    const utterance = new SpeechSynthesisUtterance(
      "Hi! I'm AURA, your AI companion. How does my voice sound?"
    );

    const selectedVoice = voices.find(v => v.name === settings.voiceName);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = settings.speed;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    utterance.onend = () => setIsTesting(false);
    utterance.onerror = () => setIsTesting(false);

    window.speechSynthesis.speak(utterance);
  };

  // Group voices by language/type
  const groupedVoices = voices.reduce((acc, voice) => {
    const key = voice.localService ? 'Local' : 'Online';
    if (!acc[key]) acc[key] = [];
    acc[key].push(voice);
    return acc;
  }, {} as Record<string, SpeechSynthesisVoice[]>);

  return (
    <div className="space-y-6">
      {/* Voice Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Volume2 className="w-4 h-4" />
          Voice
        </Label>
        <Select 
          value={settings.voiceName} 
          onValueChange={(v) => updateSettings({ voiceName: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {Object.entries(groupedVoices).map(([group, groupVoices]) => (
              <div key={group}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {group} Voices
                </div>
                {groupVoices.map((voice) => (
                  <SelectItem key={voice.name} value={voice.name}>
                    <div className="flex flex-col">
                      <span className="truncate">{voice.name}</span>
                      <span className="text-xs text-muted-foreground">{voice.lang}</span>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Speed Control */}
      <div className="space-y-3">
        <Label className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Gauge className="w-4 h-4" />
            Speed
          </span>
          <span className="text-xs text-muted-foreground">{settings.speed.toFixed(1)}x</span>
        </Label>
        <Slider
          value={[settings.speed]}
          onValueChange={(v) => updateSettings({ speed: v[0] })}
          min={0.5}
          max={2.0}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Slow</span>
          <span>Normal</span>
          <span>Fast</span>
        </div>
      </div>

      {/* Pitch Control */}
      <div className="space-y-3">
        <Label className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium">
            <AudioWaveform className="w-4 h-4" />
            Pitch
          </span>
          <span className="text-xs text-muted-foreground">{settings.pitch.toFixed(1)}</span>
        </Label>
        <Slider
          value={[settings.pitch]}
          onValueChange={(v) => updateSettings({ pitch: v[0] })}
          min={0.5}
          max={2.0}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Lower</span>
          <span>Normal</span>
          <span>Higher</span>
        </div>
      </div>

      {/* Volume Control */}
      <div className="space-y-3">
        <Label className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Volume2 className="w-4 h-4" />
            Volume
          </span>
          <span className="text-xs text-muted-foreground">{Math.round(settings.volume * 100)}%</span>
        </Label>
        <Slider
          value={[settings.volume]}
          onValueChange={(v) => updateSettings({ volume: v[0] })}
          min={0}
          max={1}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Test Voice Button */}
      <Button
        onClick={testVoice}
        variant="outline"
        className="w-full"
      >
        <Play className="w-4 h-4 mr-2" />
        {isTesting ? 'Stop' : 'Test Voice'}
      </Button>

      {/* Info */}
      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
        <p>💡 These settings apply to AURA's voice responses using your browser's built-in voices.</p>
      </div>
    </div>
  );
};
