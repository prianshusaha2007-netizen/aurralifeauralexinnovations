import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AlarmDashboard from '@/components/AlarmDashboard';
import AdaptiveExecutionEngine from '@/components/AdaptiveExecutionEngine';
import { Alarm } from '@/hooks/useAlarmSystem';

const AlarmsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [executingAlarm, setExecutingAlarm] = useState<Alarm | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Alarms & Automation</h1>
        </div>
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-[calc(100vh-60px)]"
      >
        <AlarmDashboard />
      </motion.div>

      {/* Execution engine overlay */}
      {executingAlarm && (
        <AdaptiveExecutionEngine
          alarm={executingAlarm}
          onComplete={() => setExecutingAlarm(null)}
          onCancel={() => setExecutingAlarm(null)}
        />
      )}
    </div>
  );
};

export default AlarmsScreen;
