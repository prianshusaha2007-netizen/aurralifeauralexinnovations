import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  target_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Participation {
  id: string;
  challenge_id: string;
  current_progress: number;
  completed: boolean;
  last_progress_date: string | null;
  joined_at: string;
}

export const useCommunityChallenge = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('community_challenges')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  }, []);

  const fetchParticipations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setParticipations(data || []);
    } catch (error) {
      console.error('Error fetching participations:', error);
    }
  }, [user]);

  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          current_progress: 0,
        });

      if (error) throw error;
      await fetchParticipations();
      return true;
    } catch (error) {
      console.error('Error joining challenge:', error);
      return false;
    }
  }, [user, fetchParticipations]);

  const updateProgress = useCallback(async (challengeId: string, increment: number = 1) => {
    if (!user) return;

    const participation = participations.find(p => p.challenge_id === challengeId);
    if (!participation) return;

    const challenge = challenges.find(c => c.id === challengeId);
    const newProgress = participation.current_progress + increment;
    const completed = challenge ? newProgress >= challenge.target_value : false;

    try {
      const { error } = await supabase
        .from('challenge_participants')
        .update({
          current_progress: newProgress,
          completed,
          last_progress_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', participation.id);

      if (error) throw error;
      await fetchParticipations();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [user, participations, challenges, fetchParticipations]);

  const getParticipation = useCallback((challengeId: string) => {
    return participations.find(p => p.challenge_id === challengeId);
  }, [participations]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchChallenges();
      if (user) await fetchParticipations();
      setLoading(false);
    };
    load();
  }, [fetchChallenges, fetchParticipations, user]);

  return {
    challenges,
    participations,
    loading,
    joinChallenge,
    updateProgress,
    getParticipation,
    refetch: () => Promise.all([fetchChallenges(), fetchParticipations()]),
  };
};
