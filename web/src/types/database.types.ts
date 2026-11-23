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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_type: string
          active: boolean
          created_at: string
          currency: string
          external_reference_masked: string | null
          id: number
          institution_id: number
          name: string
          profile_id: number
          updated_at: string
        }
        Insert: {
          account_type: string
          active?: boolean
          created_at?: string
          currency?: string
          external_reference_masked?: string | null
          id?: never
          institution_id: number
          name: string
          profile_id: number
          updated_at?: string
        }
        Update: {
          account_type?: string
          active?: boolean
          created_at?: string
          currency?: string
          external_reference_masked?: string | null
          id?: never
          institution_id?: number
          name?: string
          profile_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_type: string
          created_at: string
          details: Json
          entity_id: number | null
          entity_type: string
          id: number
          import_batch_id: number | null
          profile_id: number
        }
        Insert: {
          action: string
          actor_type: string
          created_at?: string
          details?: Json
          entity_id?: number | null
          entity_type: string
          id?: never
          import_batch_id?: number | null
          profile_id: number
        }
        Update: {
          action?: string
          actor_type?: string
          created_at?: string
          details?: Json
          entity_id?: number | null
          entity_type?: string
          id?: never
          import_batch_id?: number | null
          profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          id: number
          name: string
          parent_id: number | null
          profile_id: number
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: never
          name: string
          parent_id?: number | null
          profile_id: number
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: never
          name?: string
          parent_id?: number | null
          profile_id?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classification_history: {
        Row: {
          category_id: number | null
          confidence: number | null
          created_at: string
          id: number
          previous_category_id: number | null
          profile_id: number
          reason: string | null
          source: string
          transaction_id: number
        }
        Insert: {
          category_id?: number | null
          confidence?: number | null
          created_at?: string
          id?: never
          previous_category_id?: number | null
          profile_id: number
          reason?: string | null
          source: string
          transaction_id: number
        }
        Update: {
          category_id?: number | null
          confidence?: number | null
          created_at?: string
          id?: never
          previous_category_id?: number | null
          profile_id?: number
          reason?: string | null
          source?: string
          transaction_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "classification_history_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_history_previous_category_id_fkey"
            columns: ["previous_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_review_candidates"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "classification_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
      classification_rules: {
        Row: {
          active: boolean
          category_id: number
          created_at: string
          field_name: string
          id: number
          match_type: string
          pattern: string
          priority: number
          profile_id: number
        }
        Insert: {
          active?: boolean
          category_id: number
          created_at?: string
          field_name: string
          id?: never
          match_type: string
          pattern: string
          priority?: number
          profile_id: number
        }
        Update: {
          active?: boolean
          category_id?: number
          created_at?: string
          field_name?: string
          id?: never
          match_type?: string
          pattern?: string
          priority?: number
          profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "classification_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_rules_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      counterparties: {
        Row: {
          created_at: string
          id: number
          kind: string
          metadata: Json
          normalized_name: string
          profile_id: number
          tax_id_masked: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          kind?: string
          metadata?: Json
          normalized_name: string
          profile_id: number
          tax_id_masked?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          kind?: string
          metadata?: Json
          normalized_name?: string
          profile_id?: number
          tax_id_masked?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counterparties_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      counterparty_aliases: {
        Row: {
          alias: string
          counterparty_id: number
          created_at: string
          id: number
          profile_id: number
        }
        Insert: {
          alias: string
          counterparty_id: number
          created_at?: string
          id?: never
          profile_id: number
        }
        Update: {
          alias?: string
          counterparty_id?: number
          created_at?: string
          id?: never
          profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "counterparty_aliases_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counterparty_aliases_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_profiles: {
        Row: {
          auth_user_id: string | null
          base_currency: string
          created_at: string
          display_name: string
          id: number
          timezone: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          base_currency?: string
          created_at?: string
          display_name: string
          id?: never
          timezone?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          base_currency?: string
          created_at?: string
          display_name?: string
          id?: never
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          account_id: number
          amount: number
          authorized_at: string | null
          balance_after: number | null
          classification_status: string
          counterparty_id: number | null
          counterparty_raw: string | null
          created_at: string
          currency: string
          direction: string
          economic_effect: string
          id: number
          installment_plan_id: number | null
          is_own_transfer: boolean
          is_spending: boolean
          needs_review: boolean
          occurred_on: string
          operation_type_id: number
          posted_at: string | null
          profile_id: number
          raw_description: string
          raw_payload: Json
          reconciliation_status: string
          source_file_id: number | null
          source_record_key: string | null
          updated_at: string
        }
        Insert: {
          account_id: number
          amount: number
          authorized_at?: string | null
          balance_after?: number | null
          classification_status?: string
          counterparty_id?: number | null
          counterparty_raw?: string | null
          created_at?: string
          currency?: string
          direction: string
          economic_effect: string
          id?: never
          installment_plan_id?: number | null
          is_own_transfer?: boolean
          is_spending?: boolean
          needs_review?: boolean
          occurred_on: string
          operation_type_id: number
          posted_at?: string | null
          profile_id: number
          raw_description: string
          raw_payload?: Json
          reconciliation_status?: string
          source_file_id?: number | null
          source_record_key?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: number
          amount?: number
          authorized_at?: string | null
          balance_after?: number | null
          classification_status?: string
          counterparty_id?: number | null
          counterparty_raw?: string | null
          created_at?: string
          currency?: string
          direction?: string
          economic_effect?: string
          id?: never
          installment_plan_id?: number | null
          is_own_transfer?: boolean
          is_spending?: boolean
          needs_review?: boolean
          occurred_on?: string
          operation_type_id?: number
          posted_at?: string | null
          profile_id?: number
          raw_description?: string
          raw_payload?: Json
          reconciliation_status?: string
          source_file_id?: number | null
          source_record_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_installment_plan_id_fkey"
            columns: ["installment_plan_id"]
            isOneToOne: false
            referencedRelation: "installment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_operation_type_id_fkey"
            columns: ["operation_type_id"]
            isOneToOne: false
            referencedRelation: "operation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "source_files"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_document_items: {
        Row: {
          cfop: string | null
          description: string
          fiscal_document_id: number
          id: number
          line_number: number
          ncm: string | null
          product_code: string | null
          profile_id: number
          quantity: number | null
          raw_payload: Json
          total_amount: number | null
          unit_price: number | null
        }
        Insert: {
          cfop?: string | null
          description: string
          fiscal_document_id: number
          id?: never
          line_number: number
          ncm?: string | null
          product_code?: string | null
          profile_id: number
          quantity?: number | null
          raw_payload?: Json
          total_amount?: number | null
          unit_price?: number | null
        }
        Update: {
          cfop?: string | null
          description?: string
          fiscal_document_id?: number
          id?: never
          line_number?: number
          ncm?: string | null
          product_code?: string | null
          profile_id?: number
          quantity?: number | null
          raw_payload?: Json
          total_amount?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_document_items_fiscal_document_id_fkey"
            columns: ["fiscal_document_id"]
            isOneToOne: false
            referencedRelation: "fiscal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_document_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_documents: {
        Row: {
          access_key: string | null
          created_at: string
          currency: string
          document_type: string
          extraction_status: string
          id: number
          issued_at: string | null
          issuer_name: string | null
          issuer_tax_id_masked: string | null
          profile_id: number
          raw_extraction: Json
          source_file_id: number
          total_amount: number | null
        }
        Insert: {
          access_key?: string | null
          created_at?: string
          currency?: string
          document_type?: string
          extraction_status: string
          id?: never
          issued_at?: string | null
          issuer_name?: string | null
          issuer_tax_id_masked?: string | null
          profile_id: number
          raw_extraction?: Json
          source_file_id: number
          total_amount?: number | null
        }
        Update: {
          access_key?: string | null
          created_at?: string
          currency?: string
          document_type?: string
          extraction_status?: string
          id?: never
          issued_at?: string | null
          issuer_name?: string | null
          issuer_tax_id_masked?: string | null
          profile_id?: number
          raw_extraction?: Json
          source_file_id?: number
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_documents_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: true
            referencedRelation: "source_files"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          completed_at: string | null
          files_discovered: number
          files_imported: number
          id: number
          notes: Json
          profile_id: number
          requested_via: string
          source_root_provider_id: string | null
          started_at: string
          status: string
          transactions_imported: number
        }
        Insert: {
          completed_at?: string | null
          files_discovered?: number
          files_imported?: number
          id?: never
          notes?: Json
          profile_id: number
          requested_via?: string
          source_root_provider_id?: string | null
          started_at?: string
          status: string
          transactions_imported?: number
        }
        Update: {
          completed_at?: string | null
          files_discovered?: number
          files_imported?: number
          id?: never
          notes?: Json
          profile_id?: number
          requested_via?: string
          source_root_provider_id?: string | null
          started_at?: string
          status?: string
          transactions_imported?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_plans: {
        Row: {
          account_id: number
          created_at: string
          currency: string
          id: number
          installment_count: number
          merchant_name: string | null
          profile_id: number
          purchase_date: string | null
          raw_payload: Json
          status: string
          total_amount: number | null
        }
        Insert: {
          account_id: number
          created_at?: string
          currency?: string
          id?: never
          installment_count: number
          merchant_name?: string | null
          profile_id: number
          purchase_date?: string | null
          raw_payload?: Json
          status?: string
          total_amount?: number | null
        }
        Update: {
          account_id?: number
          created_at?: string
          currency?: string
          id?: never
          installment_count?: number
          merchant_name?: string | null
          profile_id?: number
          purchase_date?: string | null
          raw_payload?: Json
          status?: string
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          code: string
          country_code: string
          created_at: string
          id: number
          name: string
        }
        Insert: {
          code: string
          country_code?: string
          created_at?: string
          id?: never
          name: string
        }
        Update: {
          code?: string
          country_code?: string
          created_at?: string
          id?: never
          name?: string
        }
        Relationships: []
      }
      operation_types: {
        Row: {
          code: string
          created_at: string
          id: number
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: never
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: never
          name?: string
        }
        Relationships: []
      }
      pluggy_accounts: {
        Row: {
          account_subtype: string | null
          account_type: string
          connection_id: number
          currency_code: string
          external_account_id: string
          first_seen_at: string
          id: number
          label: string | null
          last_four: string | null
          last_seen_at: string
          local_account_id: number | null
          mapping_status: string
          profile_id: number
        }
        Insert: {
          account_subtype?: string | null
          account_type: string
          connection_id: number
          currency_code?: string
          external_account_id: string
          first_seen_at?: string
          id?: never
          label?: string | null
          last_four?: string | null
          last_seen_at?: string
          local_account_id?: number | null
          mapping_status?: string
          profile_id: number
        }
        Update: {
          account_subtype?: string | null
          account_type?: string
          connection_id?: number
          currency_code?: string
          external_account_id?: string
          first_seen_at?: string
          id?: never
          label?: string | null
          last_four?: string | null
          last_seen_at?: string
          local_account_id?: number | null
          mapping_status?: string
          profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "pluggy_accounts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "pluggy_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pluggy_accounts_local_account_id_fkey"
            columns: ["local_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pluggy_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pluggy_bills: {
        Row: {
          closing_date: string | null
          currency_code: string
          due_date: string | null
          external_account_id: string
          external_bill_id: string
          first_seen_at: string
          id: number
          last_seen_at: string
          profile_id: number
          raw_payload: Json
          total_amount: number | null
        }
        Insert: {
          closing_date?: string | null
          currency_code?: string
          due_date?: string | null
          external_account_id: string
          external_bill_id: string
          first_seen_at?: string
          id?: never
          last_seen_at?: string
          profile_id: number
          raw_payload?: Json
          total_amount?: number | null
        }
        Update: {
          closing_date?: string | null
          currency_code?: string
          due_date?: string | null
          external_account_id?: string
          external_bill_id?: string
          first_seen_at?: string
          id?: never
          last_seen_at?: string
          profile_id?: number
          raw_payload?: Json
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pluggy_bills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pluggy_category_mappings: {
        Row: {
          active: boolean
          approved: boolean
          category_id: number
          confidence: number
          id: number
          profile_id: number
          source_category: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          approved?: boolean
          category_id: number
          confidence?: number
          id?: never
          profile_id: number
          source_category: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          approved?: boolean
          category_id?: number
          confidence?: number
          id?: never
          profile_id?: number
          source_category?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pluggy_category_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pluggy_category_mappings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pluggy_connections: {
        Row: {
          connector_id: number | null
          created_at: string
          id: number
          institution_name: string | null
          item_id: string
          last_synced_at: string | null
          profile_id: number
          status: string
          updated_at: string
        }
        Insert: {
          connector_id?: number | null
          created_at?: string
          id?: never
          institution_name?: string | null
          item_id: string
          last_synced_at?: string | null
          profile_id: number
          status?: string
          updated_at?: string
        }
        Update: {
          connector_id?: number | null
          created_at?: string
          id?: never
          institution_name?: string | null
          item_id?: string
          last_synced_at?: string | null
          profile_id?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pluggy_connections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pluggy_reconciliation_reviews: {
        Row: {
          candidate_ledger_ids: number[]
          created_at: string
          details: Json
          id: number
          pluggy_ref_id: number
          profile_id: number
          reason: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          candidate_ledger_ids?: number[]
          created_at?: string
          details?: Json
          id?: never
          pluggy_ref_id: number
          profile_id: number
          reason: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          candidate_ledger_ids?: number[]
          created_at?: string
          details?: Json
          id?: never
          pluggy_ref_id?: number
          profile_id?: number
          reason?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pluggy_reconciliation_reviews_pluggy_ref_id_fkey"
            columns: ["pluggy_ref_id"]
            isOneToOne: true
            referencedRelation: "pluggy_reconciliation_preview"
            referencedColumns: ["pluggy_ref_id"]
          },
          {
            foreignKeyName: "pluggy_reconciliation_reviews_pluggy_ref_id_fkey"
            columns: ["pluggy_ref_id"]
            isOneToOne: true
            referencedRelation: "pluggy_transaction_refs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pluggy_reconciliation_reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pluggy_reconciliation_runs: {
        Row: {
          completed_at: string | null
          held_for_review: number
          id: number
          imported_new: number
          ledger_after: number | null
          ledger_before: number
          linked_existing: number
          notes: Json
          pending_count: number
          profile_id: number
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          held_for_review?: number
          id?: never
          imported_new?: number
          ledger_after?: number | null
          ledger_before: number
          linked_existing?: number
          notes?: Json
          pending_count?: number
          profile_id: number
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          held_for_review?: number
          id?: never
          imported_new?: number
          ledger_after?: number | null
          ledger_before?: number
          linked_existing?: number
          notes?: Json
          pending_count?: number
          profile_id?: number
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pluggy_reconciliation_runs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pluggy_sync_runs: {
        Row: {
          completed_at: string | null
          connection_id: number | null
          error_code: string | null
          fetched_count: number
          id: number
          imported_count: number
          matched_count: number
          metadata: Json
          profile_id: number
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          connection_id?: number | null
          error_code?: string | null
          fetched_count?: number
          id?: never
          imported_count?: number
          matched_count?: number
          metadata?: Json
          profile_id: number
          started_at?: string
          status: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: number | null
          error_code?: string | null
          fetched_count?: number
          id?: never
          imported_count?: number
          matched_count?: number
          metadata?: Json
          profile_id?: number
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pluggy_sync_runs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "pluggy_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pluggy_sync_runs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pluggy_transaction_refs: {
        Row: {
          amount: number | null
          bill_id: string | null
          deleted_at: string | null
          description: string | null
          external_account_id: string
          external_transaction_id: string
          external_updated_at: string | null
          first_seen_at: string
          id: number
          last_seen_at: string
          occurred_on: string | null
          profile_id: number
          raw_payload: Json
          reconciled_at: string | null
          reconciliation_confidence: number | null
          reconciliation_method: string | null
          status: string | null
          transaction_id: number | null
        }
        Insert: {
          amount?: number | null
          bill_id?: string | null
          deleted_at?: string | null
          description?: string | null
          external_account_id: string
          external_transaction_id: string
          external_updated_at?: string | null
          first_seen_at?: string
          id?: never
          last_seen_at?: string
          occurred_on?: string | null
          profile_id: number
          raw_payload?: Json
          reconciled_at?: string | null
          reconciliation_confidence?: number | null
          reconciliation_method?: string | null
          status?: string | null
          transaction_id?: number | null
        }
        Update: {
          amount?: number | null
          bill_id?: string | null
          deleted_at?: string | null
          description?: string | null
          external_account_id?: string
          external_transaction_id?: string
          external_updated_at?: string | null
          first_seen_at?: string
          id?: never
          last_seen_at?: string
          occurred_on?: string | null
          profile_id?: number
          raw_payload?: Json
          reconciled_at?: string | null
          reconciliation_confidence?: number | null
          reconciliation_method?: string | null
          status?: string | null
          transaction_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pluggy_transaction_refs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pluggy_transaction_refs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pluggy_transaction_refs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_review_candidates"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "pluggy_transaction_refs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
      recurring_classification_rules: {
        Row: {
          account_id: number | null
          active: boolean
          created_at: string
          expense_type: string
          id: number
          label: string
          match_text: string
          profile_id: number
        }
        Insert: {
          account_id?: number | null
          active?: boolean
          created_at?: string
          expense_type: string
          id?: never
          label: string
          match_text: string
          profile_id: number
        }
        Update: {
          account_id?: number | null
          active?: boolean
          created_at?: string
          expense_type?: string
          id?: never
          label?: string
          match_text?: string
          profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurring_classification_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_classification_rules_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_transaction_overrides: {
        Row: {
          created_at: string
          expense_type: string | null
          label: string | null
          note: string | null
          profile_id: number
          status: string
          transaction_id: number
        }
        Insert: {
          created_at?: string
          expense_type?: string | null
          label?: string | null
          note?: string | null
          profile_id: number
          status: string
          transaction_id: number
        }
        Update: {
          created_at?: string
          expense_type?: string | null
          label?: string | null
          note?: string | null
          profile_id?: number
          status?: string
          transaction_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transaction_overrides_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transaction_overrides_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transaction_overrides_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "v_recurring_review_candidates"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "recurring_transaction_overrides_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "v_recurring_transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
      review_queue: {
        Row: {
          created_at: string
          details: Json
          fiscal_document_id: number | null
          id: number
          message: string
          priority: string
          profile_id: number
          resolved_at: string | null
          review_type: string
          source_file_id: number | null
          status: string
          transaction_id: number | null
        }
        Insert: {
          created_at?: string
          details?: Json
          fiscal_document_id?: number | null
          id?: never
          message: string
          priority?: string
          profile_id: number
          resolved_at?: string | null
          review_type: string
          source_file_id?: number | null
          status?: string
          transaction_id?: number | null
        }
        Update: {
          created_at?: string
          details?: Json
          fiscal_document_id?: number | null
          id?: never
          message?: string
          priority?: string
          profile_id?: number
          resolved_at?: string | null
          review_type?: string
          source_file_id?: number | null
          status?: string
          transaction_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_fiscal_document_id_fkey"
            columns: ["fiscal_document_id"]
            isOneToOne: false
            referencedRelation: "fiscal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "source_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_review_candidates"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "review_queue_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
      source_files: {
        Row: {
          content_fingerprint: string | null
          created_at: string
          extracted_text: string | null
          extraction_status: string
          file_name: string
          id: number
          import_batch_id: number | null
          mime_type: string | null
          parent_provider_id: string | null
          profile_id: number
          provider: string
          provider_file_id: string
          provider_modified_at: string | null
          provider_url: string
          raw_metadata: Json
          size_bytes: number | null
          source_kind: string
          updated_at: string
        }
        Insert: {
          content_fingerprint?: string | null
          created_at?: string
          extracted_text?: string | null
          extraction_status: string
          file_name: string
          id?: never
          import_batch_id?: number | null
          mime_type?: string | null
          parent_provider_id?: string | null
          profile_id: number
          provider?: string
          provider_file_id: string
          provider_modified_at?: string | null
          provider_url: string
          raw_metadata?: Json
          size_bytes?: number | null
          source_kind: string
          updated_at?: string
        }
        Update: {
          content_fingerprint?: string | null
          created_at?: string
          extracted_text?: string | null
          extraction_status?: string
          file_name?: string
          id?: never
          import_batch_id?: number | null
          mime_type?: string | null
          parent_provider_id?: string | null
          profile_id?: number
          provider?: string
          provider_file_id?: string
          provider_modified_at?: string | null
          provider_url?: string
          raw_metadata?: Json
          size_bytes?: number | null
          source_kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_files_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_files_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_allocations: {
        Row: {
          amount: number
          category_id: number
          classification_source: string
          confidence: number | null
          created_at: string
          fiscal_document_item_id: number | null
          id: number
          note: string | null
          profile_id: number
          transaction_id: number
        }
        Insert: {
          amount: number
          category_id: number
          classification_source: string
          confidence?: number | null
          created_at?: string
          fiscal_document_item_id?: number | null
          id?: never
          note?: string | null
          profile_id: number
          transaction_id: number
        }
        Update: {
          amount?: number
          category_id?: number
          classification_source?: string
          confidence?: number | null
          created_at?: string
          fiscal_document_item_id?: number | null
          id?: never
          note?: string | null
          profile_id?: number
          transaction_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_allocations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_allocations_fiscal_document_item_id_fkey"
            columns: ["fiscal_document_item_id"]
            isOneToOne: false
            referencedRelation: "fiscal_document_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_allocations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_allocations_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_allocations_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_review_candidates"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "transaction_allocations_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
      transaction_fiscal_documents: {
        Row: {
          allocated_amount: number | null
          confidence: number | null
          created_at: string
          fiscal_document_id: number
          id: number
          match_status: string
          profile_id: number
          transaction_id: number
        }
        Insert: {
          allocated_amount?: number | null
          confidence?: number | null
          created_at?: string
          fiscal_document_id: number
          id?: never
          match_status: string
          profile_id: number
          transaction_id: number
        }
        Update: {
          allocated_amount?: number | null
          confidence?: number | null
          created_at?: string
          fiscal_document_id?: number
          id?: never
          match_status?: string
          profile_id?: number
          transaction_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_fiscal_documents_fiscal_document_id_fkey"
            columns: ["fiscal_document_id"]
            isOneToOne: false
            referencedRelation: "fiscal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_fiscal_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_fiscal_documents_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_fiscal_documents_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_review_candidates"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "transaction_fiscal_documents_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
      transaction_links: {
        Row: {
          confidence: number | null
          created_at: string
          from_transaction_id: number
          id: number
          link_type: string
          profile_id: number
          to_transaction_id: number
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          from_transaction_id: number
          id?: never
          link_type: string
          profile_id: number
          to_transaction_id: number
        }
        Update: {
          confidence?: number | null
          created_at?: string
          from_transaction_id?: number
          id?: never
          link_type?: string
          profile_id?: number
          to_transaction_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_links_from_transaction_id_fkey"
            columns: ["from_transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_links_from_transaction_id_fkey"
            columns: ["from_transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_review_candidates"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "transaction_links_from_transaction_id_fkey"
            columns: ["from_transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_transactions"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "transaction_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_links_to_transaction_id_fkey"
            columns: ["to_transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_links_to_transaction_id_fkey"
            columns: ["to_transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_review_candidates"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "transaction_links_to_transaction_id_fkey"
            columns: ["to_transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
    }
    Views: {
      pluggy_reconciliation_preview: {
        Row: {
          account_type: string | null
          amount: number | null
          candidate_ledger_id: number | null
          exact_count: number | null
          external_account_id: string | null
          institution_name: string | null
          local_account_id: number | null
          mapping_status: string | null
          match_status: string | null
          near_count: number | null
          occurred_on: string | null
          pluggy_ref_id: number | null
          pluggy_status: string | null
          profile_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pluggy_accounts_local_account_id_fkey"
            columns: ["local_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pluggy_transaction_refs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_cashflow_monthly: {
        Row: {
          inflows: number | null
          month: string | null
          net_cashflow: number | null
          outflows: number | null
          profile_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_open_reviews: {
        Row: {
          created_at: string | null
          details: Json | null
          fiscal_document_id: number | null
          id: number | null
          message: string | null
          priority: string | null
          profile_id: number | null
          resolved_at: string | null
          review_type: string | null
          source_file_id: number | null
          status: string | null
          transaction_id: number | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          fiscal_document_id?: number | null
          id?: number | null
          message?: string | null
          priority?: string | null
          profile_id?: number | null
          resolved_at?: string | null
          review_type?: string | null
          source_file_id?: number | null
          status?: string | null
          transaction_id?: number | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          fiscal_document_id?: number | null
          id?: number | null
          message?: string | null
          priority?: string | null
          profile_id?: number | null
          resolved_at?: string | null
          review_type?: string | null
          source_file_id?: number | null
          status?: string | null
          transaction_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_fiscal_document_id_fkey"
            columns: ["fiscal_document_id"]
            isOneToOne: false
            referencedRelation: "fiscal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "source_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_review_candidates"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "review_queue_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recurring_transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
      v_recurring_review_candidates: {
        Row: {
          amount: number | null
          currency: string | null
          occurred_on: string | null
          profile_id: number | null
          raw_description: string | null
          review_reason: string | null
          transaction_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_recurring_spending_monthly: {
        Row: {
          amount: number | null
          charges: number | null
          currency: string | null
          expense_type: string | null
          month: string | null
          profile_id: number | null
          recurring_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_recurring_transactions: {
        Row: {
          account_id: number | null
          account_name: string | null
          amount: number | null
          classification_source: string | null
          currency: string | null
          evidence_type: string | null
          expense_type: string | null
          occurred_on: string | null
          profile_id: number | null
          raw_description: string | null
          recurring_name: string | null
          transaction_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_spending_monthly: {
        Row: {
          amount: number | null
          category: string | null
          month: string | null
          profile_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "financial_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
