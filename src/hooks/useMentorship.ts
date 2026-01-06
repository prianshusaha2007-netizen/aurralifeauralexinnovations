import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface MentorshipProfile {
  id?: string;
  user_id?: string;
  role_types: string[];
  mentorship_style: 'teacher' | 'mentor' | 'coach' | 'calm_companion';
  subjects: string[];
  practices: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  injuries_notes?: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_during_work: boolean;
  only_if_user_messages_first: boolean;
  follow_up_enabled: boolean;
  last_checkin_time?: string;
}

const defaultProfile: MentorshipProfile = {
  role_types: [],
  mentorship_style: 'mentor',
  subjects: [],
  practices: [],
  level: 'beginner',
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  quiet_during_work: false,
  only_if_user_messages_first: false,
  follow_up_enabled: true,
};

export const useMentorship = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MentorshipProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedSetup, setHasCompletedSetup] = useState(false);

  // Load mentorship profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('mentorship_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile({
            id: data.id,
            user_id: data.user_id,
            role_types: data.role_types || [],
            mentorship_style: data.mentorship_style as MentorshipProfile['mentorship_style'],
            subjects: data.subjects || [],
            practices: data.practices || [],
            level: data.level as MentorshipProfile['level'],
            injuries_notes: data.injuries_notes || undefined,
            quiet_hours_enabled: data.quiet_hours_enabled,
            quiet_hours_start: data.quiet_hours_start,
            quiet_hours_end: data.quiet_hours_end,
            quiet_during_work: data.quiet_during_work,
            only_if_user_messages_first: data.only_if_user_messages_first,
            follow_up_enabled: data.follow_up_enabled,
            last_checkin_time: data.last_checkin_time || undefined,
          });
          setHasCompletedSetup(true);
        } else {
          // Check localStorage for setup completion
          const setupComplete = localStorage.getItem('mentorship-setup-complete');
          setHasCompletedSetup(!!setupComplete);
        }
      } catch (error) {
        console.error('Error loading mentorship profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Save mentorship profile
  const saveProfile = useCallback(async (newProfile: Partial<MentorshipProfile>) => {
    if (!user) return false;

    const updatedProfile = { ...profile, ...newProfile };
    setProfile(updatedProfile);

    try {
      const { error } = await supabase
        .from('mentorship_profiles')
        .upsert({
          user_id: user.id,
          role_types: updatedProfile.role_types,
          mentorship_style: updatedProfile.mentorship_style,
          subjects: updatedProfile.subjects,
          practices: updatedProfile.practices,
          level: updatedProfile.level,
          injuries_notes: updatedProfile.injuries_notes || null,
          quiet_hours_enabled: updatedProfile.quiet_hours_enabled,
          quiet_hours_start: updatedProfile.quiet_hours_start,
          quiet_hours_end: updatedProfile.quiet_hours_end,
          quiet_during_work: updatedProfile.quiet_during_work,
          only_if_user_messages_first: updatedProfile.only_if_user_messages_first,
          follow_up_enabled: updatedProfile.follow_up_enabled,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      localStorage.setItem('mentorship-setup-complete', 'true');
      setHasCompletedSetup(true);
      return true;
    } catch (error) {
      console.error('Error saving mentorship profile:', error);
      toast.error('Could not save mentorship settings');
      return false;
    }
  }, [user, profile]);

  // Check if currently in quiet hours
  const isInQuietHours = useCallback((): boolean => {
    if (!profile.quiet_hours_enabled && !profile.only_if_user_messages_first) {
      return false;
    }

    if (profile.only_if_user_messages_first) {
      return true;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const start = profile.quiet_hours_start;
    const end = profile.quiet_hours_end;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }
    
    return currentTime >= start && currentTime < end;
  }, [profile]);

  // Check if follow-up is appropriate
  const shouldSendFollowUp = useCallback((): boolean => {
    if (!profile.follow_up_enabled) return false;
    if (isInQuietHours()) return false;

    if (profile.last_checkin_time) {
      const lastCheckin = new Date(profile.last_checkin_time);
      const now = new Date();
      const hoursSinceLastCheckin = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);
      
      // Only send follow-up if at least 1 hour has passed
      return hoursSinceLastCheckin >= 1;
    }

    return true;
  }, [profile, isInQuietHours]);

  // Update last check-in time
  const updateLastCheckin = useCallback(async () => {
    if (!user) return;

    const now = new Date().toISOString();
    setProfile(prev => ({ ...prev, last_checkin_time: now }));

    try {
      await supabase
        .from('mentorship_profiles')
        .update({ last_checkin_time: now })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error updating last checkin:', error);
    }
  }, [user]);

  // Get mentorship context for AI
  const getMentorshipContext = useCallback((): string => {
    if (!hasCompletedSetup) return '';

    const roleDescriptions: Record<string, string> = {
      student: 'academic subjects and exam preparation',
      parent: "their child's learning and routines",
      trainer: 'fitness, yoga, or martial arts',
      learner: 'skills like coding, design, or music',
    };

    const styleDescriptions: Record<string, string> = {
      teacher: 'explains concepts directly and clearly',
      mentor: 'guides and motivates with encouragement',
      coach: 'keeps consistency with gentle accountability',
      calm_companion: 'low pressure, just present and supportive',
    };

    const roles = profile.role_types.map(r => roleDescriptions[r] || r).join(', ');
    const style = styleDescriptions[profile.mentorship_style] || profile.mentorship_style;

    let context = `
====================================
🧑‍🏫 MENTORSHIP MODE (ACTIVE)
====================================
USER WANTS HELP WITH: ${roles || 'general guidance'}
MENTORSHIP STYLE: ${style}
LEVEL: ${profile.level}
${profile.subjects.length > 0 ? `STUDY SUBJECTS: ${profile.subjects.join(', ')}` : ''}
${profile.practices.length > 0 ? `PRACTICES: ${profile.practices.join(', ')}` : ''}
${profile.injuries_notes ? `⚠️ INJURIES/NOTES: ${profile.injuries_notes}` : ''}

MENTORSHIP BEHAVIOR RULES:
1. AURRA is a personal mentor that STAYS with the user over time
2. Teach and guide WITHOUT:
   - Spamming messages
   - Forcing routines
   - Sounding robotic
3. In TEACHER mode: Explain topics DIRECTLY (no question loops)
   ❌ NOT: "What part do you want to focus on?"
   ✅ INSTEAD: "Here's how this works — I'll keep it clear."
4. In COACH mode: Safety-first, encouraging, no guilt language
5. In MENTOR mode: Guide + motivate, acknowledge progress
6. In CALM COMPANION mode: Be present, minimal advice, emotional safety

FOLLOW-UP RULES:
- Only send ONE gentle check-in per hour (max)
- Examples: "Still studying, or should we pause?" / "How did that session feel?"
- NEVER send repeated pings or pressure
${isInQuietHours() ? '⚠️ QUIET HOURS ACTIVE: Do NOT initiate unless user messages first' : ''}

LIFE + MENTORSHIP CONNECTION:
- Notice stress → slow pace
- Notice consistency → encourage
- Notice burnout → suggest rest
- Notice improvement → reflect it back
Example: "You've been more consistent this week. Even if it doesn't feel big, it is."
`;

    return context;
  }, [profile, hasCompletedSetup, isInQuietHours]);

  return {
    profile,
    isLoading,
    hasCompletedSetup,
    saveProfile,
    isInQuietHours,
    shouldSendFollowUp,
    updateLastCheckin,
    getMentorshipContext,
  };
};
