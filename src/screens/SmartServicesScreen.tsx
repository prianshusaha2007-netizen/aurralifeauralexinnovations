import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Search, Mail, MessageCircle, Phone,
  Navigation, Star, Clock, ExternalLink, Menu,
  Send, Loader2, Coffee, Pill, Fuel, Building2,
  Store, Utensils, ChevronRight, X, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SmartServicesScreenProps {
  onMenuClick?: () => void;
}

interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  distance: string;
  rating: number;
  isOpen: boolean;
  address: string;
  icon: string;
}

const placeCategories = [
  { id: 'cafe', label: 'Cafes', icon: Coffee, emoji: '☕' },
  { id: 'restaurant', label: 'Food', icon: Utensils, emoji: '🍽️' },
  { id: 'pharmacy', label: 'Pharmacy', icon: Pill, emoji: '💊' },
  { id: 'gas_station', label: 'Fuel', icon: Fuel, emoji: '⛽' },
  { id: 'atm', label: 'ATM', icon: Building2, emoji: '🏧' },
  { id: 'store', label: 'Stores', icon: Store, emoji: '🏪' },
];

// Simulated nearby places data
const mockPlaces: NearbyPlace[] = [
  { id: '1', name: 'Starbucks', type: 'cafe', distance: '0.3 km', rating: 4.2, isOpen: true, address: '123 Main St', icon: '☕' },
  { id: '2', name: 'Cafe Coffee Day', type: 'cafe', distance: '0.5 km', rating: 4.0, isOpen: true, address: '456 Market Rd', icon: '☕' },
  { id: '3', name: 'Apollo Pharmacy', type: 'pharmacy', distance: '0.2 km', rating: 4.5, isOpen: true, address: '789 Health Ave', icon: '💊' },
  { id: '4', name: 'Domino\'s Pizza', type: 'restaurant', distance: '0.4 km', rating: 4.1, isOpen: true, address: '321 Food Lane', icon: '🍕' },
  { id: '5', name: 'ICICI ATM', type: 'atm', distance: '0.1 km', rating: 4.0, isOpen: true, address: '555 Bank St', icon: '🏧' },
  { id: '6', name: 'Shell Petrol Pump', type: 'gas_station', distance: '0.8 km', rating: 4.3, isOpen: true, address: '999 Highway Rd', icon: '⛽' },
];

export const SmartServicesScreen: React.FC<SmartServicesScreenProps> = ({ onMenuClick }) => {
  const [activeTab, setActiveTab] = useState('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>(mockPlaces);
  
  // Email state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // WhatsApp state
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [whatsappContact, setWhatsappContact] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location error:', error);
        }
      );
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('aura-chat', {
        body: {
          message: `Search and summarize: ${searchQuery}. Give a brief, conversational answer without bullet points.`,
          context: [],
        }
      });

      if (error) throw error;
      setSearchResult(data.response || 'Hmm, couldn\'t find much on that.');
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult('Sorry, something went wrong. Try again?');
    } finally {
      setIsSearching(false);
    }
  };

  const filteredPlaces = selectedCategory 
    ? places.filter(p => p.type === selectedCategory)
    : places;

  const handleOpenMaps = (place: NearbyPlace) => {
    const query = encodeURIComponent(place.name + ' ' + place.address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    toast.success('Opening in Maps...');
  };

  const handleSendEmail = async () => {
    if (!emailTo || !emailSubject || !emailBody) {
      toast.error('Please fill all fields');
      return;
    }

    setIsSendingEmail(true);
    
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Email sent! (Demo mode)');
    setShowEmailDialog(false);
    setEmailTo('');
    setEmailSubject('');
    setEmailBody('');
    setIsSendingEmail(false);
  };

  const handleGenerateEmailBody = async () => {
    if (!emailSubject) {
      toast.error('Enter a subject first');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('aura-chat', {
        body: {
          message: `Write a brief, professional email body for subject: "${emailSubject}". Keep it under 100 words.`,
          context: [],
        }
      });

      if (error) throw error;
      setEmailBody(data.response || '');
      toast.success('Email drafted!');
    } catch (error) {
      console.error('Generate email error:', error);
      toast.error('Could not generate email');
    }
  };

  const handleSendWhatsApp = () => {
    if (!whatsappContact || !whatsappMessage) {
      toast.error('Please fill all fields');
      return;
    }

    // Open WhatsApp with pre-filled message
    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    
    toast.success('Opening WhatsApp...');
    setShowWhatsAppDialog(false);
    setWhatsappContact('');
    setWhatsappMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="rounded-full">
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Smart Services</h1>
              <p className="text-sm text-muted-foreground">
                Search, navigate, communicate
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pb-2">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="nearby" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              Nearby
            </TabsTrigger>
            <TabsTrigger value="search" className="text-xs">
              <Search className="w-3 h-3 mr-1" />
              Search
            </TabsTrigger>
            <TabsTrigger value="email" className="text-xs">
              <Mail className="w-3 h-3 mr-1" />
              Email
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs">
              <MessageCircle className="w-3 h-3 mr-1" />
              Chat
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 pb-24">
        {/* Nearby Places */}
        {activeTab === 'nearby' && (
          <div className="p-4 space-y-4">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="rounded-full shrink-0"
              >
                All
              </Button>
              {placeCategories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="rounded-full shrink-0"
                >
                  <span className="mr-1">{cat.emoji}</span>
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Location status */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>
                {location 
                  ? 'Using your current location'
                  : 'Location not available - showing demo data'
                }
              </span>
            </div>

            {/* Places list */}
            <div className="space-y-3">
              {filteredPlaces.map((place) => (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card 
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleOpenMaps(place)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                        {place.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{place.name}</h4>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            place.isOpen 
                              ? "bg-green-500/10 text-green-600"
                              : "bg-red-500/10 text-red-600"
                          )}>
                            {place.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{place.address}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            {place.distance}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {place.rating}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* AI Search */}
        {activeTab === 'search' && (
          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask anything... e.g., 'What's the weather like?'"
                className="flex-1 rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="rounded-xl"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Search Result */}
            <AnimatePresence>
              {searchResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full aura-gradient flex items-center justify-center text-white">
                        ✨
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">AURA says:</p>
                        <p className="text-foreground leading-relaxed">{searchResult}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick searches */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'What\'s happening with tech today?',
                  'Best productivity tips',
                  'How to stay focused?',
                ].map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery(q);
                      handleSearch();
                    }}
                    className="rounded-full text-xs"
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Email */}
        {activeTab === 'email' && (
          <div className="p-4 space-y-4">
            <Card 
              className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowEmailDialog(true)}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Compose Email</h3>
                  <p className="text-sm text-muted-foreground">
                    AI helps you draft and send emails
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>

            <div className="text-center py-8 text-muted-foreground">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Tap above to compose an email</p>
              <p className="text-sm">AURA can help draft your message</p>
            </div>
          </div>
        )}

        {/* WhatsApp */}
        {activeTab === 'whatsapp' && (
          <div className="p-4 space-y-4">
            <Card 
              className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowWhatsAppDialog(true)}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Send WhatsApp</h3>
                  <p className="text-sm text-muted-foreground">
                    Quick message via WhatsApp
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>

            <Card 
              className="p-6 cursor-pointer hover:bg-muted/50 transition-colors opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <Phone className="w-7 h-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Make a Call</h3>
                  <p className="text-sm text-muted-foreground">
                    Coming in full version
                  </p>
                </div>
                <span className="text-xs bg-muted px-2 py-1 rounded-full">Soon</span>
              </div>
            </Card>

            <p className="text-xs text-center text-muted-foreground">
              WhatsApp and call features are simulated in this demo
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
            <DialogDescription>
              Draft your email - AURA can help write it
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>To</Label>
              <Input
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="email@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="What's this about?"
                className="mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Message</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleGenerateEmailBody}
                  className="text-xs"
                >
                  ✨ AI Draft
                </Button>
              </div>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Write your message..."
                rows={5}
              />
            </div>
            <Button 
              onClick={handleSendEmail} 
              disabled={isSendingEmail}
              className="w-full"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Demo mode - email won't actually be sent
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send WhatsApp Message</DialogTitle>
            <DialogDescription>
              Compose your message to send via WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Contact Name</Label>
              <Input
                value={whatsappContact}
                onChange={(e) => setWhatsappContact(e.target.value)}
                placeholder="e.g., Mom, John, etc."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className="mt-1"
              />
            </div>

            {/* Preview */}
            {whatsappMessage && (
              <Card className="p-3 bg-green-50 dark:bg-green-950/30">
                <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                <div className="bg-green-100 dark:bg-green-900/50 rounded-xl p-3 text-sm">
                  {whatsappMessage}
                </div>
              </Card>
            )}

            <Button 
              onClick={handleSendWhatsApp} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Open in WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
