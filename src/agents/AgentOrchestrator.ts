// Agent Orchestrator - Coordinates all agents and manages message routing

import { 
  AgentContext, 
  AgentResponse, 
  AutonomyMode, 
  AgentDomain,
  AgentAction,
  ActionType 
} from './types';
import { AGENT_REGISTRY, getAgentById } from './registry';

interface OrchestratorState {
  activeAgents: string[];
  globalMode: AutonomyMode;
  context: AgentContext;
  pendingApprovals: AgentAction[];
  recentResponses: AgentResponse[];
}

export class AgentOrchestrator {
  private state: OrchestratorState;
  
  constructor() {
    this.state = {
      activeAgents: AGENT_REGISTRY.map(a => a.id),
      globalMode: 'adaptive',
      context: this.getDefaultContext(),
      pendingApprovals: [],
      recentResponses: [],
    };
  }

  private getDefaultContext(): AgentContext {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    return {
      mood: 'neutral',
      energy: 'medium',
      stress: 'low',
      motivation: 'medium',
      timeOfDay: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night',
      dayOfWeek,
      isWorkHours: hour >= 9 && hour <= 17 && !['Saturday', 'Sunday'].includes(dayOfWeek),
      activeFocusSession: false,
      burnoutScore: 0,
    };
  }

  updateContext(updates: Partial<AgentContext>): void {
    this.state.context = { ...this.state.context, ...updates };
  }

  // Determine which autonomy mode to use based on context
  determineMode(domain: AgentDomain, urgency: number = 5): AutonomyMode {
    if (this.state.globalMode !== 'adaptive') {
      return this.state.globalMode;
    }

    const { energy, stress, burnoutScore } = this.state.context;
    
    // High stress/burnout → more control to user
    if (burnoutScore > 70 || stress === 'high') {
      return 'suggest_approve';
    }
    
    // Low energy → simplified interactions
    if (energy === 'low') {
      return urgency > 7 ? 'predict_confirm' : 'suggest_approve';
    }
    
    // High urgency → faster execution
    if (urgency > 8) {
      return 'predict_confirm';
    }
    
    // Sensitive domains → more user control
    if (['finance', 'social'].includes(domain)) {
      return 'suggest_approve';
    }
    
    // Routine tasks with good history → more autonomy
    if (['routine', 'fitness'].includes(domain) && this.state.context.motivation === 'high') {
      return 'full_auto';
    }
    
    return 'predict_confirm';
  }

  // Route a user message to appropriate agents
  async routeMessage(userMessage: string): Promise<AgentResponse[]> {
    const relevantAgents = this.identifyRelevantAgents(userMessage);
    const responses: AgentResponse[] = [];
    
    for (const agentId of relevantAgents) {
      const agent = getAgentById(agentId);
      if (!agent) continue;
      
      const mode = this.determineMode(agent.domain);
      const response = this.generateAgentResponse(agent.id, agent.name, agent.domain, mode, userMessage);
      responses.push(response);
    }
    
    this.state.recentResponses = [...responses, ...this.state.recentResponses].slice(0, 20);
    return responses;
  }

  // Identify which agents should respond to a message
  private identifyRelevantAgents(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const relevant: string[] = [];
    
    // Keyword-based routing
    const keywordMap: Record<string, string[]> = {
      planner: ['plan', 'goal', 'achieve', 'want to', 'need to'],
      scheduler: ['schedule', 'when', 'calendar', 'time', 'slot'],
      routine: ['habit', 'routine', 'daily', 'morning', 'evening', 'streak'],
      task: ['task', 'todo', 'deadline', 'finish', 'complete', 'do'],
      study: ['study', 'learn', 'exam', 'read', 'course', 'book', 'notes'],
      fitness: ['gym', 'workout', 'exercise', 'run', 'fitness', 'health', 'weight'],
      finance: ['money', 'spend', 'expense', 'budget', 'save', 'invest', 'cost', '₹', '$'],
      social: ['message', 'follow up', 'network', 'reach out', 'contact', 'call', 'meet'],
      memory: ['remember', 'recall', 'forget', 'last time', 'previously'],
      insight: ['insight', 'pattern', 'trend', 'analysis', 'review'],
      identity: ['who am i', 'growth', 'values', 'becoming', 'identity'],
      reflection: ['journal', 'reflect', 'grateful', 'feel', 'think about'],
      mood: ['mood', 'feeling', 'happy', 'sad', 'anxious', 'stressed'],
      energy: ['tired', 'energy', 'exhausted', 'awake', 'sleepy'],
      recovery: ['rest', 'break', 'burnout', 'overwhelmed', 'relax'],
    };
    
    for (const [agentId, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        relevant.push(agentId);
      }
    }
    
    // Default to planner if no specific match
    if (relevant.length === 0) {
      relevant.push('planner');
    }
    
    // Limit to top 3 most relevant
    return relevant.slice(0, 3);
  }

  // Generate a response from an agent
  private generateAgentResponse(
    agentId: string,
    agentName: string,
    domain: AgentDomain,
    mode: AutonomyMode,
    userMessage: string
  ): AgentResponse {
    // This will be enhanced with actual AI calls
    const agent = getAgentById(agentId);
    
    return {
      agentId,
      agentName,
      domain,
      message: this.getPlaceholderResponse(agentId, mode),
      actions: this.getAgentActions(agentId, mode),
      stats: this.getAgentStats(agentId),
      timestamp: new Date().toISOString(),
    };
  }

  private getPlaceholderResponse(agentId: string, mode: AutonomyMode): string {
    const modePrefix = mode === 'full_auto' ? '✅ Auto-executing: ' :
                       mode === 'predict_confirm' ? '🔮 Predicting: ' :
                       mode === 'suggest_approve' ? '💡 Suggesting: ' :
                       '📋 Ready to execute: ';
    
    const responses: Record<string, string> = {
      planner: 'I can help break this down into actionable steps.',
      scheduler: 'Let me find the optimal time for this.',
      routine: 'Tracking your consistency on this habit.',
      task: 'I\'ve added this to your task list.',
      study: 'Ready to start a focused study session.',
      fitness: 'Let\'s plan your workout based on your energy.',
      finance: 'I\'ll log this and track your spending.',
      social: 'I can help draft a follow-up message.',
      memory: 'I\'ve noted this for future reference.',
      insight: 'Analyzing patterns from your recent activity.',
      identity: 'Reflecting on your growth journey.',
      reflection: 'Let\'s take a moment to process this.',
      mood: 'Thank you for sharing how you\'re feeling.',
      energy: 'Adjusting recommendations for your energy level.',
      recovery: 'Remember to take care of yourself.',
    };
    
    return modePrefix + (responses[agentId] || 'Processing your request.');
  }

  private getAgentActions(agentId: string, mode: AutonomyMode): AgentResponse['actions'] {
    if (mode === 'full_auto') return undefined;
    
    const actionMap: Record<string, AgentResponse['actions']> = {
      planner: [
        { label: 'Create Goal', action: 'create_plan', data: { title: 'New Goal' } },
        { label: 'View Goals', action: 'view_goals' },
      ],
      scheduler: [
        { label: 'Add Task', action: 'add_focus_block', data: { title: 'Scheduled Task', duration: 30 } },
      ],
      routine: [
        { label: 'Add Habit', action: 'create_habit', data: { name: 'New Habit' } },
        { label: 'Log Mood', action: 'log_mood', data: { mood: 'neutral', energy: 'medium', stress: 'low' } },
      ],
      task: [
        { label: 'Add Focus Block', action: 'add_focus_block', data: { title: 'Focus Time', duration: 25 } },
      ],
      study: [
        { label: 'Start 25min', action: 'start_session', data: { type: 'study', duration: 25 } },
        { label: 'Start 50min', action: 'start_session', data: { type: 'study', duration: 50 } },
      ],
      fitness: [
        { label: 'Log 30min', action: 'log_workout', data: { type: 'general', duration: 30 } },
        { label: 'Log 60min', action: 'log_workout', data: { type: 'general', duration: 60 } },
        { label: 'View Progress', action: 'view_fitness' },
      ],
      finance: [
        { label: 'Log ₹100', action: 'log_expense', data: { amount: 100, category: 'other' } },
        { label: 'Log ₹500', action: 'log_expense', data: { amount: 500, category: 'other' } },
        { label: 'View Budget', action: 'view_budget' },
      ],
      social: [
        { label: 'Draft Message', action: 'draft_message' },
        { label: 'Schedule Follow-up', action: 'schedule_followup', data: { contactName: 'Contact', platform: 'email' } },
      ],
      memory: [
        { label: 'Save Memory', action: 'save_memory', data: { content: 'Important note', category: 'general' } },
      ],
      mood: [
        { label: 'Log High', action: 'log_mood', data: { mood: 'high', energy: 'high', stress: 'low' } },
        { label: 'Log Low', action: 'log_mood', data: { mood: 'low', energy: 'low', stress: 'high' } },
      ],
      energy: [
        { label: 'Log Water', action: 'log_water', data: { amount: 250 } },
      ],
      recovery: [
        { label: 'Log Rest', action: 'log_mood', data: { mood: 'neutral', energy: 'low', stress: 'low', notes: 'Taking a break' } },
      ],
    };
    
    return actionMap[agentId];
  }

  private getAgentStats(agentId: string): AgentResponse['stats'] {
    const statsMap: Record<string, AgentResponse['stats']> = {
      routine: [
        { label: 'Streak', value: '7 days' },
        { label: 'Completion', value: '85%' },
      ],
      study: [
        { label: 'Session', value: '25 min' },
        { label: 'Cards Due', value: 12 },
      ],
      fitness: [
        { label: 'This Week', value: '4/5' },
        { label: 'Streak', value: '14 days' },
      ],
      finance: [
        { label: 'Today', value: '₹450' },
        { label: 'Budget Left', value: '₹2,550' },
      ],
    };
    
    return statsMap[agentId];
  }

  // Execute a pending action
  async executeAction(actionId: string): Promise<{ success: boolean; message: string }> {
    const action = this.state.pendingApprovals.find(a => a.id === actionId);
    if (!action) {
      return { success: false, message: 'Action not found' };
    }
    
    // Remove from pending
    this.state.pendingApprovals = this.state.pendingApprovals.filter(a => a.id !== actionId);
    
    // Execute based on action type
    return { success: true, message: `Executed: ${action.content}` };
  }

  // Get current state
  getState(): OrchestratorState {
    return { ...this.state };
  }

  // Set global autonomy mode
  setGlobalMode(mode: AutonomyMode): void {
    this.state.globalMode = mode;
  }
}

// Singleton instance
export const orchestrator = new AgentOrchestrator();
