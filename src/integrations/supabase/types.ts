export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          description: string | null
          earned_at: string
          icon: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      alarm_executions: {
        Row: {
          actions_performed: Json | null
          alarm_id: string | null
          context_snapshot: Json | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          executed_at: string
          execution_mode: Database["public"]["Enums"]["execution_mode"]
          id: string
          result: Json | null
          status: string
          user_id: string
        }
        Insert: {
          actions_performed?: Json | null
          alarm_id?: string | null
          context_snapshot?: Json | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string
          execution_mode: Database["public"]["Enums"]["execution_mode"]
          id?: string
          result?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          actions_performed?: Json | null
          alarm_id?: string | null
          context_snapshot?: Json | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string
          execution_mode?: Database["public"]["Enums"]["execution_mode"]
          id?: string
          result?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alarm_executions_alarm_id_fkey"
            columns: ["alarm_id"]
            isOneToOne: false
            referencedRelation: "alarms"
            referencedColumns: ["id"]
          },
        ]
      }
      alarms: {
        Row: {
          actions: Json | null
          alarm_type: Database["public"]["Enums"]["alarm_type"]
          autonomy_level: string | null
          category: Database["public"]["Enums"]["task_category"] | null
          conditions: Json | null
          created_at: string
          description: string | null
          execution_mode: Database["public"]["Enums"]["execution_mode"] | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          metadata: Json | null
          next_trigger_at: string | null
          priority: number | null
          repeat_pattern: string | null
          scheduled_at: string
          title: string
          updated_at: string
          urgency: number | null
          user_id: string
        }
        Insert: {
          actions?: Json | null
          alarm_type?: Database["public"]["Enums"]["alarm_type"]
          autonomy_level?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          conditions?: Json | null
          created_at?: string
          description?: string | null
          execution_mode?: Database["public"]["Enums"]["execution_mode"] | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          metadata?: Json | null
          next_trigger_at?: string | null
          priority?: number | null
          repeat_pattern?: string | null
          scheduled_at: string
          title: string
          updated_at?: string
          urgency?: number | null
          user_id: string
        }
        Update: {
          actions?: Json | null
          alarm_type?: Database["public"]["Enums"]["alarm_type"]
          autonomy_level?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          conditions?: Json | null
          created_at?: string
          description?: string | null
          execution_mode?: Database["public"]["Enums"]["execution_mode"] | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          metadata?: Json | null
          next_trigger_at?: string | null
          priority?: number | null
          repeat_pattern?: string | null
          scheduled_at?: string
          title?: string
          updated_at?: string
          urgency?: number | null
          user_id?: string
        }
        Relationships: []
      }
      analyzed_images: {
        Row: {
          analysis_data: Json | null
          annotations: string[] | null
          created_at: string
          id: string
          original_image_url: string
          transformation_type: string | null
          transformed_image_url: string | null
          user_id: string
        }
        Insert: {
          analysis_data?: Json | null
          annotations?: string[] | null
          created_at?: string
          id?: string
          original_image_url: string
          transformation_type?: string | null
          transformed_image_url?: string | null
          user_id: string
        }
        Update: {
          analysis_data?: Json | null
          annotations?: string[] | null
          created_at?: string
          id?: string
          original_image_url?: string
          transformation_type?: string | null
          transformed_image_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      batch_tasks: {
        Row: {
          alarm_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          message_template: string | null
          platform: string | null
          progress: Json | null
          recipients: Json
          scheduled_at: string | null
          status: string | null
          task_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alarm_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          message_template?: string | null
          platform?: string | null
          progress?: Json | null
          recipients?: Json
          scheduled_at?: string | null
          status?: string | null
          task_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alarm_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          message_template?: string | null
          platform?: string | null
          progress?: Json | null
          recipients?: Json
          scheduled_at?: string | null
          status?: string | null
          task_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_tasks_alarm_id_fkey"
            columns: ["alarm_id"]
            isOneToOne: false
            referencedRelation: "alarms"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          completed: boolean | null
          current_progress: number | null
          id: string
          joined_at: string
          last_progress_date: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean | null
          current_progress?: number | null
          id?: string
          joined_at?: string
          last_progress_date?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean | null
          current_progress?: number | null
          id?: string
          joined_at?: string
          last_progress_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "community_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_date: string
          content: string
          created_at: string
          id: string
          sender: string
          user_id: string
        }
        Insert: {
          chat_date?: string
          content: string
          created_at?: string
          id?: string
          sender: string
          user_id: string
        }
        Update: {
          chat_date?: string
          content?: string
          created_at?: string
          id?: string
          sender?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean | null
          message_count: number | null
          session_date: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          message_count?: number | null
          session_date?: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          message_count?: number | null
          session_date?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_summaries: {
        Row: {
          created_at: string
          emotional_trend: string | null
          extracted_memories: string[] | null
          id: string
          key_topics: string[] | null
          message_count: number
          open_loops: string[] | null
          summary: string
          time_range_end: string
          time_range_start: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emotional_trend?: string | null
          extracted_memories?: string[] | null
          id?: string
          key_topics?: string[] | null
          message_count?: number
          open_loops?: string[] | null
          summary: string
          time_range_end: string
          time_range_start: string
          user_id: string
        }
        Update: {
          created_at?: string
          emotional_trend?: string | null
          extracted_memories?: string[] | null
          id?: string
          key_topics?: string[] | null
          message_count?: number
          open_loops?: string[] | null
          summary?: string
          time_range_end?: string
          time_range_start?: string
          user_id?: string
        }
        Relationships: []
      }
      community_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          start_date: string
          target_value: number
          title: string
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          start_date?: string
          target_value?: number
          title: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          start_date?: string
          target_value?: number
          title?: string
        }
        Relationships: []
      }
      daily_chats: {
        Row: {
          archived_at: string | null
          chat_date: string
          created_at: string
          id: string
          message_count: number
          status: string
          summary_id: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          chat_date: string
          created_at?: string
          id?: string
          message_count?: number
          status?: string
          summary_id?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          chat_date?: string
          created_at?: string
          id?: string
          message_count?: number
          status?: string
          summary_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_chats_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "chat_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_focus_blocks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          date: string
          description: string | null
          duration_minutes: number | null
          id: string
          priority: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          date?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          priority?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          date?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          priority?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          completed: string
          created_at: string
          duration_minutes: number
          focus_type: string
          goal: string | null
          gym_body_area: string | null
          gym_sub_type: string | null
          id: string
          struggled_count: number | null
          user_id: string
        }
        Insert: {
          completed?: string
          created_at?: string
          duration_minutes?: number
          focus_type: string
          goal?: string | null
          gym_body_area?: string | null
          gym_sub_type?: string | null
          id?: string
          struggled_count?: number | null
          user_id: string
        }
        Update: {
          completed?: string
          created_at?: string
          duration_minutes?: number
          focus_type?: string
          goal?: string | null
          gym_body_area?: string | null
          gym_sub_type?: string | null
          id?: string
          struggled_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          contact_identifier: string | null
          contact_name: string
          context: string | null
          created_at: string
          follow_up_count: number | null
          id: string
          last_contact_at: string | null
          metadata: Json | null
          next_follow_up_at: string | null
          notes: string | null
          platform: string
          response_received: boolean | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_identifier?: string | null
          contact_name: string
          context?: string | null
          created_at?: string
          follow_up_count?: number | null
          id?: string
          last_contact_at?: string | null
          metadata?: Json | null
          next_follow_up_at?: string | null
          notes?: string | null
          platform: string
          response_received?: boolean | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_identifier?: string | null
          contact_name?: string
          context?: string | null
          created_at?: string
          follow_up_count?: number | null
          id?: string
          last_contact_at?: string | null
          metadata?: Json | null
          next_follow_up_at?: string | null
          notes?: string | null
          platform?: string
          response_received?: boolean | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      friend_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_at: string
          count: number | null
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          count?: number | null
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          count?: number | null
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          created_at: string
          frequency: string
          icon: string | null
          id: string
          name: string
          reminder_enabled: boolean | null
          reminder_time: string | null
          target_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          icon?: string | null
          id?: string
          name: string
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          target_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          icon?: string | null
          id?: string
          name?: string
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          target_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      hydration_logs: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amount_ml?: number
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      hydration_settings: {
        Row: {
          created_at: string
          daily_goal_ml: number
          id: string
          reminder_enabled: boolean
          reminder_interval_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_goal_ml?: number
          id?: string
          reminder_enabled?: boolean
          reminder_interval_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_goal_ml?: number
          id?: string
          reminder_enabled?: boolean
          reminder_interval_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      life_memories: {
        Row: {
          content: string
          created_at: string
          id: string
          importance_score: number | null
          last_referenced_at: string | null
          memory_type: string
          metadata: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          importance_score?: number | null
          last_referenced_at?: string | null
          memory_type: string
          metadata?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          importance_score?: number | null
          last_referenced_at?: string | null
          memory_type?: string
          metadata?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memories: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      mentorship_profiles: {
        Row: {
          created_at: string
          follow_up_enabled: boolean | null
          id: string
          injuries_notes: string | null
          last_checkin_time: string | null
          level: string | null
          mentorship_style: string | null
          only_if_user_messages_first: boolean | null
          practices: string[] | null
          quiet_during_work: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          role_types: string[] | null
          subjects: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          follow_up_enabled?: boolean | null
          id?: string
          injuries_notes?: string | null
          last_checkin_time?: string | null
          level?: string | null
          mentorship_style?: string | null
          only_if_user_messages_first?: boolean | null
          practices?: string[] | null
          quiet_during_work?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          role_types?: string[] | null
          subjects?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          follow_up_enabled?: boolean | null
          id?: string
          injuries_notes?: string | null
          last_checkin_time?: string | null
          level?: string | null
          mentorship_style?: string | null
          only_if_user_messages_first?: boolean | null
          practices?: string[] | null
          quiet_during_work?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          role_types?: string[] | null
          subjects?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_checkins: {
        Row: {
          created_at: string
          energy: string
          id: string
          mood: string
          notes: string | null
          stress: string
          user_id: string
        }
        Insert: {
          created_at?: string
          energy: string
          id?: string
          mood: string
          notes?: string | null
          stress: string
          user_id: string
        }
        Update: {
          created_at?: string
          energy?: string
          id?: string
          mood?: string
          notes?: string | null
          stress?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          status: string
          tier: string
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          status?: string
          tier: string
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          status?: string
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          birthday: string | null
          created_at: string
          gender: string | null
          goals: string[] | null
          id: string
          languages: string[] | null
          name: string
          preferred_model: string | null
          profession: string | null
          professions: string[] | null
          public_profile: boolean | null
          share_focus_stats: boolean | null
          sleep_time: string | null
          stress_level: string | null
          tone_preference: string | null
          updated_at: string
          wake_time: string | null
        }
        Insert: {
          age?: number | null
          birthday?: string | null
          created_at?: string
          gender?: string | null
          goals?: string[] | null
          id: string
          languages?: string[] | null
          name: string
          preferred_model?: string | null
          profession?: string | null
          professions?: string[] | null
          public_profile?: boolean | null
          share_focus_stats?: boolean | null
          sleep_time?: string | null
          stress_level?: string | null
          tone_preference?: string | null
          updated_at?: string
          wake_time?: string | null
        }
        Update: {
          age?: number | null
          birthday?: string | null
          created_at?: string
          gender?: string | null
          goals?: string[] | null
          id?: string
          languages?: string[] | null
          name?: string
          preferred_model?: string | null
          profession?: string | null
          professions?: string[] | null
          public_profile?: boolean | null
          share_focus_stats?: boolean | null
          sleep_time?: string | null
          stress_level?: string | null
          tone_preference?: string | null
          updated_at?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          user_id: string
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
          uses_count?: number
        }
        Relationships: []
      }
      referral_wallets: {
        Row: {
          cash_balance: number
          created_at: string
          credit_balance: number
          id: string
          successful_referrals: number
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cash_balance?: number
          created_at?: string
          credit_balance?: number
          id?: string
          successful_referrals?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cash_balance?: number
          created_at?: string
          credit_balance?: number
          id?: string
          successful_referrals?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_amount: number | null
          confirmed_at: string | null
          created_at: string
          hold_until: string | null
          id: string
          plan_type: string | null
          referral_code: string
          referred_user_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          commission_amount?: number | null
          confirmed_at?: string | null
          created_at?: string
          hold_until?: string | null
          id?: string
          plan_type?: string | null
          referral_code: string
          referred_user_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          commission_amount?: number | null
          confirmed_at?: string | null
          created_at?: string
          hold_until?: string | null
          id?: string
          plan_type?: string | null
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          text: string
          time: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          text: string
          time: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          text?: string
          time?: string
          user_id?: string
        }
        Relationships: []
      }
      routines: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          time: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          time: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          time?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          notification_type: string
          scheduled_for: string
          sent: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          notification_type: string
          scheduled_for: string
          sent?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          notification_type?: string
          scheduled_for?: string
          sent?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          payment_id: string | null
          started_at: string
          status: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          started_at?: string
          status?: string
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          started_at?: string
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_context_state: {
        Row: {
          active_focus_session: boolean | null
          burnout_score: number | null
          context_metadata: Json | null
          current_energy: string | null
          current_location: string | null
          current_mood: string | null
          id: string
          is_exercising: boolean | null
          is_studying: boolean | null
          is_working: boolean | null
          last_sleep_at: string | null
          last_wake_at: string | null
          motivation_level: number | null
          quiet_hours_active: boolean | null
          sleep_quality: string | null
          stress_level: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_focus_session?: boolean | null
          burnout_score?: number | null
          context_metadata?: Json | null
          current_energy?: string | null
          current_location?: string | null
          current_mood?: string | null
          id?: string
          is_exercising?: boolean | null
          is_studying?: boolean | null
          is_working?: boolean | null
          last_sleep_at?: string | null
          last_wake_at?: string | null
          motivation_level?: number | null
          quiet_hours_active?: boolean | null
          sleep_quality?: string | null
          stress_level?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_focus_session?: boolean | null
          burnout_score?: number | null
          context_metadata?: Json | null
          current_energy?: string | null
          current_location?: string | null
          current_mood?: string | null
          id?: string
          is_exercising?: boolean | null
          is_studying?: boolean | null
          is_working?: boolean | null
          last_sleep_at?: string | null
          last_wake_at?: string | null
          motivation_level?: number | null
          quiet_hours_active?: boolean | null
          sleep_quality?: string | null
          stress_level?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          daily_credits_limit: number
          daily_credits_used: number
          id: string
          is_premium: boolean
          last_reset_date: string
          premium_since: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_credits_limit?: number
          daily_credits_used?: number
          id?: string
          is_premium?: boolean
          last_reset_date?: string
          premium_since?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_credits_limit?: number
          daily_credits_used?: number
          id?: string
          is_premium?: boolean
          last_reset_date?: string
          premium_since?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_engagement: {
        Row: {
          created_at: string
          emotional_conversations: number
          first_interaction_at: string
          id: string
          last_interaction_at: string
          mood_shares: number
          relationship_phase: string
          routines_created: number
          skill_sessions: number
          subscription_tier: string
          total_days_active: number
          total_messages: number
          updated_at: string
          upgrade_prompted_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          emotional_conversations?: number
          first_interaction_at?: string
          id?: string
          last_interaction_at?: string
          mood_shares?: number
          relationship_phase?: string
          routines_created?: number
          skill_sessions?: number
          subscription_tier?: string
          total_days_active?: number
          total_messages?: number
          updated_at?: string
          upgrade_prompted_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          emotional_conversations?: number
          first_interaction_at?: string
          id?: string
          last_interaction_at?: string
          mood_shares?: number
          relationship_phase?: string
          routines_created?: number
          skill_sessions?: number
          subscription_tier?: string
          total_days_active?: number
          total_messages?: number
          updated_at?: string
          upgrade_prompted_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_transcripts: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_reflections: {
        Row: {
          challenges: string | null
          created_at: string
          focus_blocks_completed: number | null
          gratitude: string | null
          highlights: string | null
          id: string
          next_week_intention: string | null
          overall_feeling: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          challenges?: string | null
          created_at?: string
          focus_blocks_completed?: number | null
          gratitude?: string | null
          highlights?: string | null
          id?: string
          next_week_intention?: string | null
          overall_feeling?: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          challenges?: string | null
          created_at?: string
          focus_blocks_completed?: number | null
          gratitude?: string | null
          highlights?: string | null
          id?: string
          next_week_intention?: string | null
          overall_feeling?: string | null
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          bank_details: Json | null
          created_at: string
          id: string
          processed_at: string | null
          status: string
          upi_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bank_details?: Json | null
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          upi_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bank_details?: Json | null
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          upi_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_friend_code: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
    }
    Enums: {
      alarm_type:
        | "time_based"
        | "purpose"
        | "batch_task"
        | "follow_up"
        | "calendar_autopilot"
        | "reminder_chain"
      execution_mode:
        | "ring_ask_execute"
        | "ring_execute"
        | "silent_execute"
        | "silent_execute_report"
        | "suppress"
        | "delay"
      task_category:
        | "fitness"
        | "study"
        | "finance"
        | "social"
        | "reflection"
        | "routine"
        | "networking"
        | "outreach"
        | "wellness"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alarm_type: [
        "time_based",
        "purpose",
        "batch_task",
        "follow_up",
        "calendar_autopilot",
        "reminder_chain",
      ],
      execution_mode: [
        "ring_ask_execute",
        "ring_execute",
        "silent_execute",
        "silent_execute_report",
        "suppress",
        "delay",
      ],
      task_category: [
        "fitness",
        "study",
        "finance",
        "social",
        "reflection",
        "routine",
        "networking",
        "outreach",
        "wellness",
      ],
    },
  },
} as const
