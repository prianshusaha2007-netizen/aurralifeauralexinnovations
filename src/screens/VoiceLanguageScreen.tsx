import React, { useState } from 'react';
import { ArrowLeft, Mic, Volume2, MessageCircle, Globe, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { VoiceSettingsPanel } from '@/components/VoiceSettingsPanel';
import { MicrophoneTest } from '@/components/MicrophoneTest';
import { ResetPermissionsGuide } from '@/components/ResetPermissionsGuide';
import { useAura } from '@/contexts/AuraContext';
import { useToast } from '@/hooks/use-toast';
import { getGreetingFrequency, setGreetingFrequency, GreetingFrequency } from '@/components/MorningGreeting';

interface VoiceLanguageScreenProps {
  onBack?: () => void;
}

export const VoiceLanguageScreen: React.FC<VoiceLanguageScreenProps> = ({ onBack }) => {
  const { userProfile } = useAura();
  const { toast } = useToast();
  
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('aurra-voice-enabled') !== 'false';
  });
  
  const [greetingFreq, setGreetingFreq] = useState<GreetingFrequency>(getGreetingFrequency());
  const [greetingDialogOpen, setGreetingDialogOpen] = useState(false);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [micTestOpen, setMicTestOpen] = useState(false);
  const [permissionsGuideOpen, setPermissionsGuideOpen] = useState(false);

  const handleVoiceToggle = (enabled: boolean) => {
    setVoiceEnabled(enabled);
    localStorage.setItem('aurra-voice-enabled', String(enabled));
    toast({
      title: enabled ? 'Voice Enabled' : 'Voice Disabled',
      description: enabled ? 'AURRA will speak responses' : 'Text-only responses',
    });
  };

  const handleGreetingFrequencyChange = (value: GreetingFrequency) => {
    setGreetingFreq(value);
    setGreetingFrequency(value);
    setGreetingDialogOpen(false);
    toast({
      title: 'Greeting Frequency Updated',
      description: value === 'off' ? 'Voice greetings disabled' : 
                   value === 'daily' ? "I'll greet you once a day" : 
                   "I'll greet you every few hours",
    });
  };

  const getGreetingFreqLabel = () => {
    switch (greetingFreq) {
      case 'every4h': return 'Every 4 hours';
      case 'daily': return 'Once daily';
      case 'off': return 'Off';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-semibold">Voice & Language</h1>
          <p className="text-sm text-muted-foreground">How AURRA sounds and speaks</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        {/* Voice Master Toggle */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Volume2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Voice Replies</p>
                  <p className="text-sm text-muted-foreground">
                    {voiceEnabled ? 'AURRA speaks responses' : 'Text only'}
                  </p>
                </div>
              </div>
              <Switch 
                checked={voiceEnabled} 
                onCheckedChange={handleVoiceToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Voice Settings */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Voice Settings
          </h3>
          
          <Card className="border-border/50">
            <CardContent className="p-0">
              <button 
                onClick={() => setGreetingDialogOpen(true)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-xl bg-rose-500/10">
                  <MessageCircle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">Voice Greetings</p>
                  <p className="text-xs text-muted-foreground">{getGreetingFreqLabel()}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <div className="border-t border-border/50" />
              
              <button 
                onClick={() => setVoiceSettingsOpen(true)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <Volume2 className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">Voice Style</p>
                  <p className="text-xs text-muted-foreground">Gender, speed & pitch</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-0">
              <button 
                onClick={() => setMicTestOpen(true)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-xl bg-green-500/10">
                  <Mic className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">Test Microphone</p>
                  <p className="text-xs text-muted-foreground">Verify your mic works</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <div className="border-t border-border/50" />
              
              <button 
                onClick={() => setPermissionsGuideOpen(true)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-xl bg-amber-500/10">
                  <Shield className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">Reset Permissions</p>
                  <p className="text-xs text-muted-foreground">Fix denied mic/notification access</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Language */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Language
          </h3>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10">
                  <Globe className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Language</p>
                  <p className="text-xs text-muted-foreground">
                    {userProfile.languages?.join(', ') || 'Auto-detect'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground px-1">
            AURRA automatically detects your language from your messages.
          </p>
        </div>
      </div>

      {/* Greeting Frequency Dialog */}
      <Dialog open={greetingDialogOpen} onOpenChange={setGreetingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Voice Greetings</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={greetingFreq} onValueChange={(value) => handleGreetingFrequencyChange(value as GreetingFrequency)}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="every4h" id="every4h" />
                  <Label htmlFor="every4h" className="flex-1 cursor-pointer">
                    <p className="font-medium">Every 4 hours</p>
                    <p className="text-sm text-muted-foreground">Frequent greetings throughout the day</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily" className="flex-1 cursor-pointer">
                    <p className="font-medium">Once daily</p>
                    <p className="text-sm text-muted-foreground">A single morning greeting</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="off" id="off" />
                  <Label htmlFor="off" className="flex-1 cursor-pointer">
                    <p className="font-medium">Off</p>
                    <p className="text-sm text-muted-foreground">No voice greetings</p>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Settings Dialog */}
      <Dialog open={voiceSettingsOpen} onOpenChange={setVoiceSettingsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Voice Style</DialogTitle>
          </DialogHeader>
          <VoiceSettingsPanel />
        </DialogContent>
      </Dialog>

      {/* Microphone Test Dialog */}
      <Dialog open={micTestOpen} onOpenChange={setMicTestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Test Microphone</DialogTitle>
          </DialogHeader>
          <MicrophoneTest />
        </DialogContent>
      </Dialog>

      {/* Permissions Guide Dialog */}
      <Dialog open={permissionsGuideOpen} onOpenChange={setPermissionsGuideOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reset Permissions</DialogTitle>
          </DialogHeader>
          <ResetPermissionsGuide />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoiceLanguageScreen;
