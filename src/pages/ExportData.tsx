import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const ExportData = () => {
  const [loading, setLoading] = useState(false);

  const downloadCSV = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_engagement')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data) {
        alert('Failed to fetch data');
        return;
      }

      const headers = [
        'id', 'user_id', 'first_interaction_at', 'last_interaction_at',
        'total_messages', 'total_days_active', 'mood_shares', 'skill_sessions',
        'routines_created', 'emotional_conversations', 'relationship_phase',
        'subscription_tier', 'upgrade_prompted_at', 'created_at', 'updated_at'
      ];

      const csvRows = [headers.join(',')];
      for (const row of data) {
        const values = headers.map(h => {
          const val = (row as any)[h];
          if (val === null || val === undefined) return '';
          const str = String(val);
          return str.includes(',') ? `"${str}"` : str;
        });
        csvRows.push(values.join(','));
      }

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user_engagement_data.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Button onClick={downloadCSV} disabled={loading} size="lg">
        <Download className="w-4 h-4 mr-2" />
        {loading ? 'Preparing...' : 'Download User Engagement CSV'}
      </Button>
    </div>
  );
};

export default ExportData;
