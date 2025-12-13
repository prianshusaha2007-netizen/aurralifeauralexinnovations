import React from 'react';
import { Volume2, Gauge, AudioWaveform } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface VoiceSettings {
  voice: string;
  speed: number;
  pitch: number;
}

interface VoiceSettingsPanelProps {
  settings: VoiceSettings;
  onChange: (settings: VoiceSettings) => void;
}

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy', description: 'Neutral & balanced' },
  { value: 'echo', label: 'Echo', description: 'Warm & resonant' },
  { value: 'fable', label: 'Fable', description: 'Expressive & British' },
  { value: 'onyx', label: 'Onyx', description: 'Deep & authoritative' },
  { value: 'nova', label: 'Nova', description: 'Friendly & female' },
  { value: 'shimmer', label: 'Shimmer', description: 'Soft & soothing' },
];

export const VoiceSettingsPanel: React.FC<VoiceSettingsPanelProps> = ({
  settings,
  onChange,
}) => {
  const handleVoiceChange = (voice: string) => {
    onChange({ ...settings, voice });
  };

  const handleSpeedChange = (value: number[]) => {
    onChange({ ...settings, speed: value[0] });
  };

  const handlePitchChange = (value: number[]) => {
    onChange({ ...settings, pitch: value[0] });
  };

  return (
    <div className="space-y-6">
      {/* Voice Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Volume2 className="w-4 h-4" />
          Voice Type
        </Label>
        <Select value={settings.voice} onValueChange={handleVoiceChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent>
            {VOICE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </SelectItem>
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
          onValueChange={handleSpeedChange}
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
          <span className="text-xs text-muted-foreground">{settings.pitch > 0 ? '+' : ''}{settings.pitch.toFixed(1)}</span>
        </Label>
        <Slider
          value={[settings.pitch]}
          onValueChange={handlePitchChange}
          min={-1.0}
          max={1.0}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Lower</span>
          <span>Normal</span>
          <span>Higher</span>
        </div>
      </div>

      {/* Preview Info */}
      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
        <p>💡 Changes apply to AURA's voice responses. Try speaking a command to hear the difference!</p>
      </div>
    </div>
  );
};
