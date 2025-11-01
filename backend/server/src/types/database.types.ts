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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      catalog_bundle_countries: {
        Row: {
          bundle_id: number
          country_iso2: string
        }
        Insert: {
          bundle_id: number
          country_iso2: string
        }
        Update: {
          bundle_id?: number
          country_iso2?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_countries_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "catalog_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_countries_country_iso2_fkey"
            columns: ["country_iso2"]
            isOneToOne: false
            referencedRelation: "catalog_countries"
            referencedColumns: ["iso2"]
          },
        ]
      }
      catalog_bundle_country_errors: {
        Row: {
          bundle_id: number | null
          created_at: string | null
          external_id: string | null
          extra: Json | null
          id: number
          iso2: string | null
          provider: string | null
          reason: string
        }
        Insert: {
          bundle_id?: number | null
          created_at?: string | null
          external_id?: string | null
          extra?: Json | null
          id?: number
          iso2?: string | null
          provider?: string | null
          reason: string
        }
        Update: {
          bundle_id?: number | null
          created_at?: string | null
          external_id?: string | null
          extra?: Json | null
          id?: number
          iso2?: string | null
          provider?: string | null
          reason?: string
        }
        Relationships: []
      }
      catalog_bundles: {
        Row: {
          created_at: string | null
          currency: string | null
          data_amount_mb: number | null
          description: string | null
          external_id: string
          group_name: string | null
          id: number
          is_active: boolean | null
          name: string
          plan_type: string | null
          policy_id: string | null
          policy_name: string | null
          price_usd: number | null
          provider_id: number
          region: string | null
          speed: string[] | null
          unlimited: boolean | null
          updated_at: string | null
          validity_days: number | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          data_amount_mb?: number | null
          description?: string | null
          external_id: string
          group_name?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          plan_type?: string | null
          policy_id?: string | null
          policy_name?: string | null
          price_usd?: number | null
          provider_id: number
          region?: string | null
          speed?: string[] | null
          unlimited?: boolean | null
          updated_at?: string | null
          validity_days?: number | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          data_amount_mb?: number | null
          description?: string | null
          external_id?: string
          group_name?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          plan_type?: string | null
          policy_id?: string | null
          policy_name?: string | null
          price_usd?: number | null
          provider_id?: number
          region?: string | null
          speed?: string[] | null
          unlimited?: boolean | null
          updated_at?: string | null
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bundles_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "catalog_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_countries: {
        Row: {
          flag_emoji: string | null
          iso2: string
          iso3: string | null
          name: string
          name_hebrew: string | null
          region: string | null
        }
        Insert: {
          flag_emoji?: string | null
          iso2: string
          iso3?: string | null
          name: string
          name_hebrew?: string | null
          region?: string | null
        }
        Update: {
          flag_emoji?: string | null
          iso2?: string
          iso3?: string | null
          name?: string
          name_hebrew?: string | null
          region?: string | null
        }
        Relationships: []
      }
      catalog_providers: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
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
          user_id: string | null
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
      markups: {
        Row: {
          created_at: string
          duration_days: number
          id: string
          is_active: boolean
          markup_amount: number
          plan_type: string
          provider_id: number | null
        }
        Insert: {
          created_at?: string
          duration_days: number
          id?: string
          is_active?: boolean
          markup_amount: number
          plan_type: string
          provider_id?: number | null
        }
        Update: {
          created_at?: string
          duration_days?: number
          id?: string
          is_active?: boolean
          markup_amount?: number
          plan_type?: string
          provider_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "markups_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "catalog_providers"
            referencedColumns: ["id"]
          },
        ]
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
          is_enabled: boolean | null
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
          is_enabled?: boolean | null
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
          is_enabled?: boolean | null
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
    }
    Functions: {
      apply_coupon_to_checkout: {
        Args: { _coupon_code: string; _order_id: string; _user_id: string }
        Returns: Json
      }
      cleanup_expired_checkout_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_bundle_coverage_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_countries_per_bundle: number
          most_covered_country: string
          most_covered_region: string
          price_range: Json
          total_bundles: number
          total_countries: number
          total_groups: number
          total_regions: number
        }[]
      }
      get_bundles_by_countries: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_price: number
          bundle_count: number
          bundles: Json
          common_region: string
          country_code: string
          groups: string[]
          has_unlimited: boolean
          max_price: number
          min_price: number
        }[]
      }
      get_bundles_by_groups: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_price: number
          bundle_count: number
          countries_count: number
          group_name: string
          has_unlimited: boolean
          max_price: number
          min_price: number
        }[]
      }
      get_bundles_by_groups_simple: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_price: number
          bundle_count: number
          bundle_ids: string[]
          group_name: string
          has_unlimited: boolean
          max_price: number
          min_price: number
        }[]
      }
      get_bundles_by_regions: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_price: number
          bundle_count: number
          country_count: number
          has_unlimited: boolean
          max_price: number
          min_price: number
          region: string
        }[]
      }
      get_bundles_by_regions_v2: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_price: number
          bundle_count: number
          country_count: number
          has_unlimited: boolean
          max_price: number
          min_price: number
          popular_groups: string[]
          region: string
        }[]
      }
      get_bundles_for_country: {
        Args: { country_param: string }
        Returns: {
          bundle_count: number
          bundles: Json
          groups: string[]
          has_unlimited: boolean
          max_price: number
          min_price: number
          regions: string[]
        }[]
      }
      get_bundles_for_country_and_provider: {
        Args: { p_country_iso: string; p_provider_name: string }
        Returns: {
          id: number
          name: string
          plan_type: string
          price_usd: number
          provider_id: number
          validity_days: number
        }[]
      }
      get_bundles_for_country_simple: {
        Args: { country_param: string }
        Returns: Json
      }
      get_bundles_for_group: {
        Args: { group_param: string }
        Returns: {
          bundle_count: number
          bundles: Json
          countries_count: number
          has_unlimited: boolean
          max_price: number
          min_price: number
          regions: string[]
        }[]
      }
      get_bundles_for_region: {
        Args: { region_param: string }
        Returns: {
          bundle_count: number
          bundles: Json
          countries: string[]
          groups: string[]
          has_unlimited: boolean
          max_price: number
          min_price: number
          region: string
        }[]
      }
      get_distinct_bundle_countries: {
        Args: Record<PropertyKey, never>
        Returns: {
          country_iso2: string
        }[]
      }
      get_distinct_durations: {
        Args: Record<PropertyKey, never>
        Returns: {
          label: string
          max_days: number
          min_days: number
          value: string
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
          bundle_count: number
          country_count: number
          group_count: number
          price_stats: Json
          region: string
          unlimited_count: number
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
        Returns: {
          group_name: string
        }[]
      }
      get_unique_regions: {
        Args: Record<PropertyKey, never>
        Returns: {
          region: string
        }[]
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
          p_bundle_groups?: string[]
          p_countries?: string[]
          p_limit?: number
          p_max_duration?: number
          p_min_duration?: number
          p_offset?: number
          p_unlimited?: boolean
        }
        Returns: {
          bundle_group: string
          countries: Json
          currency: string
          data_amount: number
          description: string
          duration: number
          esim_go_name: string
          id: string
          price_cents: number
          regions: Json
          unlimited: boolean
        }[]
      }
      validate_checkout_session_token: {
        Args: { session_token: string }
        Returns: {
          expires_at: string
          is_valid: boolean
          session_id: string
          user_id: string
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
} as const
