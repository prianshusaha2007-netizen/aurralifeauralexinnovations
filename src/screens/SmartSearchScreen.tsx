import React, { useState } from 'react';
import { 
  Search, 
  Chrome, 
  Youtube, 
  ShoppingBag, 
  Utensils, 
  ShoppingCart,
  Music,
  Image,
  Folder,
  Calculator,
  Calendar,
  Phone,
  MessageSquare,
  Map,
  Camera,
  Settings,
  Mail,
  Cloud,
  Gamepad2,
  BookOpen,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AppItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  category: 'search' | 'shopping' | 'food' | 'entertainment' | 'utilities' | 'communication';
}

interface GoogleResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

interface YouTubeResult {
  title: string;
  channel: string;
  views: string;
  duration: string;
  description: string;
  videoId: string;
}

const apps: AppItem[] = [
  { id: 'google', name: 'Google Search', icon: Chrome, color: 'text-blue-500', bgColor: 'bg-blue-500/10', category: 'search' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500', bgColor: 'bg-red-500/10', category: 'search' },
  { id: 'amazon', name: 'Amazon', icon: ShoppingBag, color: 'text-orange-500', bgColor: 'bg-orange-500/10', category: 'shopping' },
  { id: 'flipkart', name: 'Flipkart', icon: ShoppingCart, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', category: 'shopping' },
  { id: 'swiggy', name: 'Swiggy', icon: Utensils, color: 'text-orange-600', bgColor: 'bg-orange-600/10', category: 'food' },
  { id: 'zomato', name: 'Zomato', icon: Utensils, color: 'text-red-600', bgColor: 'bg-red-600/10', category: 'food' },
  { id: 'blinkit', name: 'Blinkit', icon: ShoppingCart, color: 'text-yellow-600', bgColor: 'bg-yellow-600/10', category: 'food' },
  { id: 'zepto', name: 'Zepto', icon: ShoppingCart, color: 'text-purple-500', bgColor: 'bg-purple-500/10', category: 'food' },
  { id: 'spotify', name: 'Spotify', icon: Music, color: 'text-green-500', bgColor: 'bg-green-500/10', category: 'entertainment' },
  { id: 'games', name: 'Games', icon: Gamepad2, color: 'text-pink-500', bgColor: 'bg-pink-500/10', category: 'entertainment' },
  { id: 'books', name: 'Books', icon: BookOpen, color: 'text-amber-600', bgColor: 'bg-amber-600/10', category: 'entertainment' },
  { id: 'gallery', name: 'Gallery', icon: Image, color: 'text-purple-600', bgColor: 'bg-purple-600/10', category: 'utilities' },
  { id: 'files', name: 'Files', icon: Folder, color: 'text-blue-600', bgColor: 'bg-blue-600/10', category: 'utilities' },
  { id: 'calculator', name: 'Calculator', icon: Calculator, color: 'text-gray-500', bgColor: 'bg-gray-500/10', category: 'utilities' },
  { id: 'calendar', name: 'Calendar', icon: Calendar, color: 'text-red-500', bgColor: 'bg-red-500/10', category: 'utilities' },
  { id: 'camera', name: 'Camera', icon: Camera, color: 'text-slate-600', bgColor: 'bg-slate-600/10', category: 'utilities' },
  { id: 'settings', name: 'Settings', icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-600/10', category: 'utilities' },
  { id: 'cloud', name: 'Cloud Storage', icon: Cloud, color: 'text-sky-500', bgColor: 'bg-sky-500/10', category: 'utilities' },
  { id: 'phone', name: 'Phone', icon: Phone, color: 'text-green-600', bgColor: 'bg-green-600/10', category: 'communication' },
  { id: 'messages', name: 'Messages', icon: MessageSquare, color: 'text-blue-500', bgColor: 'bg-blue-500/10', category: 'communication' },
  { id: 'mail', name: 'Email', icon: Mail, color: 'text-red-500', bgColor: 'bg-red-500/10', category: 'communication' },
  { id: 'maps', name: 'Maps', icon: Map, color: 'text-green-500', bgColor: 'bg-green-500/10', category: 'communication' },
];

const categories = [
  { id: 'search', label: 'Search & Web' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'food', label: 'Food & Groceries' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'communication', label: 'Communication' },
];

export const SmartSearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchTab, setActiveSearchTab] = useState<'apps' | 'google' | 'youtube'>('apps');
  const [isSearching, setIsSearching] = useState(false);
  const [googleResults, setGoogleResults] = useState<GoogleResult[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<YouTubeResult[]>([]);

  const handleAppClick = (app: AppItem) => {
    if (app.id === 'google') {
      setActiveSearchTab('google');
    } else if (app.id === 'youtube') {
      setActiveSearchTab('youtube');
    } else {
      toast.info(`Opening ${app.name}...`, {
        description: "This will open the actual app in the full version of AURA."
      });
    }
  };

  const handleSearch = async (type: 'google' | 'youtube') => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('web-search', {
        body: { query: searchQuery, type }
      });

      if (error) throw error;

      if (type === 'google') {
        setGoogleResults(data.results || []);
      } else {
        setYoutubeResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (activeSearchTab === 'google') {
        handleSearch('google');
      } else if (activeSearchTab === 'youtube') {
        handleSearch('youtube');
      }
    }
  };

  const filteredApps = searchQuery && activeSearchTab === 'apps'
    ? apps.filter(app => 
        app.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : apps;

  const groupedApps = categories.reduce((acc, category) => {
    const categoryApps = filteredApps.filter(app => app.category === category.id);
    if (categoryApps.length > 0) {
      acc[category.id] = { label: category.label, apps: categoryApps };
    }
    return acc;
  }, {} as Record<string, { label: string; apps: AppItem[] }>);

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="p-4 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Smart Search</h1>
        </div>
        <p className="text-sm text-muted-foreground">Search the web or launch apps</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Tabs */}
        <Tabs value={activeSearchTab} onValueChange={(v) => setActiveSearchTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="apps">Apps</TabsTrigger>
            <TabsTrigger value="google" className="flex items-center gap-1">
              <Chrome className="w-4 h-4" /> Google
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-1">
              <Youtube className="w-4 h-4" /> YouTube
            </TabsTrigger>
          </TabsList>

          {/* Search Input */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                activeSearchTab === 'apps' 
                  ? "Search apps..." 
                  : activeSearchTab === 'google' 
                    ? "Search Google..." 
                    : "Search YouTube..."
              }
              className="pl-10 pr-20 h-12 rounded-xl"
            />
            {(activeSearchTab === 'google' || activeSearchTab === 'youtube') && (
              <Button
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => handleSearch(activeSearchTab)}
                disabled={isSearching}
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            )}
          </div>

          {/* Apps Tab */}
          <TabsContent value="apps" className="mt-4 space-y-6">
            {/* Quick Actions */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="pt-4">
                <p className="text-sm text-center text-muted-foreground mb-4">
                  Say something like:
                </p>
                <div className="space-y-2 text-center">
                  <p className="text-sm font-medium">"Search for best restaurants nearby"</p>
                  <p className="text-sm font-medium">"Order groceries from Blinkit"</p>
                  <p className="text-sm font-medium">"Play music on Spotify"</p>
                </div>
              </CardContent>
            </Card>

            {/* Apps Grid by Category */}
            {Object.entries(groupedApps).map(([categoryId, { label, apps: categoryApps }]) => (
              <div key={categoryId}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">{label}</h3>
                <div className="grid grid-cols-4 gap-3">
                  {categoryApps.map((app) => {
                    const Icon = app.icon;
                    return (
                      <motion.button
                        key={app.id}
                        onClick={() => handleAppClick(app)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className={cn('p-3 rounded-xl', app.bgColor)}>
                          <Icon className={cn('w-6 h-6', app.color)} />
                        </div>
                        <span className="text-xs font-medium text-center line-clamp-1">{app.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}

            {searchQuery && filteredApps.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No apps found for "{searchQuery}"</p>
              </div>
            )}
          </TabsContent>

          {/* Google Results Tab */}
          <TabsContent value="google" className="mt-4">
            <AnimatePresence mode="wait">
              {isSearching ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-12"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">Searching Google...</p>
                </motion.div>
              ) : googleResults.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {googleResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground truncate">{result.source}</p>
                              <h4 className="font-medium text-primary hover:underline line-clamp-2 mt-1">
                                {result.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {result.snippet}
                              </p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Chrome className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Search Google for anything</p>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* YouTube Results Tab */}
          <TabsContent value="youtube" className="mt-4">
            <AnimatePresence mode="wait">
              {isSearching ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-12"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                  <p className="text-sm text-muted-foreground mt-2">Searching YouTube...</p>
                </motion.div>
              ) : youtubeResults.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {youtubeResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                              <Youtube className="w-8 h-8 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium line-clamp-2">{result.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{result.channel}</p>
                              <p className="text-xs text-muted-foreground">
                                {result.views} views • {result.duration}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Youtube className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">Search YouTube videos</p>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
