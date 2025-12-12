import React, { useState, useEffect } from 'react';
import { Mail, Send, Loader2, CheckCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAura } from '@/contexts/AuraContext';
import { supabase } from '@/integrations/supabase/client';

export const WeeklyEmailSettings: React.FC = () => {
  const [email, setEmail] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { userProfile } = useAura();

  useEffect(() => {
    // Load saved email from localStorage
    const savedEmail = localStorage.getItem('aura_weekly_email');
    const savedEnabled = localStorage.getItem('aura_weekly_email_enabled');
    if (savedEmail) setEmail(savedEmail);
    if (savedEnabled) setEnabled(savedEnabled === 'true');
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    localStorage.setItem('aura_weekly_email', e.target.value);
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    localStorage.setItem('aura_weekly_email_enabled', String(checked));
    if (checked && email) {
      toast({
        title: "Weekly summaries enabled",
        description: "You'll receive mood insights every week.",
      });
    }
  };

  const sendNow = async () => {
    if (!email || !user) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-mood-summary', {
        body: {
          userId: user.id,
          email: email,
          userName: userProfile.name || 'Friend',
        },
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: "Summary sent!",
        description: "Check your inbox for your weekly mood summary.",
      });

      setTimeout(() => setSent(false), 3000);
    } catch (error: any) {
      console.error('Error sending summary:', error);
      toast({
        title: "Failed to send",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Mail className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Weekly Mood Summary</p>
          <p className="text-xs text-muted-foreground">Get AI insights about your week</p>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>

      {enabled && (
        <div className="space-y-3 pl-12 animate-fade-in">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={handleEmailChange}
            className="h-10"
          />
          <Button
            onClick={sendNow}
            disabled={sending || !email}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : sent ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Sent!
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Summary Now
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
