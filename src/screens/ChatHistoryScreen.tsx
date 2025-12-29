import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, MessageCircle, Trash2, Calendar, Search, X, ArrowLeft, Sun, Moon, Zap, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAura } from '@/contexts/AuraContext';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ChatSummary {
  id: string;
  summary: string;
  emotional_trend: string | null;
  key_topics: string[] | null;
  message_count: number;
  time_range_start: string;
  time_range_end: string;
  created_at: string;
}

interface GroupedMessages {
  label: string;
  messages: {
    id: string;
    preview: string;
    timestamp: Date;
    sender: 'user' | 'aura';
  }[];
}

const getEmotionalIcon = (trend: string | null) => {
  if (!trend) return null;
  const lower = trend.toLowerCase();
  if (lower.includes('happy') || lower.includes('positive') || lower.includes('good') || lower.includes('motivated')) {
    return <Sun className="w-4 h-4 text-amber-500" />;
  }
  if (lower.includes('tired') || lower.includes('calm') || lower.includes('neutral')) {
    return <Moon className="w-4 h-4 text-indigo-400" />;
  }
  if (lower.includes('energetic') || lower.includes('focused') || lower.includes('productive')) {
    return <Zap className="w-4 h-4 text-primary" />;
  }
  return null;
};

export const ChatHistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { chatMessages, clearChatHistory } = useAura();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'summaries' | 'messages'>('summaries');
  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClearAll, setShowClearAll] = useState(false);

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_summaries')
        .select('*')
        .order('time_range_start', { ascending: false });

      if (error) throw error;
      setSummaries(data || []);
    } catch (error) {
      console.error('Error fetching summaries:', error);
    } finally {
      setIsLoadingSummaries(false);
    }
  };

  const deleteSummary = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chat_summaries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSummaries(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Chat deleted' });
    } catch (error) {
      console.error('Error deleting summary:', error);
      toast({ title: 'Failed to delete', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  const clearAllSummaries = async () => {
    try {
      const { error } = await supabase
        .from('chat_summaries')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      setSummaries([]);
      toast({ title: 'Chat history cleared' });
    } catch (error) {
      console.error('Error clearing summaries:', error);
      toast({ title: 'Failed to clear', variant: 'destructive' });
    } finally {
      setShowClearAll(false);
    }
  };

  // Filter summaries
  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return summaries;
    const query = searchQuery.toLowerCase();
    return summaries.filter(s =>
      s.summary.toLowerCase().includes(query) ||
      s.emotional_trend?.toLowerCase().includes(query) ||
      s.key_topics?.some(t => t.toLowerCase().includes(query))
    );
  }, [summaries, searchQuery]);

  // Group summaries by date
  const groupedSummaries = useMemo(() => {
    const groups: Record<string, ChatSummary[]> = {};
    filteredSummaries.forEach(summary => {
      const date = parseISO(summary.time_range_start);
      let label: string;
      if (isToday(date)) {
        label = 'Today';
      } else if (isYesterday(date)) {
        label = 'Yesterday';
      } else if (isThisWeek(date)) {
        label = 'This Week';
      } else {
        label = format(date, 'MMMM yyyy');
      }
      if (!groups[label]) groups[label] = [];
      groups[label].push(summary);
    });
    return Object.entries(groups);
  }, [filteredSummaries]);

  // Messages tab logic (existing)
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return chatMessages;
    const query = searchQuery.toLowerCase();
    return chatMessages.filter(msg => 
      msg.content.toLowerCase().includes(query)
    );
  }, [chatMessages, searchQuery]);

  const groupMessagesByDate = (): GroupedMessages[] => {
    const groups: Record<string, GroupedMessages['messages']> = {};
    
    filteredMessages.forEach((msg) => {
      const date = new Date(msg.timestamp);
      let label: string;
      
      if (isToday(date)) {
        label = 'Today';
      } else if (isYesterday(date)) {
        label = 'Yesterday';
      } else if (isThisWeek(date)) {
        label = 'This Week';
      } else {
        label = format(date, 'MMMM yyyy');
      }
      
      if (!groups[label]) groups[label] = [];
      groups[label].push({
        id: msg.id,
        preview: msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : ''),
        timestamp: date,
        sender: msg.sender,
      });
    });

    return Object.entries(groups).map(([label, messages]) => ({
      label,
      messages: messages.reverse(),
    }));
  };

  const handleClearHistory = () => {
    clearChatHistory();
    toast({
      title: "Today's chat cleared",
      description: "Current conversation has been deleted.",
    });
  };

  const groupedMessages = groupMessagesByDate();

  return (
    <div className="h-full overflow-y-auto pb-24 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Chat History</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowClearAll(true)}
          >
            Clear All
          </Button>
        </div>
        
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-muted/50 rounded-full"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="px-4 pb-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summaries">Daily Summaries</TabsTrigger>
            <TabsTrigger value="messages">All Messages</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4">
        {/* Summaries Tab */}
        {activeTab === 'summaries' && (
          <div className="space-y-6">
            {isLoadingSummaries ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              </div>
            ) : groupedSummaries.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">
                  {searchQuery ? 'No results found' : 'No daily summaries yet'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Daily conversations are summarized automatically
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {groupedSummaries.map(([label, items]) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-medium text-primary">{label}</h3>
                    </div>
                    <div className="space-y-3">
                      {items.map((summary) => (
                        <motion.div
                          key={summary.id}
                          className={cn(
                            "bg-card rounded-xl p-4 border border-border/50",
                            "hover:border-primary/30 transition-colors"
                          )}
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                                {summary.summary}
                              </p>
                              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                                {summary.emotional_trend && (
                                  <div className="flex items-center gap-1">
                                    {getEmotionalIcon(summary.emotional_trend)}
                                    <span className="capitalize">{summary.emotional_trend}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-3 h-3" />
                                  <span>{summary.message_count} messages</span>
                                </div>
                              </div>
                              {summary.key_topics && summary.key_topics.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {summary.key_topics.slice(0, 3).map((topic, i) => (
                                    <span
                                      key={i}
                                      className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                                    >
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteId(summary.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            {groupedMessages.length > 0 ? (
              groupedMessages.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-muted-foreground">{group.label}</h3>
                  </div>
                  <div className="space-y-2">
                    {group.messages.map((msg) => (
                      <Card 
                        key={msg.id}
                        className={cn(
                          'border-border/50 hover:border-primary/30 transition-colors',
                          msg.sender === 'user' && 'border-l-2 border-l-primary'
                        )}
                      >
                        <CardContent className="py-3 px-4">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'p-2 rounded-full shrink-0',
                              msg.sender === 'user' 
                                ? 'bg-primary/10' 
                                : 'bg-accent/10'
                            )}>
                              <MessageCircle className={cn(
                                'w-4 h-4',
                                msg.sender === 'user' 
                                  ? 'text-primary' 
                                  : 'text-accent'
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-medium capitalize text-muted-foreground">
                                  {msg.sender === 'user' ? 'You' : 'AURRA'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(msg.timestamp, 'h:mm a')}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/80 line-clamp-2">
                                {msg.preview}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">
                  {searchQuery ? 'No results found' : 'No messages today'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start chatting with AURRA
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this summary?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this day's summary. Your life memories won't be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteSummary(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation */}
      <AlertDialog open={showClearAll} onOpenChange={setShowClearAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all chat history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all summaries and today's messages. Life memories won't be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                clearAllSummaries();
                handleClearHistory();
              }}
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};