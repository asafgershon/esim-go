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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      catalog_bundles: {
        Row: {
          countries: string[] | null
          created_at: string | null
          currency: string | null
          data_amount: number | null
          data_amount_mb: number | null
          data_amount_readable: string | null
          description: string | null
          duration: number | null
          esim_go_name: string
          groups: string[] | null
          id: string
          is_unlimited: boolean | null
          price: number | null
          region: string | null
          regions: Json | null
          speed: string[] | null
          synced_at: string | null
          unlimited: boolean | null
          updated_at: string | null
          validity_in_days: number | null
        }
        Insert: {
          countries?: string[] | null
          created_at?: string | null
          currency?: string | null
          data_amount?: number | null
          data_amount_mb?: number | null
          data_amount_readable?: string | null
          description?: string | null
          duration?: number | null
          esim_go_name: string
          groups?: string[] | null
          id?: string
          is_unlimited?: boolean | null
          price?: number | null
          region?: string | null
          regions?: Json | null
          speed?: string[] | null
          synced_at?: string | null
          unlimited?: boolean | null
          updated_at?: string | null
          validity_in_days?: number | null
        }
        Update: {
          countries?: string[] | null
          created_at?: string | null
          currency?: string | null
          data_amount?: number | null
          data_amount_mb?: number | null
          data_amount_readable?: string | null
          description?: string | null
          duration?: number | null
          esim_go_name?: string
          groups?: string[] | null
          id?: string
          is_unlimited?: boolean | null
          price?: number | null
          region?: string | null
          regions?: Json | null
          speed?: string[] | null
          synced_at?: string | null
          unlimited?: boolean | null
          updated_at?: string | null
          validity_in_days?: number | null
        }
        Relationships: []
      }
      catalog_metadata: {
        Row: {
          api_health_status: string | null
          bundle_groups: string[] | null
          created_at: string | null
          id: string
          last_full_sync: string | null
          last_health_check: string | null
          metadata: Json | null
          next_scheduled_sync: string | null
          sync_strategy: string | null
          sync_version: string | null
          total_bundles: number | null
          updated_at: string | null
        }
        Insert: {
          api_health_status?: string | null
          bundle_groups?: string[] | null
          created_at?: string | null
          id?: string
          last_full_sync?: string | null
          last_health_check?: string | null
          metadata?: Json | null
          next_scheduled_sync?: string | null
          sync_strategy?: string | null
          sync_version?: string | null
          total_bundles?: number | null
          updated_at?: string | null
        }
        Update: {
          api_health_status?: string | null
          bundle_groups?: string[] | null
          created_at?: string | null
          id?: string
          last_full_sync?: string | null
          last_health_check?: string | null
          metadata?: Json | null
          next_scheduled_sync?: string | null
          sync_strategy?: string | null
          sync_version?: string | null
          total_bundles?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      catalog_sync_jobs: {
        Row: {
          bundle_group: string | null
          bundles_added: number | null
          bundles_processed: number | null
          bundles_updated: number | null
          completed_at: string | null
          country_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          job_type: string
          metadata: Json | null
          priority: string
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          bundle_group?: string | null
          bundles_added?: number | null
          bundles_processed?: number | null
          bundles_updated?: number | null
          completed_at?: string | null
          country_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          metadata?: Json | null
          priority?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          bundle_group?: string | null
          bundles_added?: number | null
          bundles_processed?: number | null
          bundles_updated?: number | null
          completed_at?: string | null
          country_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          metadata?: Json | null
          priority?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      checkout_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          metadata: Json | null
          order_id: string | null
          payment_intent_id: string | null
          payment_status: string | null
          plan_id: string
          plan_snapshot: Json
          pricing: Json
          steps: Json
          token_hash: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          plan_id: string
          plan_snapshot: Json
          pricing?: Json
          steps?: Json
          token_hash?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          plan_id?: string
          plan_snapshot?: Json
          pricing?: Json
          steps?: Json
          token_hash?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "esim_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      data_plans: {
        Row: {
          bundle_group: string | null
          countries: Json
          created_at: string | null
          description: string | null
          duration: number
          id: string
          is_unlimited: boolean | null
          name: string
          price: number
          region: string
          updated_at: string | null
        }
        Insert: {
          bundle_group?: string | null
          countries: Json
          created_at?: string | null
          description?: string | null
          duration: number
          id?: string
          is_unlimited?: boolean | null
          name: string
          price: number
          region: string
          updated_at?: string | null
        }
        Update: {
          bundle_group?: string | null
          countries?: Json
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          is_unlimited?: boolean | null
          name?: string
          price?: number
          region?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      esim_bundles: {
        Row: {
          created_at: string | null
          data_plan_id: string
          end_date: string | null
          esim_id: string
          id: string
          name: string
          remaining_data: number | null
          start_date: string | null
          state: string
          updated_at: string | null
          used_data: number | null
        }
        Insert: {
          created_at?: string | null
          data_plan_id: string
          end_date?: string | null
          esim_id: string
          id?: string
          name: string
          remaining_data?: number | null
          start_date?: string | null
          state?: string
          updated_at?: string | null
          used_data?: number | null
        }
        Update: {
          created_at?: string | null
          data_plan_id?: string
          end_date?: string | null
          esim_id?: string
          id?: string
          name?: string
          remaining_data?: number | null
          start_date?: string | null
          state?: string
          updated_at?: string | null
          used_data?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "esim_bundles_data_plan_id_fkey"
            columns: ["data_plan_id"]
            isOneToOne: false
            referencedRelation: "data_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esim_bundles_esim_id_fkey"
            columns: ["esim_id"]
            isOneToOne: false
            referencedRelation: "esims"
            referencedColumns: ["id"]
          },
        ]
      }
      esim_orders: {
        Row: {
          created_at: string | null
          data_plan_id: string | null
          esim_go_order_ref: string | null
          id: string
          plan_data: Json | null
          pricing_breakdown: Json | null
          quantity: number
          reference: string
          status: string
          total_price: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_plan_id?: string | null
          esim_go_order_ref?: string | null
          id?: string
          plan_data?: Json | null
          pricing_breakdown?: Json | null
          quantity?: number
          reference: string
          status?: string
          total_price: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_plan_id?: string | null
          esim_go_order_ref?: string | null
          id?: string
          plan_data?: Json | null
          pricing_breakdown?: Json | null
          quantity?: number
          reference?: string
          status?: string
          total_price?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      esims: {
        Row: {
          action_date: string | null
          activation_code: string | null
          assigned_date: string | null
          created_at: string | null
          customer_ref: string | null
          iccid: string
          id: string
          last_action: string | null
          matching_id: string | null
          order_id: string
          qr_code_url: string | null
          smdp_address: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_date?: string | null
          activation_code?: string | null
          assigned_date?: string | null
          created_at?: string | null
          customer_ref?: string | null
          iccid: string
          id?: string
          last_action?: string | null
          matching_id?: string | null
          order_id: string
          qr_code_url?: string | null
          smdp_address?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_date?: string | null
          activation_code?: string | null
          assigned_date?: string | null
          created_at?: string | null
          customer_ref?: string | null
          iccid?: string
          id?: string
          last_action?: string | null
          matching_id?: string | null
          order_id?: string
          qr_code_url?: string | null
          smdp_address?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "esims_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "esim_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      high_demand_countries: {
        Row: {
          country_id: string
          created_at: string | null
          created_by: string
          id: string
          updated_at: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          created_by: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      package_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          created_at: string
          data_plan_id: string
          id: string
          plan_snapshot: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          created_at?: string
          data_plan_id: string
          id?: string
          plan_snapshot?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          created_at?: string
          data_plan_id?: string
          id?: string
          plan_snapshot?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_blocks: {
        Row: {
          action: Json
          category: string
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_editable: boolean | null
          name: string
          priority: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          action: Json
          category: string
          conditions: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_editable?: boolean | null
          name: string
          priority?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          action?: Json
          category?: string
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_editable?: boolean | null
          name?: string
          priority?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          code: string
          conditions: Json
          created_at: string | null
          description: string | null
          event_params: Json
          event_type: string
          id: string
          is_active: boolean | null
          name: string
          rule_type: string
          updated_at: string | null
        }
        Insert: {
          code: string
          conditions?: Json
          created_at?: string | null
          description?: string | null
          event_params?: Json
          event_type: string
          id?: string
          is_active?: boolean | null
          name: string
          rule_type: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          conditions?: Json
          created_at?: string | null
          description?: string | null
          event_params?: Json
          event_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rule_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pricing_rules_backup_20250730: {
        Row: {
          actions: Json | null
          category: string | null
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          is_editable: boolean | null
          name: string | null
          priority: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          actions?: Json | null
          category?: string | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          is_editable?: boolean | null
          name?: string | null
          priority?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          actions?: Json | null
          category?: string | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          is_editable?: boolean | null
          name?: string | null
          priority?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      pricing_strategies: {
        Row: {
          activation_count: number | null
          archived_at: string | null
          code: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_default: boolean | null
          last_activated_at: string | null
          name: string
          parent_strategy_id: string | null
          updated_at: string | null
          updated_by: string | null
          validated_at: string | null
          validation_errors: Json | null
          version: number
        }
        Insert: {
          activation_count?: number | null
          archived_at?: string | null
          code: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          last_activated_at?: string | null
          name: string
          parent_strategy_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          validated_at?: string | null
          validation_errors?: Json | null
          version?: number
        }
        Update: {
          activation_count?: number | null
          archived_at?: string | null
          code?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          last_activated_at?: string | null
          name?: string
          parent_strategy_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          validated_at?: string | null
          validation_errors?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricing_strategies_parent_strategy_id_fkey"
            columns: ["parent_strategy_id"]
            isOneToOne: false
            referencedRelation: "pricing_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
        }
        Insert: {
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
        }
        Update: {
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      strategy_blocks: {
        Row: {
          added_at: string | null
          added_by: string | null
          block_id: string
          config_overrides: Json | null
          id: string
          is_enabled: boolean | null
          priority: number
          strategy_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          block_id: string
          config_overrides?: Json | null
          id?: string
          is_enabled?: boolean | null
          priority: number
          strategy_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          block_id?: string
          config_overrides?: Json | null
          id?: string
          is_enabled?: boolean | null
          priority?: number
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_blocks_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "pricing_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_blocks_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "pricing_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          country_ids: Json
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          name: string
          region_id: string
          updated_at: string | null
        }
        Insert: {
          country_ids: Json
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          name: string
          region_id: string
          updated_at?: string | null
        }
        Update: {
          country_ids?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          name?: string
          region_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      active_bundles: {
        Row: {
          countries: Json | null
          created_at: string | null
          data_plan_id: string | null
          duration: number | null
          end_date: string | null
          esim_id: string | null
          esim_status: string | null
          iccid: string | null
          id: string | null
          is_unlimited: boolean | null
          name: string | null
          plan_description: string | null
          region: string | null
          remaining_data: number | null
          start_date: string | null
          state: string | null
          updated_at: string | null
          used_data: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esim_bundles_data_plan_id_fkey"
            columns: ["data_plan_id"]
            isOneToOne: false
            referencedRelation: "data_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esim_bundles_esim_id_fkey"
            columns: ["esim_id"]
            isOneToOne: false
            referencedRelation: "esims"
            referencedColumns: ["id"]
          },
        ]
      }
      active_checkout_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string | null
          is_complete: boolean | null
          metadata: Json | null
          payment_intent_id: string | null
          payment_status: string | null
          plan_id: string | null
          plan_snapshot: Json | null
          pricing: Json | null
          steps: Json | null
          time_remaining: unknown | null
          token_hash: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          is_complete?: never
          metadata?: Json | null
          payment_intent_id?: string | null
          payment_status?: string | null
          plan_id?: string | null
          plan_snapshot?: Json | null
          pricing?: Json | null
          steps?: Json | null
          time_remaining?: never
          token_hash?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          is_complete?: never
          metadata?: Json | null
          payment_intent_id?: string | null
          payment_status?: string | null
          plan_id?: string | null
          plan_snapshot?: Json | null
          pricing?: Json | null
          steps?: Json | null
          time_remaining?: never
          token_hash?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bundles_by_country: {
        Row: {
          country_code: string | null
          currency: string | null
          data_amount_mb: number | null
          data_amount_readable: string | null
          description: string | null
          esim_go_name: string | null
          groups: string[] | null
          is_unlimited: boolean | null
          price: number | null
          region: string | null
          speed: string[] | null
          validity_in_days: number | null
        }
        Relationships: []
      }
      bundles_by_group: {
        Row: {
          countries: string[] | null
          currency: string | null
          data_amount_mb: number | null
          data_amount_readable: string | null
          description: string | null
          esim_go_name: string | null
          group_name: string | null
          is_unlimited: boolean | null
          price: number | null
          region: string | null
          speed: string[] | null
          validity_in_days: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_checkout_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_bundle_coverage_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_bundles: number
          total_countries: number
          total_regions: number
          total_groups: number
          avg_countries_per_bundle: number
          most_covered_country: string
          most_covered_region: string
          price_range: Json
        }[]
      }
      get_bundles_by_countries: {
        Args: Record<PropertyKey, never>
        Returns: {
          country_code: string
          bundles: Json
          bundle_count: number
          min_price: number
          max_price: number
          avg_price: number
          groups: string[]
          has_unlimited: boolean
          common_region: string
        }[]
      }
      get_bundles_by_groups: {
        Args: Record<PropertyKey, never>
        Returns: {
          group_name: string
          bundles: Json
          bundle_count: number
          min_price: number
          max_price: number
          avg_price: number
          countries_count: number
          has_unlimited: boolean
        }[]
      }
      get_bundles_by_groups_simple: {
        Args: Record<PropertyKey, never>
        Returns: {
          group_name: string
          bundle_count: number
          bundle_ids: string[]
          min_price: number
          max_price: number
          avg_price: number
          has_unlimited: boolean
        }[]
      }
      get_bundles_by_regions: {
        Args: Record<PropertyKey, never>
        Returns: {
          region: string
          bundles: Json
          bundle_count: number
          min_price: number
          max_price: number
          avg_price: number
          countries: string[]
          country_count: number
          has_unlimited: boolean
        }[]
      }
      get_bundles_by_regions_v2: {
        Args: Record<PropertyKey, never>
        Returns: {
          region: string
          bundle_count: number
          min_price: number
          max_price: number
          avg_price: number
          country_count: number
          has_unlimited: boolean
          popular_groups: string[]
        }[]
      }
      get_bundles_for_country: {
        Args: { country_param: string }
        Returns: {
          country_code: string
          bundles: Json
          bundle_count: number
          min_price: number
          max_price: number
          groups: string[]
          regions: string[]
          has_unlimited: boolean
        }[]
      }
      get_bundles_for_country_simple: {
        Args: { country_param: string }
        Returns: Json
      }
      get_bundles_for_group: {
        Args: { group_param: string }
        Returns: {
          group_name: string
          bundles: Json
          bundle_count: number
          min_price: number
          max_price: number
          countries: string[]
          regions: string[]
          has_unlimited: boolean
        }[]
      }
      get_bundles_for_region: {
        Args: { region_param: string }
        Returns: {
          region: string
          bundles: Json
          bundle_count: number
          min_price: number
          max_price: number
          countries: string[]
          groups: string[]
          has_unlimited: boolean
        }[]
      }
      get_region_countries: {
        Args: { region_param: string }
        Returns: string[]
      }
      get_region_groups: {
        Args: { region_param: string }
        Returns: string[]
      }
      get_region_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          region: string
          bundle_count: number
          country_count: number
          group_count: number
          unlimited_count: number
          price_stats: Json
        }[]
      }
      get_regions_with_bundles: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_unique_durations: {
        Args: Record<PropertyKey, never>
        Returns: {
          validity_in_days: number
        }[]
      }
      get_unique_groups_from_bundles: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_unique_regions: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_checkout_session_complete: {
        Args: { session_id: string }
        Returns: boolean
      }
      refresh_region_summary: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_catalog_bundles: {
        Args: {
          p_countries?: string[]
          p_bundle_groups?: string[]
          p_min_duration?: number
          p_max_duration?: number
          p_unlimited?: boolean
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          esim_go_name: string
          bundle_group: string
          description: string
          duration: number
          data_amount: number
          unlimited: boolean
          price_cents: number
          currency: string
          countries: Json
          regions: Json
        }[]
      }
      validate_checkout_session_token: {
        Args: { session_token: string }
        Returns: {
          session_id: string
          user_id: string
          is_valid: boolean
          expires_at: string
        }[]
      }
    }
    Enums: {
      block_type:
        | "cost"
        | "markup"
        | "discount"
        | "unused_days_discount"
        | "psychological_rounding"
        | "region_rounding"
        | "profit_constraint"
        | "processing_fee"
        | "custom"
      event_type:
        | "set-base-price"
        | "apply-markup"
        | "apply-discount"
        | "apply-unused-days-discount"
        | "apply-psychological-rounding"
        | "apply-region-rounding"
        | "apply-profit-constraint"
        | "apply-processing-fee"
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
      block_type: [
        "cost",
        "markup",
        "discount",
        "unused_days_discount",
        "psychological_rounding",
        "region_rounding",
        "profit_constraint",
        "processing_fee",
        "custom",
      ],
      event_type: [
        "set-base-price",
        "apply-markup",
        "apply-discount",
        "apply-unused-days-discount",
        "apply-psychological-rounding",
        "apply-region-rounding",
        "apply-profit-constraint",
        "apply-processing-fee",
      ],
    },
  },
} as const
