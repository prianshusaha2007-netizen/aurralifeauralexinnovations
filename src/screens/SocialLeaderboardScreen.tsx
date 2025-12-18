import React, { useState, useEffect } from 'react';
import { Trophy, Users, Flame, Target, TrendingUp, Medal, Crown, Star, Zap, Heart, Share2, Plus, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAura } from '@/contexts/AuraContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StreakCard } from '@/components/StreakCard';
import { FriendInviteSystem } from '@/components/FriendInviteSystem';
import { AchievementBadges } from '@/components/AchievementBadges';

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  badge?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  participants: number;
  daysLeft: number;
  progress: number;
  reward: string;
  joined: boolean;
}

interface UserStats {
  habitStreak: number;
  hydrationStreak: number;
  moodLogs: number;
  habitsCompleted: number;
  totalPoints: number;
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Priya S.', avatar: 'PS', score: 2850, streak: 45, badge: '👑' },
  { rank: 2, name: 'Rahul K.', avatar: 'RK', score: 2720, streak: 38, badge: '🥈' },
  { rank: 3, name: 'Ananya M.', avatar: 'AM', score: 2680, streak: 32, badge: '🥉' },
  { rank: 4, name: 'Vikram P.', avatar: 'VP', score: 2450, streak: 28 },
  { rank: 5, name: 'Neha G.', avatar: 'NG', score: 2320, streak: 25 },
  { rank: 6, name: 'Arjun D.', avatar: 'AD', score: 2180, streak: 22 },
  { rank: 7, name: 'Kavya R.', avatar: 'KR', score: 2050, streak: 19 },
];

const mockChallenges: Challenge[] = [
  {
    id: '1',
    title: '30-Day Hydration Challenge',
    description: 'Drink 2L water daily for 30 days',
    participants: 1234,
    daysLeft: 18,
    progress: 40,
    reward: '🏆 Hydration Champion Badge',
    joined: true
  },
  {
    id: '2',
    title: 'Morning Routine Master',
    description: 'Complete morning routine 7 days in a row',
    participants: 856,
    daysLeft: 5,
    progress: 71,
    reward: '⭐ Early Bird Badge',
    joined: true
  },
  {
    id: '3',
    title: 'Mood Tracker Pro',
    description: 'Log mood check-ins for 14 consecutive days',
    participants: 2341,
    daysLeft: 12,
    progress: 0,
    reward: '💫 Self-Aware Badge',
    joined: false
  },
  {
    id: '4',
    title: 'Study Sprint Week',
    description: 'Complete 20 study sessions this week',
    participants: 567,
    daysLeft: 4,
    progress: 0,
    reward: '📚 Knowledge Seeker Badge',
    joined: false
  },
];

export const SocialLeaderboardScreen: React.FC = () => {
  const { userProfile } = useAura();
  const { user } = useAuth();
  const [challenges, setChallenges] = useState(mockChallenges);
  const [isStreakCardOpen, setIsStreakCardOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    habitStreak: 0,
    hydrationStreak: 0,
    moodLogs: 0,
    habitsCompleted: 0,
    totalPoints: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);

      const [habitsRes, hydrationRes, moodRes] = await Promise.all([
        supabase.from('habit_completions').select('*').eq('user_id', user?.id).gte('completed_at', weekStart.toISOString().split('T')[0]),
        supabase.from('hydration_logs').select('*').eq('user_id', user?.id).gte('created_at', weekStart.toISOString()),
        supabase.from('mood_checkins').select('*').eq('user_id', user?.id).gte('created_at', weekStart.toISOString()),
      ]);

      const habits = habitsRes.data || [];
      const hydration = hydrationRes.data || [];
      const moods = moodRes.data || [];

      // Calculate streaks
      const habitStreak = calculateStreak(habits.map(h => h.completed_at));
      const hydrationStreak = calculateHydrationStreak(hydration);
      
      // Calculate points
      const totalPoints = (habits.length * 10) + (hydration.length * 5) + (moods.length * 15);

      setUserStats({
        habitStreak,
        hydrationStreak,
        moodLogs: moods.length,
        habitsCompleted: habits.length,
        totalPoints: Math.max(totalPoints, 100), // Minimum base points
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStreak = (dates: string[]): number => {
    if (dates.length === 0) return 0;
    const uniqueDates = [...new Set(dates.map(d => d.split('T')[0]))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expected = expectedDate.toISOString().split('T')[0];
      
      if (uniqueDates.includes(expected)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const calculateHydrationStreak = (logs: any[]): number => {
    const uniqueDates = [...new Set(logs.map(l => l.created_at.split('T')[0]))];
    return calculateStreak(uniqueDates);
  };

  const userRank = 12;
  const userScore = userStats.totalPoints;

  const joinChallenge = (challengeId: string) => {
    setChallenges(prev => 
      prev.map(c => c.id === challengeId ? { ...c, joined: true, progress: 0 } : c)
    );
    toast.success("Challenge joined! Let's crush it! 💪");
  };

  const shareStreak = () => {
    setIsStreakCardOpen(true);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-4">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Social & Leaderboards</span>
          </div>
          <h1 className="text-2xl font-bold">Compete & Grow Together</h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and compete with friends
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <FriendInviteSystem />
            <AchievementBadges />
          </div>
        </div>

        {/* Your Stats Card */}
        <Card className="p-4 aura-gradient text-primary-foreground">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-primary-foreground/30">
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                  {userProfile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold">{userProfile.name}</p>
                <p className="text-sm opacity-80">Rank #{userRank}</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
              onClick={shareStreak}
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-2 rounded-xl bg-primary-foreground/10">
              <Zap className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{userScore}</p>
              <p className="text-xs opacity-80">Points</p>
            </div>
            <div className="p-2 rounded-xl bg-primary-foreground/10">
              <Flame className="w-5 h-5 mx-auto mb-1 text-orange-300" />
              <p className="text-xl font-bold">{userStats.habitStreak}</p>
              <p className="text-xs opacity-80">Day Streak</p>
            </div>
            <div className="p-2 rounded-xl bg-primary-foreground/10">
              <Droplets className="w-5 h-5 mx-auto mb-1 text-cyan-300" />
              <p className="text-xl font-bold">{userStats.hydrationStreak}</p>
              <p className="text-xs opacity-80">Hydration</p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="leaderboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leaderboard">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="challenges">
              <Target className="w-4 h-4 mr-2" />
              Challenges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-3">
            {/* Top 3 Highlight */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {mockLeaderboard.slice(0, 3).map((entry, idx) => (
                <Card 
                  key={entry.rank} 
                  className={`p-3 text-center ${idx === 0 ? 'ring-2 ring-yellow-500/50 bg-yellow-500/5' : ''}`}
                >
                  <div className="text-2xl mb-1">{entry.badge}</div>
                  <Avatar className="w-10 h-10 mx-auto mb-2">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {entry.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-sm truncate">{entry.name}</p>
                  <p className={`text-xs font-bold ${getRankColor(entry.rank)}`}>
                    {entry.score} pts
                  </p>
                </Card>
              ))}
            </div>

            {/* Full Leaderboard */}
            <div className="space-y-2">
              {mockLeaderboard.map((entry) => (
                <Card key={entry.rank} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-center">
                      {getRankIcon(entry.rank) || (
                        <span className={`font-bold ${getRankColor(entry.rank)}`}>
                          #{entry.rank}
                        </span>
                      )}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {entry.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{entry.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {entry.streak} days
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{entry.score}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Your Position */}
            <Card className="p-3 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-8 text-center">
                  <span className="font-bold text-primary">#{userRank}</span>
                </div>
                <Avatar className="w-10 h-10 ring-2 ring-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userProfile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{userProfile.name} (You)</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {userStats.habitStreak} days
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-cyan-500" />
                      {userStats.hydrationStreak} days
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{userScore}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-3">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{challenge.title}</h3>
                      {challenge.joined && (
                        <Badge variant="secondary" className="text-xs">Joined</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {challenge.participants.toLocaleString()} joined
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {challenge.daysLeft} days left
                  </span>
                </div>

                {challenge.joined ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{challenge.progress}%</span>
                    </div>
                    <Progress value={challenge.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Reward: {challenge.reward}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Reward: {challenge.reward}
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => joinChallenge(challenge.id)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Join
                    </Button>
                  </div>
                )}
              </Card>
            ))}

            {/* Weekly Stats */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                This Week's Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted text-center">
                  <Heart className="w-5 h-5 mx-auto mb-1 text-pink-500" />
                  <p className="text-xl font-bold">{userStats.moodLogs}</p>
                  <p className="text-xs text-muted-foreground">Mood Logs</p>
                </div>
                <div className="p-3 rounded-xl bg-muted text-center">
                  <Star className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-xl font-bold">{userStats.habitsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Habits Done</p>
                </div>
                <div className="p-3 rounded-xl bg-muted text-center">
                  <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                  <p className="text-xl font-bold">{userStats.habitStreak}</p>
                  <p className="text-xs text-muted-foreground">Habit Streak</p>
                </div>
                <div className="p-3 rounded-xl bg-muted text-center">
                  <Droplets className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
                  <p className="text-xl font-bold">{userStats.hydrationStreak}</p>
                  <p className="text-xs text-muted-foreground">Hydration Streak</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Streak Card Modal */}
        <StreakCard
          userName={userProfile.name || 'Friend'}
          streak={userStats.habitStreak}
          score={userScore}
          rank={userRank}
          habitsCompleted={userStats.habitsCompleted}
          moodLogs={userStats.moodLogs}
          isOpen={isStreakCardOpen}
          onClose={() => setIsStreakCardOpen(false)}
        />
      </div>
    </div>
  );
};
