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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          condition_data: Json | null
          condition_type: string
          condition_value: number
          created_at: string
          created_by: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          points_reward: number
          rarity: string
          title: string
          updated_at: string
        }
        Insert: {
          condition_data?: Json | null
          condition_type: string
          condition_value?: number
          created_at?: string
          created_by: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          points_reward?: number
          rarity?: string
          title: string
          updated_at?: string
        }
        Update: {
          condition_data?: Json | null
          condition_type?: string
          condition_value?: number
          created_at?: string
          created_by?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          points_reward?: number
          rarity?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          thread_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          thread_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          thread_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      anamneses: {
        Row: {
          alergias: string[]
          created_at: string | null
          doencas: string[]
          horas_sono: string | null
          id: string
          lesoes: string | null
          medicacoes: string[]
          outras_alergias: string | null
          outras_doencas: string | null
          qualidade_sono: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alergias?: string[]
          created_at?: string | null
          doencas?: string[]
          horas_sono?: string | null
          id?: string
          lesoes?: string | null
          medicacoes?: string[]
          outras_alergias?: string | null
          outras_doencas?: string | null
          qualidade_sono?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alergias?: string[]
          created_at?: string | null
          doencas?: string[]
          horas_sono?: string | null
          id?: string
          lesoes?: string | null
          medicacoes?: string[]
          outras_alergias?: string | null
          outras_doencas?: string | null
          qualidade_sono?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          attachments: string[] | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          location: string | null
          location_id: string | null
          meeting_link: string | null
          notes: string | null
          payment_status: string | null
          price: number | null
          reminder_sent: boolean | null
          scheduled_time: string
          status: string | null
          student_id: string | null
          student_notes: string | null
          student_objectives: string | null
          student_title: string | null
          teacher_id: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          location?: string | null
          location_id?: string | null
          meeting_link?: string | null
          notes?: string | null
          payment_status?: string | null
          price?: number | null
          reminder_sent?: boolean | null
          scheduled_time: string
          status?: string | null
          student_id?: string | null
          student_notes?: string | null
          student_objectives?: string | null
          student_title?: string | null
          teacher_id?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          location?: string | null
          location_id?: string | null
          meeting_link?: string | null
          notes?: string | null
          payment_status?: string | null
          price?: number | null
          reminder_sent?: boolean | null
          scheduled_time?: string
          status?: string | null
          student_id?: string | null
          student_notes?: string | null
          student_objectives?: string | null
          student_title?: string | null
          teacher_id?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "training_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          access_type: string
          id: string
          record_id: string | null
          table_name: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          access_type: string
          id?: string
          record_id?: string | null
          table_name: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          access_type?: string
          id?: string
          record_id?: string | null
          table_name?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      banner_analytics: {
        Row: {
          banner_id: string
          clicks: number
          conversions: number
          created_at: string
          date: string
          id: string
          impressions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          banner_id: string
          clicks?: number
          conversions?: number
          created_at?: string
          date?: string
          id?: string
          impressions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          banner_id?: string
          clicks?: number
          conversions?: number
          created_at?: string
          date?: string
          id?: string
          impressions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_banner_analytics_banner_id"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
        ]
      }
      banner_interactions: {
        Row: {
          banner_id: string
          created_at: string
          id: string
          interaction_type: string
          ip_address: string | null
          metadata: Json | null
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          banner_id: string
          created_at?: string
          id?: string
          interaction_type: string
          ip_address?: string | null
          metadata?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          banner_id?: string
          created_at?: string
          id?: string
          interaction_type?: string
          ip_address?: string | null
          metadata?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_banner_interactions_banner_id"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          action_text: string | null
          action_url: string | null
          created_at: string | null
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
      challenge_participations: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          current_progress: number
          id: string
          points_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          points_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          points_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          participants: string[]
          points_reward: number
          start_date: string
          target_value: number
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          participants?: string[]
          points_reward?: number
          start_date?: string
          target_value?: number
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          participants?: string[]
          points_reward?: number
          start_date?: string
          target_value?: number
          teacher_id?: string
          title?: string
          updated_at?: string
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
          is_free: boolean
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
          is_free?: boolean
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
          is_free?: boolean
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
      evaluation_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string | null
          evaluation_id: string | null
          id: string
          message: string | null
          status: string
          student_id: string
          teacher_id: string
          template_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          evaluation_id?: string | null
          id?: string
          message?: string | null
          status?: string
          student_id: string
          teacher_id: string
          template_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          evaluation_id?: string | null
          id?: string
          message?: string | null
          status?: string
          student_id?: string
          teacher_id?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_requests_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_requests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "evaluation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_responses: {
        Row: {
          created_at: string
          evaluation_id: string
          id: string
          question_id: string
          question_text: string
          response_type: string
          response_value: Json
        }
        Insert: {
          created_at?: string
          evaluation_id: string
          id?: string
          question_id: string
          question_text: string
          response_type?: string
          response_value: Json
        }
        Update: {
          created_at?: string
          evaluation_id?: string
          id?: string
          question_id?: string
          question_text?: string
          response_type?: string
          response_value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_responses_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          physical_measurements: Json
          questions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          physical_measurements?: Json
          questions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          physical_measurements?: Json
          questions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          created_at: string
          evaluation_date: string
          id: string
          overall_score: number | null
          physical_measurements: Json | null
          status: string
          student_id: string
          student_notes: string | null
          teacher_id: string
          teacher_notes: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          evaluation_date?: string
          id?: string
          overall_score?: number | null
          physical_measurements?: Json | null
          status?: string
          student_id: string
          student_notes?: string | null
          teacher_id: string
          teacher_notes?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          evaluation_date?: string
          id?: string
          overall_score?: number | null
          physical_measurements?: Json | null
          status?: string
          student_id?: string
          student_notes?: string | null
          teacher_id?: string
          teacher_notes?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "evaluation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: string
          duration: number | null
          equipment: string[] | null
          id: string
          image_url: string | null
          instructions: string | null
          muscle_group: string
          muscle_groups: string[] | null
          name: string
          reps: number
          rest_time: number
          sets: number
          video_url: string | null
          weight: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty: string
          duration?: number | null
          equipment?: string[] | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          muscle_group: string
          muscle_groups?: string[] | null
          name: string
          reps: number
          rest_time: number
          sets: number
          video_url?: string | null
          weight?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string
          duration?: number | null
          equipment?: string[] | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          muscle_group?: string
          muscle_groups?: string[] | null
          name?: string
          reps?: number
          rest_time?: number
          sets?: number
          video_url?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      gamification_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          points_earned: number
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          points_earned?: number
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          points_earned?: number
          user_id?: string
        }
        Relationships: []
      }
      gamification_settings: {
        Row: {
          created_at: string
          id: string
          level_up_bonus: number
          max_daily_points: number
          points_ai_interaction: number
          points_assessment: number
          points_checkin: number
          points_goal_achieved: number
          points_meal_log: number
          points_medical_exam: number
          points_progress_update: number
          points_teacher_message: number
          points_workout: number
          streak_multiplier: number
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level_up_bonus?: number
          max_daily_points?: number
          points_ai_interaction?: number
          points_assessment?: number
          points_checkin?: number
          points_goal_achieved?: number
          points_meal_log?: number
          points_medical_exam?: number
          points_progress_update?: number
          points_teacher_message?: number
          points_workout?: number
          streak_multiplier?: number
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level_up_bonus?: number
          max_daily_points?: number
          points_ai_interaction?: number
          points_assessment?: number
          points_checkin?: number
          points_goal_achieved?: number
          points_meal_log?: number
          points_medical_exam?: number
          points_progress_update?: number
          points_teacher_message?: number
          points_workout?: number
          streak_multiplier?: number
          teacher_id?: string
          updated_at?: string
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
      medical_exams: {
        Row: {
          category: string
          created_at: string
          date: string
          file_url: string | null
          id: string
          notes: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          date: string
          file_url?: string | null
          id?: string
          notes?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_rankings: {
        Row: {
          created_at: string
          id: string
          month: string
          position: number
          teacher_id: string
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          position: number
          teacher_id: string
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          position?: number
          teacher_id?: string
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          notification_id: string | null
          onesignal_id: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          onesignal_id?: string | null
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          onesignal_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      nutrition_formulas: {
        Row: {
          category: string | null
          cook_time: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          ingredients: Json
          instructions: string | null
          name: string
          prep_time: number | null
          servings: number | null
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          cook_time?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ingredients?: Json
          instructions?: string | null
          name: string
          prep_time?: number | null
          servings?: number | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          cook_time?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ingredients?: Json
          instructions?: string | null
          name?: string
          prep_time?: number | null
          servings?: number | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string
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
      plan_catalog: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          features: Json
          highlighted: boolean
          icon: string | null
          id: string
          interval: Database["public"]["Enums"]["billing_interval"]
          is_active: boolean
          name: string
          price: number
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          highlighted?: boolean
          icon?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["billing_interval"]
          is_active?: boolean
          name: string
          price?: number
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          highlighted?: boolean
          icon?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["billing_interval"]
          is_active?: boolean
          name?: string
          price?: number
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_subscriptions: {
        Row: {
          approved_at: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          created_at: string
          end_at: string | null
          id: string
          metadata: Json
          plan_id: string
          start_at: string | null
          status: string
          student_user_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          created_at?: string
          end_at?: string | null
          id?: string
          metadata?: Json
          plan_id: string
          start_at?: string | null
          status?: string
          student_user_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          created_at?: string
          end_at?: string | null
          id?: string
          metadata?: Json
          plan_id?: string
          start_at?: string | null
          status?: string
          student_user_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plan_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          facebook_url: string | null
          id: string
          instagram_url: string | null
          name: string
          notification_preferences: Json | null
          onesignal_player_id: string | null
          professional_title: string | null
          profile_complete: boolean | null
          push_enabled: boolean | null
          show_profile_to_students: boolean | null
          specialties: string[] | null
          updated_at: string | null
          user_type: string | null
          whatsapp_number: string | null
          whatsapp_url: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          facebook_url?: string | null
          id: string
          instagram_url?: string | null
          name: string
          notification_preferences?: Json | null
          onesignal_player_id?: string | null
          professional_title?: string | null
          profile_complete?: boolean | null
          push_enabled?: boolean | null
          show_profile_to_students?: boolean | null
          specialties?: string[] | null
          updated_at?: string | null
          user_type?: string | null
          whatsapp_number?: string | null
          whatsapp_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          name?: string
          notification_preferences?: Json | null
          onesignal_player_id?: string | null
          professional_title?: string | null
          profile_complete?: boolean | null
          push_enabled?: boolean | null
          show_profile_to_students?: boolean | null
          specialties?: string[] | null
          updated_at?: string | null
          user_type?: string | null
          whatsapp_number?: string | null
          whatsapp_url?: string | null
          youtube_url?: string | null
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
      progress_photos: {
        Row: {
          created_at: string
          date: string
          id: string
          image_url: string
          notes: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          image_url: string
          notes?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          image_url?: string
          notes?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_records: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          photo_url: string | null
          type: string
          unit: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          type: string
          unit: string
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          type?: string
          unit?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      rate_limit_log: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: unknown
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address: unknown
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: unknown
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          created_at: string
          id: string
          points_spent: number
          reward_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_spent: number
          reward_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_spent?: number
          reward_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards_items"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_items: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          points_cost: number
          stock: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          points_cost: number
          stock?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          points_cost?: number
          stock?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_activity_log: {
        Row: {
          activity_description: string
          activity_type: string
          created_at: string
          device_info: Json | null
          id: string
          ip_address: string | null
          location_info: Json | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_description: string
          activity_type: string
          created_at?: string
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          location_info?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_description?: string
          activity_type?: string
          created_at?: string
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          location_info?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      student_invitations: {
        Row: {
          accepted_at: string | null
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          metadata: Json
          status: string
          student_user_id: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          metadata?: Json
          status?: string
          student_user_id?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          metadata?: Json
          status?: string
          student_user_id?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
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
          mode: string | null
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
          mode?: string | null
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
          mode?: string | null
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
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      teacher_availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          slot_minutes: number
          start_time: string
          teacher_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          slot_minutes?: number
          start_time: string
          teacher_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          slot_minutes?: number
          start_time?: string
          teacher_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      teacher_booking_settings: {
        Row: {
          allow_same_day: boolean
          auto_confirm: boolean
          created_at: string
          id: string
          minimum_advance_minutes: number
          teacher_id: string
          updated_at: string
          visibility_days: number
        }
        Insert: {
          allow_same_day?: boolean
          auto_confirm?: boolean
          created_at?: string
          id?: string
          minimum_advance_minutes?: number
          teacher_id: string
          updated_at?: string
          visibility_days?: number
        }
        Update: {
          allow_same_day?: boolean
          auto_confirm?: boolean
          created_at?: string
          id?: string
          minimum_advance_minutes?: number
          teacher_id?: string
          updated_at?: string
          visibility_days?: number
        }
        Relationships: []
      }
      teacher_schedule_exceptions: {
        Row: {
          created_at: string
          date: string
          id: string
          is_available: boolean
          reason: string | null
          special_end_time: string | null
          special_start_time: string | null
          teacher_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_available?: boolean
          reason?: string | null
          special_end_time?: string | null
          special_start_time?: string | null
          teacher_id: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_available?: boolean
          reason?: string | null
          special_end_time?: string | null
          special_start_time?: string | null
          teacher_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_locations: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          google_maps_link: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          teacher_id: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          google_maps_link?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          teacher_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          google_maps_link?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          teacher_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          points_earned: number
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          points_earned?: number
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          points_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          category: string
          challenge_id: string | null
          completed_at: string | null
          created_at: string
          current_value: number | null
          description: string | null
          id: string
          is_challenge_based: boolean | null
          metadata: Json | null
          points_reward: number | null
          progress_percentage: number | null
          start_date: string
          status: string
          target_date: string | null
          target_type: string
          target_unit: string | null
          target_value: number
          teacher_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          challenge_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          is_challenge_based?: boolean | null
          metadata?: Json | null
          points_reward?: number | null
          progress_percentage?: number | null
          start_date?: string
          status?: string
          target_date?: string | null
          target_type?: string
          target_unit?: string | null
          target_value: number
          teacher_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          challenge_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          is_challenge_based?: boolean | null
          metadata?: Json | null
          points_reward?: number | null
          progress_percentage?: number | null
          start_date?: string
          status?: string
          target_date?: string | null
          target_type?: string
          target_unit?: string | null
          target_value?: number
          teacher_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          current_streak: number
          last_activity_date: string | null
          level: number
          longest_streak: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_info: Json | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity: string
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          marketing_notifications: boolean | null
          push_notifications: boolean | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          marketing_notifications?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          marketing_notifications?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
      accept_invitation: {
        Args: { code: string }
        Returns: string
      }
      aggregate_banner_interactions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      aggregate_banner_metrics_realtime: {
        Args: { p_banner_id: string }
        Returns: undefined
      }
      aggregate_banner_metrics_simple: {
        Args: { p_banner_id: string; p_date?: string }
        Returns: undefined
      }
      aggregate_daily_banner_metrics: {
        Args: { target_date?: string }
        Returns: Json
      }
      approve_subscription: {
        Args: { p_subscription_id: string }
        Returns: string
      }
      award_points: {
        Args: {
          p_activity_type: string
          p_description?: string
          p_metadata?: Json
          p_points: number
          p_user_id: string
        }
        Returns: undefined
      }
      award_points_enhanced: {
        Args: {
          p_activity_type: string
          p_custom_points?: number
          p_description?: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: undefined
      }
      book_appointment: {
        Args:
          | {
              p_description?: string
              p_duration?: number
              p_location_id?: string
              p_scheduled_time: string
              p_student_notes?: string
              p_student_objectives?: string
              p_student_title?: string
              p_teacher_id: string
              p_title?: string
              p_type?: string
            }
          | {
              p_description?: string
              p_duration?: number
              p_scheduled_time: string
              p_student_notes?: string
              p_student_objectives?: string
              p_student_title?: string
              p_teacher_id: string
              p_title?: string
              p_type?: string
            }
        Returns: string
      }
      calculate_user_level: {
        Args: { points: number }
        Returns: number
      }
      can_insert_notification: {
        Args: { targets: string[] }
        Returns: boolean
      }
      check_and_award_achievements: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      check_rate_limit: {
        Args: {
          max_attempts?: number
          operation_type: string
          time_window?: unknown
        }
        Returns: boolean
      }
      clean_old_appointments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clean_test_banner_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_chat_messages: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_rate_limit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      ensure_student_record: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_backup_codes: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_banner_metrics_direct: {
        Args: {
          p_banner_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          banner_id: string
          ctr: number
          total_clicks: number
          total_conversions: number
          total_impressions: number
          unique_users: number
        }[]
      }
      get_teacher_conversations: {
        Args: { teacher_id_param: string }
        Returns: {
          conversation_id: string
          is_active: boolean
          last_message: string
          last_message_at: string
          student_email: string
          student_id: string
          student_name: string
          unread_count: number
        }[]
      }
      get_teacher_name: {
        Args: { teacher_id_param: string }
        Returns: string
      }
      get_user_entitlements: {
        Args: { p_teacher_id: string; p_user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_teacher_of: {
        Args: { _student_user_id: string; _teacher_id: string }
        Returns: boolean
      }
      list_available_slots: {
        Args: { p_date: string; p_slot_minutes?: number; p_teacher_id: string }
        Returns: {
          slot_end: string
          slot_start: string
        }[]
      }
      list_available_slots_improved: {
        Args: {
          p_end_date: string
          p_slot_minutes?: number
          p_start_date: string
          p_teacher_id: string
        }
        Returns: {
          slot_date: string
          slot_end: string
          slot_minutes: number
          slot_start: string
          slot_teacher_id: string
        }[]
      }
      log_security_activity: {
        Args: {
          p_activity_description: string
          p_activity_type: string
          p_device_info?: Json
          p_ip_address?: string
          p_success?: boolean
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_sensitive_access: {
        Args: { access_type: string; record_id: string; table_name: string }
        Returns: undefined
      }
      redeem_reward: {
        Args: { _reward_id: string }
        Returns: string
      }
      seed_banner_test_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_student_membership: {
        Args: { p_student_user_id: string; p_teacher_id: string }
        Returns: string
      }
      teacher_link_students: {
        Args: { _emails: string[] }
        Returns: Json
      }
      teacher_update_student_profile: {
        Args:
          | {
              p_active_plan?: string
              p_email?: string
              p_goals?: string[]
              p_membership_expiry?: string
              p_membership_status?: string
              p_mode?: string
              p_name?: string
              p_student_user_id: string
            }
          | {
              p_active_plan?: string
              p_email?: string
              p_goals?: string[]
              p_membership_expiry?: string
              p_membership_status?: string
              p_name?: string
              p_student_user_id: string
            }
        Returns: string
      }
      trigger_cleanup_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_goal_progress: {
        Args: { p_category: string; p_user_id: string; p_value: number }
        Returns: undefined
      }
      update_monthly_rankings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_session_activity: {
        Args: { p_session_token: string }
        Returns: undefined
      }
      update_user_streak: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      validate_input: {
        Args: { allow_html?: boolean; input_text: string; max_length?: number }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "professor" | "admin"
      billing_interval: "monthly" | "quarterly" | "yearly"
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
      app_role: ["student", "professor", "admin"],
      billing_interval: ["monthly", "quarterly", "yearly"],
    },
  },
} as const
