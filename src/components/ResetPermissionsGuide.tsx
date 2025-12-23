import React, { useState } from 'react';
import { 
  Shield, 
  Chrome, 
  Smartphone, 
  Monitor, 
  RefreshCw,
  ExternalLink,
  Mic,
  Bell,
  MapPin,
  Camera,
  Check,
  X,
  Loader2,
  Zap
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMobilePermissions } from '@/hooks/useMobilePermissions';
import { cn } from '@/lib/utils';

export const ResetPermissionsGuide: React.FC = () => {
  const { 
    permissions, 
    isChecking, 
    requestMicrophone,
    requestCamera,
    requestNotifications,
    requestGeolocation,
    checkAllPermissions
  } = useMobilePermissions();
  
  const [isRequesting, setIsRequesting] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const permissionItems = [
    { 
      key: 'microphone' as const, 
      name: 'Microphone', 
      icon: Mic, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      request: requestMicrophone
    },
    { 
      key: 'notifications' as const, 
      name: 'Notifications', 
      icon: Bell, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      request: requestNotifications
    },
    { 
      key: 'geolocation' as const, 
      name: 'Location', 
      icon: MapPin, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      request: requestGeolocation
    },
    { 
      key: 'camera' as const, 
      name: 'Camera', 
      icon: Camera, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      request: requestCamera
    },
  ];

  const getStatusIcon = (status: string) => {
    if (status === 'granted') {
      return <Check className="w-3.5 h-3.5 text-green-500" />;
    }
    if (status === 'denied') {
      return <X className="w-3.5 h-3.5 text-destructive" />;
    }
    return <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground/30" />;
  };

  const getStatusText = (status: string) => {
    if (status === 'granted') return 'Allowed';
    if (status === 'denied') return 'Blocked';
    if (status === 'unavailable') return 'N/A';
    return 'Not set';
  };

  const handleRequestAll = async () => {
    setIsRequesting(true);
    
    for (const perm of permissionItems) {
      const status = permissions[perm.key];
      if (status !== 'granted' && status !== 'unavailable') {
        setCurrentStep(perm.key);
        await perm.request();
        // Small delay between requests for UX
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    setCurrentStep(null);
    setIsRequesting(false);
    await checkAllPermissions();
  };

  const handleRequestSingle = async (perm: typeof permissionItems[0]) => {
    setIsRequesting(true);
    setCurrentStep(perm.key);
    await perm.request();
    setCurrentStep(null);
    setIsRequesting(false);
  };

  const allGranted = permissionItems.every(
    p => permissions[p.key] === 'granted' || permissions[p.key] === 'unavailable'
  );

  const grantedCount = permissionItems.filter(p => permissions[p.key] === 'granted').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary/20">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Reset Permissions</h3>
          <p className="text-xs text-muted-foreground">
            Accidentally denied access? Here's how to fix it.
          </p>
        </div>
      </div>

      {/* Request All Button */}
      <Button
        onClick={handleRequestAll}
        disabled={isRequesting || allGranted}
        className="w-full gap-2"
        size="lg"
      >
        {isRequesting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Requesting {currentStep}...
          </>
        ) : allGranted ? (
          <>
            <Check className="w-4 h-4" />
            All Permissions Granted
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Request All Permissions ({grantedCount}/{permissionItems.length})
          </>
        )}
      </Button>

      {/* Permissions Status Grid */}
      <div className="bg-muted/50 rounded-xl p-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground">PERMISSION STATUS</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkAllPermissions}
            disabled={isChecking}
            className="h-6 text-xs"
          >
            <RefreshCw className={cn("w-3 h-3 mr-1", isChecking && "animate-spin")} />
            Refresh
          </Button>
        </div>
        <div className="space-y-2">
          {permissionItems.map((perm) => {
            const Icon = perm.icon;
            const status = permissions[perm.key];
            const isCurrentStep = currentStep === perm.key;
            
            return (
              <div
                key={perm.key}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg transition-colors",
                  isCurrentStep && "bg-primary/10 ring-1 ring-primary/30"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg", perm.bgColor)}>
                    <Icon className={cn("w-3.5 h-3.5", perm.color)} />
                  </div>
                  <span className="text-sm font-medium">{perm.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isCurrentStep ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  ) : (
                    <>
                      {getStatusIcon(status)}
                      <span className={cn(
                        "text-xs",
                        status === 'granted' && "text-green-500",
                        status === 'denied' && "text-destructive",
                        status !== 'granted' && status !== 'denied' && "text-muted-foreground"
                      )}>
                        {getStatusText(status)}
                      </span>
                    </>
                  )}
                  {status !== 'granted' && status !== 'unavailable' && !isRequesting && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRequestSingle(perm)}
                      className="h-6 px-2 text-xs ml-1"
                    >
                      Allow
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Reset Instructions */}
      <div className="pt-2">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Permission blocked? Follow these steps:
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {/* Chrome Desktop */}
        <AccordionItem value="chrome-desktop">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <Chrome className="w-4 h-4" />
              <Monitor className="w-4 h-4" />
              Chrome (Desktop)
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Click the <strong>lock icon</strong> (🔒) in the address bar</li>
              <li>Select <strong>"Site settings"</strong></li>
              <li>Find the permission you want to reset</li>
              <li>Change from <strong>"Block"</strong> to <strong>"Allow"</strong></li>
              <li><strong>Refresh the page</strong> (Ctrl+R or Cmd+R)</li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        {/* Chrome Mobile */}
        <AccordionItem value="chrome-mobile">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <Chrome className="w-4 h-4" />
              <Smartphone className="w-4 h-4" />
              Chrome (Android)
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Tap the <strong>three dots</strong> (⋮) menu</li>
              <li>Go to <strong>"Settings"</strong> → <strong>"Site settings"</strong></li>
              <li>Tap the permission type</li>
              <li>Find this site and change to <strong>"Allow"</strong></li>
              <li><strong>Refresh the page</strong></li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        {/* Safari iOS */}
        <AccordionItem value="safari-ios">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              <Smartphone className="w-4 h-4" />
              Safari (iPhone/iPad)
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Open <strong>Settings app</strong> on your device</li>
              <li>Scroll down and tap <strong>"Safari"</strong></li>
              <li>Scroll to <strong>"Settings for Websites"</strong></li>
              <li>Tap the permission type</li>
              <li>Change to <strong>"Allow"</strong> or <strong>"Ask"</strong></li>
            </ol>
            <div className="mt-3 p-2 bg-amber-500/10 rounded-lg text-xs text-amber-600 dark:text-amber-400">
              <strong>Note:</strong> Safari has limited notification support.
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Native App */}
        <AccordionItem value="native-app">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              AURA App (Native)
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p className="text-sm font-medium">Android:</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Open <strong>Settings</strong> → <strong>Apps</strong></li>
                <li>Find and tap <strong>"AURA"</strong></li>
                <li>Tap <strong>"Permissions"</strong></li>
                <li>Enable the required permissions</li>
              </ol>
              
              <p className="text-sm font-medium mt-4">iOS:</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Open <strong>Settings</strong> app</li>
                <li>Scroll down and tap <strong>"AURA"</strong></li>
                <li>Toggle on desired permissions</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* HTTPS Notice */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mt-4">
        <p className="text-xs text-amber-600 dark:text-amber-400">
          <strong>⚠️ Important:</strong> Microphone and camera require a secure (HTTPS) connection.
        </p>
      </div>
    </div>
  );
};
