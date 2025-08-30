export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          query?: string
          operationName?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      catalog_bundles: {
        Row: {
          countries: string[] | null
          created_at: string | null
          currency: string | null
          data_amount_mb: number | null
          data_amount_readable: string | null
          description: string | null
          duration: number | null
          esim_go_name: string
          groups: string[] | null
          id: string
          is_unlimited: boolean | null
          price: number | null
          provider: string | null
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
          data_amount_mb?: number | null
          data_amount_readable?: string | null
          description?: string | null
          duration?: number | null
          esim_go_name: string
          groups?: string[] | null
          id?: string
          is_unlimited?: boolean | null
          price?: number | null
          provider?: string | null
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
          data_amount_mb?: number | null
          data_amount_readable?: string | null
          description?: string | null
          duration?: number | null
          esim_go_name?: string
          groups?: string[] | null
          id?: string
          is_unlimited?: boolean | null
          price?: number | null
          provider?: string | null
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
          state: string | null
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
          state?: string | null
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
          state?: string | null
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
      corporate_email_domains: {
        Row: {
          created_at: string
          discount_percentage: number
          domain: string
          id: string
          is_active: boolean
          max_discount: number | null
          min_spend: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percentage: number
          domain: string
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_spend?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percentage?: number
          domain?: string
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_spend?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      coupon_usage_logs: {
        Row: {
          coupon_id: string
          discount_amount: number
          discounted_amount: number
          id: string
          order_id: string | null
          original_amount: number
          used_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_amount: number
          discounted_amount: number
          id?: string
          order_id?: string | null
          original_amount: number
          used_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_amount?: number
          discounted_amount?: number
          id?: string
          order_id?: string | null
          original_amount?: number
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_logs_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          allowed_bundle_ids: string[] | null
          allowed_regions: string[] | null
          applicability:
            | Database["public"]["Enums"]["coupon_applicability"]
            | null
          code: string
          corporate_domain: string | null
          coupon_type: Database["public"]["Enums"]["coupon_type"]
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          max_per_user: number | null
          max_total_usage: number | null
          min_spend: number | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          allowed_bundle_ids?: string[] | null
          allowed_regions?: string[] | null
          applicability?:
            | Database["public"]["Enums"]["coupon_applicability"]
            | null
          code: string
          corporate_domain?: string | null
          coupon_type: Database["public"]["Enums"]["coupon_type"]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          max_per_user?: number | null
          max_total_usage?: number | null
          min_spend?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          allowed_bundle_ids?: string[] | null
          allowed_regions?: string[] | null
          applicability?:
            | Database["public"]["Enums"]["coupon_applicability"]
            | null
          code?: string
          corporate_domain?: string | null
          coupon_type?: Database["public"]["Enums"]["coupon_type"]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          max_per_user?: number | null
          max_total_usage?: number | null
          min_spend?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: []
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
          category: string
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          is_active: boolean | null
          is_editable: boolean | null
          name: string
          params: Json | null
          priority: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          category: string
          conditions: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          is_editable?: boolean | null
          name: string
          params?: Json | null
          priority?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          category?: string
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          is_editable?: boolean | null
          name?: string
          params?: Json | null
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
      tenants: {
        Row: {
          created_at: string | null
          img_url: string | null
          name: string
          slug: string
          tenant_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          img_url?: string | null
          name: string
          slug: string
          tenant_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          img_url?: string | null
          name?: string
          slug?: string
          tenant_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      user_tenants: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          tenant_slug: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          tenant_slug: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          tenant_slug?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenants_tenant_slug_fkey"
            columns: ["tenant_slug"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["slug"]
          },
        ]
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
          most_covered_region: string
          most_covered_country: string
          avg_countries_per_bundle: number
          total_groups: number
          total_regions: number
          total_countries: number
          total_bundles: number
          price_range: Json
        }[]
      }
      get_bundles_by_countries: {
        Args: Record<PropertyKey, never>
        Returns: {
          groups: string[]
          country_code: string
          bundles: Json
          bundle_count: number
          min_price: number
          max_price: number
          avg_price: number
          has_unlimited: boolean
          common_region: string
        }[]
      }
      get_bundles_by_groups: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_unlimited: boolean
          avg_price: number
          min_price: number
          max_price: number
          group_name: string
          bundles: Json
          bundle_count: number
          countries_count: number
        }[]
      }
      get_bundles_by_groups_simple: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_price: number
          group_name: string
          bundle_count: number
          bundle_ids: string[]
          min_price: number
          max_price: number
          has_unlimited: boolean
        }[]
      }
      get_bundles_by_regions: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_unlimited: boolean
          region: string
          bundles: Json
          bundle_count: number
          min_price: number
          max_price: number
          avg_price: number
          countries: string[]
          country_count: number
        }[]
      }
      get_bundles_by_regions_v2: {
        Args: Record<PropertyKey, never>
        Returns: {
          country_count: number
          has_unlimited: boolean
          popular_groups: string[]
          region: string
          bundle_count: number
          min_price: number
          max_price: number
          avg_price: number
        }[]
      }
      get_bundles_for_country: {
        Args: { country_param: string }
        Returns: {
          max_price: number
          regions: string[]
          has_unlimited: boolean
          groups: string[]
          country_code: string
          bundles: Json
          bundle_count: number
          min_price: number
        }[]
      }
      get_bundles_for_country_simple: {
        Args: { country_param: string }
        Returns: Json
      }
      get_bundles_for_group: {
        Args: { group_param: string }
        Returns: {
          max_price: number
          has_unlimited: boolean
          regions: string[]
          group_name: string
          bundles: Json
          bundle_count: number
          min_price: number
          countries: string[]
        }[]
      }
      get_bundles_for_region: {
        Args: { region_param: string }
        Returns: {
          groups: string[]
          region: string
          bundles: Json
          bundle_count: number
          min_price: number
          max_price: number
          countries: string[]
          has_unlimited: boolean
        }[]
      }
      get_distinct_durations: {
        Args: Record<PropertyKey, never>
        Returns: {
          min_days: number
          value: string
          max_days: number
          label: string
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
      is_master_tenant_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_master_tenant_admin: {
        Args: { check_user_id: string }
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
          esim_go_name: string
          bundle_group: string
          description: string
          duration: number
          data_amount: number
          unlimited: boolean
          price_cents: number
          regions: Json
          currency: string
          countries: Json
          id: string
        }[]
      }
      validate_checkout_session_token: {
        Args: { session_token: string }
        Returns: {
          expires_at: string
          is_valid: boolean
          user_id: string
          session_id: string
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
      coupon_applicability: "global" | "region_specific" | "bundle_specific"
      coupon_type: "percentage" | "fixed_amount"
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { name: string; owner: string; metadata: Json; bucketid: string }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _name: string; _bucket_id: string }
        Returns: boolean
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_level: {
        Args: { name: string }
        Returns: number
      }
      get_prefix: {
        Args: { name: string }
        Returns: string
      }
      get_prefixes: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          delimiter_param: string
          next_key_token?: string
          next_upload_token?: string
          bucket_id: string
          prefix_param: string
          max_keys?: number
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
          bucket_id: string
          prefix_param: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          updated_at: string
          name: string
          id: string
          metadata: Json
          last_accessed_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
          bucketname: string
          prefix: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
      search_v1_optimised: {
        Args: {
          sortorder?: string
          sortcolumn?: string
          search?: string
          offsets?: number
          levels?: number
          limits?: number
          bucketname: string
          prefix: string
        }
        Returns: {
          metadata: Json
          last_accessed_at: string
          created_at: string
          updated_at: string
          id: string
          name: string
        }[]
      }
      search_v2: {
        Args: {
          prefix: string
          bucket_name: string
          limits?: number
          levels?: number
          start_after?: string
        }
        Returns: {
          updated_at: string
          key: string
          name: string
          id: string
          created_at: string
          metadata: Json
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
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
      coupon_applicability: ["global", "region_specific", "bundle_specific"],
      coupon_type: ["percentage", "fixed_amount"],
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
  storage: {
    Enums: {},
  },
} as const

