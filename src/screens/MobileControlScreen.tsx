import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone, Zap, AppWindow, Settings2, Menu, Play,
  ChevronRight, Search, X, Wifi, WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  useMobileControls,
  type AppInfo,
  type DeviceControl,
  type AutomationAction,
} from '@/hooks/useMobileControls';

interface MobileControlScreenProps {
  onMenuClick?: () => void;
}

const APP_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'communication', label: '💬 Chat' },
  { id: 'social', label: '📱 Social' },
  { id: 'entertainment', label: '🎵 Media' },
  { id: 'productivity', label: '📋 Work' },
  { id: 'utility', label: '🔧 Tools' },
  { id: 'health', label: '❤️ Health' },
  { id: 'finance', label: '💳 Pay' },
];

const CONTROL_CATEGORIES = [
  { id: 'connectivity', label: '📶 Network' },
  { id: 'display', label: '🖥️ Display' },
  { id: 'sound', label: '🔊 Sound' },
  { id: 'system', label: '⚙️ System' },
];

export const MobileControlScreen: React.FC<MobileControlScreenProps> = ({ onMenuClick }) => {
  const [activeTab, setActiveTab] = useState('apps');
  const [appFilter, setAppFilter] = useState('all');
  const [appSearch, setAppSearch] = useState('');
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({ brightness: 70, volume: 50 });

  const {
    isNative,
    apps,
    deviceControls,
    automations,
    openApp,
    toggleDeviceControl,
    runAutomation,
  } = useMobileControls();

  const filteredApps = apps.filter(app => {
    const matchesCategory = appFilter === 'all' || app.category === appFilter;
    const matchesSearch = !appSearch || app.name.toLowerCase().includes(appSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToggle = (control: DeviceControl) => {
    const newVal = !toggleStates[control.id];
    setToggleStates(prev => ({ ...prev, [control.id]: newVal }));
    toggleDeviceControl(control, newVal);
  };

  const handleSlider = (control: DeviceControl, value: number[]) => {
    setSliderValues(prev => ({ ...prev, [control.id]: value[0] }));
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
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Mobile Control
              </h1>
              <p className="text-xs text-muted-foreground">
                {isNative ? '📱 Native mode active' : '🌐 Web mode — install app for full control'}
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pb-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="apps" className="text-xs gap-1">
              <AppWindow className="w-3.5 h-3.5" /> Apps
            </TabsTrigger>
            <TabsTrigger value="controls" className="text-xs gap-1">
              <Settings2 className="w-3.5 h-3.5" /> Controls
            </TabsTrigger>
            <TabsTrigger value="automations" className="text-xs gap-1">
              <Zap className="w-3.5 h-3.5" /> Automate
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 pb-24">
        {/* ===== APPS TAB ===== */}
        {activeTab === 'apps' && (
          <div className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={appSearch}
                onChange={e => setAppSearch(e.target.value)}
                placeholder="Search apps..."
                className="pl-9 rounded-xl"
              />
              {appSearch && (
                <Button
                  variant="ghost" size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setAppSearch('')}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {APP_CATEGORIES.map(cat => (
                <Button
                  key={cat.id}
                  variant={appFilter === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAppFilter(cat.id)}
                  className="rounded-full shrink-0 text-xs"
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* App grid */}
            <div className="grid grid-cols-4 gap-3">
              {filteredApps.map((app, i) => (
                <AppTile key={app.id} app={app} index={i} onOpen={openApp} />
              ))}
            </div>

            {filteredApps.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <AppWindow className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No apps found</p>
              </div>
            )}
          </div>
        )}

        {/* ===== CONTROLS TAB ===== */}
        {activeTab === 'controls' && (
          <div className="p-4 space-y-6">
            {CONTROL_CATEGORIES.map(cat => {
              const controls = deviceControls.filter(c => c.category === cat.id);
              return (
                <div key={cat.id}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">{cat.label}</h3>
                  <div className="space-y-2">
                    {controls.map(control => (
                      <ControlTile
                        key={control.id}
                        control={control}
                        isOn={toggleStates[control.id] || false}
                        sliderValue={sliderValues[control.id]}
                        onToggle={() => handleToggle(control)}
                        onSlider={val => handleSlider(control, val)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== AUTOMATIONS TAB ===== */}
        {activeTab === 'automations' && (
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              One-tap workflows that chain multiple actions together
            </p>
            {automations.map((auto, i) => (
              <AutomationCard key={auto.id} automation={auto} index={i} onRun={runAutomation} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

/* ===== Sub-components ===== */

const AppTile: React.FC<{ app: AppInfo; index: number; onOpen: (app: AppInfo) => void }> = ({ app, index, onOpen }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.02 }}
    onClick={() => onOpen(app)}
    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-muted/60 transition-colors active:scale-95 group"
  >
    <div className="w-12 h-12 rounded-2xl bg-card border border-border/60 flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md transition-shadow group-hover:scale-105">
      {app.icon}
    </div>
    <span className="text-[10px] font-medium text-foreground truncate w-full text-center">{app.name}</span>
  </motion.button>
);

const ControlTile: React.FC<{
  control: DeviceControl;
  isOn: boolean;
  sliderValue?: number;
  onToggle: () => void;
  onSlider: (val: number[]) => void;
}> = ({ control, isOn, sliderValue, onToggle, onSlider }) => (
  <Card className={cn(
    'p-4 transition-colors',
    isOn && control.actionType === 'toggle' && 'bg-primary/5 border-primary/20'
  )}>
    <div className="flex items-center gap-3">
      <span className="text-2xl">{control.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{control.name}</p>
        <p className="text-xs text-muted-foreground">{control.description}</p>
        {control.actionType === 'slider' && (
          <Slider
            value={[sliderValue ?? 50]}
            onValueChange={onSlider}
            max={100}
            step={5}
            className="mt-2"
          />
        )}
      </div>
      {control.actionType === 'toggle' && (
        <Switch checked={isOn} onCheckedChange={onToggle} />
      )}
    </div>
  </Card>
);

const AutomationCard: React.FC<{
  automation: AutomationAction;
  index: number;
  onRun: (a: AutomationAction) => void;
}> = ({ automation, index, onRun }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.08 }}
  >
    <Card className="p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
          {automation.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm">{automation.name}</h4>
            <Badge variant="secondary" className="text-[10px]">{automation.steps.length} steps</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{automation.description}</p>
          <div className="space-y-1">
            {automation.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold shrink-0">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Button
        size="sm"
        className="w-full mt-3 rounded-xl gap-2"
        onClick={() => onRun(automation)}
      >
        <Play className="w-3.5 h-3.5" /> Run Automation
      </Button>
    </Card>
  </motion.div>
);
