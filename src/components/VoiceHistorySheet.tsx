import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Trash2, MessageSquare, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VoiceTranscript {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ConversationGroup {
  conversationId: string;
  date: Date;
  messages: VoiceTranscript[];
}

interface VoiceHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VoiceHistorySheet: React.FC<VoiceHistorySheetProps> = ({
  open,
  onOpenChange
}) => {
  const [conversations, setConversations] = useState<ConversationGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('voice_transcripts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by conversation_id
      const grouped = (data || []).reduce((acc: Record<string, VoiceTranscript[]>, msg) => {
        if (!acc[msg.conversation_id]) {
          acc[msg.conversation_id] = [];
        }
        acc[msg.conversation_id].push(msg);
        return acc;
      }, {});

      // Convert to array and sort by most recent
      const conversationGroups: ConversationGroup[] = Object.entries(grouped)
        .map(([conversationId, messages]) => ({
          conversationId,
          date: new Date(messages[0]?.created_at || Date.now()),
          messages
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      setConversations(conversationGroups);
    } catch (error) {
      console.error('Error fetching voice history:', error);
      toast.error('Failed to load voice history');
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('voice_transcripts')
        .delete()
        .eq('conversation_id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.conversationId !== conversationId));
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Voice Conversation History
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No voice conversations yet</p>
              <p className="text-sm mt-1">Start a voice chat to see your history here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {conversations.map((conversation) => (
                <div
                  key={conversation.conversationId}
                  className="border rounded-lg p-4 bg-card"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {format(conversation.date, 'MMM d, yyyy h:mm a')}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteConversation(conversation.conversationId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {conversation.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-2 text-sm",
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <Bot className="w-3.5 h-3.5 text-primary" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 max-w-[85%]",
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          {msg.content}
                        </div>
                        {msg.role === 'user' && (
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
