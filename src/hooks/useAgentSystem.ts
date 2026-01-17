// useAgentSystem - Hook for integrating the multi-agent system with React

import { useState, useCallback, useEffect, useMemo } from 'react';
import { orchestrator } from '@/agents/AgentOrchestrator';
import { AGENT_REGISTRY, getAgentById } from '@/agents/registry';
import { AgentContext, AgentResponse, AutonomyMode, AgentDomain } from '@/agents/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AgentMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  agentId?: string;
  agentName?: string;
  domain?: AgentDomain;
  actions?: { label: string; action: string; data?: any }[];
  stats?: { label: string; value: string | number }[];
  timestamp: Date;
  mode?: AutonomyMode;
}

interface UseAgentSystemReturn {
  messages: AgentMessage[];
  isProcessing: boolean;
  currentMode: AutonomyMode;
  context: AgentContext;
  activeAgents: typeof AGENT_REGISTRY;
  
  // Actions
  sendMessage: (message: string) => Promise<void>;
  executeAction: (action: string, data?: any) => Promise<void>;
  updateContext: (updates: Partial<AgentContext>) => void;
  setMode: (mode: AutonomyMode) => void;
  clearMessages: () => void;
}

export const useAgentSystem = (): UseAgentSystemReturn => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMode, setCurrentMode] = useState<AutonomyMode>('adaptive');
  const [context, setContext] = useState<AgentContext>(orchestrator.getState().context);

  // Update orchestrator when mode changes
  useEffect(() => {
    orchestrator.setGlobalMode(currentMode);
  }, [currentMode]);

  // Send a message to the agent system
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    // Add user message
    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    try {
      // Route message through orchestrator
      const responses = await orchestrator.routeMessage(message);
      
      // Convert responses to messages
      const agentMessages: AgentMessage[] = responses.map((response, index) => ({
        id: `agent-${Date.now()}-${index}`,
        type: 'agent' as const,
        content: response.message,
        agentId: response.agentId,
        agentName: response.agentName,
        domain: response.domain,
        actions: response.actions,
        stats: response.stats,
        timestamp: new Date(response.timestamp),
        mode: orchestrator.determineMode(response.domain),
      }));
      
      setMessages(prev => [...prev, ...agentMessages]);
      
      // Try to get AI-enhanced response if user is authenticated
      if (user) {
        await enhanceWithAI(message, responses);
      }
    } catch (error) {
      console.error('Agent system error:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        type: 'agent',
        content: 'I encountered an issue processing your request. Please try again.',
        agentId: 'system',
        agentName: 'System',
        domain: 'routine',
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, [user]);

  // Enhance responses with AI
  const enhanceWithAI = async (userMessage: string, initialResponses: AgentResponse[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('aura-chat', {
        body: {
          message: userMessage,
          context: {
            agents: initialResponses.map(r => r.agentId),
            mode: currentMode,
            userContext: context,
          },
        },
      });
      
      if (error) throw error;
      
      // Could update the last agent message with AI-enhanced content
      // For now, we'll use the orchestrator responses
    } catch (error) {
      console.error('AI enhancement failed:', error);
    }
  };

  // Execute an action suggested by an agent
  const executeAction = useCallback(async (action: string, data?: any) => {
    setIsProcessing(true);
    
    try {
      // Route to appropriate handler
      const actionHandlers: Record<string, () => Promise<string>> = {
        create_plan: async () => 'Plan created! I\'ve broken down your goal into steps.',
        start_session: async () => 'Focus session started. I\'ll track your progress.',
        log_workout: async () => 'Workout logged! Great job staying active.',
        log_expense: async () => 'Expense logged. I\'m tracking your spending.',
        draft_message: async () => 'Message draft ready. Would you like to review it?',
        view_goals: async () => 'Loading your goals...',
        review_flashcards: async () => 'Starting flashcard review...',
        view_fitness: async () => 'Loading fitness progress...',
        view_budget: async () => 'Loading budget overview...',
        schedule_followup: async () => 'Follow-up scheduled.',
      };
      
      const handler = actionHandlers[action];
      const result = handler ? await handler() : `Action "${action}" executed.`;
      
      // Add result message
      setMessages(prev => [...prev, {
        id: `action-${Date.now()}`,
        type: 'agent',
        content: result,
        agentId: 'execution',
        agentName: 'Execution Agent',
        domain: 'routine',
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Action execution error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Update context
  const updateContext = useCallback((updates: Partial<AgentContext>) => {
    orchestrator.updateContext(updates);
    setContext(orchestrator.getState().context);
  }, []);

  // Set autonomy mode
  const setMode = useCallback((mode: AutonomyMode) => {
    setCurrentMode(mode);
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Memoize active agents
  const activeAgents = useMemo(() => AGENT_REGISTRY, []);

  return {
    messages,
    isProcessing,
    currentMode,
    context,
    activeAgents,
    sendMessage,
    executeAction,
    updateContext,
    setMode,
    clearMessages,
  };
};
