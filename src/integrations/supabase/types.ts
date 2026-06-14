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
      courses: {
        Row: {
          category: string
          certificate: string | null
          created_at: string
          description: string
          duration: string
          featured: boolean
          full_description: string | null
          id: string
          instructor: string
          level: string
          modules: Json
          pinned: boolean
          pinned_at: string | null
          prerequisites: string | null
          price: string | null
          published: boolean
          rating: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          what_you_learn: Json
        }
        Insert: {
          category?: string
          certificate?: string | null
          created_at?: string
          description?: string
          duration?: string
          featured?: boolean
          full_description?: string | null
          id?: string
          instructor?: string
          level?: string
          modules?: Json
          pinned?: boolean
          pinned_at?: string | null
          prerequisites?: string | null
          price?: string | null
          published?: boolean
          rating?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          what_you_learn?: Json
        }
        Update: {
          category?: string
          certificate?: string | null
          created_at?: string
          description?: string
          duration?: string
          featured?: boolean
          full_description?: string | null
          id?: string
          instructor?: string
          level?: string
          modules?: Json
          pinned?: boolean
          pinned_at?: string | null
          prerequisites?: string | null
          price?: string | null
          published?: boolean
          rating?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          what_you_learn?: Json
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
