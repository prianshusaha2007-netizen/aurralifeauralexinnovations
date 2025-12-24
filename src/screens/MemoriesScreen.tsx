import React, { useState } from 'react';
import { Plus, Trash2, User, Briefcase, Heart, Calendar, BookOpen, MessageSquare, Brain, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAura } from '@/contexts/AuraContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const categoryIcons: Record<string, React.ElementType> = {
  personal: User,
  work: Briefcase,
  hobbies: Heart,
  dates: Calendar,
  notes: BookOpen,
  phrases: MessageSquare,
};

const categoryColors: Record<string, string> = {
  personal: 'text-blue-500 bg-blue-500/10',
  work: 'text-orange-500 bg-orange-500/10',
  hobbies: 'text-pink-500 bg-pink-500/10',
  dates: 'text-purple-500 bg-purple-500/10',
  notes: 'text-yellow-500 bg-yellow-500/10',
  phrases: 'text-green-500 bg-green-500/10',
};

export const MemoriesScreen: React.FC = () => {
  const { userProfile, memories, addMemory, deleteMemory } = useAura();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('notes');
  const [newContent, setNewContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleAddMemory = () => {
    if (!newContent.trim()) return;
    addMemory({ category: newCategory, content: newContent.trim() });
    setNewContent('');
    setIsDialogOpen(false);
  };

  const filteredMemories = memories.filter(memory => {
    const matchesSearch = !searchQuery || 
      memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || memory.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const profileMemories = [
    { icon: User, label: 'Name', value: userProfile.name || 'Not set', color: 'text-primary' },
    { icon: Calendar, label: 'Age', value: userProfile.age || 'Not set', color: 'text-accent' },
    { icon: Briefcase, label: 'Work', value: userProfile.professions?.join(', ') || userProfile.profession || 'Not set', color: 'text-orange-500' },
  ];

  const categories = ['personal', 'work', 'hobbies', 'dates', 'notes', 'phrases'];

  return (
    <div className="flex flex-col h-full p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold aura-gradient-text">AURA Remembers</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Everything I remember about you — safely stored 💫
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-card rounded-2xl p-4 mb-4 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground">ABOUT YOU</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {profileMemories.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="text-center">
                <div className={cn('inline-flex p-2 rounded-xl bg-muted/50 mb-2', item.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium truncate">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filter */}
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-xl aura-gradient shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add New Memory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal Info</SelectItem>
                  <SelectItem value="work">Work Related</SelectItem>
                  <SelectItem value="hobbies">Hobbies & Interests</SelectItem>
                  <SelectItem value="dates">Important Dates</SelectItem>
                  <SelectItem value="notes">Notes</SelectItem>
                  <SelectItem value="phrases">Frequent Phrases</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="What should I remember?"
                className="rounded-xl"
              />
              <Button onClick={handleAddMemory} className="w-full rounded-xl aura-gradient">
                Save Memory
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          className="rounded-full text-xs shrink-0"
          onClick={() => setSelectedCategory(null)}
        >
          All ({memories.length})
        </Button>
        {categories.map(cat => {
          const count = memories.filter(m => m.category === cat).length;
          if (count === 0) return null;
          return (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              className="rounded-full text-xs shrink-0 capitalize"
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            >
              {cat} ({count})
            </Button>
          );
        })}
      </div>

      {/* Memories List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory ? 'No matching memories found' : 'No memories saved yet'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {searchQuery || selectedCategory ? 'Try a different search' : 'Tell me things you want me to remember!'}
            </p>
          </div>
        ) : (
          filteredMemories.map((memory) => {
            const Icon = categoryIcons[memory.category] || BookOpen;
            const colorClass = categoryColors[memory.category] || 'text-primary bg-primary/10';
            
            return (
              <div
                key={memory.id}
                className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border/50 animate-fade-in group"
              >
                <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-muted-foreground capitalize">
                      {memory.category.replace('_', ' ')}
                    </p>
                    {memory.createdAt && (
                      <span className="text-xs text-muted-foreground/50">
                        • {format(new Date(memory.createdAt), 'MMM d')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{memory.content}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteMemory(memory.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Memory Stats */}
      {memories.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-center text-muted-foreground">
            💾 {memories.length} memories stored • Your data is private & secure
          </p>
        </div>
      )}
    </div>
  );
};
