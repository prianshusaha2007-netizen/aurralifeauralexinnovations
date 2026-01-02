import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Calendar, Users, Check, Sparkles } from 'lucide-react';
import { useCommunityChallenge } from '@/hooks/useCommunityChallenge';
import { format, differenceInDays, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const challengeIcons: Record<string, React.ElementType> = {
  focus_days: Calendar,
  focus_sessions: Trophy,
  morning_sessions: Sparkles,
};

export const CommunityChallenges = () => {
  const { challenges, loading, joinChallenge, getParticipation } = useCommunityChallenge();
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const handleJoin = async (challengeId: string) => {
    setJoiningId(challengeId);
    await joinChallenge(challengeId);
    setJoiningId(null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-5 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Trophy className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No active challenges right now</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Check back soon!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Community Challenges</h3>
      </div>
      
      <AnimatePresence mode="popLayout">
        {challenges.map((challenge, index) => {
          const participation = getParticipation(challenge.id);
          const isJoined = !!participation;
          const progress = participation?.current_progress || 0;
          const progressPercent = Math.min((progress / challenge.target_value) * 100, 100);
          const daysLeft = differenceInDays(parseISO(challenge.end_date), new Date());
          const Icon = challengeIcons[challenge.challenge_type] || Trophy;

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "p-4 transition-all",
                participation?.completed && "border-green-500/50 bg-green-500/5"
              )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn(
                      "p-2.5 rounded-xl",
                      participation?.completed 
                        ? "bg-green-500/20 text-green-400"
                        : "bg-primary/10 text-primary"
                    )}>
                      {participation?.completed ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{challenge.title}</h4>
                        {participation?.completed && (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">
                            Completed!
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {challenge.description}
                      </p>
                      
                      {isJoined && !participation?.completed && (
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{progress}/{challenge.target_value}</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant="secondary" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Ends today'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {!isJoined && (
                    <Button
                      size="sm"
                      onClick={() => handleJoin(challenge.id)}
                      disabled={joiningId === challenge.id}
                      className="shrink-0"
                    >
                      {joiningId === challenge.id ? 'Joining...' : 'Join'}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      <p className="text-xs text-center text-muted-foreground pt-2">
        Join if it feels right. No pressure. ✨
      </p>
    </div>
  );
};
