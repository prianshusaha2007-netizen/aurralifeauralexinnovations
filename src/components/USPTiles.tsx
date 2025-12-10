import React from 'react';
import { Wand2, Clock, Mail, Search, Dumbbell, BookOpen, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TaskItem {
  icon: React.ElementType;
  name: string;
  description: string;
}

const controlDayTasks: TaskItem[] = [
  { icon: Clock, name: 'Morning Routine', description: 'Start your day right with a personalized routine' },
  { icon: BookOpen, name: 'Study Schedule', description: 'Optimize your learning sessions' },
  { icon: Dumbbell, name: 'Workout Plan', description: 'Stay fit with custom workout suggestions' },
  { icon: Brain, name: 'Focus Blocks', description: 'Deep work sessions for productivity' },
];

const prepareThingsTasks: TaskItem[] = [
  { icon: Mail, name: 'Draft Email', description: 'AURA writes professional emails for you' },
  { icon: Search, name: 'Search Ingredients', description: 'Find recipes and ingredients instantly' },
  { icon: BookOpen, name: 'Make Study Plan', description: 'Get a structured study roadmap' },
  { icon: Dumbbell, name: 'Create Workout Plan', description: 'Custom fitness plan for your goals' },
];

export const USPTiles: React.FC = () => {
  const { toast } = useToast();

  const handleTaskClick = (task: TaskItem) => {
    toast({
      title: `${task.name} 🚀`,
      description: `AURA is preparing this for you! Ask in chat to get started.`,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {/* AURA Controls Your Day */}
      <Dialog>
        <DialogTrigger asChild>
          <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg bg-gradient-to-br from-primary/20 to-accent/10 border-primary/20">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">AURA Controls Your Day</h3>
              <p className="text-xs text-muted-foreground mt-1">Smart routine suggestions</p>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Control Your Day
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Let AURA help you structure your perfect day. Choose what you need:
            </p>
            {controlDayTasks.map((task) => {
              const Icon = task.icon;
              return (
                <Button
                  key={task.name}
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-4"
                  onClick={() => handleTaskClick(task)}
                >
                  <Icon className="w-5 h-5 mr-3 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">{task.name}</div>
                    <div className="text-xs text-muted-foreground">{task.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* AURA Prepares Things */}
      <Dialog>
        <DialogTrigger asChild>
          <Card className="cursor-pointer hover:border-accent/50 transition-all hover:shadow-lg bg-gradient-to-br from-accent/20 to-primary/10 border-accent/20">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-3">
                <Wand2 className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-sm">AURA Prepares For You</h3>
              <p className="text-xs text-muted-foreground mt-1">Quick task automation</p>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-accent" />
              Quick Preparations
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              AURA can prepare these things for you. Just tap and ask in chat!
            </p>
            {prepareThingsTasks.map((task) => {
              const Icon = task.icon;
              return (
                <Button
                  key={task.name}
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-4"
                  onClick={() => handleTaskClick(task)}
                >
                  <Icon className="w-5 h-5 mr-3 text-accent" />
                  <div className="text-left">
                    <div className="font-medium">{task.name}</div>
                    <div className="text-xs text-muted-foreground">{task.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
