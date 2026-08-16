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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          agreed_terms: boolean
          city: string
          country: string
          course_id: string
          created_at: string
          email: string
          full_name: string
          gender: string
          heard_from: string
          id: string
          motivation: string
          occupation: string
          organisation: string
          phone: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          agreed_terms?: boolean
          city?: string
          country?: string
          course_id: string
          created_at?: string
          email: string
          full_name: string
          gender?: string
          heard_from?: string
          id?: string
          motivation?: string
          occupation?: string
          organisation?: string
          phone?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          agreed_terms?: boolean
          city?: string
          country?: string
          course_id?: string
          created_at?: string
          email?: string
          full_name?: string
          gender?: string
          heard_from?: string
          id?: string
          motivation?: string
          occupation?: string
          organisation?: string
          phone?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string
          id: string
          meta: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string
          id?: string
          meta?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string
          id?: string
          meta?: Json
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          course_id: string
          course_title: string
          final_score: number
          id: string
          issued_at: string
          learner_name: string
          revoked_reason: string
          signatory: string
          status: Database["public"]["Enums"]["certificate_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_number: string
          course_id: string
          course_title: string
          final_score?: number
          id?: string
          issued_at?: string
          learner_name: string
          revoked_reason?: string
          signatory?: string
          status?: Database["public"]["Enums"]["certificate_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_number?: string
          course_id?: string
          course_title?: string
          final_score?: number
          id?: string
          issued_at?: string
          learner_name?: string
          revoked_reason?: string
          signatory?: string
          status?: Database["public"]["Enums"]["certificate_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          age_range: string | null
          city: string | null
          country: string | null
          course_id: string | null
          course_title: string
          created_at: string
          education_level: string | null
          email: string
          experience_level: string | null
          gender: string | null
          heard_from: string | null
          id: string
          motivation: string
          name: string
          occupation: string | null
          phone: string
          preferred_schedule: string | null
          status: string
        }
        Insert: {
          age_range?: string | null
          city?: string | null
          country?: string | null
          course_id?: string | null
          course_title?: string
          created_at?: string
          education_level?: string | null
          email: string
          experience_level?: string | null
          gender?: string | null
          heard_from?: string | null
          id?: string
          motivation?: string
          name: string
          occupation?: string | null
          phone?: string
          preferred_schedule?: string | null
          status?: string
        }
        Update: {
          age_range?: string | null
          city?: string | null
          country?: string | null
          course_id?: string | null
          course_title?: string
          created_at?: string
          education_level?: string | null
          email?: string
          experience_level?: string | null
          gender?: string | null
          heard_from?: string | null
          id?: string
          motivation?: string
          name?: string
          occupation?: string | null
          phone?: string
          preferred_schedule?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          archived_at: string | null
          course_id: string
          created_at: string
          description: string
          id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          course_id: string
          created_at?: string
          description?: string
          id?: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          course_id?: string
          created_at?: string
          description?: string
          id?: string
          position?: number
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
          completed_at: string | null
          course_id: string
          last_lesson_id: string | null
          percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          last_lesson_id?: string | null
          percent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          last_lesson_id?: string | null
          percent?: number
          updated_at?: string
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
            foreignKeyName: "course_progress_last_lesson_id_fkey"
            columns: ["last_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          archived_at: string | null
          category: string
          category_id: string | null
          certificate: string | null
          completion_rules: Json
          course_type: Database["public"]["Enums"]["course_type"]
          created_at: string
          credit_cost: number
          currency: string
          description: string
          discount_price_ugx: number | null
          duration: string
          estimated_minutes: number
          faq: Json
          featured: boolean
          full_description: string | null
          id: string
          instructor: string
          instructor_id: string | null
          level: string
          modules: Json
          pinned: boolean
          pinned_at: string | null
          prerequisites: string | null
          price: string | null
          price_ugx: number
          published: boolean
          rating: number
          registration_end: string | null
          registration_start: string | null
          reviews_enabled: boolean
          slug: string
          target_audience: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          what_you_learn: Json
        }
        Insert: {
          archived_at?: string | null
          category?: string
          category_id?: string | null
          certificate?: string | null
          completion_rules?: Json
          course_type?: Database["public"]["Enums"]["course_type"]
          created_at?: string
          credit_cost?: number
          currency?: string
          description?: string
          discount_price_ugx?: number | null
          duration?: string
          estimated_minutes?: number
          faq?: Json
          featured?: boolean
          full_description?: string | null
          id?: string
          instructor?: string
          instructor_id?: string | null
          level?: string
          modules?: Json
          pinned?: boolean
          pinned_at?: string | null
          prerequisites?: string | null
          price?: string | null
          price_ugx?: number
          published?: boolean
          rating?: number
          registration_end?: string | null
          registration_start?: string | null
          reviews_enabled?: boolean
          slug: string
          target_audience?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          what_you_learn?: Json
        }
        Update: {
          archived_at?: string | null
          category?: string
          category_id?: string | null
          certificate?: string | null
          completion_rules?: Json
          course_type?: Database["public"]["Enums"]["course_type"]
          created_at?: string
          credit_cost?: number
          currency?: string
          description?: string
          discount_price_ugx?: number | null
          duration?: string
          estimated_minutes?: number
          faq?: Json
          featured?: boolean
          full_description?: string | null
          id?: string
          instructor?: string
          instructor_id?: string | null
          level?: string
          modules?: Json
          pinned?: boolean
          pinned_at?: string | null
          prerequisites?: string | null
          price?: string | null
          price_ugx?: number
          published?: boolean
          rating?: number
          registration_end?: string | null
          registration_start?: string | null
          reviews_enabled?: boolean
          slug?: string
          target_audience?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          what_you_learn?: Json
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_balances: {
        Row: {
          balance: number
          created_at: string
          email: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          email: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          email?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          course_id: string | null
          course_title: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          reason: string
          type: string
        }
        Insert: {
          amount: number
          course_id?: string | null
          course_title?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          reason?: string
          type: string
        }
        Update: {
          amount?: number
          course_id?: string | null
          course_title?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          reason?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          active: boolean
          code: string
          course_id: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          kind: string
          max_uses: number | null
          per_user_limit: number
          starts_at: string | null
          uses: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          max_uses?: number | null
          per_user_limit?: number
          starts_at?: string | null
          uses?: number
          value?: number
        }
        Update: {
          active?: boolean
          code?: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          max_uses?: number | null
          per_user_limit?: number
          starts_at?: string | null
          uses?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_redemptions: {
        Row: {
          code_id: string
          created_at: string
          id: string
          order_id: string | null
          user_id: string
        }
        Insert: {
          code_id: string
          created_at?: string
          id?: string
          order_id?: string | null
          user_id: string
        }
        Update: {
          code_id?: string
          created_at?: string
          id?: string
          order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      enrolments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          grant_reason: string
          granted_by: string | null
          id: string
          needs_review: boolean
          order_id: string | null
          source: Database["public"]["Enums"]["enrolment_source"]
          started_at: string
          status: Database["public"]["Enums"]["enrolment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          grant_reason?: string
          granted_by?: string | null
          id?: string
          needs_review?: boolean
          order_id?: string | null
          source?: Database["public"]["Enums"]["enrolment_source"]
          started_at?: string
          status?: Database["public"]["Enums"]["enrolment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          grant_reason?: string
          granted_by?: string | null
          id?: string
          needs_review?: boolean
          order_id?: string | null
          source?: Database["public"]["Enums"]["enrolment_source"]
          started_at?: string
          status?: Database["public"]["Enums"]["enrolment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrolments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrolments_order_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          id: string
          name: string
          title: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          id?: string
          name: string
          title?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          id?: string
          name?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          seconds_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          seconds_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          seconds_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_resources: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          lesson_id: string
          size_bytes: number | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          lesson_id: string
          size_bytes?: number | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          lesson_id?: string
          size_bytes?: number | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          archived_at: string | null
          body: string
          course_id: string
          created_at: string
          duration_minutes: number
          id: string
          is_required: boolean
          kind: Database["public"]["Enums"]["lesson_kind"]
          media_path: string | null
          media_url: string | null
          module_id: string
          position: number
          prerequisite_lesson_id: string | null
          title: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          body?: string
          course_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          is_required?: boolean
          kind?: Database["public"]["Enums"]["lesson_kind"]
          media_path?: string | null
          media_url?: string | null
          module_id: string
          position?: number
          prerequisite_lesson_id?: string | null
          title: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          body?: string
          course_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          is_required?: boolean
          kind?: Database["public"]["Enums"]["lesson_kind"]
          media_path?: string | null
          media_url?: string | null
          module_id?: string
          position?: number
          prerequisite_lesson_id?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_prerequisite_lesson_id_fkey"
            columns: ["prerequisite_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          unsubscribe_token: string
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          email_to: string
          id: string
          payload: Json
          read_at: string | null
          sent_at: string | null
          status: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          email_to?: string
          id?: string
          payload?: Json
          read_at?: string | null
          sent_at?: string | null
          status?: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          email_to?: string
          id?: string
          payload?: Json
          read_at?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          application_id: string | null
          course_id: string
          created_at: string
          currency: string
          discount_amount: number
          discount_code_id: string | null
          id: string
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          tx_ref: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          application_id?: string | null
          course_id: string
          created_at?: string
          currency?: string
          discount_amount?: number
          discount_code_id?: string | null
          id?: string
          order_number: string
          status?: Database["public"]["Enums"]["order_status"]
          tx_ref: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          application_id?: string | null
          course_id?: string
          created_at?: string
          currency?: string
          discount_amount?: number
          discount_code_id?: string | null
          id?: string
          order_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          tx_ref?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_inquiries: {
        Row: {
          budget_range: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string
          goals: string | null
          id: string
          industry: string | null
          message: string
          name: string
          organization: string
          organization_size: string | null
          partnership_type: string
          phone: string
          role: string | null
          status: string
          timeline: string | null
          website: string | null
        }
        Insert: {
          budget_range?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          goals?: string | null
          id?: string
          industry?: string | null
          message?: string
          name: string
          organization?: string
          organization_size?: string | null
          partnership_type?: string
          phone?: string
          role?: string | null
          status?: string
          timeline?: string | null
          website?: string | null
        }
        Update: {
          budget_range?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          goals?: string | null
          id?: string
          industry?: string | null
          message?: string
          name?: string
          organization?: string
          organization_size?: string | null
          partnership_type?: string
          phone?: string
          role?: string | null
          status?: string
          timeline?: string | null
          website?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          method: string
          order_id: string
          provider: string
          provider_tx_id: string | null
          raw: Json
          status: Database["public"]["Enums"]["order_status"]
          tx_ref: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          order_id: string
          provider?: string
          provider_tx_id?: string | null
          raw?: Json
          status?: Database["public"]["Enums"]["order_status"]
          tx_ref: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          order_id?: string
          provider?: string
          provider_tx_id?: string | null
          raw?: Json
          status?: Database["public"]["Enums"]["order_status"]
          tx_ref?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string
          country: string
          created_at: string
          email: string
          full_name: string
          gender: string
          heard_from: string
          id: string
          occupation: string
          organisation: string
          phone: string
          updated_at: string
        }
        Insert: {
          city?: string
          country?: string
          created_at?: string
          email?: string
          full_name?: string
          gender?: string
          heard_from?: string
          id: string
          occupation?: string
          organisation?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          email?: string
          full_name?: string
          gender?: string
          heard_from?: string
          id?: string
          occupation?: string
          organisation?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          id: string
          is_correct: boolean
          label: string
          position: number
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          label: string
          position?: number
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          label?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempt_no: number
          course_id: string
          created_at: string
          id: string
          passed: boolean
          quiz_id: string
          responses: Json
          score: number
          user_id: string
        }
        Insert: {
          attempt_no?: number
          course_id: string
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id: string
          responses?: Json
          score?: number
          user_id: string
        }
        Update: {
          attempt_no?: number
          course_id?: string
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          responses?: Json
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          explanation: string
          id: string
          kind: string
          points: number
          position: number
          prompt: string
          quiz_id: string
        }
        Insert: {
          created_at?: string
          explanation?: string
          id?: string
          kind?: string
          points?: number
          position?: number
          prompt: string
          quiz_id: string
        }
        Update: {
          created_at?: string
          explanation?: string
          id?: string
          kind?: string
          points?: number
          position?: number
          prompt?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string
          id: string
          is_mandatory: boolean
          lesson_id: string | null
          max_attempts: number
          module_id: string | null
          pass_mark: number
          position: number
          score_mode: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string
          id?: string
          is_mandatory?: boolean
          lesson_id?: string | null
          max_attempts?: number
          module_id?: string | null
          pass_mark?: number
          position?: number
          score_mode?: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string
          id?: string
          is_mandatory?: boolean
          lesson_id?: string | null
          max_attempts?: number
          module_id?: string | null
          pass_mark?: number
          position?: number
          score_mode?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved: boolean
          body: string
          course_id: string
          created_at: string
          id: string
          learner_name: string
          rating: number
          user_id: string
        }
        Insert: {
          approved?: boolean
          body?: string
          course_id: string
          created_at?: string
          id?: string
          learner_name?: string
          rating: number
          user_id: string
        }
        Update: {
          approved?: boolean
          body?: string
          course_id?: string
          created_at?: string
          id?: string
          learner_name?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_credits: {
        Args: { _amount: number; _email: string; _reason?: string }
        Returns: {
          balance: number
          email: string
        }[]
      }
      get_course_curriculum: {
        Args: { _course_id: string }
        Returns: {
          duration_minutes: number
          lesson_id: string
          lesson_kind: Database["public"]["Enums"]["lesson_kind"]
          lesson_position: number
          lesson_title: string
          module_id: string
          module_position: number
          module_title: string
        }[]
      }
      get_subscriber_by_token: {
        Args: { _token: string }
        Returns: {
          already_unsubscribed: boolean
          email: string
        }[]
      }
      has_course_access: {
        Args: { _course_id: string; _uid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_instructor: { Args: { _uid: string }; Returns: boolean }
      is_staff: { Args: { _uid: string }; Returns: boolean }
      spend_credits_for_enrollment: {
        Args: { _course_id: string; _email: string }
        Returns: {
          balance: number
          cost: number
          message: string
          success: boolean
        }[]
      }
      unsubscribe_newsletter: {
        Args: { _token: string }
        Returns: {
          email: string
          success: boolean
        }[]
      }
      verify_certificate: {
        Args: { _number: string }
        Returns: {
          certificate_number: string
          course_title: string
          issued_at: string
          learner_name: string
          status: Database["public"]["Enums"]["certificate_status"]
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "instructor" | "super_admin"
      application_status:
        | "pending_payment"
        | "submitted"
        | "enrolled"
        | "cancelled"
        | "rejected"
      certificate_status: "valid" | "revoked" | "reissued"
      course_type: "self_paced" | "cohort" | "live" | "free"
      enrolment_source:
        | "payment"
        | "complimentary"
        | "sponsored"
        | "credits"
        | "free"
      enrolment_status: "active" | "suspended" | "completed" | "revoked"
      lesson_kind: "video" | "text" | "audio" | "embed"
      order_status:
        | "pending"
        | "paid"
        | "failed"
        | "cancelled"
        | "refunded"
        | "disputed"
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
      app_role: ["admin", "user", "instructor", "super_admin"],
      application_status: [
        "pending_payment",
        "submitted",
        "enrolled",
        "cancelled",
        "rejected",
      ],
      certificate_status: ["valid", "revoked", "reissued"],
      course_type: ["self_paced", "cohort", "live", "free"],
      enrolment_source: [
        "payment",
        "complimentary",
        "sponsored",
        "credits",
        "free",
      ],
      enrolment_status: ["active", "suspended", "completed", "revoked"],
      lesson_kind: ["video", "text", "audio", "embed"],
      order_status: [
        "pending",
        "paid",
        "failed",
        "cancelled",
        "refunded",
        "disputed",
      ],
    },
  },
} as const
