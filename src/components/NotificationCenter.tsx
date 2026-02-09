import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Clock, Droplets, Calendar, Sparkles, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useUnifiedNotifications, AppNotification } from '@/hooks/useUnifiedNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const getNotificationIcon = (type: AppNotification['type']) => {
  switch (type) {
    case 'reminder':
      return <Clock className="h-4 w-4 text-primary" />;
    case 'habit':
      return <Check className="h-4 w-4 text-primary" />;
    case 'hydration':
      return <Droplets className="h-4 w-4 text-primary" />;
    case 'routine':
      return <Calendar className="h-4 w-4 text-primary" />;
    case 'morning':
      return <Sparkles className="h-4 w-4 text-primary" />;
    case 'push':
      return <Megaphone className="h-4 w-4 text-destructive" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkRead }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "p-3 rounded-lg border transition-colors",
        notification.read
          ? "bg-muted/30 border-transparent"
          : "bg-card border-border shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "text-sm font-medium truncate",
              notification.read && "text-muted-foreground"
            )}>
              {notification.title}
            </h4>
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.body}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => onMarkRead(notification.id)}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    permission,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useUnifiedNotifications();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge
                  variant="destructive"
                  className="h-5 min-w-5 px-1.5 text-[10px] font-bold"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </SheetTitle>
            {notifications.length > 0 && (
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
            )}
          </div>
        </SheetHeader>

        {permission !== 'granted' && (
          <div className="mx-4 mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Enable notifications to stay updated
            </p>
            <Button size="sm" onClick={requestPermission}>
              Enable Notifications
            </Button>
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-4 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  You'll see reminders, updates, and more here
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="w-full text-muted-foreground"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all notifications
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;
