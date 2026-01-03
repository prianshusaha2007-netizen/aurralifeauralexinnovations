import { useState, useEffect, useCallback } from 'react';

// Skill types available for self-improvement
export type SkillType = 
  | 'gym' 
  | 'coding' 
  | 'video_editing' 
  | 'graphic_design' 
  | 'music' 
  | 'content_creation' 
  | 'self_discipline'
  | 'general';

export type SkillIntensity = 'casual' | 'serious';

export interface UserSkill {
  id: string;
  type: SkillType;
  displayName: string;
  intensity: SkillIntensity;
  isActive: boolean;
  preferredTimeSlot?: 'morning' | 'afternoon' | 'evening' | 'night';
  sessionDurationMinutes: number;
  lastSessionAt?: string;
  totalSessions: number;
  currentStreak: number;
}

interface SkillSession {
  skillId: string;
  startedAt: string;
  endedAt?: string;
  energyBefore?: 'low' | 'medium' | 'high';
  notes?: string;
}

const SKILL_DISPLAY_NAMES: Record<SkillType, string> = {
  gym: 'Gym / Workout',
  coding: 'Coding / Tech',
  video_editing: 'Video Editing',
  graphic_design: 'Graphic Design',
  music: 'Music',
  content_creation: 'Content Creation',
  self_discipline: 'Self-Discipline',
  general: 'General Skills',
};

const DEFAULT_SESSION_DURATIONS: Record<SkillType, number> = {
  gym: 45,
  coding: 30,
  video_editing: 30,
  graphic_design: 25,
  music: 30,
  content_creation: 30,
  self_discipline: 20,
  general: 25,
};

const STORAGE_KEY = 'aurra-skills-progress';
const SESSION_STORAGE_KEY = 'aurra-skill-sessions';

export const useSkillsProgress = () => {
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [currentSession, setCurrentSession] = useState<SkillSession | null>(null);
  const [hasCompletedDiscovery, setHasCompletedDiscovery] = useState(false);

  // Load skills from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSkills(data.skills || []);
        setHasCompletedDiscovery(data.hasCompletedDiscovery || false);
      } catch {
        setSkills([]);
      }
    }
  }, []);

  // Save skills to localStorage
  useEffect(() => {
    if (skills.length > 0 || hasCompletedDiscovery) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ skills, hasCompletedDiscovery }));
    }
  }, [skills, hasCompletedDiscovery]);

  // Add a new skill
  const addSkill = useCallback((type: SkillType, intensity: SkillIntensity = 'casual') => {
    const newSkill: UserSkill = {
      id: `skill-${type}-${Date.now()}`,
      type,
      displayName: SKILL_DISPLAY_NAMES[type],
      intensity,
      isActive: true,
      sessionDurationMinutes: DEFAULT_SESSION_DURATIONS[type],
      totalSessions: 0,
      currentStreak: 0,
    };
    
    setSkills(prev => {
      // Check if skill already exists
      if (prev.some(s => s.type === type)) {
        return prev.map(s => s.type === type ? { ...s, isActive: true, intensity } : s);
      }
      return [...prev, newSkill];
    });
    
    return newSkill;
  }, []);

  // Remove or deactivate a skill
  const removeSkill = useCallback((skillType: SkillType) => {
    setSkills(prev => prev.map(s => 
      s.type === skillType ? { ...s, isActive: false } : s
    ));
  }, []);

  // Update skill intensity
  const updateSkillIntensity = useCallback((skillType: SkillType, intensity: SkillIntensity) => {
    setSkills(prev => prev.map(s => 
      s.type === skillType ? { ...s, intensity } : s
    ));
  }, []);

  // Set preferred time slot for a skill
  const setSkillTimeSlot = useCallback((
    skillType: SkillType, 
    timeSlot: 'morning' | 'afternoon' | 'evening' | 'night'
  ) => {
    setSkills(prev => prev.map(s => 
      s.type === skillType ? { ...s, preferredTimeSlot: timeSlot } : s
    ));
  }, []);

  // Start a skill session
  const startSession = useCallback((skillType: SkillType, energyLevel?: 'low' | 'medium' | 'high') => {
    const skill = skills.find(s => s.type === skillType);
    if (!skill) return null;
    
    const session: SkillSession = {
      skillId: skill.id,
      startedAt: new Date().toISOString(),
      energyBefore: energyLevel,
    };
    
    setCurrentSession(session);
    return session;
  }, [skills]);

  // End current session
  const endSession = useCallback((notes?: string) => {
    if (!currentSession) return;
    
    const completedSession = {
      ...currentSession,
      endedAt: new Date().toISOString(),
      notes,
    };
    
    // Update skill stats
    setSkills(prev => prev.map(s => {
      if (s.id === currentSession.skillId) {
        const lastSession = s.lastSessionAt ? new Date(s.lastSessionAt) : null;
        const now = new Date();
        const daysSinceLastSession = lastSession 
          ? Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        return {
          ...s,
          lastSessionAt: completedSession.endedAt,
          totalSessions: s.totalSessions + 1,
          currentStreak: daysSinceLastSession <= 1 ? s.currentStreak + 1 : 1,
        };
      }
      return s;
    }));
    
    // Save session to history
    const sessions = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || '[]');
    sessions.push(completedSession);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions.slice(-100))); // Keep last 100
    
    setCurrentSession(null);
  }, [currentSession]);

  // Get active skills
  const getActiveSkills = useCallback(() => {
    return skills.filter(s => s.isActive);
  }, [skills]);

  // Get skill by type
  const getSkill = useCallback((type: SkillType) => {
    return skills.find(s => s.type === type);
  }, [skills]);

  // Check if user has any active skills
  const hasActiveSkills = useCallback(() => {
    return skills.some(s => s.isActive);
  }, [skills]);

  // Get skills that should be practiced today (based on time)
  const getSkillsForNow = useCallback(() => {
    const hour = new Date().getHours();
    const currentTimeSlot = 
      hour < 12 ? 'morning' : 
      hour < 17 ? 'afternoon' : 
      hour < 21 ? 'evening' : 'night';
    
    return skills.filter(s => 
      s.isActive && 
      (!s.preferredTimeSlot || s.preferredTimeSlot === currentTimeSlot)
    );
  }, [skills]);

  // Mark discovery as complete
  const completeDiscovery = useCallback(() => {
    setHasCompletedDiscovery(true);
  }, []);

  // Should show skill discovery
  const shouldShowDiscovery = useCallback(() => {
    if (hasCompletedDiscovery) return false;
    
    // Check if we've been using the app for at least 1 session
    const firstUse = localStorage.getItem('aurra-first-use');
    if (!firstUse) return false;
    
    return true;
  }, [hasCompletedDiscovery]);

  return {
    skills,
    currentSession,
    hasCompletedDiscovery,
    addSkill,
    removeSkill,
    updateSkillIntensity,
    setSkillTimeSlot,
    startSession,
    endSession,
    getActiveSkills,
    getSkill,
    hasActiveSkills,
    getSkillsForNow,
    completeDiscovery,
    shouldShowDiscovery,
  };
};
