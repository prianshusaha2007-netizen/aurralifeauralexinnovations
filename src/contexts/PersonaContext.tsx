import React, { createContext, useContext, ReactNode } from 'react';
import { usePersona, PersonaType, PersonaConfig, PersonaBias } from '@/hooks/usePersona';
import { AvatarStyle } from '@/components/AuraAvatar';

interface PersonaContextType {
  currentPersona: PersonaType;
  persona: PersonaConfig;
  personaBias: PersonaBias;
  avatarStyle: string;
  allPersonas: Record<PersonaType, PersonaConfig>;
  setPersona: (persona: PersonaType) => void;
  autoSwitchPersona: (message: string) => PersonaType;
  detectPersona: (message: string) => PersonaType;
  updateBias: (key: keyof PersonaBias, delta: number) => void;
  applyBiasPreset: (preset: 'direct' | 'gentle' | 'simple' | 'balanced') => void;
  setAvatarStyle: (style: string) => void;
  getPersonaPromptAdditions: () => string;
}

const PersonaContext = createContext<PersonaContextType | null>(null);

export const PersonaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const personaState = usePersona();

  return (
    <PersonaContext.Provider value={personaState}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersonaContext = (): PersonaContextType => {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersonaContext must be used within a PersonaProvider');
  }
  return context;
};
