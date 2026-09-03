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
      google_integrations: {
        Row: {
          access_token_encrypted: string
          connected_at: string
          drive_root_folder_id: string | null
          drive_subfolder_ids: Json
          id: string
          refresh_token_encrypted: string
          scopes: string[]
          sheets_review_sync_enabled: boolean
          spreadsheet_id: string | null
          token_expiry: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted: string
          connected_at?: string
          drive_root_folder_id?: string | null
          drive_subfolder_ids?: Json
          id?: string
          refresh_token_encrypted: string
          scopes?: string[]
          sheets_review_sync_enabled?: boolean
          spreadsheet_id?: string | null
          token_expiry: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string
          connected_at?: string
          drive_root_folder_id?: string | null
          drive_subfolder_ids?: Json
          id?: string
          refresh_token_encrypted?: string
          scopes?: string[]
          sheets_review_sync_enabled?: boolean
          spreadsheet_id?: string | null
          token_expiry?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      processed_content: {
        Row: {
          content_hash: string
          id: string
          processed_at: string
          publication_date: string | null
          run_id: string | null
          source_url: string
        }
        Insert: {
          content_hash: string
          id?: string
          processed_at?: string
          publication_date?: string | null
          run_id?: string | null
          source_url: string
        }
        Update: {
          content_hash?: string
          id?: string
          processed_at?: string
          publication_date?: string | null
          run_id?: string | null
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "processed_content_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "research_runs"
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
          is_admin: boolean
          personalization_enabled: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_admin?: boolean
          personalization_enabled?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_admin?: boolean
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
          embedding: string | null
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
          embedding?: string | null
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
          embedding?: string | null
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
      research_candidates: {
        Row: {
          category_id: string | null
          clarity_score: number | null
          content_hash: string
          context_score: number | null
          created_at: string
          description: string | null
          duplicate_of_prompt_id: string | null
          duplicate_probability: number | null
          google_sheet_row_id: number | null
          id: string
          is_ai_optimized: boolean
          original_excerpt: string | null
          originality_score: number | null
          practical_value_score: number | null
          prompt_text: string
          quality_score: number | null
          recommended_action: string | null
          reusability_score: number | null
          review_status: string
          reviewer_notes: string | null
          run_id: string
          security_notes: string | null
          security_status: string
          source_author: string | null
          source_id: string | null
          source_name: string | null
          source_publication_date: string | null
          source_url: string
          specificity_score: number | null
          structure_score: number | null
          supabase_prompt_id: string | null
          tags: string[]
          title: string
          use_case: string | null
        }
        Insert: {
          category_id?: string | null
          clarity_score?: number | null
          content_hash: string
          context_score?: number | null
          created_at?: string
          description?: string | null
          duplicate_of_prompt_id?: string | null
          duplicate_probability?: number | null
          google_sheet_row_id?: number | null
          id?: string
          is_ai_optimized?: boolean
          original_excerpt?: string | null
          originality_score?: number | null
          practical_value_score?: number | null
          prompt_text: string
          quality_score?: number | null
          recommended_action?: string | null
          reusability_score?: number | null
          review_status?: string
          reviewer_notes?: string | null
          run_id: string
          security_notes?: string | null
          security_status?: string
          source_author?: string | null
          source_id?: string | null
          source_name?: string | null
          source_publication_date?: string | null
          source_url: string
          specificity_score?: number | null
          structure_score?: number | null
          supabase_prompt_id?: string | null
          tags?: string[]
          title: string
          use_case?: string | null
        }
        Update: {
          category_id?: string | null
          clarity_score?: number | null
          content_hash?: string
          context_score?: number | null
          created_at?: string
          description?: string | null
          duplicate_of_prompt_id?: string | null
          duplicate_probability?: number | null
          google_sheet_row_id?: number | null
          id?: string
          is_ai_optimized?: boolean
          original_excerpt?: string | null
          originality_score?: number | null
          practical_value_score?: number | null
          prompt_text?: string
          quality_score?: number | null
          recommended_action?: string | null
          reusability_score?: number | null
          review_status?: string
          reviewer_notes?: string | null
          run_id?: string
          security_notes?: string | null
          security_status?: string
          source_author?: string | null
          source_id?: string | null
          source_name?: string | null
          source_publication_date?: string | null
          source_url?: string
          specificity_score?: number | null
          structure_score?: number | null
          supabase_prompt_id?: string | null
          tags?: string[]
          title?: string
          use_case?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_candidates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_candidates_duplicate_of_prompt_id_fkey"
            columns: ["duplicate_of_prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_candidates_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "research_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_candidates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_candidates_supabase_prompt_id_fkey"
            columns: ["supabase_prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      research_runs: {
        Row: {
          ai_cost_usd: number
          created_at: string
          drive_report_error: string | null
          drive_report_file_id: string | null
          drive_report_status: string
          drive_report_uploaded_at: string | null
          duplicates_found: number
          ended_at: string | null
          errors: Json
          id: string
          input_tokens: number
          items_analyzed: number
          items_discovered: number
          items_rejected: number
          output_tokens: number
          pending_review_count: number
          published_count: number
          sheets_sync_error: string | null
          sheets_sync_status: string
          sheets_synced_at: string | null
          sources_scanned: number
          started_at: string
          status: string
          triggered_by: string | null
        }
        Insert: {
          ai_cost_usd?: number
          created_at?: string
          drive_report_error?: string | null
          drive_report_file_id?: string | null
          drive_report_status?: string
          drive_report_uploaded_at?: string | null
          duplicates_found?: number
          ended_at?: string | null
          errors?: Json
          id?: string
          input_tokens?: number
          items_analyzed?: number
          items_discovered?: number
          items_rejected?: number
          output_tokens?: number
          pending_review_count?: number
          published_count?: number
          sheets_sync_error?: string | null
          sheets_sync_status?: string
          sheets_synced_at?: string | null
          sources_scanned?: number
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Update: {
          ai_cost_usd?: number
          created_at?: string
          drive_report_error?: string | null
          drive_report_file_id?: string | null
          drive_report_status?: string
          drive_report_uploaded_at?: string | null
          duplicates_found?: number
          ended_at?: string | null
          errors?: Json
          id?: string
          input_tokens?: number
          items_analyzed?: number
          items_discovered?: number
          items_rejected?: number
          output_tokens?: number
          pending_review_count?: number
          published_count?: number
          sheets_sync_error?: string | null
          sheets_sync_status?: string
          sheets_synced_at?: string | null
          sources_scanned?: number
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      sources: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          last_scanned_at: string | null
          name: string
          notes: string | null
          scan_frequency: string
          trust_score: number
          type: string
          url: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_scanned_at?: string | null
          name: string
          notes?: string | null
          scan_frequency?: string
          trust_score?: number
          type?: string
          url: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_scanned_at?: string | null
          name?: string
          notes?: string | null
          scan_frequency?: string
          trust_score?: number
          type?: string
          url?: string
        }
        Relationships: []
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
      match_prompts: {
        Args: {
          match_category_id?: string
          match_count?: number
          match_user_id: string
          query_embedding: string
        }
        Returns: {
          id: string
          similarity: number
        }[]
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
