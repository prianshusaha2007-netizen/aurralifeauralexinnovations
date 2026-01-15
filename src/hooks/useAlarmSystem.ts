import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccessibilityService, AppId } from '@/hooks/useAccessibilityService';
import { useNativeCapabilities } from '@/hooks/useNativeCapabilities';

// Types for alarm system
export type AlarmType = 'time_based' | 'purpose' | 'batch_task' | 'follow_up' | 'calendar_autopilot' | 'reminder_chain';
export type ExecutionMode = 'ring_ask_execute' | 'ring_execute' | 'silent_execute' | 'silent_execute_report' | 'suppress' | 'delay';
export type TaskCategory = 'fitness' | 'study' | 'finance' | 'social' | 'reflection' | 'routine' | 'networking' | 'outreach' | 'wellness';
export type AutonomyLevel = 'A' | 'B' | 'C';

export interface AlarmAction {
  type: 'send_message' | 'send_email' | 'calendar_event' | 'open_app' | 'play_music' | 'start_workflow' | 'create_note' | 'trigger_reminder';
  platform?: 'whatsapp' | 'sms' | 'linkedin' | 'instagram' | 'email';
  target?: string;
  content?: string;
  appId?: AppId;
  workflowType?: 'study' | 'gym' | 'reflection' | 'finance' | 'routine';
  metadata?: Record<string, unknown>;
}

export interface AlarmConditions {
  minMood?: number;
  maxMood?: number;
  minEnergy?: number;
  maxEnergy?: number;
  allowedDays?: number[];
  quietHoursRespect?: boolean;
  burnoutThreshold?: number;
  requiresApproval?: boolean;
}

export interface Alarm {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  alarm_type: AlarmType;
  category?: TaskCategory;
  scheduled_at: string;
  repeat_pattern?: string;
  is_active: boolean;
  execution_mode: ExecutionMode;
  autonomy_level: AutonomyLevel;
  priority: number;
  urgency: number;
  actions: AlarmAction[];
  conditions: AlarmConditions;
  metadata?: Record<string, unknown>;
  last_triggered_at?: string;
  next_trigger_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserContextState {
  current_mood?: string;
  current_energy?: string;
  motivation_level?: number;
  burnout_score?: number;
  stress_level?: number;
  is_working?: boolean;
  is_studying?: boolean;
  is_exercising?: boolean;
  active_focus_session?: boolean;
  quiet_hours_active?: boolean;
}

export interface BatchTask {
  id: string;
  alarm_id?: string;
  title: string;
  task_type: string;
  recipients: Array<{ name: string; identifier: string }>;
  message_template?: string;
  platform?: string;
  status: string;
  progress: { sent: number; total: number; failed: number };
}

export const useAlarmSystem = () => {
  const { user } = useAuth();
  const { openApp, sendMessage, playSpotify, executeWorkflow } = useAccessibilityService();
  const { scheduleNotification, hapticNotification, isNative } = useNativeCapabilities();

  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [pendingAlarms, setPendingAlarms] = useState<Alarm[]>([]);
  const [userContext, setUserContext] = useState<UserContextState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  // Fetch alarms
  const fetchAlarms = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('alarms')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      
      // Type-safe transformation
      const transformedAlarms: Alarm[] = (data || []).map(alarm => ({
        ...alarm,
        alarm_type: alarm.alarm_type as AlarmType,
        execution_mode: alarm.execution_mode as ExecutionMode,
        category: alarm.category as TaskCategory | undefined,
        autonomy_level: (alarm.autonomy_level || 'A') as AutonomyLevel,
        actions: (alarm.actions as unknown as AlarmAction[]) || [],
        conditions: (alarm.conditions as unknown as AlarmConditions) || {},
        metadata: alarm.metadata as Record<string, unknown> | undefined,
      }));
      
      setAlarms(transformedAlarms);
    } catch (error) {
      console.error('Error fetching alarms:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch user context state
  const fetchUserContext = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_context_state')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setUserContext(data);
      }
    } catch (error) {
      console.log('No context state found, using defaults');
    }
  }, [user?.id]);

  // Update user context
  const updateUserContext = useCallback(async (updates: Partial<UserContextState>) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_context_state')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (!error) {
        setUserContext(prev => ({ ...prev, ...updates }));
      }
    } catch (error) {
      console.error('Error updating context:', error);
    }
  }, [user?.id]);

  // Create alarm
  const createAlarm = useCallback(async (alarmData: Omit<Alarm, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return null;

    try {
      const insertData = {
        title: alarmData.title,
        description: alarmData.description,
        alarm_type: alarmData.alarm_type,
        category: alarmData.category,
        scheduled_at: alarmData.scheduled_at,
        repeat_pattern: alarmData.repeat_pattern,
        is_active: alarmData.is_active,
        execution_mode: alarmData.execution_mode,
        autonomy_level: alarmData.autonomy_level,
        priority: alarmData.priority,
        urgency: alarmData.urgency,
        actions: alarmData.actions as unknown as Record<string, unknown>[],
        conditions: alarmData.conditions as unknown as Record<string, unknown>,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('alarms')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Schedule native notification if on mobile
      if (isNative && data) {
        const scheduledDate = new Date(data.scheduled_at);
        await scheduleNotification(
          data.title,
          data.description || 'Time for your scheduled task',
          scheduledDate
        );
      }

      await fetchAlarms();
      return data;
    } catch (error) {
      console.error('Error creating alarm:', error);
      return null;
    }
  }, [user?.id, fetchAlarms, isNative, scheduleNotification]);

  // Update alarm
  const updateAlarm = useCallback(async (alarmId: string, updates: Partial<Alarm>) => {
    if (!user?.id) return false;

    try {
      const updateData = {
        ...updates,
        actions: updates.actions ? (updates.actions as unknown as Record<string, unknown>[]) : undefined,
        conditions: updates.conditions ? (updates.conditions as unknown as Record<string, unknown>) : undefined,
      };
      
      const { error } = await supabase
        .from('alarms')
        .update(updateData)
        .eq('id', alarmId)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchAlarms();
      return true;
    } catch (error) {
      console.error('Error updating alarm:', error);
      return false;
    }
  }, [user?.id, fetchAlarms]);

  // Delete alarm
  const deleteAlarm = useCallback(async (alarmId: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('alarms')
        .delete()
        .eq('id', alarmId)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchAlarms();
      return true;
    } catch (error) {
      console.error('Error deleting alarm:', error);
      return false;
    }
  }, [user?.id, fetchAlarms]);

  // Determine execution mode based on context
  const determineAdaptiveMode = useCallback((alarm: Alarm): ExecutionMode => {
    const { conditions } = alarm;
    
    // Check burnout
    if (userContext.burnout_score && conditions.burnoutThreshold) {
      if (userContext.burnout_score > conditions.burnoutThreshold) {
        return 'suppress';
      }
    }

    // Check quiet hours
    if (conditions.quietHoursRespect && userContext.quiet_hours_active) {
      return 'silent_execute_report';
    }

    // Check energy levels
    if (userContext.current_energy === 'low') {
      if (alarm.priority < 7) {
        return 'delay';
      }
      return 'ring_ask_execute';
    }

    // Check if in focus session
    if (userContext.active_focus_session && alarm.priority < 9) {
      return 'silent_execute_report';
    }

    // Default to alarm's configured mode
    return alarm.execution_mode;
  }, [userContext]);

  // Execute alarm action
  const executeAction = useCallback(async (action: AlarmAction): Promise<boolean> => {
    setExecutionLog(prev => [...prev, `Executing: ${action.type}`]);

    try {
      switch (action.type) {
        case 'send_message':
          if (action.target && action.content) {
            await sendMessage(action.target, action.content, (action.platform as AppId) || 'whatsapp');
          }
          break;

        case 'open_app':
          if (action.appId) {
            await openApp(action.appId);
          }
          break;

        case 'play_music':
          await playSpotify(action.content);
          break;

        case 'start_workflow':
          if (action.workflowType) {
            setExecutionLog(prev => [...prev, `Starting ${action.workflowType} workflow...`]);
            // Trigger workflow-specific actions
            switch (action.workflowType) {
              case 'study':
                await openApp('youtube');
                break;
              case 'gym':
                await playSpotify('workout music');
                break;
              case 'reflection':
                // Open journaling
                break;
            }
          }
          break;

        case 'calendar_event':
          await openApp('calendar');
          break;

        case 'trigger_reminder':
          if (isNative) {
            await hapticNotification('warning');
          }
          break;
      }

      setExecutionLog(prev => [...prev, `✓ ${action.type} completed`]);
      return true;
    } catch (error) {
      setExecutionLog(prev => [...prev, `✗ ${action.type} failed`]);
      console.error('Action execution error:', error);
      return false;
    }
  }, [openApp, sendMessage, playSpotify, hapticNotification, isNative]);

  // Execute alarm
  const executeAlarm = useCallback(async (alarm: Alarm, approved: boolean = true) => {
    if (!user?.id || !approved) return;

    const adaptiveMode = determineAdaptiveMode(alarm);
    
    // Log execution start
    await supabase.from('alarm_executions').insert({
      alarm_id: alarm.id,
      user_id: user.id,
      execution_mode: adaptiveMode,
      status: 'executing',
      context_snapshot: userContext as unknown as Record<string, unknown>,
    });

    const startTime = Date.now();
    const actionsPerformed: AlarmAction[] = [];

    // Execute each action
    for (const action of alarm.actions) {
      const success = await executeAction(action);
      if (success) {
        actionsPerformed.push(action);
      }
      await new Promise(r => setTimeout(r, 500)); // Delay between actions
    }

    // Log execution complete
    await supabase.from('alarm_executions').insert({
      alarm_id: alarm.id,
      user_id: user.id,
      execution_mode: adaptiveMode,
      status: 'completed',
      actions_performed: actionsPerformed as unknown as Record<string, unknown>[],
      context_snapshot: userContext as unknown as Record<string, unknown>,
      duration_ms: Date.now() - startTime,
    });

    // Update alarm last triggered
    await updateAlarm(alarm.id, {
      last_triggered_at: new Date().toISOString(),
    });

  }, [user?.id, userContext, determineAdaptiveMode, executeAction, updateAlarm]);

  // Check for pending alarms
  const checkPendingAlarms = useCallback(() => {
    const now = new Date();
    const pending = alarms.filter(alarm => {
      if (!alarm.is_active) return false;
      const scheduledTime = new Date(alarm.scheduled_at);
      const timeDiff = scheduledTime.getTime() - now.getTime();
      // Within next 5 minutes
      return timeDiff >= 0 && timeDiff <= 5 * 60 * 1000;
    });
    setPendingAlarms(pending);
  }, [alarms]);

  // Create batch task
  const createBatchTask = useCallback(async (
    title: string,
    recipients: Array<{ name: string; identifier: string }>,
    messageTemplate: string,
    platform: string,
    scheduledAt?: Date
  ) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('batch_tasks')
        .insert({
          user_id: user.id,
          title,
          task_type: 'message_batch',
          recipients,
          message_template: messageTemplate,
          platform,
          status: 'pending',
          scheduled_at: scheduledAt?.toISOString(),
          progress: { sent: 0, total: recipients.length, failed: 0 },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating batch task:', error);
      return null;
    }
  }, [user?.id]);

  // Execute batch task
  const executeBatchTask = useCallback(async (taskId: string) => {
    if (!user?.id) return;

    const { data: task } = await supabase
      .from('batch_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!task) return;

    const recipients = task.recipients as Array<{ name: string; identifier: string }>;
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        const personalizedMessage = (task.message_template || '').replace('{name}', recipient.name);
        await sendMessage(recipient.identifier, personalizedMessage, (task.platform as AppId) || 'whatsapp');
        sent++;
      } catch {
        failed++;
      }

      // Update progress
      await supabase
        .from('batch_tasks')
        .update({
          progress: { sent, total: recipients.length, failed },
          status: sent + failed === recipients.length ? 'completed' : 'in_progress',
        })
        .eq('id', taskId);

      await new Promise(r => setTimeout(r, 2000)); // Rate limiting
    }
  }, [user?.id, sendMessage]);

  // Effects
  useEffect(() => {
    fetchAlarms();
    fetchUserContext();
  }, [fetchAlarms, fetchUserContext]);

  useEffect(() => {
    const interval = setInterval(checkPendingAlarms, 60000); // Check every minute
    checkPendingAlarms();
    return () => clearInterval(interval);
  }, [checkPendingAlarms]);

  return {
    alarms,
    pendingAlarms,
    userContext,
    isLoading,
    executionLog,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    executeAlarm,
    updateUserContext,
    createBatchTask,
    executeBatchTask,
    fetchAlarms,
    determineAdaptiveMode,
  };
};
