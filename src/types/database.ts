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
      bean_redemptions: {
        Row: {
          amount: number
          child_id: string
          created_at: string
          id: string
          note: string | null
        }
        Insert: {
          amount: number
          child_id: string
          created_at?: string
          id?: string
          note?: string | null
        }
        Update: {
          amount?: number
          child_id?: string
          created_at?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bean_redemptions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_transactions: {
        Row: {
          amount: number
          child_id: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          direction: Database["public"]["Enums"]["tx_direction"]
          id: string
          note: string | null
          source: Database["public"]["Enums"]["tx_source"]
          source_id: string | null
        }
        Insert: {
          amount: number
          child_id: string
          created_at?: string
          currency: Database["public"]["Enums"]["currency_type"]
          direction: Database["public"]["Enums"]["tx_direction"]
          id?: string
          note?: string | null
          source: Database["public"]["Enums"]["tx_source"]
          source_id?: string | null
        }
        Update: {
          amount?: number
          child_id?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          direction?: Database["public"]["Enums"]["tx_direction"]
          id?: string
          note?: string | null
          source?: Database["public"]["Enums"]["tx_source"]
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "currency_transactions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_emoji: string
          created_at: string
          display_name: string
          family_id: string | null
          gold_beans: number
          id: string
          magic_stars: number
          role: Database["public"]["Enums"]["user_role"]
          stars: number
          total_tasks_completed: number
          updated_at: string
        }
        Insert: {
          avatar_emoji?: string
          created_at?: string
          display_name: string
          family_id?: string | null
          gold_beans?: number
          id: string
          magic_stars?: number
          role?: Database["public"]["Enums"]["user_role"]
          stars?: number
          total_tasks_completed?: number
          updated_at?: string
        }
        Update: {
          avatar_emoji?: string
          created_at?: string
          display_name?: string
          family_id?: string | null
          gold_beans?: number
          id?: string
          magic_stars?: number
          role?: Database["public"]["Enums"]["user_role"]
          stars?: number
          total_tasks_completed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          created_at: string
          description: string | null
          emoji: string
          gold_beans_reward: number
          id: string
          is_active: boolean
          magic_stars_cost: number
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string
          gold_beans_reward: number
          id?: string
          is_active?: boolean
          magic_stars_cost: number
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string
          gold_beans_reward?: number
          id?: string
          is_active?: boolean
          magic_stars_cost?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      shop_purchases: {
        Row: {
          child_id: string
          created_at: string
          gold_beans_received: number
          id: string
          magic_stars_spent: number
          product_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          gold_beans_received: number
          id?: string
          magic_stars_spent: number
          product_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          gold_beans_received?: number
          id?: string
          magic_stars_spent?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_purchases_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      star_conversions: {
        Row: {
          child_id: string
          created_at: string
          id: string
          magic_stars_gained: number
          stars_spent: number
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          magic_stars_gained: number
          stars_spent: number
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          magic_stars_gained?: number
          stars_spent?: number
        }
        Relationships: [
          {
            foreignKeyName: "star_conversions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          child_id: string
          created_at: string
          id: string
          note: string | null
          proof_url: string | null
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["completion_status"]
          task_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          note?: string | null
          proof_url?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["completion_status"]
          task_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          note?: string | null
          proof_url?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["completion_status"]
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          emoji: string
          family_id: string
          id: string
          magic_stars_reward: number
          recurrence: Database["public"]["Enums"]["task_recurrence"]
          stars_reward: number
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          emoji?: string
          family_id: string
          id?: string
          magic_stars_reward?: number
          recurrence?: Database["public"]["Enums"]["task_recurrence"]
          stars_reward?: number
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          emoji?: string
          family_id?: string
          id?: string
          magic_stars_reward?: number
          recurrence?: Database["public"]["Enums"]["task_recurrence"]
          stars_reward?: number
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      completion_status: "pending" | "approved" | "rejected"
      currency_type: "star" | "magic_star" | "gold_bean"
      task_recurrence: "once" | "daily" | "weekly" | "milestone"
      task_status: "active" | "archived"
      tx_direction: "credit" | "debit"
      tx_source:
        | "task_reward"
        | "star_conversion"
        | "shop_purchase"
        | "bean_spend"
        | "parent_adjustment"
      user_role: "parent" | "child"
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
      completion_status: ["pending", "approved", "rejected"],
      currency_type: ["star", "magic_star", "gold_bean"],
      task_recurrence: ["once", "daily", "weekly", "milestone"],
      task_status: ["active", "archived"],
      tx_direction: ["credit", "debit"],
      tx_source: [
        "task_reward",
        "star_conversion",
        "shop_purchase",
        "bean_spend",
        "parent_adjustment",
      ],
      user_role: ["parent", "child"],
    },
  },
} as const
