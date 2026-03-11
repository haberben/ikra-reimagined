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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      daily_content: {
        Row: {
          arabic_text: string
          created_by_user_id: string | null
          date: string
          id: string
          source: string | null
          turkish_text: string
          type: string
        }
        Insert: {
          arabic_text: string
          created_by_user_id?: string | null
          date?: string
          id?: string
          source?: string | null
          turkish_text: string
          type: string
        }
        Update: {
          arabic_text?: string
          created_by_user_id?: string | null
          date?: string
          id?: string
          source?: string | null
          turkish_text?: string
          type?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      hatim_groups: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          invite_code: string
          is_public: boolean
          name: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invite_code: string
          is_public?: boolean
          name: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invite_code?: string
          is_public?: boolean
          name?: string
        }
        Relationships: []
      }
      hatim_juz: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          claimed_by_name: string | null
          completed_at: string | null
          group_id: string
          id: string
          juz_number: number
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          claimed_by_name?: string | null
          completed_at?: string | null
          group_id: string
          id?: string
          juz_number: number
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          claimed_by_name?: string | null
          completed_at?: string | null
          group_id?: string
          id?: string
          juz_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "hatim_juz_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "hatim_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          created_by_user_id: string | null
          id: string
          image_url: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          body: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          image_url?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          image_url?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_banned: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_banned?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_banned?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_playlists: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by_user_id: string | null
          description: string | null
          id: string
          is_published: boolean
          sort_order: number
          title: string
          updated_at: string
          youtube_playlist_id: string
          youtube_playlist_url: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          youtube_playlist_id: string
          youtube_playlist_url: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          youtube_playlist_id?: string
          youtube_playlist_url?: string
        }
        Relationships: []
      }
      wallpapers: {
        Row: {
          arabic_text: string | null
          category: string
          created_by_user_id: string | null
          id: string
          image_url: string
          sort_order: number
          turkish_text: string | null
          uploaded_at: string
        }
        Insert: {
          arabic_text?: string | null
          category: string
          created_by_user_id?: string | null
          id?: string
          image_url: string
          sort_order?: number
          turkish_text?: string | null
          uploaded_at?: string
        }
        Update: {
          arabic_text?: string | null
          category?: string
          created_by_user_id?: string | null
          id?: string
          image_url?: string
          sort_order?: number
          turkish_text?: string | null
          uploaded_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_admin_if_eligible: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
