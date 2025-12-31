import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, MessageSquare, FileText, Mail, ExternalLink, Heart, ChevronRight, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface HelpSupportScreenProps {
  onBack?: () => void;
}

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const faqItems = [
    {
      question: 'How does AURRA remember things?',
      answer: 'AURRA saves important details from your conversations to the Life Memory Graph. You can view and manage these memories anytime.',
    },
    {
      question: 'What can I do with the free plan?',
      answer: 'Free users get daily check-ins, emotional support, basic routines, and limited conversations. Upgrade for deeper features.',
    },
    {
      question: 'How do I change AURRA\'s personality?',
      answer: 'Go to Personality & Relationship in the menu to adjust AURRA\'s communication style, avatar, and relationship depth.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! All your data is encrypted and stored securely. You can export or delete your data anytime from Account settings.',
    },
  ];

  const handleContactSupport = () => {
    window.open('mailto:support@aurra.ai', '_blank');
    toast({
      title: 'Opening Email',
      description: 'Your email app should open now',
    });
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
          <h1 className="text-xl font-semibold">Help & Support</h1>
          <p className="text-sm text-muted-foreground">Get answers and assistance</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <button 
                onClick={handleContactSupport}
                className="w-full flex flex-col items-center gap-2 text-center"
              >
                <div className="p-3 rounded-xl bg-primary/10">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-sm">Contact Us</span>
                <span className="text-xs text-muted-foreground">Email support</span>
              </button>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4">
              <button 
                onClick={() => window.open('https://aurra.ai/guide', '_blank')}
                className="w-full flex flex-col items-center gap-2 text-center"
              >
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                </div>
                <span className="font-medium text-sm">User Guide</span>
                <span className="text-xs text-muted-foreground">Getting started</span>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-3">
            {faqItems.map((faq, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 mt-0.5">
                      <HelpCircle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">{faq.question}</p>
                      <p className="text-xs text-muted-foreground">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Chat with AURRA */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Ask AURRA</p>
                <p className="text-sm text-muted-foreground">
                  You can always ask me anything in chat!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Links */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Legal
          </h3>
          
          <Card className="border-border/50">
            <CardContent className="p-0">
              <button 
                onClick={() => navigate('/privacy')}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-xl bg-muted">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">Privacy Policy</p>
                  <p className="text-xs text-muted-foreground">How we handle your data</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <div className="border-t border-border/50" />
              
              <button 
                onClick={() => navigate('/terms')}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-xl bg-muted">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">Terms of Service</p>
                  <p className="text-xs text-muted-foreground">Usage terms and conditions</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        </div>

        {/* App Version */}
        <div className="text-center pt-4">
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <Heart className="w-3 h-3" />
            <span className="text-xs">Made with care</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">AURRA v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportScreen;
