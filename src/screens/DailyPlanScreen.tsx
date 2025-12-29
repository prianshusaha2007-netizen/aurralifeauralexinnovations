import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Check, 
  Clock, 
  Sparkles,
  Target,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useDailyFocus } from '@/hooks/useDailyFocus';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DailyPlanScreenProps {
  onBack: () => void;
}

const AURRA_SUGGESTIONS = [
  "What's the one thing that would make today feel successful?",
  "What task have you been putting off that deserves your focus today?",
  "What would move you closer to your goals?",
  "What's something important but not urgent?",
  "What would make you proud to complete today?",
];

const DailyPlanScreen: React.FC<DailyPlanScreenProps> = ({ onBack }) => {
  const { 
    focusBlocks, 
    isLoading, 
    addFocusBlock, 
    completeFocusBlock, 
    deleteFocusBlock,
    getCompletionProgress,
    canAddMore 
  } = useDailyFocus();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState('30');
  const [suggestion] = useState(() => 
    AURRA_SUGGESTIONS[Math.floor(Math.random() * AURRA_SUGGESTIONS.length)]
  );

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    
    await addFocusBlock(newTitle.trim(), newDescription.trim() || undefined, parseInt(newDuration));
    setNewTitle('');
    setNewDescription('');
    setNewDuration('30');
    setShowAddDialog(false);
  };

  const progress = getCompletionProgress();
  const completedCount = focusBlocks.filter(b => b.completed).length;

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'from-primary/20 to-primary/10 border-primary/30';
      case 2: return 'from-secondary/20 to-secondary/10 border-secondary/30';
      case 3: return 'from-muted/30 to-muted/20 border-muted-foreground/20';
      default: return 'from-muted/20 to-muted/10 border-border';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Top Priority';
      case 2: return 'Important';
      case 3: return 'Nice to Have';
      default: return 'Focus';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Today's Focus</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-medium">Daily Progress</span>
            </div>
            <span className="text-2xl font-bold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {completedCount} of {focusBlocks.length} focus blocks completed
          </p>
        </motion.div>

        {/* AURRA Guidance */}
        {focusBlocks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl p-5 border border-secondary/20"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">AURRA's gentle nudge</p>
                <p className="text-sm text-muted-foreground italic">"{suggestion}"</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Focus Blocks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Focus Blocks ({focusBlocks.length}/3)
            </h2>
          </div>

          <AnimatePresence mode="popLayout">
            {focusBlocks.map((block, index) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`relative rounded-xl p-4 border bg-gradient-to-br ${getPriorityColor(block.priority)} ${
                  block.completed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Completion Button */}
                  <button
                    onClick={() => !block.completed && completeFocusBlock(block.id)}
                    disabled={block.completed}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      block.completed 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'border-muted-foreground/40 hover:border-primary hover:bg-primary/10'
                    }`}
                  >
                    {block.completed && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        {getPriorityLabel(block.priority)}
                      </span>
                    </div>
                    <h3 className={`font-medium ${block.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {block.title}
                    </h3>
                    {block.description && (
                      <p className="text-sm text-muted-foreground mt-1">{block.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{block.duration_minutes} min</span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteFocusBlock(block.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {focusBlocks.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No focus blocks set for today</p>
              <p className="text-sm text-muted-foreground/70">
                Set 1-3 things you want to accomplish today
              </p>
            </motion.div>
          )}

          {/* Add Button */}
          {canAddMore && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowAddDialog(true)}
              className="w-full py-4 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-primary"
            >
              <Plus className="w-5 h-5" />
              <span>Add Focus Block</span>
            </motion.button>
          )}
        </div>

        {/* Completion Message */}
        {focusBlocks.length > 0 && progress === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-2xl p-5 border border-green-500/30 text-center"
          >
            <div className="text-3xl mb-2">🎉</div>
            <h3 className="font-semibold text-green-700 dark:text-green-400 mb-1">
              All Focus Blocks Complete!
            </h3>
            <p className="text-sm text-muted-foreground">
              You've accomplished everything you set out to do today. Well done!
            </p>
          </motion.div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Focus Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                What do you want to focus on?
              </label>
              <Input
                placeholder="e.g., Complete project proposal"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Any details? (optional)
              </label>
              <Textarea
                placeholder="Add context or break it down..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Estimated time
              </label>
              <Select value={newDuration} onValueChange={setNewDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!newTitle.trim()} className="flex-1">
                Add Focus
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyPlanScreen;
