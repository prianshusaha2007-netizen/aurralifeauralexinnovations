import React from 'react';
import { Shield, Mic, Camera, Bell, MapPin, HardDrive, CheckCircle2, XCircle, Loader2, Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMobilePermissions, PermissionStatus } from '@/hooks/useMobilePermissions';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';

interface Permission {
  id: keyof PermissionStatus;
  name: string;
  description: string;
  icon: React.ElementType;
  requestFn: () => Promise<boolean>;
}

export const PermissionsScreen: React.FC = () => {
  const {
    permissions,
    isChecking,
    requestMicrophone,
    requestCamera,
    requestNotifications,
    requestGeolocation,
    requestAllPermissions,
  } = useMobilePermissions();

  const permissionsList: Permission[] = [
    {
      id: 'microphone',
      name: 'Microphone',
      description: 'Voice commands and voice chat',
      icon: Mic,
      requestFn: requestMicrophone,
    },
    {
      id: 'camera',
      name: 'Camera',
      description: 'Image capture and analysis',
      icon: Camera,
      requestFn: requestCamera,
    },
    {
      id: 'notifications',
      name: 'Notifications',
      description: 'Reminders, alarms, and updates',
      icon: Bell,
      requestFn: requestNotifications,
    },
    {
      id: 'geolocation',
      name: 'Location',
      description: 'Weather and location-based features',
      icon: MapPin,
      requestFn: requestGeolocation,
    },
    {
      id: 'storage',
      name: 'Storage',
      description: 'Save images and data locally',
      icon: HardDrive,
      requestFn: async () => true,
    },
  ];

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  const getStatusIcon = (status: string) => {
    if (status === 'granted') {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    } else if (status === 'denied') {
      return <XCircle className="w-5 h-5 text-destructive" />;
    }
    return null;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'granted': return 'Enabled';
      case 'denied': return 'Denied';
      case 'prompt': return 'Not requested';
      case 'default': return 'Not requested';
      case 'unavailable': return 'Not available';
      default: return 'Unknown';
    }
  };

  const enabledCount = Object.values(permissions).filter(p => p === 'granted').length;
  const totalCount = permissionsList.length;
  const allEnabled = enabledCount === totalCount;

  if (isChecking) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-8">
      {/* Header */}
      <div className="p-4 pt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 mb-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Permissions</span>
        </div>
        <h1 className="text-2xl font-bold">App Permissions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Grant permissions for the best AURA experience
        </p>
        
        {/* Platform Badge */}
        <div className={cn(
          'inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-medium',
          isNative ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
        )}>
          <Smartphone className="w-3 h-3" />
          {isNative ? `Native ${platform === 'ios' ? 'iOS' : 'Android'} App` : 'Web Browser'}
        </div>
      </div>

      {/* Status Card */}
      <div className="px-4 mb-4">
        <Card className={cn(
          'border-2 transition-colors',
          allEnabled ? 'border-green-500/50 bg-green-500/10' : 'border-muted'
        )}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                allEnabled ? 'bg-green-500/20' : 'bg-muted'
              )}>
                <CheckCircle2 className={cn(
                  'w-5 h-5',
                  allEnabled ? 'text-green-500' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <p className="font-semibold">{enabledCount} of {totalCount} enabled</p>
                <p className="text-xs text-muted-foreground">
                  {allEnabled ? 'Full functionality active' : 'Enable all for best experience'}
                </p>
              </div>
            </div>
            {!allEnabled && (
              <Button size="sm" onClick={requestAllPermissions}>
                Enable All
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permissions List */}
      <div className="px-4 space-y-3">
        {permissionsList.map((permission) => {
          const Icon = permission.icon;
          const status = permissions[permission.id];
          const isEnabled = status === 'granted';
          const isDenied = status === 'denied';
          
          return (
            <Card 
              key={permission.id}
              className={cn(
                'transition-all',
                isEnabled && 'border-green-500/30 bg-green-500/5',
                isDenied && 'border-destructive/30 bg-destructive/5'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                    isEnabled ? 'bg-green-500/20' : isDenied ? 'bg-destructive/20' : 'bg-muted'
                  )}>
                    <Icon className={cn(
                      'w-6 h-6',
                      isEnabled ? 'text-green-500' : isDenied ? 'text-destructive' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{permission.name}</h3>
                      {getStatusIcon(status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {permission.description}
                    </p>
                    <p className={cn(
                      'text-xs mt-1',
                      isEnabled ? 'text-green-500' : isDenied ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {getStatusText(status)}
                    </p>
                  </div>
                  {!isEnabled && permission.id !== 'storage' && (
                    <Button 
                      size="sm" 
                      variant={isDenied ? "destructive" : "default"}
                      onClick={permission.requestFn}
                    >
                      {isDenied ? 'Retry' : 'Enable'}
                    </Button>
                  )}
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
            <span className="font-medium">Note:</span> Some permissions may require browser settings changes if previously denied.
            For mobile apps, install the PWA for full native-like permissions.
          </p>
        </div>
      </div>
    </div>
  );
};
