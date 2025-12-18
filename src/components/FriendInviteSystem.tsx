import React, { useState, useEffect } from 'react';
import { UserPlus, Copy, Check, Users, Link2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Friend {
  id: string;
  name: string;
  status: string;
}

export const FriendInviteSystem: React.FC = () => {
  const { user } = useAuth();
  const [myCode, setMyCode] = useState<string | null>(null);
  const [friendCode, setFriendCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrCreateCode();
      fetchFriends();
    }
  }, [user]);

  const fetchOrCreateCode = async () => {
    try {
      const { data: existing } = await supabase
        .from('friend_codes')
        .select('code')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existing?.code) {
        setMyCode(existing.code);
      } else {
        // Generate new code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars[Math.floor(Math.random() * chars.length)];
        }
        
        const { error } = await supabase
          .from('friend_codes')
          .insert({ user_id: user?.id, code });
        
        if (!error) setMyCode(code);
      }
    } catch (error) {
      console.error('Error with friend code:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id, status')
        .eq('user_id', user?.id);

      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map(f => f.friend_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', friendIds);

        if (profiles) {
          setFriends(profiles.map(p => ({
            id: p.id,
            name: p.name,
            status: friendships.find(f => f.friend_id === p.id)?.status || 'pending'
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const copyCode = async () => {
    if (myCode) {
      await navigator.clipboard.writeText(myCode);
      setCopied(true);
      toast.success('Code copied! Share with friends 🎉');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const redeemCode = async () => {
    if (!friendCode.trim()) return;
    setIsLoading(true);

    try {
      // Find the code
      const { data: codeData, error: codeError } = await supabase
        .from('friend_codes')
        .select('user_id')
        .eq('code', friendCode.toUpperCase().trim())
        .maybeSingle();

      if (codeError || !codeData) {
        toast.error('Invalid code. Check and try again!');
        return;
      }

      if (codeData.user_id === user?.id) {
        toast.error("That's your own code, silly! 😄");
        return;
      }

      // Check if already friends
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('id')
        .eq('user_id', user?.id)
        .eq('friend_id', codeData.user_id)
        .maybeSingle();

      if (existingFriendship) {
        toast.info('Already friends with this person! 👫');
        return;
      }

      // Create friendship (both ways)
      await supabase.from('friendships').insert([
        { user_id: user?.id, friend_id: codeData.user_id, status: 'active' },
        { user_id: codeData.user_id, friend_id: user?.id, status: 'active' }
      ]);

      toast.success('Friend added! Time to compete! 🔥');
      setFriendCode('');
      fetchFriends();
    } catch (error) {
      toast.error('Something went wrong. Try again!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Friends
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Friend Invite System
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* My Code Section */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Your Invite Code</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background rounded-lg px-4 py-3 font-mono text-lg tracking-widest text-center border">
                {myCode || '--------'}
              </div>
              <Button
                variant="secondary"
                size="icon"
                onClick={copyCode}
                disabled={!myCode}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Share this code with friends to connect!
            </p>
          </Card>

          {/* Redeem Code Section */}
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Enter Friend's Code</p>
            <div className="flex gap-2">
              <Input
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                className="font-mono tracking-wider"
                maxLength={8}
              />
              <Button onClick={redeemCode} disabled={isLoading || !friendCode.trim()}>
                <Link2 className="w-4 h-4 mr-1" />
                Connect
              </Button>
            </div>
          </Card>

          {/* Friends List */}
          {friends.length > 0 && (
            <Card className="p-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Your Friends ({friends.length})
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">{friend.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      friend.status === 'active' ? 'bg-green-500/20 text-green-600' : 'bg-yellow-500/20 text-yellow-600'
                    }`}>
                      {friend.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
