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
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender: string
          user_id: string
        }
        Update: {
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
      profiles: {
        Row: {
          age: number | null
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
          sleep_time: string | null
          stress_level: string | null
          tone_preference: string | null
          updated_at: string
          wake_time: string | null
        }
        Insert: {
          age?: number | null
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
          sleep_time?: string | null
          stress_level?: string | null
          tone_preference?: string | null
          updated_at?: string
          wake_time?: string | null
        }
        Update: {
          age?: number | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_friend_code: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
