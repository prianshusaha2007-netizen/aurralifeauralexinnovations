import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Flame, Clock, Eye, EyeOff, UserPlus, Check, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FriendStats {
  id: string;
  name: string;
  streak: number;
  weeklyMinutes: number;
  lastActive: string;
}

interface FriendCirclesLeaderboardProps {
  className?: string;
}

export const FriendCirclesLeaderboard: React.FC<FriendCirclesLeaderboardProps> = ({ className }) => {
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [friendStats, setFriendStats] = useState<FriendStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [myStats, setMyStats] = useState<{ streak: number; weeklyMinutes: number } | null>(null);

  // Load sharing preference
  useEffect(() => {
    const loadSharingPreference = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('share_focus_stats, public_profile')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setIsSharing(data.share_focus_stats || data.public_profile || false);
      }
    };
    
    loadSharingPreference();
  }, [user]);

  // Toggle sharing
  const toggleSharing = async () => {
    if (!user) return;
    
    const newValue = !isSharing;
    setIsSharing(newValue);
    
    const { error } = await supabase
      .from('profiles')
      .update({ share_focus_stats: newValue, public_profile: newValue })
      .eq('id', user.id);
    
    if (error) {
      setIsSharing(!newValue);
      toast.error('Failed to update sharing preference');
    } else {
      toast.success(newValue ? 'Your focus stats are now visible to friends' : 'Your focus stats are now private');
    }
  };

  // Load friend stats
  useEffect(() => {
    const loadFriendStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // Get accepted friendships
        const { data: friendships } = await supabase
          .from('friendships')
          .select('user_id, friend_id')
          .eq('status', 'accepted')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
        
        if (!friendships || friendships.length === 0) {
          setFriendStats([]);
          setLoading(false);
          return;
        }
        
        // Get friend IDs
        const friendIds = friendships.map(f => 
          f.user_id === user.id ? f.friend_id : f.user_id
        );
        
        // Get profiles of friends who share stats
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, share_focus_stats, public_profile')
          .in('id', friendIds)
          .or('share_focus_stats.eq.true,public_profile.eq.true');
        
        if (!profiles || profiles.length === 0) {
          setFriendStats([]);
          setLoading(false);
          return;
        }
        
        // Get focus sessions for these friends (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const { data: sessions } = await supabase
          .from('focus_sessions')
          .select('user_id, duration_minutes, completed, created_at')
          .in('user_id', profiles.map(p => p.id))
          .gte('created_at', weekAgo.toISOString());
        
        // Calculate stats for each friend
        const stats: FriendStats[] = profiles.map(profile => {
          const friendSessions = sessions?.filter(s => s.user_id === profile.id) || [];
          
          // Calculate weekly minutes
          const weeklyMinutes = friendSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
          
          // Calculate streak (consecutive days)
          const daySet = new Set<string>();
          friendSessions.forEach(s => {
            const d = new Date(s.created_at);
            daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
          });
          
          let streak = 0;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          let checkDate = new Date(today);
          
          while (true) {
            const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
            if (daySet.has(key)) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
          
          // Last active
          const lastSession = friendSessions.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          
          return {
            id: profile.id,
            name: profile.name,
            streak,
            weeklyMinutes,
            lastActive: lastSession?.created_at || '',
          };
        });
        
        // Sort by streak, then weekly minutes
        stats.sort((a, b) => b.streak - a.streak || b.weeklyMinutes - a.weeklyMinutes);
        
        setFriendStats(stats);
      } catch (error) {
        console.error('Error loading friend stats:', error);
      }
      
      setLoading(false);
    };
    
    loadFriendStats();
  }, [user]);

  // Load my stats
  useEffect(() => {
    const loadMyStats = async () => {
      if (!user) return;
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: sessions } = await supabase
        .from('focus_sessions')
        .select('duration_minutes, created_at')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString());
      
      if (!sessions) {
        setMyStats({ streak: 0, weeklyMinutes: 0 });
        return;
      }
      
      const weeklyMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      
      // Calculate streak
      const daySet = new Set<string>();
      sessions.forEach(s => {
        const d = new Date(s.created_at);
        daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      });
      
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let checkDate = new Date(today);
      
      while (true) {
        const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
        if (daySet.has(key)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      setMyStats({ streak, weeklyMinutes });
    };
    
    loadMyStats();
  }, [user]);

  const getRelativeTime = (dateStr: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  if (!user) {
    return (
      <Card className={cn("bg-card/50 border-border/30", className)}>
        <CardContent className="py-6 text-center">
          <Users className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Sign in to see friend circles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-4", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">Friend Circles</span>
        </div>
      </div>
      
      {/* Opt-in Toggle */}
      <Card className="bg-muted/30 border-border/30">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSharing ? (
                <Eye className="w-4 h-4 text-green-500" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Share my focus stats</p>
                <p className="text-xs text-muted-foreground">Let friends see your streaks</p>
              </div>
            </div>
            <Switch
              checked={isSharing}
              onCheckedChange={toggleSharing}
            />
          </div>
        </CardContent>
      </Card>

      {/* My Stats */}
      {myStats && (
        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Your stats</p>
                <p className="text-sm font-medium">You</p>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="w-3 h-3" />
                    <span className="text-sm font-bold">{myStats.streak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">streak</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-violet-500">
                    <Clock className="w-3 h-3" />
                    <span className="text-sm font-bold">{myStats.weeklyMinutes}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">min/week</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Friends List */}
      {loading ? (
        <Card className="bg-card/50 border-border/30">
          <CardContent className="py-6 text-center">
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground mt-2">Loading friends...</p>
          </CardContent>
        </Card>
      ) : friendStats.length === 0 ? (
        <Card className="bg-card/50 border-border/30">
          <CardContent className="py-6 text-center">
            <UserPlus className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No friends sharing yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Invite friends to see their progress
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">
            {friendStats.length} friend{friendStats.length !== 1 ? 's' : ''} sharing
          </p>
          
          {friendStats.map((friend, index) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card/50 border-border/30 hover:bg-muted/30 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{friend.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getRelativeTime(friend.lastActive)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="flex items-center gap-1 text-orange-500">
                          <Flame className="w-3 h-3" />
                          <span className="text-sm font-bold">{friend.streak}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span className="text-sm">{friend.weeklyMinutes}m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Encouragement */}
      <p className="text-xs text-center text-muted-foreground/70">
        Showing up matters. Keep going! ✨
      </p>
    </motion.div>
  );
};

// Compact version for More menu
export const CompactFriendCircles: React.FC = () => {
  const { user } = useAuth();
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    const loadFriendCount = async () => {
      if (!user) return;
      
      const { count } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
      
      setFriendCount(count || 0);
    };
    
    loadFriendCount();
  }, [user]);

  if (!user || friendCount === 0) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Users className="w-3 h-3 text-blue-500" />
      <span>{friendCount} friend{friendCount !== 1 ? 's' : ''}</span>
    </div>
  );
};
