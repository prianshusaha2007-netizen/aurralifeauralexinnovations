import React, { useState, useEffect } from 'react';
import { Shield, HardDrive, Users, Mic, AppWindow, Activity, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const permissions: Permission[] = [
  {
    id: 'storage',
    name: 'Storage Access',
    description: 'Access files, photos, and media on your device',
    icon: HardDrive,
  },
  {
    id: 'contacts',
    name: 'Contacts Access',
    description: 'Read and sync contacts for personalized assistance',
    icon: Users,
  },
  {
    id: 'microphone',
    name: 'Microphone Access',
    description: 'Enable voice commands and voice chat',
    icon: Mic,
  },
  {
    id: 'appAccess',
    name: 'App Access',
    description: 'Launch and interact with other apps on your device',
    icon: AppWindow,
  },
  {
    id: 'backgroundActivity',
    name: 'Background Activity',
    description: 'Run in background for reminders and notifications',
    icon: Activity,
  },
];

export const PermissionsScreen: React.FC = () => {
  const { toast } = useToast();
  const [permissionStates, setPermissionStates] = useState<Record<string, boolean>>({
    storage: false,
    contacts: false,
    microphone: false,
    appAccess: false,
    backgroundActivity: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('aura_permissions');
    if (saved) {
      setPermissionStates(JSON.parse(saved));
    }
  }, []);

  const handleToggle = (id: string, checked: boolean) => {
    const newStates = { ...permissionStates, [id]: checked };
    setPermissionStates(newStates);
    localStorage.setItem('aura_permissions', JSON.stringify(newStates));

    const permission = permissions.find(p => p.id === id);
    
    if (checked) {
      toast({
        title: `${permission?.name} Enabled`,
        description: "AURA now has enhanced functionality on your device.",
      });
    } else {
      toast({
        title: `${permission?.name} Disabled`,
        description: "Some features may be limited.",
      });
    }
  };

  const enabledCount = Object.values(permissionStates).filter(Boolean).length;
  const allEnabled = enabledCount === permissions.length;

  const enableAll = () => {
    const allOn = permissions.reduce((acc, p) => ({ ...acc, [p.id]: true }), {});
    setPermissionStates(allOn);
    localStorage.setItem('aura_permissions', JSON.stringify(allOn));
    toast({
      title: "All Permissions Granted",
      description: "AURA now has full functionality on your device.",
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="p-4 pt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 mb-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Permissions</span>
        </div>
        <h1 className="text-2xl font-bold">Android Permissions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Grant permissions for full AURA experience
        </p>
      </div>

      {/* Status Card */}
      <div className="px-4 mb-4">
        <Card className={`border-2 transition-colors ${allEnabled ? 'border-green-500/50 bg-green-500/10' : 'border-muted'}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${allEnabled ? 'bg-green-500/20' : 'bg-muted'}`}>
                <CheckCircle2 className={`w-5 h-5 ${allEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-semibold">{enabledCount} of {permissions.length} enabled</p>
                <p className="text-xs text-muted-foreground">
                  {allEnabled ? 'Full functionality active' : 'Enable all for best experience'}
                </p>
              </div>
            </div>
            {!allEnabled && (
              <button
                onClick={enableAll}
                className="text-sm font-medium text-primary hover:underline"
              >
                Enable All
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permissions List */}
      <div className="px-4 space-y-3">
        {permissions.map((permission) => {
          const Icon = permission.icon;
          const isEnabled = permissionStates[permission.id];
          
          return (
            <Card 
              key={permission.id}
              className={`transition-all ${isEnabled ? 'border-primary/30 bg-primary/5' : 'border-muted'}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    isEnabled ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Icon className={`w-6 h-6 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{permission.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {permission.description}
                    </p>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggle(permission.id, checked)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="px-4 mt-6">
        <div className="p-4 rounded-xl bg-muted/50 border border-muted">
          <p className="text-xs text-muted-foreground text-center">
            <span className="font-medium">Note:</span> This is a simulation for prototype purposes. 
            No actual device permissions are being requested.
          </p>
        </div>
      </div>
    </div>
  );
};
