// Agent Registry - Defines the 9 canonical AURRA CORE sub-agents (invisible to user)

import { AgentDefinition, AgentDomain } from './types';

export const AGENT_REGISTRY: AgentDefinition[] = [
  // 1. Education Agent
  {
    id: 'education',
    name: 'Education Agent',
    domain: 'study',
    description: 'Academic explanations, exam prep, skill learning, coding help',
    icon: '📚',
    systemPrompt: `You handle academic explanations, exam prep, skill learning, and coding help.
Rules: No cheating assistance. Clear, patient explanations only. Teach directly without interview loops.`,
    triggers: [
      { type: 'user', condition: 'study_intent', priority: 9 },
      { type: 'user', condition: 'coding_intent', priority: 9 },
      { type: 'event', condition: 'exam_approaching', priority: 10 },
    ],
    capabilities: ['explain_concept', 'exam_prep', 'code_review', 'skill_coaching', 'note_summary'],
  },

  // 2. Health & Wellness Agent
  {
    id: 'health',
    name: 'Health & Wellness Agent',
    domain: 'recovery',
    description: 'Symptom understanding, lifestyle guidance, mental wellbeing support',
    icon: '🩺',
    systemPrompt: `You provide non-diagnostic health support, lifestyle guidance, and mental wellbeing.
Rules: Never diagnose or prescribe. Always include gentle disclaimer. Escalate to professionals for serious/persistent issues.`,
    triggers: [
      { type: 'user', condition: 'health_concern', priority: 9 },
      { type: 'emotional', condition: 'stress_high', priority: 8 },
      { type: 'pattern', condition: 'burnout_detected', priority: 9 },
    ],
    capabilities: ['symptom_guidance', 'wellness_tips', 'mental_health_support', 'professional_referral'],
  },

  // 3. Fitness & Diet Agent
  {
    id: 'fitness',
    name: 'Fitness & Diet Agent',
    domain: 'fitness',
    description: 'Workout suggestions, diet planning, hydration, routine health habits',
    icon: '💪',
    systemPrompt: `You manage workout suggestions, diet planning, hydration, and health habits.
Rules: No extreme advice. Stop on pain/injury signals. Culturally adaptive food suggestions. No body shaming.`,
    triggers: [
      { type: 'user', condition: 'fitness_intent', priority: 8 },
      { type: 'time', condition: 'workout_time', priority: 7 },
      { type: 'pattern', condition: 'hydration_low', priority: 6 },
    ],
    capabilities: ['workout_plan', 'diet_suggestion', 'hydration_tracking', 'progress_tracking', 'rest_advice'],
  },

  // 4. Focus & Productivity Agent
  {
    id: 'focus',
    name: 'Focus & Productivity Agent',
    domain: 'routine',
    description: 'Focus sessions, task breakdown, distraction management',
    icon: '🎯',
    systemPrompt: `You manage focus sessions, task breakdown, routines, habits, and distraction management.
Rules: Never guilt. Flexible pacing. Focus is "shared calm", not enforcement. No shaming for breaks.`,
    triggers: [
      { type: 'user', condition: 'focus_intent', priority: 9 },
      { type: 'user', condition: 'task_mentioned', priority: 8 },
      { type: 'time', condition: 'routine_time', priority: 7 },
      { type: 'time', condition: 'deadline_approaching', priority: 9 },
    ],
    capabilities: ['focus_session', 'task_breakdown', 'habit_tracking', 'routine_management', 'schedule_optimization'],
  },

  // 5. Memory & Context Agent
  {
    id: 'memory',
    name: 'Memory & Context Agent',
    domain: 'reflection',
    description: 'Summarize conversations, store daily memories, recall past context',
    icon: '🧠',
    systemPrompt: `You manage conversation memory, daily summaries, and context recall.
Rules: Permission-based storage. Editable memory. Store patterns, not raw chat logs. Respect "forget" commands.`,
    triggers: [
      { type: 'user', condition: 'memory_intent', priority: 8 },
      { type: 'event', condition: 'significant_event', priority: 7 },
      { type: 'time', condition: 'daily_reflection', priority: 6 },
    ],
    capabilities: ['save_memory', 'recall_context', 'pattern_detection', 'daily_summary', 'journal_prompt'],
  },

  // 6. Automation & Tools Agent
  {
    id: 'automation',
    name: 'Automation & Tools Agent',
    domain: 'routine',
    description: 'Calendar, reminders, emails, app control, external integrations',
    icon: '⚡',
    systemPrompt: `You handle calendar, reminders, alarms, app control, and external integrations.
Rules: Explicit user consent required. Always confirm before executing actions. Preview before send.`,
    triggers: [
      { type: 'user', condition: 'action_command', priority: 10 },
      { type: 'user', condition: 'reminder_intent', priority: 9 },
      { type: 'event', condition: 'scheduled_action', priority: 8 },
    ],
    capabilities: ['set_reminder', 'app_control', 'email_draft', 'alarm_management', 'automation_workflow'],
  },

  // 7. Culture & Language Agent
  {
    id: 'culture',
    name: 'Culture & Language Agent',
    domain: 'reflection',
    description: 'Cultural adaptation, language tone, regional sensitivity',
    icon: '🌍',
    systemPrompt: `You handle cultural adaptation, language detection, and regional sensitivity.
Rules: No stereotypes. Always allow correction. Adapt tone to regional context. Respect festivals and customs.`,
    triggers: [
      { type: 'context', condition: 'cultural_signal', priority: 6 },
      { type: 'pattern', condition: 'language_switch', priority: 7 },
    ],
    capabilities: ['language_detection', 'cultural_adaptation', 'regional_sensitivity', 'festival_awareness'],
  },

  // 8. Image & Vision Agent
  {
    id: 'vision',
    name: 'Image & Vision Agent',
    domain: 'skill',
    description: 'Image understanding, notes, documents, objects',
    icon: '👁️',
    systemPrompt: `You handle image analysis, document understanding, and visual content processing.
Rules: Ask before assuming content. No sensitive inference. Describe clearly and helpfully.`,
    triggers: [
      { type: 'user', condition: 'image_shared', priority: 9 },
      { type: 'user', condition: 'document_analysis', priority: 8 },
    ],
    capabilities: ['image_analysis', 'document_reading', 'object_recognition', 'visual_summary'],
  },

  // 9. Strategy & Co-founder Agent
  {
    id: 'strategy',
    name: 'Strategy & Co-founder Agent',
    domain: 'work',
    description: 'Decision-making help, planning, trade-offs, long-term thinking',
    icon: '🧠',
    systemPrompt: `You help with decision-making, planning, trade-offs, and long-term thinking.
Rules: Never decide for the user. Present options calmly. Structured analysis without overwhelming.`,
    triggers: [
      { type: 'user', condition: 'strategy_intent', priority: 8 },
      { type: 'user', condition: 'decision_needed', priority: 9 },
      { type: 'time', condition: 'weekly_planning', priority: 7 },
    ],
    capabilities: ['decision_support', 'trade_off_analysis', 'goal_planning', 'long_term_strategy'],
  },
];

export const getAgentById = (id: string): AgentDefinition | undefined => {
  return AGENT_REGISTRY.find(agent => agent.id === id);
};

export const getAgentsByDomain = (domain: AgentDomain): AgentDefinition[] => {
  return AGENT_REGISTRY.filter(agent => agent.domain === domain);
};

// Map legacy agent IDs to new canonical agents
export const LEGACY_AGENT_MAP: Record<string, string> = {
  planner: 'focus',
  scheduler: 'focus',
  routine: 'focus',
  task: 'focus',
  study: 'education',
  fitness: 'fitness',
  finance: 'strategy',
  social: 'automation',
  memory: 'memory',
  insight: 'memory',
  identity: 'memory',
  reflection: 'memory',
  execution: 'automation',
  notification: 'automation',
  mood: 'health',
  energy: 'health',
  recovery: 'health',
  autonomy: 'focus',
};

export const resolveAgentId = (legacyId: string): string => {
  return LEGACY_AGENT_MAP[legacyId] || legacyId;
};
