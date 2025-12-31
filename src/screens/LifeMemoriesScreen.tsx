import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, User, Target, Heart, Brain, Sparkles, Clock, Star, 
  MessageCircle, Compass, Users, Lightbulb, Calendar, X, Eye, Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useRoutineVisualization } from '@/hooks/useRoutineVisualization';

type MemoryType = 'person' | 'goal' | 'habit' | 'emotional_pattern' | 'decision' | 'preference' | 'routine' | 'relationship';

interface LifeMemory {
  id: string;
  user_id: string;
  memory_type: MemoryType;
  title: string;
  content: string;
  metadata: Record<string, any>;
  importance_score: number;
  last_referenced_at: string;
  created_at: string;
  updated_at: string;
}

const memoryTypeConfig: Record<MemoryType, { icon: React.ElementType; label: string; color: string; chatPrompt: string }> = {
  person: { icon: User, label: 'Person', color: 'text-blue-500 bg-blue-500/10', chatPrompt: 'Tell me about someone important to you' },
  goal: { icon: Target, label: 'Goal', color: 'text-emerald-500 bg-emerald-500/10', chatPrompt: 'What goal are you working towards?' },
  habit: { icon: Calendar, label: 'Habit', color: 'text-orange-500 bg-orange-500/10', chatPrompt: 'What habits are you building?' },
  emotional_pattern: { icon: Heart, label: 'Emotion', color: 'text-pink-500 bg-pink-500/10', chatPrompt: 'How have you been feeling lately?' },
  decision: { icon: Compass, label: 'Decision', color: 'text-purple-500 bg-purple-500/10', chatPrompt: 'What decision are you thinking about?' },
  preference: { icon: Lightbulb, label: 'Preference', color: 'text-yellow-500 bg-yellow-500/10', chatPrompt: 'Tell me what you prefer or like' },
  routine: { icon: Clock, label: 'Routine', color: 'text-teal-500 bg-teal-500/10', chatPrompt: 'Describe your daily routine' },
  relationship: { icon: Users, label: 'Relationship', color: 'text-rose-500 bg-rose-500/10', chatPrompt: 'Tell me about your relationships' },
};

const memoryTypes: MemoryType[] = ['goal', 'person', 'habit', 'preference', 'routine', 'emotional_pattern', 'decision', 'relationship'];

// AI control prompts
const AI_PROMPTS = {
  add: 'Tell me something you want me to remember',
  edit: (title: string) => `Update my memory about "${title}"`,
  delete: (title: string) => `Forget about "${title}"`,
  viewAll: 'What do you remember about me?',
  byCategory: (cat: string) => `What do you know about my ${cat}?`,
};

export const LifeMemoriesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [memories, setMemories] = useState<LifeMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<MemoryType | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<LifeMemory | null>(null);
  const [showRoutineVisual, setShowRoutineVisual] = useState(false);
  
  const { routineVisual } = useRoutineVisualization();

  const fetchMemories = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('life_memories')
        .select('*')
        .order('importance_score', { ascending: false })
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      setMemories((data || []) as LifeMemory[]);
    } catch (error) {
      console.error('Error fetching life memories:', error);
      toast.error('Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  // Navigate to chat with a pre-filled message
  const goToChat = (message?: string) => {
    if (message) {
      localStorage.setItem('aura-prefilled-message', message);
    }
    navigate('/');
  };

  const filteredMemories = memories.filter(memory => {
    const matchesSearch = !searchQuery || 
      memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || memory.memory_type === selectedType;
    return matchesSearch && matchesType;
  });

  const groupedMemories = {
    goals: filteredMemories.filter(m => m.memory_type === 'goal'),
    important: filteredMemories.filter(m => m.importance_score >= 7 && m.memory_type !== 'goal'),
    recent: filteredMemories.filter(m => m.importance_score < 7 && m.memory_type !== 'goal'),
  };

  const MemoryCard = ({ memory }: { memory: LifeMemory }) => {
    const config = memoryTypeConfig[memory.memory_type];
    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 bg-card rounded-2xl border border-border/50 cursor-pointer hover:border-primary/30 transition-all"
        onClick={() => setSelectedMemory(memory)}
      >
        <div className={cn('p-2.5 rounded-xl shrink-0', config.color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs font-normal">
              {config.label}
            </Badge>
            {memory.importance_score >= 7 && (
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            )}
          </div>
          <h3 className="font-medium text-sm mb-1 line-clamp-1">{memory.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{memory.content}</p>
          <p className="text-xs text-muted-foreground/50 mt-2">
            {format(new Date(memory.updated_at), 'MMM d, yyyy')}
          </p>
        </div>
      </motion.div>
    );
  };

  // Memory Detail Sheet
  const MemoryDetailSheet = ({ memory, onClose }: { memory: LifeMemory; onClose: () => void }) => {
    const config = memoryTypeConfig[memory.memory_type];
    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[80vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Handle */}
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
            
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className={cn('p-3 rounded-2xl', config.color)}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <Badge variant="secondary" className="mb-2">{config.label}</Badge>
                <h2 className="text-xl font-semibold">{memory.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Saved {format(new Date(memory.created_at), 'MMMM d, yyyy')}
                </p>
              </div>
              {memory.importance_score >= 7 && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-xs">Important</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="bg-muted/30 rounded-2xl p-4 mb-6">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{memory.content}</p>
            </div>

            {/* AI Control Actions */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center mb-4">
                💬 Ask AURRA to manage this memory
              </p>
              
              <Button
                variant="outline"
                className="w-full rounded-xl justify-start gap-3"
                onClick={() => {
                  onClose();
                  goToChat(AI_PROMPTS.edit(memory.title));
                }}
              >
                <MessageCircle className="w-4 h-4 text-primary" />
                <span>Update this memory</span>
              </Button>
              
              <Button
                variant="outline"
                className="w-full rounded-xl justify-start gap-3 text-destructive hover:text-destructive"
                onClick={() => {
                  onClose();
                  goToChat(AI_PROMPTS.delete(memory.title));
                }}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Ask AURRA to forget this</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Life Memory</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Everything AURRA remembers about you
        </p>
      </div>

      {/* AI Control Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 mb-4 border border-primary/20"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">AI-Managed Memories</p>
            <p className="text-xs text-muted-foreground">
              Tell AURRA what to remember, update, or forget
            </p>
          </div>
          <Button
            size="sm"
            className="rounded-xl gap-2"
            onClick={() => goToChat(AI_PROMPTS.add)}
          >
            <MessageCircle className="w-4 h-4" />
            Add
          </Button>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search memories..."
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Type Filter Pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={selectedType === null ? "default" : "outline"}
          size="sm"
          className="rounded-full text-xs shrink-0"
          onClick={() => setSelectedType(null)}
        >
          All
        </Button>
        {memoryTypes.map(type => {
          const count = memories.filter(m => m.memory_type === type).length;
          if (count === 0) return null;
          const config = memoryTypeConfig[type];
          return (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              size="sm"
              className="rounded-full text-xs shrink-0 gap-1.5"
              onClick={() => setSelectedType(selectedType === type ? null : type)}
            >
              {React.createElement(config.icon, { className: 'w-3 h-3' })}
              {config.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Memories List */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Routine Visual Section */}
        {routineVisual && !selectedType && !searchQuery && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-muted-foreground">MY ROUTINE</h2>
            </div>
            <Card 
              className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setShowRoutineVisual(true)}
            >
              <div className="relative">
                <img 
                  src={routineVisual.imageUrl} 
                  alt="Your daily routine" 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Daily Routine Visual</p>
                    <p className="text-xs text-muted-foreground">
                      {format(routineVisual.generatedAt, 'MMM d, yyyy')} • {routineVisual.blocksCount} blocks
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" className="rounded-full gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <Sparkles className="w-8 h-8 mx-auto text-primary animate-pulse mb-4" />
            <p className="text-muted-foreground">Loading memories...</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-2">
              {searchQuery || selectedType ? 'No matching memories' : 'No memories yet'}
            </p>
            <Button
              variant="outline"
              className="rounded-xl gap-2"
              onClick={() => goToChat(AI_PROMPTS.add)}
            >
              <MessageCircle className="w-4 h-4" />
              Tell AURRA something to remember
            </Button>
          </div>
        ) : (
          <>
            {/* Goals Section */}
            {groupedMemories.goals.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-sm font-semibold text-muted-foreground">GOALS</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground h-7"
                    onClick={() => goToChat(AI_PROMPTS.byCategory('goals'))}
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Ask about goals
                  </Button>
                </div>
                <div className="space-y-3">
                  {groupedMemories.goals.map(memory => (
                    <MemoryCard key={memory.id} memory={memory} />
                  ))}
                </div>
              </div>
            )}

            {/* Important Memories */}
            {groupedMemories.important.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <h2 className="text-sm font-semibold text-muted-foreground">IMPORTANT</h2>
                </div>
                <div className="space-y-3">
                  {groupedMemories.important.map(memory => (
                    <MemoryCard key={memory.id} memory={memory} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Memories */}
            {groupedMemories.recent.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-muted-foreground">OTHER MEMORIES</h2>
                </div>
                <div className="space-y-3">
                  {groupedMemories.recent.map(memory => (
                    <MemoryCard key={memory.id} memory={memory} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Stats */}
      {memories.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-center text-muted-foreground">
            {memories.length} memories • {memories.filter(m => m.importance_score >= 7).length} important
          </p>
        </div>
      )}

      {/* Memory Detail Sheet */}
      <AnimatePresence>
        {selectedMemory && (
          <MemoryDetailSheet
            memory={selectedMemory}
            onClose={() => setSelectedMemory(null)}
          />
        )}
      </AnimatePresence>

      {/* Routine Visual Full View Modal */}
      <AnimatePresence>
        {showRoutineVisual && routineVisual && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowRoutineVisual(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Your Daily Routine</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowRoutineVisual(false)}
                    className="h-8 w-8 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <img 
                  src={routineVisual.imageUrl} 
                  alt="Your daily routine visualization"
                  className="w-full h-auto"
                />
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
