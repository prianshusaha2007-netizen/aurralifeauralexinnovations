import React, { useState } from 'react';
import { Sparkles, Gamepad2, Brain, BookOpen, Zap, Smile, Lightbulb, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MiniGame } from '@/components/MiniGames';

type GameType = 'word-chain' | 'would-you-rather' | '20-questions' | null;

const gameNameToType: Record<string, 'word-chain' | 'would-you-rather' | '20-questions'> = {
  'Word Chain': 'word-chain',
  'Would You Rather': 'would-you-rather',
  '20 Questions': '20-questions',
};

const funFacts = [
  "Your brain generates enough electricity to power a small light bulb!",
  "Honey never spoils — archaeologists found 3000-year-old honey that was still edible!",
  "A group of flamingos is called a 'flamboyance'!",
  "You blink about 15-20 times per minute, that's up to 1,200 times per hour!",
  "Bananas are berries, but strawberries aren't!",
  "The shortest war in history lasted 38-45 minutes!",
  "Octopuses have three hearts and blue blood!",
  "A jiffy is an actual unit of time — 1/100th of a second!",
];

const productivityTips = [
  "Try the 2-minute rule: if it takes less than 2 minutes, do it now!",
  "Take a 5-minute break every 25 minutes (Pomodoro Technique).",
  "Start your day with your hardest task — eat that frog!",
  "Batch similar tasks together to maintain focus.",
  "Keep your phone in another room while working.",
  "Write tomorrow's to-do list before bed.",
];

const miniGames = [
  { name: 'Word Chain', desc: 'Say a word starting with the last letter of the previous word', icon: Brain },
  { name: 'Would You Rather', desc: 'Fun dilemmas to think about', icon: Smile },
  { name: 'Story Builder', desc: 'Create a story one sentence at a time', icon: BookOpen },
  { name: '20 Questions', desc: 'Guess what AURA is thinking!', icon: Lightbulb },
];

const personalityTests = [
  { name: 'Mood Check', desc: 'How are you really feeling today?', color: 'from-pink-500 to-rose-500' },
  { name: 'Energy Level', desc: 'Rate your energy from 1-10', color: 'from-amber-500 to-orange-500' },
  { name: 'Focus Score', desc: 'How focused have you been?', color: 'from-cyan-500 to-blue-500' },
  { name: 'Social Battery', desc: 'Introvert or extrovert mode today?', color: 'from-violet-500 to-purple-500' },
];

export const PlayLearnScreen: React.FC = () => {
  const { toast } = useToast();
  const [currentFact, setCurrentFact] = useState(funFacts[0]);
  const [currentTip, setCurrentTip] = useState(productivityTips[0]);
  const [activeGame, setActiveGame] = useState<GameType>(null);

  const getRandomFact = () => {
    const newFact = funFacts[Math.floor(Math.random() * funFacts.length)];
    setCurrentFact(newFact);
  };

  const getRandomTip = () => {
    const newTip = productivityTips[Math.floor(Math.random() * productivityTips.length)];
    setCurrentTip(newTip);
  };

  const handleBoredClick = () => {
    const responses = [
      "Ooh, bored? Let's fix that! 🎮 How about a quick game or a random fun fact?",
      "No worries, I got you! Want me to tell you something cool or play a game?",
      "Boredom = opportunity! Let's do something fun together. Pick a mini-game!",
    ];
    toast({
      title: "AURA says...",
      description: responses[Math.floor(Math.random() * responses.length)],
    });
  };

  const handleGameClick = (gameName: string) => {
    const gameType = gameNameToType[gameName];
    if (gameType) {
      setActiveGame(gameType);
    }
  };

  const handleTestClick = (test: string) => {
    toast({
      title: `${test} 📊`,
      description: "Personality insights coming soon!",
    });
  };

  if (activeGame) {
    return (
      <div className="flex flex-col h-full overflow-y-auto pb-24 p-4">
        <MiniGame gameType={activeGame} onClose={() => setActiveGame(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="p-4 pt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 mb-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent">Play & Learn</span>
        </div>
        <h1 className="text-2xl font-bold">Fun Zone</h1>
        <p className="text-sm text-muted-foreground mt-1">Games, facts & brain boosters</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Feeling Bored Button */}
        <Button
          onClick={handleBoredClick}
          className="w-full h-14 text-lg font-semibold rounded-2xl aura-gradient text-primary-foreground hover:opacity-90 transition-all"
        >
          <Smile className="w-5 h-5 mr-2" />
          Feeling Bored?
        </Button>

        {/* Fun Fact Card */}
        <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-accent" />
              Fun Fact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{currentFact}</p>
            <Button variant="outline" size="sm" onClick={getRandomFact} className="rounded-full">
              <Zap className="w-3 h-3 mr-1" /> Another one!
            </Button>
          </CardContent>
        </Card>

        {/* Productivity Tip */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Productivity Boost
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{currentTip}</p>
            <Button variant="outline" size="sm" onClick={getRandomTip} className="rounded-full">
              <Lightbulb className="w-3 h-3 mr-1" /> New tip
            </Button>
          </CardContent>
        </Card>

        {/* Mini Games */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" /> Mini Games
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {miniGames.map((game) => {
              const Icon = game.icon;
              return (
                <Card
                  key={game.name}
                  className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg"
                  onClick={() => handleGameClick(game.name)}
                >
                  <CardContent className="p-4">
                    <Icon className="w-6 h-6 text-primary mb-2" />
                    <h3 className="font-semibold text-sm">{game.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{game.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Personality Tests */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4" /> Quick Check-ins
          </h2>
          <div className="space-y-2">
            {personalityTests.map((test) => (
              <div
                key={test.name}
                onClick={() => handleTestClick(test.name)}
                className={`p-4 rounded-xl cursor-pointer bg-gradient-to-r ${test.color} text-white hover:opacity-90 transition-all`}
              >
                <h3 className="font-semibold">{test.name}</h3>
                <p className="text-xs opacity-90">{test.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Short Stories */}
        <Card className="border-secondary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-secondary-foreground" />
              Story Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Want AURA to tell you a short story? Pick a genre and relax!
            </p>
            <div className="flex flex-wrap gap-2">
              {['Adventure', 'Mystery', 'Sci-Fi', 'Motivational'].map((genre) => (
                <Button
                  key={genre}
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                  onClick={() => toast({ title: `${genre} Story`, description: "Coming soon! Stories will appear in chat." })}
                >
                  {genre}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
