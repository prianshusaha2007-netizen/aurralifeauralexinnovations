import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallBannerProps {
  onDismiss?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onDismiss }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(checkInstalled);

    // Check for iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if user chose web-only mode
    const webOnly = localStorage.getItem('aurra_web_only_mode');
    if (webOnly === 'true') {
      setDismissed(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleWebOnly = () => {
    localStorage.setItem('aurra_web_only_mode', 'true');
    setDismissed(true);
    onDismiss?.();
  };

  // Don't show if installed or dismissed
  if (isInstalled || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-0 left-0 right-0 z-50 p-3 bg-gradient-to-r from-primary/95 via-primary to-primary/95 backdrop-blur-sm shadow-lg"
      >
        <div className="max-w-md mx-auto">
          {!showIOSInstructions ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white text-sm">Install AURRA</p>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-white/20 text-white border-0">
                    Life OS
                  </Badge>
                </div>
                <p className="text-xs text-white/80 truncate">
                  Faster, offline-ready, native experience
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleInstall}
                  className="bg-white text-primary hover:bg-white/90 h-8 px-3 text-xs font-medium"
                >
                  {isIOS ? 'How to' : 'Install'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleWebOnly}
                  className="text-white/70 hover:text-white hover:bg-white/10 h-8 px-2 text-xs"
                >
                  Web only
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white text-sm">Add to Home Screen (iOS)</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowIOSInstructions(false)}
                  className="text-white/70 hover:text-white h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3 text-white/90 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
                  <span>Tap Share</span>
                </div>
                <ChevronRight className="w-3 h-3 text-white/50" />
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
                  <span>Add to Home</span>
                </div>
                <ChevronRight className="w-3 h-3 text-white/50" />
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
                  <span>Add</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleWebOnly}
                className="w-full bg-white/10 text-white hover:bg-white/20 h-7 text-xs border-0"
              >
                Continue in browser instead
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
