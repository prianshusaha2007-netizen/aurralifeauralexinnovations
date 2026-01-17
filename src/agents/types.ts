// Agent Types and Interfaces for AURRA Multi-Agent System

export type AgentDomain = 
  | 'study' 
  | 'fitness' 
  | 'finance' 
  | 'social' 
  | 'work' 
  | 'skill' 
  | 'routine' 
  | 'reflection' 
  | 'recovery';

export type AutonomyMode = 
  | 'do_as_told'      // A: User commands → agent executes
  | 'suggest_approve' // B: Agent generates options → user picks
  | 'predict_confirm' // C: Agent predicts → user confirms
  | 'full_auto'       // D: Agent executes within constraints
  | 'adaptive';       // E: Switches modes based on context

export type TriggerType = 
  | 'time'      // morning, evening, night, weekly, monthly
  | 'event'     // missed gym, exam soon, salary day
  | 'pattern'   // procrastination, avoidance, consistency
  | 'emotional' // low energy, stress, overwhelm
  | 'context'   // calendar, notifications, workplace hours
  | 'user';     // commands, questions, reflections

export type ActionType = 
  | 'plan'      // "Study 30 mins at 8 PM"
  | 'schedule'  // "Gym tomorrow 7 PM"
  | 'execute'   // "Sending outreach…"
  | 'log'       // "Expense logged: food ₹220"
  | 'track'     // "Study streak: 4 days"
  | 'analyze'   // "Energy peak at night"
  | 'summarize' // "Monthly performance…"
  | 'reflect'   // "What did you learn today?"
  | 'warn'      // "Finance procrastination detected"
  | 'adjust';   // "Move finance to mornings?"

export interface AgentTrigger {
  type: TriggerType;
  condition: string;
  priority: number; // 1-10
}

export interface AgentAction {
  id: string;
  type: ActionType;
  domain: AgentDomain;
  content: string;
  metadata?: Record<string, any>;
  requiresApproval: boolean;
  timestamp: string;
}

export interface AgentContext {
  mood: 'low' | 'neutral' | 'high';
  energy: 'low' | 'medium' | 'high';
  stress: 'low' | 'medium' | 'high';
  motivation: 'low' | 'medium' | 'high';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  isWorkHours: boolean;
  activeFocusSession: boolean;
  burnoutScore: number; // 0-100
}

export interface AgentMessage {
  id: string;
  agentId: string;
  agentName: string;
  domain: AgentDomain;
  content: string;
  actions?: AgentAction[];
  timestamp: string;
  requiresResponse: boolean;
  autonomyMode: AutonomyMode;
}

export interface AgentState {
  isActive: boolean;
  currentMode: AutonomyMode;
  lastAction?: AgentAction;
  pendingActions: AgentAction[];
  stats: {
    actionsToday: number;
    successRate: number;
    streakDays: number;
  };
}

export interface Agent {
  id: string;
  name: string;
  domain: AgentDomain;
  description: string;
  icon: string;
  triggers: AgentTrigger[];
  defaultMode: AutonomyMode;
  state: AgentState;
  
  // Methods
  analyze: (context: AgentContext, history: AgentMessage[]) => Promise<AgentAction[]>;
  execute: (action: AgentAction) => Promise<{ success: boolean; message: string }>;
  suggest: (context: AgentContext) => Promise<string[]>;
  getInsights: () => Promise<string>;
}

export interface AgentResponse {
  agentId: string;
  agentName: string;
  domain: AgentDomain;
  message: string;
  actions?: {
    label: string;
    action: string;
    data?: any;
  }[];
  stats?: {
    label: string;
    value: string | number;
  }[];
  timestamp: string;
}

// Agent Registry Entry
export interface AgentDefinition {
  id: string;
  name: string;
  domain: AgentDomain;
  description: string;
  icon: string;
  systemPrompt: string;
  triggers: AgentTrigger[];
  capabilities: string[];
}
