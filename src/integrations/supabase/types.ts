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
      atlon_assistant_conversations: {
        Row: {
          created_at: string
          id: string
          teacher_id: string
          thread_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          teacher_id: string
          thread_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          teacher_id?: string
          thread_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      atlon_assistant_messages: {
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
            foreignKeyName: "atlon_assistant_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "atlon_assistant_conversations"
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
          delivered_at: string | null
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
          delivered_at?: string | null
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
          delivered_at?: string | null
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
      course_lessons: {
        Row: {
          attachments: Json | null
          content: string | null
          created_at: string
          description: string | null
          id: string
          is_free: boolean
          is_published: boolean
          module_id: string
          order_index: number
          release_after_days: number | null
          release_mode: string
          title: string
          updated_at: string
          video_duration_minutes: number | null
          video_url: string | null
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_free?: boolean
          is_published?: boolean
          module_id: string
          order_index: number
          release_after_days?: number | null
          release_mode?: string
          title: string
          updated_at?: string
          video_duration_minutes?: number | null
          video_url?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_free?: boolean
          is_published?: boolean
          module_id?: string
          order_index?: number
          release_after_days?: number | null
          release_mode?: string
          title?: string
          updated_at?: string
          video_duration_minutes?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_materials: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          is_downloadable: boolean
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          is_downloadable?: boolean
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          is_downloadable?: boolean
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          order_index: number
          release_after_days: number | null
          release_mode: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          order_index: number
          release_after_days?: number | null
          release_mode?: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          release_after_days?: number | null
          release_mode?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          certificate_issued: boolean | null
          certificate_url: string | null
          course_id: string | null
          current_lesson_id: string | null
          enrolled_at: string | null
          id: string
          last_accessed: string | null
          lessons_completed: number | null
          module_progress: Json | null
          overall_progress: number | null
          time_spent_minutes: number | null
          user_id: string
        }
        Insert: {
          certificate_issued?: boolean | null
          certificate_url?: string | null
          course_id?: string | null
          current_lesson_id?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed?: string | null
          lessons_completed?: number | null
          module_progress?: Json | null
          overall_progress?: number | null
          time_spent_minutes?: number | null
          user_id: string
        }
        Update: {
          certificate_issued?: boolean | null
          certificate_url?: string | null
          course_id?: string | null
          current_lesson_id?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed?: string | null
          lessons_completed?: number | null
          module_progress?: Json | null
          overall_progress?: number | null
          time_spent_minutes?: number | null
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
          {
            foreignKeyName: "course_progress_current_lesson_id_fkey"
            columns: ["current_lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_unlock_requests: {
        Row: {
          course_id: string
          created_at: string
          id: string
          status: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          status?: string
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          status?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration: number | null
          enrolled_users: string[] | null
          has_certificate: boolean | null
          id: string
          instructor: string | null
          is_free: boolean
          is_published: boolean | null
          level: string | null
          modules: Json | null
          preview_video_url: string | null
          price: number | null
          published_at: string | null
          rating: number | null
          requirements: string[] | null
          reviews: number | null
          tags: string[] | null
          thumbnail: string | null
          title: string
          total_duration_minutes: number | null
          total_lessons: number | null
          updated_at: string | null
          what_you_learn: string[] | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: number | null
          enrolled_users?: string[] | null
          has_certificate?: boolean | null
          id?: string
          instructor?: string | null
          is_free?: boolean
          is_published?: boolean | null
          level?: string | null
          modules?: Json | null
          preview_video_url?: string | null
          price?: number | null
          published_at?: string | null
          rating?: number | null
          requirements?: string[] | null
          reviews?: number | null
          tags?: string[] | null
          thumbnail?: string | null
          title: string
          total_duration_minutes?: number | null
          total_lessons?: number | null
          updated_at?: string | null
          what_you_learn?: string[] | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: number | null
          enrolled_users?: string[] | null
          has_certificate?: boolean | null
          id?: string
          instructor?: string | null
          is_free?: boolean
          is_published?: boolean | null
          level?: string | null
          modules?: Json | null
          preview_video_url?: string | null
          price?: number | null
          published_at?: string | null
          rating?: number | null
          requirements?: string[] | null
          reviews?: number | null
          tags?: string[] | null
          thumbnail?: string | null
          title?: string
          total_duration_minutes?: number | null
          total_lessons?: number | null
          updated_at?: string | null
          what_you_learn?: string[] | null
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
      feedbacks: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          rating: number
          related_item_id: string | null
          responded_at: string | null
          student_id: string
          teacher_id: string
          teacher_response: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          rating: number
          related_item_id?: string | null
          responded_at?: string | null
          student_id: string
          teacher_id: string
          teacher_response?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          rating?: number
          related_item_id?: string | null
          responded_at?: string | null
          student_id?: string
          teacher_id?: string
          teacher_response?: string | null
          type?: string
          updated_at?: string
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
      gamification_activities_backup: {
        Row: {
          activity_type: string | null
          created_at: string | null
          description: string | null
          id: string | null
          metadata: Json | null
          points_earned: number | null
          user_id: string | null
        }
        Insert: {
          activity_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          metadata?: Json | null
          points_earned?: number | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          metadata?: Json | null
          points_earned?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      gamification_settings: {
        Row: {
          auto_reset_enabled: boolean | null
          created_at: string
          id: string
          level_up_bonus: number
          max_daily_points: number
          next_reset_date: string | null
          points_ai_interaction: number
          points_assessment: number
          points_checkin: number
          points_goal_achieved: number
          points_meal_log: number
          points_medical_exam: number
          points_progress_update: number
          points_teacher_message: number
          points_workout: number
          reset_frequency: string | null
          streak_multiplier: number
          teacher_id: string
          updated_at: string
        }
        Insert: {
          auto_reset_enabled?: boolean | null
          created_at?: string
          id?: string
          level_up_bonus?: number
          max_daily_points?: number
          next_reset_date?: string | null
          points_ai_interaction?: number
          points_assessment?: number
          points_checkin?: number
          points_goal_achieved?: number
          points_meal_log?: number
          points_medical_exam?: number
          points_progress_update?: number
          points_teacher_message?: number
          points_workout?: number
          reset_frequency?: string | null
          streak_multiplier?: number
          teacher_id: string
          updated_at?: string
        }
        Update: {
          auto_reset_enabled?: boolean | null
          created_at?: string
          id?: string
          level_up_bonus?: number
          max_daily_points?: number
          next_reset_date?: string | null
          points_ai_interaction?: number
          points_assessment?: number
          points_checkin?: number
          points_goal_achieved?: number
          points_meal_log?: number
          points_medical_exam?: number
          points_progress_update?: number
          points_teacher_message?: number
          points_workout?: number
          reset_frequency?: string | null
          streak_multiplier?: number
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          connection_id: string
          created_at: string
          id: string
          metadata: Json | null
          metric_type: string
          recorded_at: string
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          connection_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type: string
          recorded_at: string
          unit: string
          user_id: string
          value: number
        }
        Update: {
          connection_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          recorded_at?: string
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "health_metrics_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "wearable_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          last_position_seconds: number | null
          lesson_id: string
          progress_percentage: number
          time_spent_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          last_position_seconds?: number | null
          lesson_id: string
          progress_percentage?: number
          time_spent_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          last_position_seconds?: number | null
          lesson_id?: string
          progress_percentage?: number
          time_spent_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
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
          meal_name: string | null
          meal_plan_id: string | null
          meal_plan_item_id: string | null
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
          meal_name?: string | null
          meal_plan_id?: string | null
          meal_plan_item_id?: string | null
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
          meal_name?: string | null
          meal_plan_id?: string | null
          meal_plan_item_id?: string | null
          notes?: string | null
          nutrition_plan_id?: string | null
          photo_url?: string | null
          rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          assigned_students: string[]
          created_at: string
          created_by: string
          description: string | null
          duration_days: number | null
          id: string
          meals_data: Json
          name: string
          status: string
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          updated_at: string
        }
        Insert: {
          assigned_students?: string[]
          created_at?: string
          created_by: string
          description?: string | null
          duration_days?: number | null
          id?: string
          meals_data?: Json
          name: string
          status?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string
        }
        Update: {
          assigned_students?: string[]
          created_at?: string
          created_by?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          meals_data?: Json
          name?: string
          status?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      meal_rotations: {
        Row: {
          created_at: string | null
          day_of_week: number
          id: string
          meal_id: string | null
          meal_type: string
          nutrition_plan_id: string
          week_number: number
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          id?: string
          meal_id?: string | null
          meal_type: string
          nutrition_plan_id: string
          week_number?: number
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          id?: string
          meal_id?: string | null
          meal_type?: string
          nutrition_plan_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_rotations_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
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
          foods: Json | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          instructions: string | null
          meal_type: string | null
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
          foods?: Json | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          instructions?: string | null
          meal_type?: string | null
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
          foods?: Json | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          instructions?: string | null
          meal_type?: string | null
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
      notification_automation_rules: {
        Row: {
          condition: Json | null
          created_at: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed: string | null
          name: string
          teacher_id: string
          template_id: string | null
          trigger: string
          updated_at: string | null
        }
        Insert: {
          condition?: Json | null
          created_at?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          name: string
          teacher_id: string
          template_id?: string | null
          trigger: string
          updated_at?: string | null
        }
        Update: {
          condition?: Json | null
          created_at?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          name?: string
          teacher_id?: string
          template_id?: string | null
          trigger?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_automation_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
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
      notification_templates: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          message: string
          teacher_id: string
          title: string
          updated_at: string | null
          usage_count: number | null
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          teacher_id: string
          title: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          teacher_id?: string
          title?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: string[] | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_required: boolean | null
          action_text: string | null
          action_url: string | null
          created_at: string | null
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
      order_items: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          item_type: string
          order_id: string
          price: number
          product_id: string | null
          quantity: number
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          item_type: string
          order_id: string
          price: number
          product_id?: string | null
          quantity?: number
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          item_type?: string
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          id: string
          instructor_id: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          instructor_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          instructor_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          checkout_url: string | null
          created_at: string | null
          currency: string | null
          expires_at: string | null
          gateway_payment_id: string | null
          gateway_response: Json | null
          gateway_transaction_id: string | null
          gateway_type: string
          id: string
          metadata: Json | null
          paid_at: string | null
          payment_method: string | null
          service_pricing_id: string | null
          status: string | null
          student_id: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          checkout_url?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          gateway_type: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          service_pricing_id?: string | null
          status?: string | null
          student_id: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          checkout_url?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          gateway_type?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          service_pricing_id?: string | null
          status?: string | null
          student_id?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_service_pricing_id_fkey"
            columns: ["service_pricing_id"]
            isOneToOne: false
            referencedRelation: "service_pricing"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhooks: {
        Row: {
          created_at: string
          error_message: string | null
          gateway_type: string
          id: string
          payment_id: string | null
          processed: boolean | null
          webhook_data: Json
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          gateway_type: string
          id?: string
          payment_id?: string | null
          processed?: boolean | null
          webhook_data: Json
        }
        Update: {
          created_at?: string
          error_message?: string | null
          gateway_type?: string
          id?: string
          payment_id?: string | null
          processed?: boolean | null
          webhook_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhooks_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          auto_approved: boolean | null
          created_at: string | null
          currency: string | null
          description: string
          due_date: string | null
          gateway_metadata: Json | null
          gateway_status: string | null
          gateway_transaction_id: string | null
          gateway_type: string | null
          id: string
          invoice_number: string | null
          invoice_url: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          product_id: string | null
          product_type: string | null
          related_item_id: string | null
          status: string | null
          teacher_id: string | null
          transaction_id: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          webhook_received_at: string | null
        }
        Insert: {
          amount: number
          auto_approved?: boolean | null
          created_at?: string | null
          currency?: string | null
          description: string
          due_date?: string | null
          gateway_metadata?: Json | null
          gateway_status?: string | null
          gateway_transaction_id?: string | null
          gateway_type?: string | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          product_id?: string | null
          product_type?: string | null
          related_item_id?: string | null
          status?: string | null
          teacher_id?: string | null
          transaction_id?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_received_at?: string | null
        }
        Update: {
          amount?: number
          auto_approved?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string
          due_date?: string | null
          gateway_metadata?: Json | null
          gateway_status?: string | null
          gateway_transaction_id?: string | null
          gateway_type?: string | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          product_id?: string | null
          product_type?: string | null
          related_item_id?: string | null
          status?: string | null
          teacher_id?: string | null
          transaction_id?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_received_at?: string | null
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
      points_reset_history: {
        Row: {
          affected_students: number
          backup_data: Json | null
          created_at: string
          id: string
          reason: string | null
          reset_date: string
          reset_type: string
          teacher_id: string
          total_points_reset: number
        }
        Insert: {
          affected_students?: number
          backup_data?: Json | null
          created_at?: string
          id?: string
          reason?: string | null
          reset_date?: string
          reset_type?: string
          teacher_id: string
          total_points_reset?: number
        }
        Update: {
          affected_students?: number
          backup_data?: Json | null
          created_at?: string
          id?: string
          reason?: string | null
          reset_date?: string
          reset_type?: string
          teacher_id?: string
          total_points_reset?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          files: Json | null
          id: string
          image_url: string | null
          instructor_id: string
          is_digital: boolean
          is_published: boolean
          name: string
          price: number
          stock: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          files?: Json | null
          id?: string
          image_url?: string | null
          instructor_id: string
          is_digital?: boolean
          is_published?: boolean
          name: string
          price: number
          stock?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          files?: Json | null
          id?: string
          image_url?: string | null
          instructor_id?: string
          is_digital?: boolean
          is_published?: boolean
          name?: string
          price?: number
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
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
          phone: string | null
          professional_title: string | null
          profile_complete: boolean | null
          push_enabled: boolean | null
          role: string | null
          role_set_once: boolean | null
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
          phone?: string | null
          professional_title?: string | null
          profile_complete?: boolean | null
          push_enabled?: boolean | null
          role?: string | null
          role_set_once?: boolean | null
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
          phone?: string | null
          professional_title?: string | null
          profile_complete?: boolean | null
          push_enabled?: boolean | null
          role?: string | null
          role_set_once?: boolean | null
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
      security_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          device_info: Json | null
          id: string
          ip_address: unknown | null
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
          user_id?: string | null
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
      service_pricing: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          service_id: string | null
          service_type: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          service_id?: string | null
          service_type: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          service_id?: string | null
          service_type?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_content_permissions: {
        Row: {
          content_id: string
          created_at: string | null
          granted_at: string | null
          id: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          granted_at?: string | null
          id?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          granted_at?: string | null
          id?: string
          student_id?: string
          teacher_id?: string
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
          birth_date: string | null
          body_fat: number | null
          created_at: string | null
          goal_achieved_this_month: boolean | null
          goals: string[] | null
          height: number | null
          id: string
          language: string | null
          last_activity: string | null
          last_workout: string | null
          measurements_updated_at: string | null
          membership_expiry: string | null
          membership_months: number | null
          membership_status: string | null
          mode: string | null
          muscle_mass: number | null
          notifications: boolean | null
          teacher_id: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          weekly_frequency: number | null
          weight: number | null
        }
        Insert: {
          active_plan?: string | null
          birth_date?: string | null
          body_fat?: number | null
          created_at?: string | null
          goal_achieved_this_month?: boolean | null
          goals?: string[] | null
          height?: number | null
          id?: string
          language?: string | null
          last_activity?: string | null
          last_workout?: string | null
          measurements_updated_at?: string | null
          membership_expiry?: string | null
          membership_months?: number | null
          membership_status?: string | null
          mode?: string | null
          muscle_mass?: number | null
          notifications?: boolean | null
          teacher_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          weekly_frequency?: number | null
          weight?: number | null
        }
        Update: {
          active_plan?: string | null
          birth_date?: string | null
          body_fat?: number | null
          created_at?: string | null
          goal_achieved_this_month?: boolean | null
          goals?: string[] | null
          height?: number | null
          id?: string
          language?: string | null
          last_activity?: string | null
          last_workout?: string | null
          measurements_updated_at?: string | null
          membership_expiry?: string | null
          membership_months?: number | null
          membership_status?: string | null
          mode?: string | null
          muscle_mass?: number | null
          notifications?: boolean | null
          teacher_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_frequency?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_students_user_id_profiles"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      teacher_feedback_settings: {
        Row: {
          auto_request_feedback: boolean
          created_at: string
          custom_questions: Json
          default_feedback_period: number
          feedback_days: number[]
          feedback_frequency: string
          feedback_reminder_days: number
          feedback_types_enabled: string[]
          feedbacks_per_page: number
          id: string
          is_active: boolean
          show_feedback_stats: boolean
          teacher_id: string
          updated_at: string
        }
        Insert: {
          auto_request_feedback?: boolean
          created_at?: string
          custom_questions?: Json
          default_feedback_period?: number
          feedback_days?: number[]
          feedback_frequency?: string
          feedback_reminder_days?: number
          feedback_types_enabled?: string[]
          feedbacks_per_page?: number
          id?: string
          is_active?: boolean
          show_feedback_stats?: boolean
          teacher_id: string
          updated_at?: string
        }
        Update: {
          auto_request_feedback?: boolean
          created_at?: string
          custom_questions?: Json
          default_feedback_period?: number
          feedback_days?: number[]
          feedback_frequency?: string
          feedback_reminder_days?: number
          feedback_types_enabled?: string[]
          feedbacks_per_page?: number
          id?: string
          is_active?: boolean
          show_feedback_stats?: boolean
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_feedback_settings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_payment_settings: {
        Row: {
          bank_details: Json | null
          commission_rate: number | null
          created_at: string
          credentials: Json
          gateway_type: string
          id: string
          is_active: boolean
          pix_key: string | null
          teacher_id: string
          updated_at: string
          webhook_config: Json | null
        }
        Insert: {
          bank_details?: Json | null
          commission_rate?: number | null
          created_at?: string
          credentials?: Json
          gateway_type: string
          id?: string
          is_active?: boolean
          pix_key?: string | null
          teacher_id: string
          updated_at?: string
          webhook_config?: Json | null
        }
        Update: {
          bank_details?: Json | null
          commission_rate?: number | null
          created_at?: string
          credentials?: Json
          gateway_type?: string
          id?: string
          is_active?: boolean
          pix_key?: string | null
          teacher_id?: string
          updated_at?: string
          webhook_config?: Json | null
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
      user_presence: {
        Row: {
          created_at: string
          is_online: boolean
          is_typing_in_conversation: string | null
          last_seen: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_online?: boolean
          is_typing_in_conversation?: string | null
          last_seen?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_online?: boolean
          is_typing_in_conversation?: string | null
          last_seen?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          access_expires_at: string | null
          access_granted_at: string
          course_id: string | null
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          purchase_type: string
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          access_granted_at?: string
          course_id?: string | null
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          purchase_type: string
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          access_granted_at?: string
          course_id?: string | null
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          purchase_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchases_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      wearable_connections: {
        Row: {
          access_token: string
          created_at: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          metadata: Json | null
          provider: string
          provider_user_id: string
          refresh_token: string | null
          sync_error: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          metadata?: Json | null
          provider: string
          provider_user_id: string
          refresh_token?: string | null
          sync_error?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          metadata?: Json | null
          provider?: string
          provider_user_id?: string
          refresh_token?: string | null
          sync_error?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_activities: {
        Row: {
          activity_type: string
          avg_heart_rate: number | null
          calories_burned: number | null
          connection_id: string
          created_at: string
          description: string | null
          distance_meters: number | null
          duration_seconds: number | null
          elevation_gain: number | null
          id: string
          max_heart_rate: number | null
          metadata: Json | null
          name: string
          provider_activity_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          activity_type: string
          avg_heart_rate?: number | null
          calories_burned?: number | null
          connection_id: string
          created_at?: string
          description?: string | null
          distance_meters?: number | null
          duration_seconds?: number | null
          elevation_gain?: number | null
          id?: string
          max_heart_rate?: number | null
          metadata?: Json | null
          name: string
          provider_activity_id: string
          started_at: string
          user_id: string
        }
        Update: {
          activity_type?: string
          avg_heart_rate?: number | null
          calories_burned?: number | null
          connection_id?: string
          created_at?: string
          description?: string | null
          distance_meters?: number | null
          duration_seconds?: number | null
          elevation_gain?: number | null
          id?: string
          max_heart_rate?: number | null
          metadata?: Json | null
          name?: string
          provider_activity_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_activities_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "wearable_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          assigned_students: string[] | null
          created_at: string
          created_by: string
          description: string | null
          difficulty: string | null
          duration_weeks: number | null
          exercises_data: Json
          id: string
          is_template: boolean | null
          name: string
          notes: string | null
          sessions_per_week: number | null
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          assigned_students?: string[] | null
          created_at?: string
          created_by: string
          description?: string | null
          difficulty?: string | null
          duration_weeks?: number | null
          exercises_data?: Json
          id?: string
          is_template?: boolean | null
          name: string
          notes?: string | null
          sessions_per_week?: number | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          assigned_students?: string[] | null
          created_at?: string
          created_by?: string
          description?: string | null
          difficulty?: string | null
          duration_weeks?: number | null
          exercises_data?: Json
          id?: string
          is_template?: boolean | null
          name?: string
          notes?: string | null
          sessions_per_week?: number | null
          status?: string
          tags?: string[] | null
          updated_at?: string
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
          auto_expire: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: string | null
          duration_days: number | null
          end_date: string | null
          estimated_calories: number | null
          estimated_duration: number | null
          exercises: Json
          id: string
          image_url: string | null
          is_template: boolean | null
          last_completed: string | null
          last_synced_at: string | null
          muscle_groups: string[] | null
          name: string
          sessions: number | null
          start_date: string | null
          status: string | null
          sync_status: string | null
          tags: string[] | null
          template_category: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string[] | null
          auto_expire?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          duration_days?: number | null
          end_date?: string | null
          estimated_calories?: number | null
          estimated_duration?: number | null
          exercises?: Json
          id?: string
          image_url?: string | null
          is_template?: boolean | null
          last_completed?: string | null
          last_synced_at?: string | null
          muscle_groups?: string[] | null
          name: string
          sessions?: number | null
          start_date?: string | null
          status?: string | null
          sync_status?: string | null
          tags?: string[] | null
          template_category?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string[] | null
          auto_expire?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          duration_days?: number | null
          end_date?: string | null
          estimated_calories?: number | null
          estimated_duration?: number | null
          exercises?: Json
          id?: string
          image_url?: string | null
          is_template?: boolean | null
          last_completed?: string | null
          last_synced_at?: string | null
          muscle_groups?: string[] | null
          name?: string
          sessions?: number | null
          start_date?: string | null
          status?: string | null
          sync_status?: string | null
          tags?: string[] | null
          template_category?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      teacher_payment_metrics: {
        Row: {
          failed_count: number | null
          last_updated: string | null
          month: string | null
          paid_count: number | null
          pending_count: number | null
          teacher_id: string | null
          total_revenue: number | null
        }
        Relationships: []
      }
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
      award_points_enhanced_v3: {
        Args: {
          p_activity_type: string
          p_custom_points?: number
          p_description?: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: Json
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
      calculate_meal_plan_totals: {
        Args: { meals_data_param: Json }
        Returns: {
          total_calories: number
          total_carbs: number
          total_fat: number
          total_protein: number
        }[]
      }
      calculate_user_level: {
        Args: { points: number }
        Returns: number
      }
      can_insert_notification: {
        Args: { p_target_users?: string[]; p_user_id: string }
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
      cleanup_old_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_presence: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_rate_limit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clear_conversation_messages: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      create_meal_rotation: {
        Args: {
          p_day_of_week: number
          p_meal_id: string
          p_meal_type: string
          p_nutrition_plan_id: string
          p_week_number: number
        }
        Returns: string
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
      get_current_plan_week: {
        Args: { plan_id: string }
        Returns: number
      }
      get_meals_for_today: {
        Args: { p_user_id: string }
        Returns: {
          calories: number
          carbs: number
          fat: number
          foods: Json
          is_logged: boolean
          log_id: string
          meal_id: string
          meal_name: string
          meal_time: string
          meal_type: string
          protein: number
        }[]
      }
      get_meals_for_today_v2: {
        Args: { p_user_id: string }
        Returns: {
          calories: number
          carbs: number
          fat: number
          foods: Json
          is_logged: boolean
          log_id: string
          meal_name: string
          meal_plan_id: string
          meal_plan_item_id: string
          meal_time: string
          meal_type: string
          protein: number
        }[]
      }
      get_teacher_chat_stats: {
        Args: { teacher_id_param: string }
        Returns: Json
      }
      get_teacher_chat_stats_optimized: {
        Args: { teacher_id_param: string }
        Returns: {
          active_students_count: number
          conversations_with_student_messages: number
          conversations_with_teacher_messages: number
          response_rate: number
          total_conversations_count: number
          unread_teacher_messages: number
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
      get_teacher_data_optimized: {
        Args: { p_teacher_id: string }
        Returns: Json
      }
      get_teacher_metrics: {
        Args: { p_teacher_id?: string }
        Returns: {
          failed_count: number
          month: string
          paid_count: number
          pending_count: number
          total_revenue: number
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
      is_teacher: {
        Args: { user_id: string }
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
      mark_conversation_messages_as_read: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      redeem_reward: {
        Args: { _reward_id: string }
        Returns: string
      }
      reset_all_student_points: {
        Args: { p_reason?: string; p_teacher_id: string }
        Returns: Json
      }
      sanitize_chat_input: {
        Args: { input_text: string }
        Returns: boolean
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
      update_redemption_status: {
        Args: {
          _admin_notes?: string
          _new_status: string
          _redemption_id: string
        }
        Returns: Json
      }
      update_session_activity: {
        Args: { p_session_token: string }
        Returns: undefined
      }
      update_user_presence: {
        Args: {
          is_online_param?: boolean
          typing_in_conversation_param?: string
        }
        Returns: undefined
      }
      update_user_streak: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      user_has_content_access: {
        Args: { p_content_id: string }
        Returns: boolean
      }
      user_has_course_access: {
        Args: { p_course_id: string; p_user_id?: string }
        Returns: boolean
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
