import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, Bug, HelpCircle, Lightbulb, Send, 
  Copy, Check, ChevronDown, Sparkles, Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CodingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'question' | 'debug' | 'explain' | 'general';
  timestamp: Date;
  codeBlocks?: string[];
}

interface CodingMentorModeProps {
  isActive: boolean;
  onSendMessage: (message: string, type: string) => Promise<string>;
  className?: string;
}

const QUICK_ACTIONS = [
  { icon: Bug, label: 'Debug Error', type: 'debug', prompt: 'Help me debug this error:' },
  { icon: HelpCircle, label: 'Explain Code', type: 'explain', prompt: 'Explain this code:' },
  { icon: Lightbulb, label: 'Suggest Fix', type: 'suggest', prompt: 'Suggest a fix for:' },
  { icon: Code, label: 'Review Code', type: 'review', prompt: 'Review this code:' },
];

export const CodingMentorMode: React.FC<CodingMentorModeProps> = ({
  isActive,
  onSendMessage,
  className
}) => {
  const [messages, setMessages] = useState<CodingMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('general');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: CodingMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      type: selectedType as CodingMessage['type'],
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await onSendMessage(input, selectedType);
      
      const assistantMessage: CodingMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        type: selectedType as CodingMessage['type'],
        timestamp: new Date(),
        codeBlocks: extractCodeBlocks(response)
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    setSelectedType(action.type);
    setInput(action.prompt + '\n\n');
  };

  const extractCodeBlocks = (content: string): string[] => {
    const codeBlockRegex = /```[\s\S]*?```/g;
    const matches = content.match(codeBlockRegex);
    return matches || [];
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text.replace(/```\w*\n?/g, '').replace(/```/g, ''));
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        const language = lines[0].replace('```', '').trim() || 'code';
        const code = lines.slice(1, -1).join('\n');
        
        return (
          <div key={index} className="my-3">
            <div className="flex items-center justify-between bg-muted/50 px-3 py-1 rounded-t-lg border-b border-border">
              <span className="text-xs text-muted-foreground font-mono">{language}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(code, `${index}`)}
                className="h-6 px-2"
              >
                {copiedId === `${index}` ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
            <pre className="bg-muted/30 p-3 rounded-b-lg overflow-x-auto">
              <code className="text-sm font-mono">{code}</code>
            </pre>
          </div>
        );
      }
      
      return <p key={index} className="whitespace-pre-wrap">{part}</p>;
    });
  };

  if (!isActive) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <Terminal className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground mb-2">Coding Mentor Mode</p>
        <p className="text-sm text-muted-foreground/70">
          Available during your coding time blocks
        </p>
      </Card>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
          <Code className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold">Coding Mentor</h3>
          <p className="text-xs text-muted-foreground">AURRA is here to help debug and explain</p>
        </div>
        <div className="ml-auto">
          <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full">
            Active
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.type}
            variant={selectedType === action.type ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickAction(action)}
            className="whitespace-nowrap"
          >
            <action.icon className="w-4 h-4 mr-1" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto text-primary/30 mb-4" />
              <p className="text-muted-foreground">
                Paste your code or describe your problem
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                I'll help you debug, explain, or improve it
              </p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'max-w-[90%]',
                  message.role === 'user' ? 'ml-auto' : 'mr-auto'
                )}
              >
                <Card
                  className={cn(
                    'p-4',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50'
                  )}
                >
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {formatMessage(message.content)}
                    </div>
                  )}
                </Card>
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm">Analyzing...</span>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your code or describe the issue..."
            className="min-h-[100px] pr-12 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="absolute bottom-2 right-2 rounded-full aura-gradient"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Cmd/Ctrl + Enter to send
        </p>
      </div>
    </div>
  );
};

// Standalone component for embedding in chat
export const CodingMentorBanner: React.FC<{ onActivate: () => void }> = ({ onActivate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4"
    >
      <Card className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <Code className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Coding Time Active</p>
            <p className="text-sm text-muted-foreground">
              I'm ready to help debug and explain code
            </p>
          </div>
          <Button onClick={onActivate} size="sm" className="bg-green-500 hover:bg-green-600">
            Open Mentor
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
