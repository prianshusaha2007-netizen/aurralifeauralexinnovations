import { Bell, BellOff, CheckCircle2, Smartphone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { usePWAPush } from '@/hooks/usePWAPush';
import { motion } from 'framer-motion';

interface PWAPushSettingsProps {
  className?: string;
}

export const PWAPushSettings = ({ className }: PWAPushSettingsProps) => {
  const {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    showLocalNotification,
  } = usePWAPush();

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleTestNotification = () => {
    showLocalNotification(
      '✨ AURA Test',
      'Push notifications are working perfectly! You\'ll receive reminders and updates here.',
      { tag: 'test-notification' }
    );
  };

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser. Try using Chrome, Firefox, or Edge.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get reminders, habit nudges, and updates even when AURA isn't open
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission === 'denied' ? (
            <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Notifications Blocked</p>
                <p className="text-xs text-muted-foreground">
                  You've blocked notifications. To enable them:
                </p>
                <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1 mt-2">
                  <li>Click the lock icon in your browser's address bar</li>
                  <li>Find "Notifications" in the permissions</li>
                  <li>Change it from "Block" to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Enable Push Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Receive notifications on this device
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={handleToggle}
                />
              </div>

              {isSubscribed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Push notifications are active
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestNotification}
                    className="w-full"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Send Test Notification
                  </Button>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      You'll receive:
                    </p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                      <li>• Habit and routine reminders</li>
                      <li>• Hydration nudges</li>
                      <li>• Daily check-in prompts</li>
                      <li>• Focus session alerts</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
