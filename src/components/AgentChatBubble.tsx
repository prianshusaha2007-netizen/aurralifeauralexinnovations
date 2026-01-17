import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AgentDomain, AutonomyMode } from '@/agents/types';

interface AgentChatBubbleProps {
  content: string;
  agentId?: string;
  agentName?: string;
  domain?: AgentDomain;
  actions?: { label: string; action: string; data?: any }[];
  stats?: { label: string; value: string | number }[];
  mode?: AutonomyMode;
  timestamp: Date;
  onAction?: (action: string, data?: any) => void;
}

const domainColors: Record<AgentDomain, string> = {
  study: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
  fitness: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  finance: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
  social: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
  work: 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
  skill: 'from-cyan-500/20 to-sky-500/20 border-cyan-500/30',
  routine: 'from-primary/20 to-primary/10 border-primary/30',
  reflection: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
  recovery: 'from-teal-500/20 to-cyan-500/20 border-teal-500/30',
};

const modeLabels: Record<AutonomyMode, { label: string; color: string }> = {
  do_as_told: { label: 'Manual', color: 'text-muted-foreground' },
  suggest_approve: { label: 'Suggest', color: 'text-blue-500' },
  predict_confirm: { label: 'Predict', color: 'text-purple-500' },
  full_auto: { label: 'Auto', color: 'text-green-500' },
  adaptive: { label: 'Adaptive', color: 'text-primary' },
};

const AgentChatBubble: React.FC<AgentChatBubbleProps> = ({
  content,
  agentId,
  agentName,
  domain,
  actions,
  stats,
  mode,
  timestamp,
  onAction,
}) => {
  const colorClass = domain ? domainColors[domain] : 'from-muted to-muted/50 border-border';
  const modeInfo = mode ? modeLabels[mode] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="flex justify-start"
    >
      <Card className={`max-w-[85%] p-0 overflow-hidden border bg-gradient-to-br ${colorClass}`}>
        {/* Agent Header */}
        {agentName && (
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-background/30">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-medium">{agentName}</span>
              {domain && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                  {domain}
                </Badge>
              )}
            </div>
            {modeInfo && (
              <span className={`text-[10px] ${modeInfo.color}`}>
                {modeInfo.label}
              </span>
            )}
          </div>
        )}

        {/* Message Content */}
        <div className="px-3 py-2">
          <p className="text-sm leading-relaxed">{content}</p>
        </div>

        {/* Stats Row */}
        {stats && stats.length > 0 && (
          <div className="px-3 py-2 border-t border-border/50 bg-background/20">
            <div className="flex gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-xs text-muted-foreground">{stat.label}:</span>
                  <span className="text-xs font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Row */}
        {actions && actions.length > 0 && (
          <div className="px-3 py-2 border-t border-border/50 bg-background/30">
            <div className="flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => onAction?.(action.action, action.data)}
                >
                  {action.label}
                  <ChevronRight className="w-3 h-3" />
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="px-3 py-1 bg-background/10">
          <span className="text-[10px] text-muted-foreground">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </Card>
    </motion.div>
  );
};

export default AgentChatBubble;
