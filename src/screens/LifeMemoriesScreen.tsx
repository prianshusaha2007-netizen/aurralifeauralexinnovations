import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Plus, Trash2, Edit2, User, Target, Heart, 
  Brain, Sparkles, Clock, Star, Filter, X, Check,
  Compass, Users, Lightbulb, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const memoryTypeConfig: Record<MemoryType, { icon: React.ElementType; label: string; color: string }> = {
  person: { icon: User, label: 'Person', color: 'text-blue-500 bg-blue-500/10' },
  goal: { icon: Target, label: 'Goal', color: 'text-emerald-500 bg-emerald-500/10' },
  habit: { icon: Calendar, label: 'Habit', color: 'text-orange-500 bg-orange-500/10' },
  emotional_pattern: { icon: Heart, label: 'Emotion', color: 'text-pink-500 bg-pink-500/10' },
  decision: { icon: Compass, label: 'Decision', color: 'text-purple-500 bg-purple-500/10' },
  preference: { icon: Lightbulb, label: 'Preference', color: 'text-yellow-500 bg-yellow-500/10' },
  routine: { icon: Clock, label: 'Routine', color: 'text-teal-500 bg-teal-500/10' },
  relationship: { icon: Users, label: 'Relationship', color: 'text-rose-500 bg-rose-500/10' },
};

const memoryTypes: MemoryType[] = ['goal', 'person', 'habit', 'preference', 'routine', 'emotional_pattern', 'decision', 'relationship'];

export const LifeMemoriesScreen: React.FC = () => {
  const [memories, setMemories] = useState<LifeMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<MemoryType | null>(null);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<LifeMemory | null>(null);
  
  // Form states
  const [formType, setFormType] = useState<MemoryType>('goal');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImportance, setFormImportance] = useState(5);

  const fetchMemories = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('life_memories')
        .select('*')
        .order('importance_score', { ascending: false })
        .order('updated_at', { ascending: false });

      const { data, error } = await query;
      
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

  const handleAddMemory = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('life_memories')
        .insert({
          user_id: user.id,
          memory_type: formType,
          title: formTitle.trim(),
          content: formContent.trim(),
          importance_score: formImportance,
          metadata: {},
        })
        .select()
        .single();

      if (error) throw error;
      
      setMemories(prev => [data as LifeMemory, ...prev]);
      resetForm();
      setIsAddDialogOpen(false);
      toast.success('Memory saved');
    } catch (error) {
      console.error('Error adding memory:', error);
      toast.error('Failed to save memory');
    }
  };

  const handleUpdateMemory = async () => {
    if (!editingMemory || !formTitle.trim() || !formContent.trim()) return;

    try {
      const { error } = await supabase
        .from('life_memories')
        .update({
          memory_type: formType,
          title: formTitle.trim(),
          content: formContent.trim(),
          importance_score: formImportance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingMemory.id);

      if (error) throw error;
      
      setMemories(prev => prev.map(m => 
        m.id === editingMemory.id 
          ? { ...m, memory_type: formType, title: formTitle.trim(), content: formContent.trim(), importance_score: formImportance }
          : m
      ));
      resetForm();
      setEditingMemory(null);
      toast.success('Memory updated');
    } catch (error) {
      console.error('Error updating memory:', error);
      toast.error('Failed to update memory');
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('life_memories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMemories(prev => prev.filter(m => m.id !== id));
      toast.success('Memory deleted');
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast.error('Failed to delete memory');
    }
  };

  const resetForm = () => {
    setFormType('goal');
    setFormTitle('');
    setFormContent('');
    setFormImportance(5);
  };

  const openEditDialog = (memory: LifeMemory) => {
    setEditingMemory(memory);
    setFormType(memory.memory_type);
    setFormTitle(memory.title);
    setFormContent(memory.content);
    setFormImportance(memory.importance_score);
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
      <div className="flex items-start gap-3 p-4 bg-card rounded-2xl border border-border/50 group hover:border-border transition-colors">
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
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => openEditDialog(memory)}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => handleDeleteMemory(memory.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  const MemoryForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4 pt-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Type</label>
        <Select value={formType} onValueChange={(v) => setFormType(v as MemoryType)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {memoryTypes.map(type => (
              <SelectItem key={type} value={type}>
                <div className="flex items-center gap-2">
                  {React.createElement(memoryTypeConfig[type].icon, { className: 'w-4 h-4' })}
                  {memoryTypeConfig[type].label}
                </div>
              </SelectItem>
            ))
            }
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Title</label>
        <Input
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          placeholder="What should AURRA remember?"
          className="rounded-xl"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Details</label>
        <Textarea
          value={formContent}
          onChange={(e) => setFormContent(e.target.value)}
          placeholder="Tell me more..."
          className="rounded-xl min-h-[100px] resize-none"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">
          Importance ({formImportance}/10)
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={formImportance}
          onChange={(e) => setFormImportance(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>
      
      <Button 
        onClick={isEdit ? handleUpdateMemory : handleAddMemory} 
        className="w-full rounded-xl"
      >
        <Check className="w-4 h-4 mr-2" />
        {isEdit ? 'Update Memory' : 'Save Memory'}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Life</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Your goals, preferences, and important memories
        </p>
      </div>

      {/* Search & Add */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="pl-9 rounded-xl"
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-xl shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add Memory</DialogTitle>
            </DialogHeader>
            <MemoryForm />
          </DialogContent>
        </Dialog>
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
        {isLoading ? (
          <div className="text-center py-12">
            <Sparkles className="w-8 h-8 mx-auto text-primary animate-pulse mb-4" />
            <p className="text-muted-foreground">Loading memories...</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || selectedType ? 'No matching memories' : 'No memories yet'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {searchQuery || selectedType ? 'Try a different filter' : 'Tell AURRA about your goals and preferences!'}
            </p>
          </div>
        ) : (
          <>
            {/* Goals Section */}
            {groupedMemories.goals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-semibold text-muted-foreground">GOALS</h2>
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

      {/* Edit Dialog */}
      <Dialog open={!!editingMemory} onOpenChange={(open) => !open && setEditingMemory(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
          </DialogHeader>
          <MemoryForm isEdit />
        </DialogContent>
      </Dialog>

      {/* Footer Stats */}
      {memories.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-center text-muted-foreground">
            {memories.length} memories • {memories.filter(m => m.importance_score >= 7).length} important
          </p>
        </div>
      )}
    </div>
  );
};
