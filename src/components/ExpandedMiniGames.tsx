import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Gamepad2, RefreshCw, Trophy, X, Timer, Target, Brain, Zap, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Memory Match Game
export const MemoryMatchGame: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const emojis = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎢', '🎡', '🎠'];
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(shuffled);
    setFlipped([]);
    setMoves(0);
    setMatches(0);
    setGameWon(false);
  };

  const handleFlip = (id: number) => {
    if (flipped.length === 2 || cards[id].matched || flipped.includes(id)) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        setCards(prev => prev.map(c => 
          c.id === first || c.id === second ? { ...c, matched: true } : c
        ));
        setMatches(m => m + 1);
        setFlipped([]);
        
        if (matches + 1 === emojis.length) {
          setGameWon(true);
          toast.success('🎉 Amazing memory! You won!');
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <Card className="border-primary/30">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Memory Match
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex justify-between mb-4 text-sm">
          <span>Moves: {moves}</span>
          <span>Matches: {matches}/{emojis.length}</span>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {cards.map((card) => (
            <motion.button
              key={card.id}
              onClick={() => handleFlip(card.id)}
              className={cn(
                "aspect-square rounded-lg text-2xl flex items-center justify-center transition-all",
                card.matched ? "bg-green-500/20 border-green-500" : 
                flipped.includes(card.id) ? "bg-primary/20 border-primary" : 
                "bg-muted hover:bg-muted/80 border-border"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ border: '2px solid' }}
            >
              {(card.matched || flipped.includes(card.id)) ? card.emoji : '?'}
            </motion.button>
          ))}
        </div>

        {gameWon && (
          <div className="text-center p-4 bg-green-500/10 rounded-lg">
            <p className="text-lg font-bold text-green-500">🎉 You Won!</p>
            <p className="text-sm text-muted-foreground">Completed in {moves} moves</p>
            <Button onClick={initGame} className="mt-2">Play Again</Button>
          </div>
        )}

        {!gameWon && (
          <Button variant="outline" onClick={initGame} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Restart
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Reaction Time Game
export const ReactionTimeGame: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [state, setState] = useState<'waiting' | 'ready' | 'go' | 'result' | 'early'>('waiting');
  const [reactionTime, setReactionTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);

  const startGame = () => {
    setState('ready');
    const delay = 2000 + Math.random() * 3000; // 2-5 seconds
    setTimeout(() => {
      setState('go');
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (state === 'waiting') {
      startGame();
    } else if (state === 'ready') {
      setState('early');
    } else if (state === 'go') {
      const time = Date.now() - startTime;
      setReactionTime(time);
      if (!bestTime || time < bestTime) {
        setBestTime(time);
      }
      setState('result');
    } else if (state === 'result' || state === 'early') {
      startGame();
    }
  };

  const getColor = () => {
    switch (state) {
      case 'waiting': return 'bg-muted';
      case 'ready': return 'bg-red-500';
      case 'go': return 'bg-green-500';
      case 'result': return 'bg-primary';
      case 'early': return 'bg-orange-500';
    }
  };

  return (
    <Card className="border-primary/30">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Reaction Time
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <motion.button
          onClick={handleClick}
          className={cn(
            "w-full h-40 rounded-xl flex flex-col items-center justify-center transition-colors",
            getColor()
          )}
          whileTap={{ scale: 0.98 }}
        >
          {state === 'waiting' && (
            <div className="text-center text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-2" />
              <p className="font-bold">Click to Start</p>
            </div>
          )}
          {state === 'ready' && (
            <p className="text-white font-bold text-xl">Wait for green...</p>
          )}
          {state === 'go' && (
            <p className="text-white font-bold text-2xl">CLICK NOW!</p>
          )}
          {state === 'result' && (
            <div className="text-center text-primary-foreground">
              <p className="text-4xl font-bold">{reactionTime}ms</p>
              <p className="text-sm opacity-80">Click to try again</p>
            </div>
          )}
          {state === 'early' && (
            <div className="text-center text-white">
              <p className="font-bold text-xl">Too early! 😅</p>
              <p className="text-sm opacity-80">Click to try again</p>
            </div>
          )}
        </motion.button>

        {bestTime && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Best: <span className="font-bold text-primary">{bestTime}ms</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Trivia Quiz
export const TriviaGame: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const questions = [
    { q: "What is the capital of Japan?", options: ["Beijing", "Seoul", "Tokyo", "Bangkok"], answer: 2 },
    { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: 1 },
    { q: "What is the largest mammal?", options: ["Elephant", "Giraffe", "Blue Whale", "Hippo"], answer: 2 },
    { q: "Who painted the Mona Lisa?", options: ["Van Gogh", "Da Vinci", "Picasso", "Monet"], answer: 1 },
    { q: "What is H2O commonly known as?", options: ["Salt", "Sugar", "Water", "Oxygen"], answer: 2 },
  ];

  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const handleAnswer = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    setShowResult(true);
    
    if (index === questions[current].answer) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent(c => c + 1);
        setSelected(null);
        setShowResult(false);
      } else {
        setGameOver(true);
      }
    }, 1500);
  };

  const restart = () => {
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setShowResult(false);
    setGameOver(false);
  };

  if (gameOver) {
    return (
      <Card className="border-primary/30">
        <CardContent className="pt-4 text-center">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Trivia Quiz
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <p className="text-2xl font-bold mb-2">Quiz Complete!</p>
          <p className="text-lg mb-4">Score: {score}/{questions.length}</p>
          <p className="text-muted-foreground mb-4">
            {score === questions.length ? "Perfect! 🎉" : 
             score >= 3 ? "Great job! 👏" : 
             "Keep practicing! 💪"}
          </p>
          <Button onClick={restart}>Play Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Trivia Quiz
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex justify-between mb-4 text-sm">
          <span>Question {current + 1}/{questions.length}</span>
          <span>Score: {score}</span>
        </div>

        <p className="text-lg font-medium mb-4">{questions[current].q}</p>

        <div className="space-y-2">
          {questions[current].options.map((option, i) => (
            <Button
              key={i}
              variant={selected === i 
                ? (i === questions[current].answer ? "default" : "destructive")
                : showResult && i === questions[current].answer ? "default" : "outline"
              }
              className={cn("w-full justify-start", 
                showResult && i === questions[current].answer && "bg-green-500 hover:bg-green-500"
              )}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
            >
              {option}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Breathing Exercise
export const BreathingExercise: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (phase === 'idle') return;

    const durations = { inhale: 4, hold: 4, exhale: 4 };
    const currentDuration = durations[phase] || 4;

    if (count < currentDuration) {
      const timer = setTimeout(() => setCount(c => c + 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCount(0);
      if (phase === 'inhale') setPhase('hold');
      else if (phase === 'hold') setPhase('exhale');
      else if (phase === 'exhale') {
        setCycles(c => c + 1);
        setPhase('inhale');
      }
    }
  }, [phase, count]);

  const startExercise = () => {
    setPhase('inhale');
    setCount(0);
    setCycles(0);
  };

  const stopExercise = () => {
    setPhase('idle');
    setCount(0);
  };

  return (
    <Card className="border-primary/30">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            Breathing Exercise
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col items-center py-8">
          <motion.div
            className={cn(
              "w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-xl",
              phase === 'idle' ? "bg-muted" : 
              phase === 'inhale' ? "bg-blue-500" :
              phase === 'hold' ? "bg-purple-500" : "bg-green-500"
            )}
            animate={{
              scale: phase === 'inhale' ? 1.3 : phase === 'exhale' ? 0.8 : 1
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
          >
            {phase === 'idle' ? 'Start' : 
             phase === 'inhale' ? 'Breathe In' :
             phase === 'hold' ? 'Hold' : 'Breathe Out'}
          </motion.div>

          {phase !== 'idle' && (
            <p className="mt-4 text-2xl font-bold text-primary">{4 - count}</p>
          )}

          <p className="mt-2 text-sm text-muted-foreground">
            Cycles completed: {cycles}
          </p>
        </div>

        {phase === 'idle' ? (
          <Button onClick={startExercise} className="w-full">
            Start 4-4-4 Breathing
          </Button>
        ) : (
          <Button variant="outline" onClick={stopExercise} className="w-full">
            Stop
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Main Export with all games
interface ExpandedMiniGameProps {
  gameType: 'memory-match' | 'reaction-time' | 'trivia' | 'breathing' | 'word-chain' | 'would-you-rather' | '20-questions';
  onClose: () => void;
}

export const ExpandedMiniGame: React.FC<ExpandedMiniGameProps> = ({ gameType, onClose }) => {
  switch (gameType) {
    case 'memory-match':
      return <MemoryMatchGame onClose={onClose} />;
    case 'reaction-time':
      return <ReactionTimeGame onClose={onClose} />;
    case 'trivia':
      return <TriviaGame onClose={onClose} />;
    case 'breathing':
      return <BreathingExercise onClose={onClose} />;
    default:
      return null;
  }
};
