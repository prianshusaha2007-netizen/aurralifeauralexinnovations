import React, { useState, useCallback, useEffect } from 'react';
import { Gamepad2, Music, MapPin, Lightbulb, Building2, TrendingUp, X, Play, Trophy, RotateCcw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type GameType = 'antakshari' | 'atlas' | 'guess-word' | 'guess-startup' | 'guess-trend' | 'would-you-rather' | '20-questions' | 'word-chain';

interface GameConfig {
  id: GameType;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
  instructions: string;
}

const games: GameConfig[] = [
  {
    id: 'word-chain',
    name: 'Word Chain',
    icon: MessageCircle,
    description: 'Each word starts with the last letter!',
    color: 'from-violet-500 to-purple-600',
    instructions: 'Say a word, and the next word must start with the last letter of the previous word!'
  },
  {
    id: 'would-you-rather',
    name: 'Would You Rather',
    icon: Lightbulb,
    description: 'Choose between two options!',
    color: 'from-pink-500 to-rose-600',
    instructions: 'I\'ll give you two choices. Pick one and explain why!'
  },
  {
    id: '20-questions',
    name: '20 Questions',
    icon: Lightbulb,
    description: 'Guess what I\'m thinking!',
    color: 'from-amber-500 to-orange-600',
    instructions: 'I\'ll think of something. Ask yes/no questions to figure out what it is!'
  },
  {
    id: 'antakshari',
    name: 'Antakshari',
    icon: Music,
    description: 'Sing songs starting with the last letter!',
    color: 'from-pink-500 to-rose-500',
    instructions: 'I\'ll start with a song line. You respond with a song starting with the last letter of my line!'
  },
  {
    id: 'atlas',
    name: 'Atlas',
    icon: MapPin,
    description: 'Name places - city, country, or location',
    color: 'from-blue-500 to-cyan-500',
    instructions: 'Name a place (city/country). Next player names a place starting with the last letter!'
  },
  {
    id: 'guess-word',
    name: 'Guess the Word',
    icon: Lightbulb,
    description: 'I describe, you guess the word!',
    color: 'from-amber-500 to-orange-500',
    instructions: 'I\'ll give you hints about a word. Try to guess it in as few clues as possible!'
  },
  {
    id: 'guess-startup',
    name: 'Guess the Startup',
    icon: Building2,
    description: 'Guess famous startups from clues',
    color: 'from-purple-500 to-violet-500',
    instructions: 'I\'ll describe a famous startup. Can you guess which one it is?'
  },
  {
    id: 'guess-trend',
    name: 'Guess the Trend',
    icon: TrendingUp,
    description: 'Guess viral trends & memes',
    color: 'from-green-500 to-emerald-500',
    instructions: 'I\'ll describe a viral trend or meme. Guess what it is!'
  },
];

interface InteractiveChatGamesProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (gameType: GameType, initialMessage: string, systemPrompt: string) => void;
  gamesPlayed?: number;
  currentStreak?: number;
}

export const InteractiveChatGames: React.FC<InteractiveChatGamesProps> = ({ 
  isOpen, 
  onClose, 
  onStartGame,
  gamesPlayed = 0,
  currentStreak = 0,
}) => {
  const [selectedGame, setSelectedGame] = useState<GameConfig | null>(null);

  const getGameStartMessage = (game: GameConfig): string => {
    const messages: Record<GameType, string> = {
      'word-chain': `Let's play Word Chain! 🔗\n\nI'll start: **ELEPHANT**\n\nNow say a word starting with 'T'!`,
      'would-you-rather': `Let's play Would You Rather! 🤔\n\n**Would you rather:**\n\nA) Have the ability to fly but only 3 feet above the ground\n\nOR\n\nB) Be invisible but only when no one is looking?\n\nChoose and tell me why! 😄`,
      '20-questions': `Let's play 20 Questions! 🎯\n\nI'm thinking of something... It could be a person, place, thing, or concept.\n\nYou have 20 yes/no questions to figure it out!\n\n**Question 1:** Go ahead, ask me anything! (Yes/No answers only)`,
      'antakshari': `Let's play Antakshari! 🎵\n\nI'll start:\n\n*"Tujhe dekha to ye jaana sanam..."* 🎶\n\nNow you sing a song starting with **'M'**!`,
      'atlas': `Let's play Atlas! 🗺️\n\nI'll start: **INDIA**\n\nNow name a place starting with 'A'!`,
      'guess-word': `Let's play Guess the Word! 🤔\n\n**Clue 1:** It's something you use every day, it fits in your pocket, and connects you to the world...\n\nWhat am I describing? 🤷`,
      'guess-startup': `Let's play Guess the Startup! 🚀\n\n**Clue 1:** Founded in a garage in 2005, this platform lets you share videos and has over 2 billion users...\n\nWhich startup is this? 🤔`,
      'guess-trend': `Let's play Guess the Trend! 📱\n\n**Clue 1:** This 2023 trend involves people showing their morning routine with a specific coffee order and aesthetic lifestyle...\n\nWhat trend am I describing? ☕`,
    };
    return messages[game.id];
  };

  const getGameSystemPrompt = (gameType: GameType): string => {
    const prompts: Record<GameType, string> = {
      'word-chain': `You are playing Word Chain with the user. Rules:
- Take turns saying words
- Each word must start with the last letter of the previous word
- No repeating words
- Be quick and playful!
- If user says wrong word, gently correct them
- Keep track of the chain
- Celebrate good words!
- Use emojis to keep it fun`,
      
      'would-you-rather': `You are playing Would You Rather with the user. Rules:
- Present fun, creative dilemmas
- Mix silly, deep, and relatable options
- React to their choices genuinely
- Share your own preference too
- Ask follow-up questions
- Keep the vibe playful
- Create thought-provoking scenarios
- Use emojis!`,
      
      '20-questions': `You are playing 20 Questions with the user. Rules:
- Think of something specific (person, place, thing, concept)
- Only answer Yes, No, or Sometimes
- Keep track of question count
- Give hints if they're stuck after 10+ questions
- Celebrate when they guess correctly
- If they give up, reveal with enthusiasm
- Be encouraging throughout!`,

      'antakshari': `You are playing Antakshari with the user. Rules:
- Take turns with song lyrics
- Each song must start with the last letter of previous line
- Accept Hindi, English, or any language
- Be enthusiastic! Use emojis
- Appreciate good songs
- If user's song works, continue with your turn
- It's okay to accept close matches`,
      
      'atlas': `You are playing Atlas with the user. Rules:
- Take turns naming places
- Each place starts with last letter of previous
- Accept cities, countries, landmarks
- No repeating places
- Share a fun fact about each place you name
- Be educational and fun!`,
      
      'guess-word': `You are playing Guess the Word with the user. Rules:
- Think of a word and give progressive hints
- Start vague, get more specific
- Max 5 hints before revealing
- Celebrate correct guesses
- Track hints used
- Choose interesting words`,
      
      'guess-startup': `You are playing Guess the Startup with the user. Rules:
- Describe famous startups without naming them
- Give clues about: founding year, founders, what they do
- Include Indian and international startups
- 5 clues max before revealing
- Share fun facts when guessed correctly`,
      
      'guess-trend': `You are playing Guess the Trend with the user. Rules:
- Describe viral trends, memes, internet phenomena
- Mix recent and classic internet culture
- Include social media trends, viral videos
- 5 clues max before revealing
- Be relatable with Gen-Z culture`,
    };
    return prompts[gameType];
  };

  const handleStartGame = useCallback((game: GameConfig) => {
    const startMessage = getGameStartMessage(game);
    const systemPrompt = getGameSystemPrompt(game.id);
    onStartGame(game.id, startMessage, systemPrompt);
    onClose();
  }, [onStartGame, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
            <Gamepad2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-xl">Play Games 🎮</h2>
            <p className="text-sm text-muted-foreground">Interactive games with AURA!</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {selectedGame ? (
            <motion.div
              key="game-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Button variant="ghost" onClick={() => setSelectedGame(null)} className="mb-2 rounded-full">
                ← Back to games
              </Button>
              
              <Card className="overflow-hidden border-2 border-primary/20">
                <div className={cn('h-40 bg-gradient-to-br flex items-center justify-center', selectedGame.color)}>
                  <selectedGame.icon className="w-20 h-20 text-white/90 drop-shadow-lg" />
                </div>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedGame.name}</h3>
                    <p className="text-muted-foreground">{selectedGame.description}</p>
                  </div>
                  
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm font-semibold mb-2">📖 How to play:</p>
                    <p className="text-sm text-muted-foreground">{selectedGame.instructions}</p>
                  </div>

                  <Button 
                    className={cn('w-full h-12 text-base font-semibold bg-gradient-to-r text-white rounded-xl shadow-lg', selectedGame.color)}
                    onClick={() => handleStartGame(selectedGame)}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Playing!
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="game-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              {games.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-200 border-2 border-transparent hover:border-primary/20 shadow-lg hover:shadow-xl"
                    onClick={() => setSelectedGame(game)}
                  >
                    <div className={cn('h-24 bg-gradient-to-br flex items-center justify-center', game.color)}>
                      <game.icon className="w-10 h-10 text-white/90 drop-shadow-lg" />
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-bold text-sm">{game.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{game.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center justify-center gap-8 text-center">
          <div>
            <Trophy className="w-6 h-6 mx-auto text-amber-500 mb-1" />
            <p className="text-xs text-muted-foreground">Games Played</p>
            <p className="font-bold text-lg">{gamesPlayed}</p>
          </div>
          <div className="w-px h-12 bg-border" />
          <div>
            <Gamepad2 className="w-6 h-6 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Win Streak</p>
            <p className="font-bold text-lg">{currentStreak}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const getInteractiveGameSystemPrompt = (gameType: GameType): string => {
  const prompts: Record<GameType, string> = {
    'word-chain': 'You are playing Word Chain. Follow the rules and keep it fun!',
    'would-you-rather': 'You are playing Would You Rather. Be creative with options!',
    '20-questions': 'You are playing 20 Questions. Only answer Yes/No/Sometimes!',
    'antakshari': 'You are playing Antakshari. Match songs by last letter!',
    'atlas': 'You are playing Atlas. Name places by last letter!',
    'guess-word': 'You are playing Guess the Word. Give progressive hints!',
    'guess-startup': 'You are playing Guess the Startup. Describe without naming!',
    'guess-trend': 'You are playing Guess the Trend. Describe viral trends!',
  };
  return prompts[gameType];
};
