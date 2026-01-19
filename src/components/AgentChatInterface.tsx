import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, Sparkles, Settings2, 
  ChevronDown, Loader2, Mic, Image as ImageIcon,
  Wallet, Dumbbell, Target, BookOpen, Droplets
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAgentSystem } from '@/hooks/useAgentSystem';
import { AutonomyModeSelector, useAutonomyMode, modeToExtended } from './AutonomyModeSelector';
import AgentChatBubble from './AgentChatBubble';
import { AGENT_REGISTRY } from '@/agents/registry';

interface AgentChatInterfaceProps {
  embedded?: boolean;
  onClose?: () => void;
}

const AgentChatInterface: React.FC<AgentChatInterfaceProps> = ({
  embedded = false,
  onClose,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { mode, setAutonomyMode, extendedMode } = useAutonomyMode();
  const {
    messages,
    isProcessing,
    context,
    activeAgents,
    sendMessage,
    executeAction,
    setMode,
  } = useAgentSystem();

  // Sync mode with agent system
  useEffect(() => {
    setMode(extendedMode);
  }, [extendedMode, setMode]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleQuickAction = async (action: string, data?: any) => {
    await executeAction(action, data);
  };

  // Active agent indicators
  const getActiveAgentIndicators = () => {
    const recentAgents = messages
      .filter(m => m.type === 'agent' && m.agentId)
      .slice(-5)
      .map(m => m.agentId)
      .filter((v, i, a) => a.indexOf(v) === i);
    
    return recentAgents.map(agentId => {
      const agent = AGENT_REGISTRY.find(a => a.id === agentId);
      return agent ? { id: agentId, icon: agent.icon, name: agent.name } : null;
    }).filter(Boolean);
  };

  return (
    <div className={`flex flex-col ${embedded ? 'h-full' : 'h-[600px]'} bg-background rounded-2xl overflow-hidden border`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AURRA Agents</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {activeAgents.length} agents active
              </span>
              {getActiveAgentIndicators().slice(0, 3).map((agent: any) => (
                <span key={agent.id} className="text-xs" title={agent.name}>
                  {agent.icon}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <AutonomyModeSelector
            value={mode}
            onChange={setAutonomyMode}
            compact
            extended
          />
          
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings2 className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Agent Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Autonomy Mode</h4>
                  <AutonomyModeSelector
                    value={mode}
                    onChange={setAutonomyMode}
                    extended
                  />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3">Current Context</h4>
                  <Card className="p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mood</span>
                      <Badge variant="outline">{context.mood}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Energy</span>
                      <Badge variant="outline">{context.energy}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time</span>
                      <Badge variant="outline">{context.timeOfDay}</Badge>
                    </div>
                  </Card>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3">Active Agents</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {AGENT_REGISTRY.slice(0, 8).map(agent => (
                      <Card key={agent.id} className="p-2 flex items-center gap-2">
                        <span className="text-lg">{agent.icon}</span>
                        <span className="text-xs truncate">{agent.name.replace(' Agent', '')}</span>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-medium mb-2">Multi-Agent System Ready</h3>
              <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                Tell me about your goals, tasks, or anything you need help with. 
                My specialized agents will work together to assist you.
              </p>
              
              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-6 max-w-sm mx-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-2"
                  onClick={() => handleQuickAction('log_expense', { amount: 100, category: 'food', description: 'Quick expense' })}
                >
                  <Wallet className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Log ₹100 expense</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-2"
                  onClick={() => handleQuickAction('log_workout', { type: 'general', duration: 30 })}
                >
                  <Dumbbell className="w-4 h-4 text-orange-500" />
                  <span className="text-xs">Log 30min workout</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-2"
                  onClick={() => handleQuickAction('start_session', { type: 'study', duration: 25 })}
                >
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="text-xs">Start 25min study</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-2"
                  onClick={() => handleQuickAction('log_water', { amount: 250 })}
                >
                  <Droplets className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs">Log 250ml water</span>
                </Button>
              </div>
              
              {/* Chat Suggestions */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {['Create a goal', 'View my budget', 'Track my fitness', 'Plan my week'].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <AnimatePresence>
            {messages.map((message) => (
              <React.Fragment key={message.id}>
                {message.type === 'user' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-2.5">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </motion.div>
                ) : (
                  <AgentChatBubble
                    content={message.content}
                    agentId={message.agentId}
                    agentName={message.agentName}
                    domain={message.domain}
                    actions={message.actions}
                    stats={message.stats}
                    mode={message.mode}
                    timestamp={message.timestamp}
                    isStreaming={message.isStreaming}
                    onAction={handleQuickAction}
                  />
                )}
              </React.Fragment>
            ))}
          </AnimatePresence>
          
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Agents processing...</span>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tell me what you want to achieve..."
              className="pr-20 h-11 rounded-xl bg-background"
              disabled={isProcessing}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                <Mic className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <Button 
            type="submit" 
            size="icon" 
            className="h-11 w-11 rounded-xl"
            disabled={!inputValue.trim() || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AgentChatInterface;