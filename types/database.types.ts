export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_usage_log: {
        Row: {
          cost_usd: number
          created_at: string
          error: string | null
          feature: string
          id: string
          input_tokens: number
          latency_ms: number
          model: string
          output_tokens: number
          provider: string
          research_run_id: string | null
          user_id: string | null
        }
        Insert: {
          cost_usd?: number
          created_at?: string
          error?: string | null
          feature: string
          id?: string
          input_tokens?: number
          latency_ms?: number
          model: string
          output_tokens?: number
          provider: string
          research_run_id?: string | null
          user_id?: string | null
        }
        Update: {
          cost_usd?: number
          created_at?: string
          error?: string | null
          feature?: string
          id?: string
          input_tokens?: number
          latency_ms?: number
          model?: string
          output_tokens?: number
          provider?: string
          research_run_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          new_value: Json | null
          object_id: string | null
          object_type: string
          previous_value: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_value?: Json | null
          object_id?: string | null
          object_type: string
          previous_value?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_value?: Json | null
          object_id?: string | null
          object_type?: string
          previous_value?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      collection_prompts: {
        Row: {
          added_at: string
          collection_id: string
          prompt_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          prompt_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          prompt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_prompts_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_prompts_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          prompt_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          prompt_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          prompt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          personalization_enabled: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          personalization_enabled?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          personalization_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      prompt_tags: {
        Row: {
          prompt_id: string
          tag_id: string
        }
        Insert: {
          prompt_id: string
          tag_id: string
        }
        Update: {
          prompt_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_tags_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          change_source: string
          created_at: string
          created_by: string
          id: string
          prompt_id: string
          prompt_text: string
          title: string
          version_number: number
        }
        Insert: {
          change_source?: string
          created_at?: string
          created_by: string
          id?: string
          prompt_id: string
          prompt_text: string
          title: string
          version_number: number
        }
        Update: {
          change_source?: string
          created_at?: string
          created_by?: string
          id?: string
          prompt_id?: string
          prompt_text?: string
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          category_id: string | null
          clarity_score: number | null
          context_score: number | null
          created_at: string
          description: string | null
          difficulty: string | null
          discovered_at: string | null
          example_input: string | null
          example_output: string | null
          favorite_count: number
          google_drive_file_id: string | null
          google_sheet_row_id: string | null
          id: string
          improved_prompt: string | null
          industry: string | null
          instructions: string | null
          is_ai_discovered: boolean
          is_ai_improved: boolean
          is_archived: boolean
          is_duplicate: boolean
          is_original: boolean
          is_verified: boolean
          last_verified_at: string | null
          notes: string | null
          original_prompt: string | null
          originality_score: number | null
          practical_value_score: number | null
          prompt_text: string
          prompt_type: string | null
          quality_score: number | null
          recommended_models: string[]
          reusability_score: number | null
          slug: string
          source_author: string | null
          source_id: string | null
          source_name: string | null
          source_publication_date: string | null
          source_url: string | null
          specificity_score: number | null
          structure_score: number | null
          subcategory: string | null
          tested_models: string[]
          title: string
          updated_at: string
          usage_count: number
          use_case: string | null
          user_id: string
          user_rating: number | null
          variables: Json
          verification_status: string | null
        }
        Insert: {
          category_id?: string | null
          clarity_score?: number | null
          context_score?: number | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          discovered_at?: string | null
          example_input?: string | null
          example_output?: string | null
          favorite_count?: number
          google_drive_file_id?: string | null
          google_sheet_row_id?: string | null
          id?: string
          improved_prompt?: string | null
          industry?: string | null
          instructions?: string | null
          is_ai_discovered?: boolean
          is_ai_improved?: boolean
          is_archived?: boolean
          is_duplicate?: boolean
          is_original?: boolean
          is_verified?: boolean
          last_verified_at?: string | null
          notes?: string | null
          original_prompt?: string | null
          originality_score?: number | null
          practical_value_score?: number | null
          prompt_text: string
          prompt_type?: string | null
          quality_score?: number | null
          recommended_models?: string[]
          reusability_score?: number | null
          slug: string
          source_author?: string | null
          source_id?: string | null
          source_name?: string | null
          source_publication_date?: string | null
          source_url?: string | null
          specificity_score?: number | null
          structure_score?: number | null
          subcategory?: string | null
          tested_models?: string[]
          title: string
          updated_at?: string
          usage_count?: number
          use_case?: string | null
          user_id: string
          user_rating?: number | null
          variables?: Json
          verification_status?: string | null
        }
        Update: {
          category_id?: string | null
          clarity_score?: number | null
          context_score?: number | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          discovered_at?: string | null
          example_input?: string | null
          example_output?: string | null
          favorite_count?: number
          google_drive_file_id?: string | null
          google_sheet_row_id?: string | null
          id?: string
          improved_prompt?: string | null
          industry?: string | null
          instructions?: string | null
          is_ai_discovered?: boolean
          is_ai_improved?: boolean
          is_archived?: boolean
          is_duplicate?: boolean
          is_original?: boolean
          is_verified?: boolean
          last_verified_at?: string | null
          notes?: string | null
          original_prompt?: string | null
          originality_score?: number | null
          practical_value_score?: number | null
          prompt_text?: string
          prompt_type?: string | null
          quality_score?: number | null
          recommended_models?: string[]
          reusability_score?: number | null
          slug?: string
          source_author?: string | null
          source_id?: string | null
          source_name?: string | null
          source_publication_date?: string | null
          source_url?: string | null
          specificity_score?: number | null
          structure_score?: number | null
          subcategory?: string | null
          tested_models?: string[]
          title?: string
          updated_at?: string
          usage_count?: number
          use_case?: string | null
          user_id?: string
          user_rating?: number | null
          variables?: Json
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
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
