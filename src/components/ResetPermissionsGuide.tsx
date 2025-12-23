import React from 'react';
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
  Camera
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

export const ResetPermissionsGuide: React.FC = () => {
  const permissions = [
    { name: 'Microphone', icon: Mic, color: 'text-blue-500' },
    { name: 'Notifications', icon: Bell, color: 'text-amber-500' },
    { name: 'Location', icon: MapPin, color: 'text-green-500' },
    { name: 'Camera', icon: Camera, color: 'text-purple-500' },
  ];

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

      {/* Permissions Status */}
      <div className="bg-muted/50 rounded-xl p-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">AURA needs these permissions:</p>
        <div className="flex flex-wrap gap-2">
          {permissions.map((perm) => {
            const Icon = perm.icon;
            return (
              <Badge key={perm.name} variant="secondary" className="flex items-center gap-1.5">
                <Icon className={`w-3 h-3 ${perm.color}`} />
                {perm.name}
              </Badge>
            );
          })}
        </div>
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
              <li>Find the permission you want to reset (Microphone, Notifications, etc.)</li>
              <li>Change from <strong>"Block"</strong> to <strong>"Allow"</strong></li>
              <li><strong>Refresh the page</strong> (Ctrl+R or Cmd+R)</li>
            </ol>
            <div className="mt-3 p-2 bg-primary/10 rounded-lg text-xs">
              <RefreshCw className="w-3 h-3 inline mr-1" />
              <strong>Tip:</strong> You may need to refresh the page for changes to take effect.
            </div>
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
              <li>Tap <strong>"Microphone"</strong> or <strong>"Notifications"</strong></li>
              <li>Find this site and change to <strong>"Allow"</strong></li>
              <li><strong>Refresh the page</strong></li>
            </ol>
            <div className="mt-3 p-2 bg-primary/10 rounded-lg text-xs">
              <strong>Alternative:</strong> Long-press the lock icon in the address bar for quick access.
            </div>
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
              <li>Tap <strong>"Microphone"</strong> or <strong>"Camera"</strong></li>
              <li>Change to <strong>"Allow"</strong> or <strong>"Ask"</strong></li>
            </ol>
            <div className="mt-3 p-2 bg-amber-500/10 rounded-lg text-xs text-amber-600 dark:text-amber-400">
              <strong>Note:</strong> Safari has limited notification support. Consider using Chrome for the best experience.
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Native App (Capacitor) */}
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
                <li>Enable <strong>Microphone</strong>, <strong>Camera</strong>, etc.</li>
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

        {/* Firefox */}
        <AccordionItem value="firefox">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Firefox
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Click the <strong>lock icon</strong> in the address bar</li>
              <li>Click <strong>"Clear Cookies and Site Data..."</strong></li>
              <li>Or click <strong>"More Information"</strong> → <strong>"Permissions"</strong></li>
              <li>Find the permission and click <strong>"Remove"</strong> or change to <strong>"Allow"</strong></li>
              <li><strong>Refresh the page</strong></li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* HTTPS Notice */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mt-4">
        <p className="text-xs text-amber-600 dark:text-amber-400">
          <strong>⚠️ Important:</strong> Microphone and camera require a secure (HTTPS) connection. 
          If you're on an insecure connection (HTTP), permissions won't work.
        </p>
      </div>
    </div>
  );
};
