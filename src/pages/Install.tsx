import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import auraLogo from "@/assets/aura-logo.jpeg";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <img
            src={auraLogo}
            alt="Auralex"
            className="w-20 h-20 mx-auto rounded-2xl mb-4"
          />
          <CardTitle className="text-2xl">Install Auralex</CardTitle>
          <CardDescription>
            Add Auralex to your home screen for the best experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
              <p className="text-muted-foreground">
                Auralex is already installed on your device!
              </p>
              <Button onClick={() => navigate("/")} className="w-full">
                Open App
              </Button>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                To install on iOS:
              </p>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0">
                    1
                  </span>
                  <span>Tap the Share button in Safari</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0">
                    2
                  </span>
                  <span>Scroll down and tap "Add to Home Screen"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0">
                    3
                  </span>
                  <span>Tap "Add" in the top right corner</span>
                </li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-4">
              <Button onClick={handleInstall} className="w-full" size="lg">
                <Download className="h-5 w-5 mr-2" />
                Install Now
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Works offline • Fast loading • No app store needed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Smartphone className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Mobile</p>
                  <p className="text-xs text-muted-foreground">
                    Use your browser menu → "Add to Home Screen"
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Monitor className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Desktop</p>
                  <p className="text-xs text-muted-foreground">
                    Look for the install icon in the address bar
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
