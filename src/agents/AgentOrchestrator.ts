// AURRA CORE Orchestrator - Single intelligence that coordinates 9 invisible sub-agents

import { 
  AgentContext, 
  AgentResponse, 
  AutonomyMode, 
  AgentDomain,
  AgentAction,
} from './types';
import { AGENT_REGISTRY, getAgentById, resolveAgentId } from './registry';

interface OrchestratorState {
  activeAgents: string[];
  globalMode: AutonomyMode;
  context: AgentContext;
  pendingApprovals: AgentAction[];
  recentResponses: AgentResponse[];
}

// AURRA CORE — the single orchestrator the user experiences
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

  // Adaptive autonomy mode based on context
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
    
    // Sensitive domains → more user control (Strategy, Automation)
    if (['work', 'social'].includes(domain)) {
      return 'suggest_approve';
    }
    
    // Routine tasks with good history → more autonomy
    if (['routine', 'fitness'].includes(domain) && this.state.context.motivation === 'high') {
      return 'full_auto';
    }
    
    return 'predict_confirm';
  }

  // Route user message to appropriate sub-agents (invisible to user)
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
    
    // Resolve conflicts: emotional safety > user intent > practicality
    const resolved = this.resolveConflicts(responses);
    
    this.state.recentResponses = [...resolved, ...this.state.recentResponses].slice(0, 20);
    return resolved;
  }

  // Conflict resolution: prioritize emotional safety, then intent, then practicality
  private resolveConflicts(responses: AgentResponse[]): AgentResponse[] {
    if (responses.length <= 1) return responses;
    
    // Priority order: health/recovery > memory > focus > education > fitness > automation > culture > vision > strategy
    const priorityOrder = ['health', 'memory', 'focus', 'education', 'fitness', 'automation', 'culture', 'vision', 'strategy'];
    
    return responses.sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a.agentId);
      const bIdx = priorityOrder.indexOf(b.agentId);
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });
  }

  // Identify which sub-agents should be consulted (internally)
  private identifyRelevantAgents(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const relevant: string[] = [];
    
    // Keyword-based routing to 9 canonical agents
    const keywordMap: Record<string, string[]> = {
      education: ['study', 'learn', 'exam', 'teach', 'explain', 'concept', 'course', 'book', 'notes', 'code', 'debug', 'programming', 'tutor'],
      health: ['health', 'sick', 'pain', 'headache', 'fever', 'tired', 'exhausted', 'stressed', 'anxious', 'sad', 'depressed', 'burnout', 'sleep', 'doctor', 'medicine'],
      fitness: ['gym', 'workout', 'exercise', 'run', 'fitness', 'weight', 'diet', 'meal', 'nutrition', 'protein', 'calories', 'hydration', 'water'],
      focus: ['focus', 'task', 'todo', 'deadline', 'routine', 'habit', 'plan', 'goal', 'schedule', 'streak', 'morning', 'evening', 'daily'],
      memory: ['remember', 'recall', 'forget', 'memory', 'last time', 'previously', 'journal', 'reflect', 'gratitude', 'pattern', 'insight'],
      automation: ['remind', 'alarm', 'timer', 'open', 'send', 'message', 'call', 'email', 'app', 'calendar', 'notification'],
      culture: ['language', 'translate', 'festival', 'cultural', 'region'],
      vision: ['image', 'photo', 'picture', 'document', 'scan', 'screenshot'],
      strategy: ['decide', 'strategy', 'business', 'invest', 'startup', 'idea', 'trade-off', 'long-term', 'budget', 'money', 'expense', 'spend', '₹', '$'],
    };
    
    for (const [agentId, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        relevant.push(agentId);
      }
    }
    
    // Default to focus agent for general queries
    if (relevant.length === 0) {
      relevant.push('focus');
    }
    
    // Limit to top 3 most relevant
    return relevant.slice(0, 3);
  }

  // Generate response (internal, never exposed to user)
  private generateAgentResponse(
    agentId: string,
    agentName: string,
    domain: AgentDomain,
    mode: AutonomyMode,
    _userMessage: string
  ): AgentResponse {
    return {
      agentId,
      agentName,
      domain,
      message: this.getInternalResponse(agentId, mode),
      actions: this.getAgentActions(agentId, mode),
      stats: this.getAgentStats(agentId),
      timestamp: new Date().toISOString(),
    };
  }

  private getInternalResponse(agentId: string, mode: AutonomyMode): string {
    const modePrefix = mode === 'full_auto' ? '✅ ' :
                       mode === 'predict_confirm' ? '🔮 ' :
                       mode === 'suggest_approve' ? '💡 ' : '📋 ';
    
    const responses: Record<string, string> = {
      education: 'Ready to explain and guide.',
      health: 'Checking wellness context.',
      fitness: 'Adjusting for energy and goals.',
      focus: 'Managing tasks and focus.',
      memory: 'Accessing context and patterns.',
      automation: 'Preparing action for confirmation.',
      culture: 'Adapting for cultural context.',
      vision: 'Processing visual content.',
      strategy: 'Analyzing options and trade-offs.',
    };
    
    return modePrefix + (responses[agentId] || 'Processing.');
  }

  private getAgentActions(agentId: string, mode: AutonomyMode): AgentResponse['actions'] {
    if (mode === 'full_auto') return undefined;
    
    const actionMap: Record<string, AgentResponse['actions']> = {
      education: [
        { label: 'Start Study', action: 'start_session', data: { type: 'study', duration: 25 } },
        { label: 'Explain Topic', action: 'explain_topic' },
      ],
      health: [
        { label: 'Log Mood', action: 'log_mood', data: { mood: 'neutral', energy: 'medium', stress: 'low' } },
        { label: 'Take Break', action: 'start_break' },
      ],
      fitness: [
        { label: 'Log Workout', action: 'log_workout', data: { type: 'general', duration: 30 } },
        { label: 'Log Water', action: 'log_water', data: { amount: 250 } },
      ],
      focus: [
        { label: 'Start Focus', action: 'add_focus_block', data: { title: 'Focus Time', duration: 25 } },
        { label: 'View Goals', action: 'view_goals' },
      ],
      memory: [
        { label: 'Save Memory', action: 'save_memory', data: { content: 'Important note', category: 'general' } },
      ],
      automation: [
        { label: 'Set Reminder', action: 'set_reminder' },
        { label: 'Draft Message', action: 'draft_message' },
      ],
      strategy: [
        { label: 'Create Plan', action: 'create_plan', data: { title: 'New Plan' } },
        { label: 'Log Expense', action: 'log_expense', data: { amount: 100, category: 'other' } },
      ],
    };
    
    return actionMap[agentId];
  }

  private getAgentStats(agentId: string): AgentResponse['stats'] {
    const statsMap: Record<string, AgentResponse['stats']> = {
      focus: [
        { label: 'Streak', value: '7 days' },
        { label: 'Completion', value: '85%' },
      ],
      education: [
        { label: 'Session', value: '25 min' },
        { label: 'Topics', value: 12 },
      ],
      fitness: [
        { label: 'This Week', value: '4/5' },
        { label: 'Streak', value: '14 days' },
      ],
      strategy: [
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
    
    this.state.pendingApprovals = this.state.pendingApprovals.filter(a => a.id !== actionId);
    return { success: true, message: `Executed: ${action.content}` };
  }

  getState(): OrchestratorState {
    return { ...this.state };
  }

  setGlobalMode(mode: AutonomyMode): void {
    this.state.globalMode = mode;
  }
}

// Singleton instance
export const orchestrator = new AgentOrchestrator();
