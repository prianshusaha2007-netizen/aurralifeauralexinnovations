import React from 'react';
import { Cpu, Zap, Brain, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  speed: 'fast' | 'medium' | 'slow';
  capability: 'basic' | 'advanced' | 'premium';
}

const models: AIModel[] = [
  {
    id: 'gemini-flash',
    name: 'Gemini Flash',
    description: 'Fast & balanced',
    icon: <Zap className="w-4 h-4" />,
    speed: 'fast',
    capability: 'advanced',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    description: 'Most capable',
    icon: <Brain className="w-4 h-4" />,
    speed: 'medium',
    capability: 'premium',
  },
  {
    id: 'gpt-5',
    name: 'GPT-5',
    description: 'Deep reasoning',
    icon: <Sparkles className="w-4 h-4" />,
    speed: 'slow',
    capability: 'premium',
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    description: 'Fast reasoning',
    icon: <Cpu className="w-4 h-4" />,
    speed: 'fast',
    capability: 'advanced',
  },
];

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  const selectedModel = models.find(m => m.id === value) || models[0];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger 
        className={cn(
          'w-auto min-w-[140px] h-8 text-xs rounded-full bg-muted/50 border-border/50',
          className
        )}
      >
        <div className="flex items-center gap-1.5">
          {selectedModel.icon}
          <SelectValue placeholder="Select model" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex items-center gap-2">
              {model.icon}
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted-foreground">{model.description}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
