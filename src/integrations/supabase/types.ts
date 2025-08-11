export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          attachments: string[] | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          location: string | null
          meeting_link: string | null
          notes: string | null
          payment_status: string | null
          price: number | null
          reminder_sent: boolean | null
          scheduled_time: string
          status: string | null
          student_id: string | null
          teacher_id: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          payment_status?: string | null
          price?: number | null
          reminder_sent?: boolean | null
          scheduled_time: string
          status?: string | null
          student_id?: string | null
          teacher_id?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          payment_status?: string | null
          price?: number | null
          reminder_sent?: boolean | null
          scheduled_time?: string
          status?: string | null
          student_id?: string | null
          teacher_id?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          action_text: string | null
          action_url: string | null
          created_at: string | null
          deep_link: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          message: string | null
          priority: number | null
          start_date: string | null
          target_users: string[] | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          action_text?: string | null
          action_url?: string | null
          created_at?: string | null
          deep_link?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          message?: string | null
          priority?: number | null
          start_date?: string | null
          target_users?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          action_text?: string | null
          action_url?: string | null
          created_at?: string | null
          deep_link?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          message?: string | null
          priority?: number | null
          start_date?: string | null
          target_users?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          conversation_id: string | null
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_read: boolean | null
          message: string
          message_type: string | null
          read_at: string | null
          reply_to: string | null
          sender_id: string | null
          sender_type: string | null
        }
        Insert: {
          attachments?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          message_type?: string | null
          read_at?: string | null
          reply_to?: string | null
          sender_id?: string | null
          sender_type?: string | null
        }
        Update: {
          attachments?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          message_type?: string | null
          read_at?: string | null
          reply_to?: string | null
          sender_id?: string | null
          sender_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_message: string | null
          last_message_at: string | null
          student_id: string | null
          teacher_id: string | null
          unread_count_student: number | null
          unread_count_teacher: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_active?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          student_id?: string | null
          teacher_id?: string | null
          unread_count_student?: number | null
          unread_count_teacher?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          student_id?: string | null
          teacher_id?: string | null
          unread_count_student?: number | null
          unread_count_teacher?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          certificate_issued: boolean | null
          certificate_url: string | null
          course_id: string | null
          enrolled_at: string | null
          id: string
          last_accessed: string | null
          module_progress: Json | null
          overall_progress: number | null
          user_id: string | null
        }
        Insert: {
          certificate_issued?: boolean | null
          certificate_url?: string | null
          course_id?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed?: string | null
          module_progress?: Json | null
          overall_progress?: number | null
          user_id?: string | null
        }
        Update: {
          certificate_issued?: boolean | null
          certificate_url?: string | null
          course_id?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed?: string | null
          module_progress?: Json | null
          overall_progress?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration: number | null
          enrolled_users: string[] | null
          id: string
          instructor: string | null
          is_published: boolean | null
          modules: Json | null
          price: number | null
          published_at: string | null
          rating: number | null
          reviews: number | null
          tags: string[] | null
          thumbnail: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: number | null
          enrolled_users?: string[] | null
          id?: string
          instructor?: string | null
          is_published?: boolean | null
          modules?: Json | null
          price?: number | null
          published_at?: string | null
          rating?: number | null
          reviews?: number | null
          tags?: string[] | null
          thumbnail?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: number | null
          enrolled_users?: string[] | null
          id?: string
          instructor?: string | null
          is_published?: boolean | null
          modules?: Json | null
          price?: number | null
          published_at?: string | null
          rating?: number | null
          reviews?: number | null
          tags?: string[] | null
          thumbnail?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string | null
          difficulty: string
          duration: number | null
          equipment: string[] | null
          id: string
          instructions: string | null
          muscle_group: string
          name: string
          reps: number
          rest_time: number
          sets: number
          video_url: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          difficulty: string
          duration?: number | null
          equipment?: string[] | null
          id?: string
          instructions?: string | null
          muscle_group: string
          name: string
          reps: number
          rest_time: number
          sets: number
          video_url?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string
          duration?: number | null
          equipment?: string[] | null
          id?: string
          instructions?: string | null
          muscle_group?: string
          name?: string
          reps?: number
          rest_time?: number
          sets?: number
          video_url?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          actual_time: string | null
          consumed: boolean | null
          created_at: string | null
          custom_portion_amount: number | null
          custom_portion_unit: string | null
          date: string
          id: string
          meal_id: string | null
          notes: string | null
          nutrition_plan_id: string | null
          photo_url: string | null
          rating: number | null
          user_id: string | null
        }
        Insert: {
          actual_time?: string | null
          consumed?: boolean | null
          created_at?: string | null
          custom_portion_amount?: number | null
          custom_portion_unit?: string | null
          date: string
          id?: string
          meal_id?: string | null
          notes?: string | null
          nutrition_plan_id?: string | null
          photo_url?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          actual_time?: string | null
          consumed?: boolean | null
          created_at?: string | null
          custom_portion_amount?: number | null
          custom_portion_unit?: string | null
          date?: string
          id?: string
          meal_id?: string | null
          notes?: string | null
          nutrition_plan_id?: string | null
          photo_url?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_logs_nutrition_plan_id_fkey"
            columns: ["nutrition_plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          calories: number
          carbs: number
          category: string | null
          created_at: string | null
          description: string | null
          fat: number
          fiber: number | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          instructions: string | null
          name: string
          portion_amount: number | null
          portion_unit: string | null
          protein: number
          sodium: number | null
          sugar: number | null
          time: string | null
        }
        Insert: {
          calories: number
          carbs: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          fat: number
          fiber?: number | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          instructions?: string | null
          name: string
          portion_amount?: number | null
          portion_unit?: string | null
          protein: number
          sodium?: number | null
          sugar?: number | null
          time?: string | null
        }
        Update: {
          calories?: number
          carbs?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          fat?: number
          fiber?: number | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          instructions?: string | null
          name?: string
          portion_amount?: number | null
          portion_unit?: string | null
          protein?: number
          sodium?: number | null
          sugar?: number | null
          time?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_required: boolean | null
          action_text: string | null
          action_url: string | null
          created_at: string | null
          data: Json | null
          deep_link: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          message: string
          priority: string | null
          read_at: string | null
          scheduled_for: string | null
          target_users: string[] | null
          title: string
          type: string | null
        }
        Insert: {
          action_required?: boolean | null
          action_text?: string | null
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          deep_link?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          message: string
          priority?: string | null
          read_at?: string | null
          scheduled_for?: string | null
          target_users?: string[] | null
          title: string
          type?: string | null
        }
        Update: {
          action_required?: boolean | null
          action_text?: string | null
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          deep_link?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          message?: string
          priority?: string | null
          read_at?: string | null
          scheduled_for?: string | null
          target_users?: string[] | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      nutrition_plans: {
        Row: {
          adherence_rate: number | null
          assigned_to: string[] | null
          created_at: string | null
          created_by: string | null
          daily_calories: number | null
          daily_carbs: number | null
          daily_fat: number | null
          daily_fiber: number | null
          daily_protein: number | null
          daily_water: number | null
          description: string | null
          duration: number | null
          end_date: string | null
          id: string
          is_template: boolean | null
          meals: Json | null
          name: string
          start_date: string | null
          tags: string[] | null
          updated_at: string | null
          weekly_schedule: Json | null
        }
        Insert: {
          adherence_rate?: number | null
          assigned_to?: string[] | null
          created_at?: string | null
          created_by?: string | null
          daily_calories?: number | null
          daily_carbs?: number | null
          daily_fat?: number | null
          daily_fiber?: number | null
          daily_protein?: number | null
          daily_water?: number | null
          description?: string | null
          duration?: number | null
          end_date?: string | null
          id?: string
          is_template?: boolean | null
          meals?: Json | null
          name: string
          start_date?: string | null
          tags?: string[] | null
          updated_at?: string | null
          weekly_schedule?: Json | null
        }
        Update: {
          adherence_rate?: number | null
          assigned_to?: string[] | null
          created_at?: string | null
          created_by?: string | null
          daily_calories?: number | null
          daily_carbs?: number | null
          daily_fat?: number | null
          daily_fiber?: number | null
          daily_protein?: number | null
          daily_water?: number | null
          description?: string | null
          duration?: number | null
          end_date?: string | null
          id?: string
          is_template?: boolean | null
          meals?: Json | null
          name?: string
          start_date?: string | null
          tags?: string[] | null
          updated_at?: string | null
          weekly_schedule?: Json | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string
          due_date: string | null
          id: string
          invoice_number: string | null
          invoice_url: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          related_item_id: string | null
          status: string | null
          transaction_id: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          related_item_id?: string | null
          status?: string | null
          transaction_id?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          related_item_id?: string | null
          status?: string | null
          transaction_id?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          profile_complete: boolean | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          profile_complete?: boolean | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          profile_complete?: boolean | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      progress: {
        Row: {
          created_at: string | null
          date: string
          id: string
          meal_id: string | null
          notes: string | null
          type: string
          unit: string
          user_id: string | null
          value: number
          workout_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          meal_id?: string | null
          notes?: string | null
          type: string
          unit: string
          user_id?: string | null
          value: number
          workout_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          meal_id?: string | null
          notes?: string | null
          type?: string
          unit?: string
          user_id?: string | null
          value?: number
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          active_plan: string | null
          body_fat: number | null
          created_at: string | null
          goals: string[] | null
          height: number | null
          id: string
          language: string | null
          measurements_updated_at: string | null
          membership_expiry: string | null
          membership_status: string | null
          muscle_mass: number | null
          notifications: boolean | null
          teacher_id: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          active_plan?: string | null
          body_fat?: number | null
          created_at?: string | null
          goals?: string[] | null
          height?: number | null
          id?: string
          language?: string | null
          measurements_updated_at?: string | null
          membership_expiry?: string | null
          membership_status?: string | null
          muscle_mass?: number | null
          notifications?: boolean | null
          teacher_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          active_plan?: string | null
          body_fat?: number | null
          created_at?: string | null
          goals?: string[] | null
          height?: number | null
          id?: string
          language?: string | null
          measurements_updated_at?: string | null
          membership_expiry?: string | null
          membership_status?: string | null
          muscle_mass?: number | null
          notifications?: boolean | null
          teacher_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          calories_burned: number | null
          created_at: string | null
          end_time: string | null
          exercises: Json | null
          id: string
          notes: string | null
          rating: number | null
          start_time: string
          total_duration: number | null
          user_id: string | null
          workout_id: string | null
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string | null
          end_time?: string | null
          exercises?: Json | null
          id?: string
          notes?: string | null
          rating?: number | null
          start_time: string
          total_duration?: number | null
          user_id?: string | null
          workout_id?: string | null
        }
        Update: {
          calories_burned?: number | null
          created_at?: string | null
          end_time?: string | null
          exercises?: Json | null
          id?: string
          notes?: string | null
          rating?: number | null
          start_time?: string
          total_duration?: number | null
          user_id?: string | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          assigned_to: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: string | null
          estimated_calories: number | null
          estimated_duration: number | null
          exercises: Json
          id: string
          image_url: string | null
          is_template: boolean | null
          last_completed: string | null
          muscle_groups: string[] | null
          name: string
          sessions: number | null
          tags: string[] | null
          template_category: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_calories?: number | null
          estimated_duration?: number | null
          exercises?: Json
          id?: string
          image_url?: string | null
          is_template?: boolean | null
          last_completed?: string | null
          muscle_groups?: string[] | null
          name: string
          sessions?: number | null
          tags?: string[] | null
          template_category?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_calories?: number | null
          estimated_duration?: number | null
          exercises?: Json
          id?: string
          image_url?: string | null
          is_template?: boolean | null
          last_completed?: string | null
          muscle_groups?: string[] | null
          name?: string
          sessions?: number | null
          tags?: string[] | null
          template_category?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
