import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AutonomySettings } from '@/components/AutonomySettings';
import { toast } from 'sonner';

export const AutonomySettingsScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleSave = () => {
    toast.success('Preferences saved!');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <div>
              <h1 className="font-semibold">AURRA Settings</h1>
              <p className="text-xs text-muted-foreground">Customize how AURRA works for you</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        <AutonomySettings onSave={handleSave} />
      </div>
    </motion.div>
  );
};

export default AutonomySettingsScreen;
