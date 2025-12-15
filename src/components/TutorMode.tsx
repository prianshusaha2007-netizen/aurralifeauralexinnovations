import React, { useState } from 'react';
import { GraduationCap, BookOpen, Calculator, Atom, Globe, Palette, Code, Languages, Music, Heart, ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorModeProps {
  onStartLesson: (subject: string, topic: string) => void;
  onClose: () => void;
}

const SUBJECTS = [
  { id: 'math', name: 'Mathematics', icon: Calculator, color: 'from-blue-500 to-cyan-500', topics: ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Trigonometry'] },
  { id: 'science', name: 'Science', icon: Atom, color: 'from-green-500 to-emerald-500', topics: ['Physics', 'Chemistry', 'Biology', 'Environmental Science'] },
  { id: 'english', name: 'English', icon: BookOpen, color: 'from-purple-500 to-violet-500', topics: ['Grammar', 'Writing', 'Literature', 'Vocabulary', 'Essay Writing'] },
  { id: 'coding', name: 'Programming', icon: Code, color: 'from-orange-500 to-red-500', topics: ['Python', 'JavaScript', 'HTML/CSS', 'Data Structures', 'Algorithms'] },
  { id: 'history', name: 'History & Geography', icon: Globe, color: 'from-amber-500 to-yellow-500', topics: ['World History', 'Indian History', 'Geography', 'Civics'] },
  { id: 'languages', name: 'Languages', icon: Languages, color: 'from-pink-500 to-rose-500', topics: ['Hindi', 'French', 'Spanish', 'German', 'Japanese'] },
  { id: 'arts', name: 'Arts & Music', icon: Palette, color: 'from-teal-500 to-cyan-500', topics: ['Drawing', 'Painting', 'Music Theory', 'Photography'] },
  { id: 'life', name: 'Life Skills', icon: Heart, color: 'from-red-500 to-pink-500', topics: ['Communication', 'Time Management', 'Financial Literacy', 'Critical Thinking'] },
];

export const TutorMode: React.FC<TutorModeProps> = ({ onStartLesson, onClose }) => {
  const [selectedSubject, setSelectedSubject] = useState<typeof SUBJECTS[0] | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [mode, setMode] = useState<'subjects' | 'topics' | 'custom'>('subjects');

  const handleSubjectSelect = (subject: typeof SUBJECTS[0]) => {
    setSelectedSubject(subject);
    setMode('topics');
  };

  const handleTopicSelect = (topic: string) => {
    if (selectedSubject) {
      onStartLesson(selectedSubject.name, topic);
    }
  };

  const handleCustomTopicSubmit = () => {
    if (customTopic.trim()) {
      onStartLesson('Custom', customTopic.trim());
    }
  };

  return (
    <Card className="border-primary/30 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">AURA Tutor</h3>
                <p className="text-xs text-muted-foreground">Learn anything, anytime</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Subject Selection */}
          {mode === 'subjects' && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4"
            >
              <p className="text-sm text-muted-foreground mb-4">What would you like to learn today?</p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {SUBJECTS.map((subject) => {
                  const Icon = subject.icon;
                  return (
                    <motion.button
                      key={subject.id}
                      onClick={() => handleSubjectSelect(subject)}
                      className={cn(
                        "p-4 rounded-xl text-left transition-all",
                        "bg-gradient-to-br hover:scale-[1.02]",
                        subject.color,
                        "text-white shadow-lg"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-6 h-6 mb-2" />
                      <p className="font-semibold text-sm">{subject.name}</p>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <div className="h-px flex-1 bg-border" />
                <span>or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setMode('custom')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Ask about any topic
              </Button>
            </motion.div>
          )}

          {/* Topic Selection */}
          {mode === 'topics' && selectedSubject && (
            <motion.div
              key="topics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <Button
                variant="ghost"
                size="sm"
                className="mb-3 -ml-2"
                onClick={() => { setMode('subjects'); setSelectedSubject(null); }}
              >
                ← Back to subjects
              </Button>

              <div className={cn(
                "p-4 rounded-xl mb-4 text-white bg-gradient-to-br",
                selectedSubject.color
              )}>
                <div className="flex items-center gap-3">
                  <selectedSubject.icon className="w-8 h-8" />
                  <div>
                    <p className="font-bold">{selectedSubject.name}</p>
                    <p className="text-sm opacity-80">Choose a topic to start</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {selectedSubject.topics.map((topic) => (
                  <Button
                    key={topic}
                    variant="ghost"
                    className="w-full justify-between hover:bg-primary/10"
                    onClick={() => handleTopicSelect(topic)}
                  >
                    <span>{topic}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Don't see your topic?</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type any topic..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomTopicSubmit()}
                    className="flex-1"
                  />
                  <Button onClick={handleCustomTopicSubmit} disabled={!customTopic.trim()}>
                    Learn
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Custom Topic */}
          {mode === 'custom' && (
            <motion.div
              key="custom"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4"
            >
              <Button
                variant="ghost"
                size="sm"
                className="mb-3 -ml-2"
                onClick={() => setMode('subjects')}
              >
                ← Back
              </Button>

              <div className="text-center mb-4">
                <Sparkles className="w-12 h-12 mx-auto text-primary mb-2" />
                <p className="font-bold">Ask me anything!</p>
                <p className="text-sm text-muted-foreground">I can teach you about any topic</p>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="E.g., 'Explain quantum physics simply' or 'Teach me Spanish greetings'"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomTopicSubmit()}
                  className="text-center"
                />
                <Button 
                  className="w-full aura-gradient text-primary-foreground"
                  onClick={handleCustomTopicSubmit}
                  disabled={!customTopic.trim()}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Start Learning
                </Button>
              </div>

              <div className="mt-4 text-xs text-muted-foreground text-center">
                Example topics: "Teach me basic guitar chords", "Explain photosynthesis", "Help me with Python loops"
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
