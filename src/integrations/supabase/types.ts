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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      apollo_contacts: {
        Row: {
          account_owner: string | null
          activity: string | null
          annual_revenue: number | null
          apollo_account_id: string | null
          apollo_contact_id: string | null
          categorie_fonction: string | null
          city: string | null
          company: string | null
          company_address: string | null
          company_city: string | null
          company_country: string | null
          company_linkedin_url: string | null
          company_name_for_emails: string | null
          company_phone: string | null
          company_state: string | null
          contact_owner: string | null
          corporate_phone: string | null
          country: string | null
          created_at: string | null
          demoed: boolean | null
          departments: string | null
          email: string
          email_bounced: boolean | null
          email_confidence: string | null
          email_open: boolean | null
          email_sent: boolean | null
          email_status: string | null
          facebook_url: string | null
          first_name: string | null
          home_phone: string | null
          id: string
          industry: string | null
          keywords: string | null
          last_contacted: string | null
          last_name: string | null
          last_raised_at: string | null
          last_sync_at: string | null
          latest_funding: number | null
          latest_funding_amount: number | null
          lifecycle_stage: string | null
          lists: string | null
          mobile_phone: string | null
          nb_employees: number | null
          num_employees: number | null
          number_of_retail_locations: number | null
          other_phone: string | null
          person_linkedin_url: string | null
          primary_email_catch_all_status: string | null
          primary_email_last_verified_at: string | null
          primary_email_source: string | null
          region: string | null
          replied: boolean | null
          secondary_email: string | null
          secondary_email_source: string | null
          secondary_email_status: string | null
          secteur_activite: string | null
          seniority: string | null
          stage: string | null
          state: string | null
          statut: string | null
          subsidiary_of: string | null
          technologies: string | null
          tertiary_email: string | null
          tertiary_email_source: string | null
          tertiary_email_status: string | null
          title: string | null
          total_funding: number | null
          twitter_url: string | null
          updated_at: string | null
          website: string | null
          work_direct_phone: string | null
        }
        Insert: {
          account_owner?: string | null
          activity?: string | null
          annual_revenue?: number | null
          apollo_account_id?: string | null
          apollo_contact_id?: string | null
          categorie_fonction?: string | null
          city?: string | null
          company?: string | null
          company_address?: string | null
          company_city?: string | null
          company_country?: string | null
          company_linkedin_url?: string | null
          company_name_for_emails?: string | null
          company_phone?: string | null
          company_state?: string | null
          contact_owner?: string | null
          corporate_phone?: string | null
          country?: string | null
          created_at?: string | null
          demoed?: boolean | null
          departments?: string | null
          email: string
          email_bounced?: boolean | null
          email_confidence?: string | null
          email_open?: boolean | null
          email_sent?: boolean | null
          email_status?: string | null
          facebook_url?: string | null
          first_name?: string | null
          home_phone?: string | null
          id?: string
          industry?: string | null
          keywords?: string | null
          last_contacted?: string | null
          last_name?: string | null
          last_raised_at?: string | null
          last_sync_at?: string | null
          latest_funding?: number | null
          latest_funding_amount?: number | null
          lifecycle_stage?: string | null
          lists?: string | null
          mobile_phone?: string | null
          nb_employees?: number | null
          num_employees?: number | null
          number_of_retail_locations?: number | null
          other_phone?: string | null
          person_linkedin_url?: string | null
          primary_email_catch_all_status?: string | null
          primary_email_last_verified_at?: string | null
          primary_email_source?: string | null
          region?: string | null
          replied?: boolean | null
          secondary_email?: string | null
          secondary_email_source?: string | null
          secondary_email_status?: string | null
          secteur_activite?: string | null
          seniority?: string | null
          stage?: string | null
          state?: string | null
          statut?: string | null
          subsidiary_of?: string | null
          technologies?: string | null
          tertiary_email?: string | null
          tertiary_email_source?: string | null
          tertiary_email_status?: string | null
          title?: string | null
          total_funding?: number | null
          twitter_url?: string | null
          updated_at?: string | null
          website?: string | null
          work_direct_phone?: string | null
        }
        Update: {
          account_owner?: string | null
          activity?: string | null
          annual_revenue?: number | null
          apollo_account_id?: string | null
          apollo_contact_id?: string | null
          categorie_fonction?: string | null
          city?: string | null
          company?: string | null
          company_address?: string | null
          company_city?: string | null
          company_country?: string | null
          company_linkedin_url?: string | null
          company_name_for_emails?: string | null
          company_phone?: string | null
          company_state?: string | null
          contact_owner?: string | null
          corporate_phone?: string | null
          country?: string | null
          created_at?: string | null
          demoed?: boolean | null
          departments?: string | null
          email?: string
          email_bounced?: boolean | null
          email_confidence?: string | null
          email_open?: boolean | null
          email_sent?: boolean | null
          email_status?: string | null
          facebook_url?: string | null
          first_name?: string | null
          home_phone?: string | null
          id?: string
          industry?: string | null
          keywords?: string | null
          last_contacted?: string | null
          last_name?: string | null
          last_raised_at?: string | null
          last_sync_at?: string | null
          latest_funding?: number | null
          latest_funding_amount?: number | null
          lifecycle_stage?: string | null
          lists?: string | null
          mobile_phone?: string | null
          nb_employees?: number | null
          num_employees?: number | null
          number_of_retail_locations?: number | null
          other_phone?: string | null
          person_linkedin_url?: string | null
          primary_email_catch_all_status?: string | null
          primary_email_last_verified_at?: string | null
          primary_email_source?: string | null
          region?: string | null
          replied?: boolean | null
          secondary_email?: string | null
          secondary_email_source?: string | null
          secondary_email_status?: string | null
          secteur_activite?: string | null
          seniority?: string | null
          stage?: string | null
          state?: string | null
          statut?: string | null
          subsidiary_of?: string | null
          technologies?: string | null
          tertiary_email?: string | null
          tertiary_email_source?: string | null
          tertiary_email_status?: string | null
          title?: string | null
          total_funding?: number | null
          twitter_url?: string | null
          updated_at?: string | null
          website?: string | null
          work_direct_phone?: string | null
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          _email_unique: boolean | null
          _processed_at: string | null
          _source_file: string | null
          abonnement_zoho_ma: string | null
          address: string | null
          aicademia_cold_action_date: string | null
          aicademia_cold_note: string | null
          aicademia_cold_relance2: string | null
          aicademia_cold_relance3: string | null
          aicademia_cold_status: string | null
          aicademia_high_status: string | null
          aicademia_low_status: string | null
          aicademia_score: string | null
          apollo_aicademia_sequence: string | null
          apollo_arlynk_sequence: string | null
          apollo_click_number_aicademia_sequence: string | null
          apollo_click_number_arlynk_sequence: string | null
          apollo_description: string | null
          apollo_email_verification: string | null
          apollo_last_contact: string | null
          apollo_list: string | null
          apollo_open_number_aicademia_sequence: string | null
          apollo_open_number_arlynk_sequence: string | null
          apollo_owner: string | null
          apollo_reply_number_aicademia_sequence: string | null
          apollo_reply_number_arlynk_sequence: string | null
          apollo_status: string | null
          arlynk_cold_action_date: string | null
          arlynk_cold_note: string | null
          arlynk_cold_relance2: string | null
          arlynk_cold_relance3: string | null
          arlynk_cold_status: string | null
          arlynk_score: string | null
          arlynk_status: string | null
          brevo_click_number: string | null
          brevo_last_mail_campain: string | null
          brevo_last_sms_campain: string | null
          brevo_open_number: string | null
          brevo_reply_number: string | null
          brevo_tag: string | null
          brevo_unsuscribe: string | null
          city: string | null
          company: string | null
          company_website: string | null
          contact_active: string | null
          country: string | null
          created_at: string | null
          data_section: string | null
          departement: string | null
          email: string
          email_domain: string | null
          email_id: string | null
          firstname: string | null
          full_name: string | null
          hubspot_anis_comment: string | null
          hubspot_buy_role: string | null
          hubspot_contact_owner: string | null
          hubspot_created_at: string | null
          hubspot_last_activity: string | null
          hubspot_lead_status: string | null
          hubspot_life_cycle_phase: string | null
          hubspot_modified_at: string | null
          hubspot_notes: string | null
          id: number
          industrie: string | null
          linkedin_company_url: string | null
          linkedin_function: string | null
          linkedin_url: string | null
          mobile: string | null
          mobile_2: string | null
          name: string | null
          nb_employees: string | null
          systemeio_list: string | null
          tel: string | null
          tel_pro: string | null
          total_score: number | null
          updated_at: string | null
          zoho_account_size: string | null
          zoho_arlynk_mark: string | null
          zoho_chat: string | null
          zoho_created_at: string | null
          zoho_crm_notation_score: string | null
          zoho_description: string | null
          zoho_industrie_tag: string | null
          zoho_last_activity: string | null
          zoho_last_chat_interaction: string | null
          zoho_last_ma_interaction: string | null
          zoho_ma_score: string | null
          zoho_product_interest: string | null
          zoho_report_to: string | null
          zoho_status: string | null
          zoho_status_2: string | null
          zoho_subscription: string | null
          zoho_tag: string | null
          zoho_updated_at: string | null
          zoho_updated_by: string | null
        }
        Insert: {
          _email_unique?: boolean | null
          _processed_at?: string | null
          _source_file?: string | null
          abonnement_zoho_ma?: string | null
          address?: string | null
          aicademia_cold_action_date?: string | null
          aicademia_cold_note?: string | null
          aicademia_cold_relance2?: string | null
          aicademia_cold_relance3?: string | null
          aicademia_cold_status?: string | null
          aicademia_high_status?: string | null
          aicademia_low_status?: string | null
          aicademia_score?: string | null
          apollo_aicademia_sequence?: string | null
          apollo_arlynk_sequence?: string | null
          apollo_click_number_aicademia_sequence?: string | null
          apollo_click_number_arlynk_sequence?: string | null
          apollo_description?: string | null
          apollo_email_verification?: string | null
          apollo_last_contact?: string | null
          apollo_list?: string | null
          apollo_open_number_aicademia_sequence?: string | null
          apollo_open_number_arlynk_sequence?: string | null
          apollo_owner?: string | null
          apollo_reply_number_aicademia_sequence?: string | null
          apollo_reply_number_arlynk_sequence?: string | null
          apollo_status?: string | null
          arlynk_cold_action_date?: string | null
          arlynk_cold_note?: string | null
          arlynk_cold_relance2?: string | null
          arlynk_cold_relance3?: string | null
          arlynk_cold_status?: string | null
          arlynk_score?: string | null
          arlynk_status?: string | null
          brevo_click_number?: string | null
          brevo_last_mail_campain?: string | null
          brevo_last_sms_campain?: string | null
          brevo_open_number?: string | null
          brevo_reply_number?: string | null
          brevo_tag?: string | null
          brevo_unsuscribe?: string | null
          city?: string | null
          company?: string | null
          company_website?: string | null
          contact_active?: string | null
          country?: string | null
          created_at?: string | null
          data_section?: string | null
          departement?: string | null
          email: string
          email_domain?: string | null
          email_id?: string | null
          firstname?: string | null
          full_name?: string | null
          hubspot_anis_comment?: string | null
          hubspot_buy_role?: string | null
          hubspot_contact_owner?: string | null
          hubspot_created_at?: string | null
          hubspot_last_activity?: string | null
          hubspot_lead_status?: string | null
          hubspot_life_cycle_phase?: string | null
          hubspot_modified_at?: string | null
          hubspot_notes?: string | null
          id?: number
          industrie?: string | null
          linkedin_company_url?: string | null
          linkedin_function?: string | null
          linkedin_url?: string | null
          mobile?: string | null
          mobile_2?: string | null
          name?: string | null
          nb_employees?: string | null
          systemeio_list?: string | null
          tel?: string | null
          tel_pro?: string | null
          total_score?: number | null
          updated_at?: string | null
          zoho_account_size?: string | null
          zoho_arlynk_mark?: string | null
          zoho_chat?: string | null
          zoho_created_at?: string | null
          zoho_crm_notation_score?: string | null
          zoho_description?: string | null
          zoho_industrie_tag?: string | null
          zoho_last_activity?: string | null
          zoho_last_chat_interaction?: string | null
          zoho_last_ma_interaction?: string | null
          zoho_ma_score?: string | null
          zoho_product_interest?: string | null
          zoho_report_to?: string | null
          zoho_status?: string | null
          zoho_status_2?: string | null
          zoho_subscription?: string | null
          zoho_tag?: string | null
          zoho_updated_at?: string | null
          zoho_updated_by?: string | null
        }
        Update: {
          _email_unique?: boolean | null
          _processed_at?: string | null
          _source_file?: string | null
          abonnement_zoho_ma?: string | null
          address?: string | null
          aicademia_cold_action_date?: string | null
          aicademia_cold_note?: string | null
          aicademia_cold_relance2?: string | null
          aicademia_cold_relance3?: string | null
          aicademia_cold_status?: string | null
          aicademia_high_status?: string | null
          aicademia_low_status?: string | null
          aicademia_score?: string | null
          apollo_aicademia_sequence?: string | null
          apollo_arlynk_sequence?: string | null
          apollo_click_number_aicademia_sequence?: string | null
          apollo_click_number_arlynk_sequence?: string | null
          apollo_description?: string | null
          apollo_email_verification?: string | null
          apollo_last_contact?: string | null
          apollo_list?: string | null
          apollo_open_number_aicademia_sequence?: string | null
          apollo_open_number_arlynk_sequence?: string | null
          apollo_owner?: string | null
          apollo_reply_number_aicademia_sequence?: string | null
          apollo_reply_number_arlynk_sequence?: string | null
          apollo_status?: string | null
          arlynk_cold_action_date?: string | null
          arlynk_cold_note?: string | null
          arlynk_cold_relance2?: string | null
          arlynk_cold_relance3?: string | null
          arlynk_cold_status?: string | null
          arlynk_score?: string | null
          arlynk_status?: string | null
          brevo_click_number?: string | null
          brevo_last_mail_campain?: string | null
          brevo_last_sms_campain?: string | null
          brevo_open_number?: string | null
          brevo_reply_number?: string | null
          brevo_tag?: string | null
          brevo_unsuscribe?: string | null
          city?: string | null
          company?: string | null
          company_website?: string | null
          contact_active?: string | null
          country?: string | null
          created_at?: string | null
          data_section?: string | null
          departement?: string | null
          email?: string
          email_domain?: string | null
          email_id?: string | null
          firstname?: string | null
          full_name?: string | null
          hubspot_anis_comment?: string | null
          hubspot_buy_role?: string | null
          hubspot_contact_owner?: string | null
          hubspot_created_at?: string | null
          hubspot_last_activity?: string | null
          hubspot_lead_status?: string | null
          hubspot_life_cycle_phase?: string | null
          hubspot_modified_at?: string | null
          hubspot_notes?: string | null
          id?: number
          industrie?: string | null
          linkedin_company_url?: string | null
          linkedin_function?: string | null
          linkedin_url?: string | null
          mobile?: string | null
          mobile_2?: string | null
          name?: string | null
          nb_employees?: string | null
          systemeio_list?: string | null
          tel?: string | null
          tel_pro?: string | null
          total_score?: number | null
          updated_at?: string | null
          zoho_account_size?: string | null
          zoho_arlynk_mark?: string | null
          zoho_chat?: string | null
          zoho_created_at?: string | null
          zoho_crm_notation_score?: string | null
          zoho_description?: string | null
          zoho_industrie_tag?: string | null
          zoho_last_activity?: string | null
          zoho_last_chat_interaction?: string | null
          zoho_last_ma_interaction?: string | null
          zoho_ma_score?: string | null
          zoho_product_interest?: string | null
          zoho_report_to?: string | null
          zoho_status?: string | null
          zoho_status_2?: string | null
          zoho_subscription?: string | null
          zoho_tag?: string | null
          zoho_updated_at?: string | null
          zoho_updated_by?: string | null
        }
        Relationships: []
      }
      directus_collections: {
        Row: {
          accountability: string | null
          archive_app_filter: boolean
          archive_field: string | null
          archive_value: string | null
          collapse: string
          collection: string
          color: string | null
          display_template: string | null
          group: string | null
          hidden: boolean
          icon: string | null
          item_duplication_fields: Json | null
          note: string | null
          preview_url: string | null
          singleton: boolean
          sort: number | null
          sort_field: string | null
          translations: Json | null
          unarchive_value: string | null
          versioning: boolean
        }
        Insert: {
          accountability?: string | null
          archive_app_filter?: boolean
          archive_field?: string | null
          archive_value?: string | null
          collapse?: string
          collection: string
          color?: string | null
          display_template?: string | null
          group?: string | null
          hidden?: boolean
          icon?: string | null
          item_duplication_fields?: Json | null
          note?: string | null
          preview_url?: string | null
          singleton?: boolean
          sort?: number | null
          sort_field?: string | null
          translations?: Json | null
          unarchive_value?: string | null
          versioning?: boolean
        }
        Update: {
          accountability?: string | null
          archive_app_filter?: boolean
          archive_field?: string | null
          archive_value?: string | null
          collapse?: string
          collection?: string
          color?: string | null
          display_template?: string | null
          group?: string | null
          hidden?: boolean
          icon?: string | null
          item_duplication_fields?: Json | null
          note?: string | null
          preview_url?: string | null
          singleton?: boolean
          sort?: number | null
          sort_field?: string | null
          translations?: Json | null
          unarchive_value?: string | null
          versioning?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "directus_collections_group_foreign"
            columns: ["group"]
            isOneToOne: false
            referencedRelation: "directus_collections"
            referencedColumns: ["collection"]
          },
        ]
      }
      directus_comments: {
        Row: {
          collection: string
          comment: string
          date_created: string | null
          date_updated: string | null
          id: string
          item: string
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          collection: string
          comment: string
          date_created?: string | null
          date_updated?: string | null
          id: string
          item: string
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          collection?: string
          comment?: string
          date_created?: string | null
          date_updated?: string | null
          id?: string
          item?: string
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_comments_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_comments_user_updated_foreign"
            columns: ["user_updated"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_dashboards: {
        Row: {
          color: string | null
          date_created: string | null
          icon: string
          id: string
          name: string
          note: string | null
          user_created: string | null
        }
        Insert: {
          color?: string | null
          date_created?: string | null
          icon?: string
          id: string
          name: string
          note?: string | null
          user_created?: string | null
        }
        Update: {
          color?: string | null
          date_created?: string | null
          icon?: string
          id?: string
          name?: string
          note?: string | null
          user_created?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_dashboards_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_extensions: {
        Row: {
          bundle: string | null
          enabled: boolean
          folder: string
          id: string
          source: string
        }
        Insert: {
          bundle?: string | null
          enabled?: boolean
          folder: string
          id: string
          source: string
        }
        Update: {
          bundle?: string | null
          enabled?: boolean
          folder?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      directus_fields: {
        Row: {
          collection: string
          conditions: Json | null
          display: string | null
          display_options: Json | null
          field: string
          group: string | null
          hidden: boolean
          id: number
          interface: string | null
          note: string | null
          options: Json | null
          readonly: boolean
          required: boolean | null
          sort: number | null
          special: string | null
          translations: Json | null
          validation: Json | null
          validation_message: string | null
          width: string | null
        }
        Insert: {
          collection: string
          conditions?: Json | null
          display?: string | null
          display_options?: Json | null
          field: string
          group?: string | null
          hidden?: boolean
          id?: number
          interface?: string | null
          note?: string | null
          options?: Json | null
          readonly?: boolean
          required?: boolean | null
          sort?: number | null
          special?: string | null
          translations?: Json | null
          validation?: Json | null
          validation_message?: string | null
          width?: string | null
        }
        Update: {
          collection?: string
          conditions?: Json | null
          display?: string | null
          display_options?: Json | null
          field?: string
          group?: string | null
          hidden?: boolean
          id?: number
          interface?: string | null
          note?: string | null
          options?: Json | null
          readonly?: boolean
          required?: boolean | null
          sort?: number | null
          special?: string | null
          translations?: Json | null
          validation?: Json | null
          validation_message?: string | null
          width?: string | null
        }
        Relationships: []
      }
      directus_files: {
        Row: {
          charset: string | null
          created_on: string
          description: string | null
          duration: number | null
          embed: string | null
          filename_disk: string | null
          filename_download: string
          filesize: number | null
          focal_point_x: number | null
          focal_point_y: number | null
          folder: string | null
          height: number | null
          id: string
          location: string | null
          metadata: Json | null
          modified_by: string | null
          modified_on: string
          storage: string
          tags: string | null
          title: string | null
          tus_data: Json | null
          tus_id: string | null
          type: string | null
          uploaded_by: string | null
          uploaded_on: string | null
          width: number | null
        }
        Insert: {
          charset?: string | null
          created_on?: string
          description?: string | null
          duration?: number | null
          embed?: string | null
          filename_disk?: string | null
          filename_download: string
          filesize?: number | null
          focal_point_x?: number | null
          focal_point_y?: number | null
          folder?: string | null
          height?: number | null
          id: string
          location?: string | null
          metadata?: Json | null
          modified_by?: string | null
          modified_on?: string
          storage: string
          tags?: string | null
          title?: string | null
          tus_data?: Json | null
          tus_id?: string | null
          type?: string | null
          uploaded_by?: string | null
          uploaded_on?: string | null
          width?: number | null
        }
        Update: {
          charset?: string | null
          created_on?: string
          description?: string | null
          duration?: number | null
          embed?: string | null
          filename_disk?: string | null
          filename_download?: string
          filesize?: number | null
          focal_point_x?: number | null
          focal_point_y?: number | null
          folder?: string | null
          height?: number | null
          id?: string
          location?: string | null
          metadata?: Json | null
          modified_by?: string | null
          modified_on?: string
          storage?: string
          tags?: string | null
          title?: string | null
          tus_data?: Json | null
          tus_id?: string | null
          type?: string | null
          uploaded_by?: string | null
          uploaded_on?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_files_folder_foreign"
            columns: ["folder"]
            isOneToOne: false
            referencedRelation: "directus_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_files_modified_by_foreign"
            columns: ["modified_by"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_files_uploaded_by_foreign"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_flows: {
        Row: {
          accountability: string | null
          color: string | null
          date_created: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          operation: string | null
          options: Json | null
          status: string
          trigger: string | null
          user_created: string | null
        }
        Insert: {
          accountability?: string | null
          color?: string | null
          date_created?: string | null
          description?: string | null
          icon?: string | null
          id: string
          name: string
          operation?: string | null
          options?: Json | null
          status?: string
          trigger?: string | null
          user_created?: string | null
        }
        Update: {
          accountability?: string | null
          color?: string | null
          date_created?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          operation?: string | null
          options?: Json | null
          status?: string
          trigger?: string | null
          user_created?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_flows_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_folders: {
        Row: {
          id: string
          name: string
          parent: string | null
        }
        Insert: {
          id: string
          name: string
          parent?: string | null
        }
        Update: {
          id?: string
          name?: string
          parent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_folders_parent_foreign"
            columns: ["parent"]
            isOneToOne: false
            referencedRelation: "directus_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_migrations: {
        Row: {
          name: string
          timestamp: string | null
          version: string
        }
        Insert: {
          name: string
          timestamp?: string | null
          version: string
        }
        Update: {
          name?: string
          timestamp?: string | null
          version?: string
        }
        Relationships: []
      }
      directus_notifications: {
        Row: {
          collection: string | null
          id: number
          item: string | null
          message: string | null
          recipient: string
          sender: string | null
          status: string | null
          subject: string
          timestamp: string | null
        }
        Insert: {
          collection?: string | null
          id?: number
          item?: string | null
          message?: string | null
          recipient: string
          sender?: string | null
          status?: string | null
          subject: string
          timestamp?: string | null
        }
        Update: {
          collection?: string | null
          id?: number
          item?: string | null
          message?: string | null
          recipient?: string
          sender?: string | null
          status?: string | null
          subject?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_notifications_recipient_foreign"
            columns: ["recipient"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_notifications_sender_foreign"
            columns: ["sender"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_operations: {
        Row: {
          date_created: string | null
          flow: string
          id: string
          key: string
          name: string | null
          options: Json | null
          position_x: number
          position_y: number
          reject: string | null
          resolve: string | null
          type: string
          user_created: string | null
        }
        Insert: {
          date_created?: string | null
          flow: string
          id: string
          key: string
          name?: string | null
          options?: Json | null
          position_x: number
          position_y: number
          reject?: string | null
          resolve?: string | null
          type: string
          user_created?: string | null
        }
        Update: {
          date_created?: string | null
          flow?: string
          id?: string
          key?: string
          name?: string | null
          options?: Json | null
          position_x?: number
          position_y?: number
          reject?: string | null
          resolve?: string | null
          type?: string
          user_created?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_operations_flow_foreign"
            columns: ["flow"]
            isOneToOne: false
            referencedRelation: "directus_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_operations_reject_foreign"
            columns: ["reject"]
            isOneToOne: true
            referencedRelation: "directus_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_operations_resolve_foreign"
            columns: ["resolve"]
            isOneToOne: true
            referencedRelation: "directus_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_operations_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_panels: {
        Row: {
          color: string | null
          dashboard: string
          date_created: string | null
          height: number
          icon: string | null
          id: string
          name: string | null
          note: string | null
          options: Json | null
          position_x: number
          position_y: number
          show_header: boolean
          type: string
          user_created: string | null
          width: number
        }
        Insert: {
          color?: string | null
          dashboard: string
          date_created?: string | null
          height: number
          icon?: string | null
          id: string
          name?: string | null
          note?: string | null
          options?: Json | null
          position_x: number
          position_y: number
          show_header?: boolean
          type: string
          user_created?: string | null
          width: number
        }
        Update: {
          color?: string | null
          dashboard?: string
          date_created?: string | null
          height?: number
          icon?: string | null
          id?: string
          name?: string | null
          note?: string | null
          options?: Json | null
          position_x?: number
          position_y?: number
          show_header?: boolean
          type?: string
          user_created?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "directus_panels_dashboard_foreign"
            columns: ["dashboard"]
            isOneToOne: false
            referencedRelation: "directus_dashboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_panels_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_permissions: {
        Row: {
          action: string
          collection: string
          fields: string | null
          id: number
          permissions: Json | null
          policy: string
          presets: Json | null
          validation: Json | null
        }
        Insert: {
          action: string
          collection: string
          fields?: string | null
          id?: number
          permissions?: Json | null
          policy: string
          presets?: Json | null
          validation?: Json | null
        }
        Update: {
          action?: string
          collection?: string
          fields?: string | null
          id?: number
          permissions?: Json | null
          policy?: string
          presets?: Json | null
          validation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_permissions_policy_foreign"
            columns: ["policy"]
            isOneToOne: false
            referencedRelation: "directus_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_policies: {
        Row: {
          admin_access: boolean
          app_access: boolean
          description: string | null
          enforce_tfa: boolean
          icon: string
          id: string
          ip_access: string | null
          name: string
        }
        Insert: {
          admin_access?: boolean
          app_access?: boolean
          description?: string | null
          enforce_tfa?: boolean
          icon?: string
          id: string
          ip_access?: string | null
          name: string
        }
        Update: {
          admin_access?: boolean
          app_access?: boolean
          description?: string | null
          enforce_tfa?: boolean
          icon?: string
          id?: string
          ip_access?: string | null
          name?: string
        }
        Relationships: []
      }
      directus_presets: {
        Row: {
          bookmark: string | null
          collection: string | null
          color: string | null
          filter: Json | null
          icon: string | null
          id: number
          layout: string | null
          layout_options: Json | null
          layout_query: Json | null
          refresh_interval: number | null
          role: string | null
          search: string | null
          user: string | null
        }
        Insert: {
          bookmark?: string | null
          collection?: string | null
          color?: string | null
          filter?: Json | null
          icon?: string | null
          id?: number
          layout?: string | null
          layout_options?: Json | null
          layout_query?: Json | null
          refresh_interval?: number | null
          role?: string | null
          search?: string | null
          user?: string | null
        }
        Update: {
          bookmark?: string | null
          collection?: string | null
          color?: string | null
          filter?: Json | null
          icon?: string | null
          id?: number
          layout?: string | null
          layout_options?: Json | null
          layout_query?: Json | null
          refresh_interval?: number | null
          role?: string | null
          search?: string | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_presets_role_foreign"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "directus_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_presets_user_foreign"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_relations: {
        Row: {
          id: number
          junction_field: string | null
          many_collection: string
          many_field: string
          one_allowed_collections: string | null
          one_collection: string | null
          one_collection_field: string | null
          one_deselect_action: string
          one_field: string | null
          sort_field: string | null
        }
        Insert: {
          id?: number
          junction_field?: string | null
          many_collection: string
          many_field: string
          one_allowed_collections?: string | null
          one_collection?: string | null
          one_collection_field?: string | null
          one_deselect_action?: string
          one_field?: string | null
          sort_field?: string | null
        }
        Update: {
          id?: number
          junction_field?: string | null
          many_collection?: string
          many_field?: string
          one_allowed_collections?: string | null
          one_collection?: string | null
          one_collection_field?: string | null
          one_deselect_action?: string
          one_field?: string | null
          sort_field?: string | null
        }
        Relationships: []
      }
      directus_revisions: {
        Row: {
          activity: number
          collection: string
          data: Json | null
          delta: Json | null
          id: number
          item: string
          parent: number | null
          version: string | null
        }
        Insert: {
          activity: number
          collection: string
          data?: Json | null
          delta?: Json | null
          id?: number
          item: string
          parent?: number | null
          version?: string | null
        }
        Update: {
          activity?: number
          collection?: string
          data?: Json | null
          delta?: Json | null
          id?: number
          item?: string
          parent?: number | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_revisions_parent_foreign"
            columns: ["parent"]
            isOneToOne: false
            referencedRelation: "directus_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_revisions_version_foreign"
            columns: ["version"]
            isOneToOne: false
            referencedRelation: "directus_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_roles: {
        Row: {
          description: string | null
          icon: string
          id: string
          name: string
          parent: string | null
        }
        Insert: {
          description?: string | null
          icon?: string
          id: string
          name: string
          parent?: string | null
        }
        Update: {
          description?: string | null
          icon?: string
          id?: string
          name?: string
          parent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_roles_parent_foreign"
            columns: ["parent"]
            isOneToOne: false
            referencedRelation: "directus_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_sessions: {
        Row: {
          expires: string
          ip: string | null
          next_token: string | null
          origin: string | null
          share: string | null
          token: string
          user: string | null
          user_agent: string | null
        }
        Insert: {
          expires: string
          ip?: string | null
          next_token?: string | null
          origin?: string | null
          share?: string | null
          token: string
          user?: string | null
          user_agent?: string | null
        }
        Update: {
          expires?: string
          ip?: string | null
          next_token?: string | null
          origin?: string | null
          share?: string | null
          token?: string
          user?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_sessions_share_foreign"
            columns: ["share"]
            isOneToOne: false
            referencedRelation: "directus_shares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_sessions_user_foreign"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_settings: {
        Row: {
          accepted_terms: boolean | null
          auth_login_attempts: number | null
          auth_password_policy: string | null
          basemaps: Json | null
          custom_aspect_ratios: Json | null
          custom_css: string | null
          default_appearance: string
          default_language: string
          default_theme_dark: string | null
          default_theme_light: string | null
          id: number
          mapbox_key: string | null
          mcp_allow_deletes: boolean
          mcp_enabled: boolean
          mcp_prompts_collection: string | null
          mcp_system_prompt: string | null
          mcp_system_prompt_enabled: boolean
          module_bar: Json | null
          project_color: string
          project_descriptor: string | null
          project_id: string | null
          project_logo: string | null
          project_name: string
          project_url: string | null
          public_background: string | null
          public_favicon: string | null
          public_foreground: string | null
          public_note: string | null
          public_registration: boolean
          public_registration_email_filter: Json | null
          public_registration_role: string | null
          public_registration_verify_email: boolean
          report_bug_url: string | null
          report_error_url: string | null
          report_feature_url: string | null
          storage_asset_presets: Json | null
          storage_asset_transform: string | null
          storage_default_folder: string | null
          theme_dark_overrides: Json | null
          theme_light_overrides: Json | null
          visual_editor_urls: Json | null
        }
        Insert: {
          accepted_terms?: boolean | null
          auth_login_attempts?: number | null
          auth_password_policy?: string | null
          basemaps?: Json | null
          custom_aspect_ratios?: Json | null
          custom_css?: string | null
          default_appearance?: string
          default_language?: string
          default_theme_dark?: string | null
          default_theme_light?: string | null
          id?: number
          mapbox_key?: string | null
          mcp_allow_deletes?: boolean
          mcp_enabled?: boolean
          mcp_prompts_collection?: string | null
          mcp_system_prompt?: string | null
          mcp_system_prompt_enabled?: boolean
          module_bar?: Json | null
          project_color?: string
          project_descriptor?: string | null
          project_id?: string | null
          project_logo?: string | null
          project_name?: string
          project_url?: string | null
          public_background?: string | null
          public_favicon?: string | null
          public_foreground?: string | null
          public_note?: string | null
          public_registration?: boolean
          public_registration_email_filter?: Json | null
          public_registration_role?: string | null
          public_registration_verify_email?: boolean
          report_bug_url?: string | null
          report_error_url?: string | null
          report_feature_url?: string | null
          storage_asset_presets?: Json | null
          storage_asset_transform?: string | null
          storage_default_folder?: string | null
          theme_dark_overrides?: Json | null
          theme_light_overrides?: Json | null
          visual_editor_urls?: Json | null
        }
        Update: {
          accepted_terms?: boolean | null
          auth_login_attempts?: number | null
          auth_password_policy?: string | null
          basemaps?: Json | null
          custom_aspect_ratios?: Json | null
          custom_css?: string | null
          default_appearance?: string
          default_language?: string
          default_theme_dark?: string | null
          default_theme_light?: string | null
          id?: number
          mapbox_key?: string | null
          mcp_allow_deletes?: boolean
          mcp_enabled?: boolean
          mcp_prompts_collection?: string | null
          mcp_system_prompt?: string | null
          mcp_system_prompt_enabled?: boolean
          module_bar?: Json | null
          project_color?: string
          project_descriptor?: string | null
          project_id?: string | null
          project_logo?: string | null
          project_name?: string
          project_url?: string | null
          public_background?: string | null
          public_favicon?: string | null
          public_foreground?: string | null
          public_note?: string | null
          public_registration?: boolean
          public_registration_email_filter?: Json | null
          public_registration_role?: string | null
          public_registration_verify_email?: boolean
          report_bug_url?: string | null
          report_error_url?: string | null
          report_feature_url?: string | null
          storage_asset_presets?: Json | null
          storage_asset_transform?: string | null
          storage_default_folder?: string | null
          theme_dark_overrides?: Json | null
          theme_light_overrides?: Json | null
          visual_editor_urls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_settings_project_logo_foreign"
            columns: ["project_logo"]
            isOneToOne: false
            referencedRelation: "directus_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_settings_public_background_foreign"
            columns: ["public_background"]
            isOneToOne: false
            referencedRelation: "directus_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_settings_public_favicon_foreign"
            columns: ["public_favicon"]
            isOneToOne: false
            referencedRelation: "directus_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_settings_public_foreground_foreign"
            columns: ["public_foreground"]
            isOneToOne: false
            referencedRelation: "directus_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_settings_public_registration_role_foreign"
            columns: ["public_registration_role"]
            isOneToOne: false
            referencedRelation: "directus_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_settings_storage_default_folder_foreign"
            columns: ["storage_default_folder"]
            isOneToOne: false
            referencedRelation: "directus_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_shares: {
        Row: {
          collection: string
          date_created: string | null
          date_end: string | null
          date_start: string | null
          id: string
          item: string
          max_uses: number | null
          name: string | null
          password: string | null
          role: string | null
          times_used: number | null
          user_created: string | null
        }
        Insert: {
          collection: string
          date_created?: string | null
          date_end?: string | null
          date_start?: string | null
          id: string
          item: string
          max_uses?: number | null
          name?: string | null
          password?: string | null
          role?: string | null
          times_used?: number | null
          user_created?: string | null
        }
        Update: {
          collection?: string
          date_created?: string | null
          date_end?: string | null
          date_start?: string | null
          id?: string
          item?: string
          max_uses?: number | null
          name?: string | null
          password?: string | null
          role?: string | null
          times_used?: number | null
          user_created?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_shares_collection_foreign"
            columns: ["collection"]
            isOneToOne: false
            referencedRelation: "directus_collections"
            referencedColumns: ["collection"]
          },
          {
            foreignKeyName: "directus_shares_role_foreign"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "directus_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_shares_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_translations: {
        Row: {
          id: string
          key: string
          language: string
          value: string
        }
        Insert: {
          id: string
          key: string
          language: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          language?: string
          value?: string
        }
        Relationships: []
      }
      directus_users: {
        Row: {
          appearance: string | null
          auth_data: Json | null
          avatar: string | null
          description: string | null
          email: string | null
          email_notifications: boolean | null
          external_identifier: string | null
          first_name: string | null
          id: string
          language: string | null
          last_access: string | null
          last_name: string | null
          last_page: string | null
          location: string | null
          password: string | null
          provider: string
          role: string | null
          status: string
          tags: Json | null
          text_direction: string
          tfa_secret: string | null
          theme_dark: string | null
          theme_dark_overrides: Json | null
          theme_light: string | null
          theme_light_overrides: Json | null
          title: string | null
          token: string | null
        }
        Insert: {
          appearance?: string | null
          auth_data?: Json | null
          avatar?: string | null
          description?: string | null
          email?: string | null
          email_notifications?: boolean | null
          external_identifier?: string | null
          first_name?: string | null
          id: string
          language?: string | null
          last_access?: string | null
          last_name?: string | null
          last_page?: string | null
          location?: string | null
          password?: string | null
          provider?: string
          role?: string | null
          status?: string
          tags?: Json | null
          text_direction?: string
          tfa_secret?: string | null
          theme_dark?: string | null
          theme_dark_overrides?: Json | null
          theme_light?: string | null
          theme_light_overrides?: Json | null
          title?: string | null
          token?: string | null
        }
        Update: {
          appearance?: string | null
          auth_data?: Json | null
          avatar?: string | null
          description?: string | null
          email?: string | null
          email_notifications?: boolean | null
          external_identifier?: string | null
          first_name?: string | null
          id?: string
          language?: string | null
          last_access?: string | null
          last_name?: string | null
          last_page?: string | null
          location?: string | null
          password?: string | null
          provider?: string
          role?: string | null
          status?: string
          tags?: Json | null
          text_direction?: string
          tfa_secret?: string | null
          theme_dark?: string | null
          theme_dark_overrides?: Json | null
          theme_light?: string | null
          theme_light_overrides?: Json | null
          title?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_users_role_foreign"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "directus_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_versions: {
        Row: {
          collection: string
          date_created: string | null
          date_updated: string | null
          delta: Json | null
          hash: string | null
          id: string
          item: string
          key: string
          name: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          collection: string
          date_created?: string | null
          date_updated?: string | null
          delta?: Json | null
          hash?: string | null
          id: string
          item: string
          key: string
          name?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          collection?: string
          date_created?: string | null
          date_updated?: string | null
          delta?: Json | null
          hash?: string | null
          id?: string
          item?: string
          key?: string
          name?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_versions_collection_foreign"
            columns: ["collection"]
            isOneToOne: false
            referencedRelation: "directus_collections"
            referencedColumns: ["collection"]
          },
          {
            foreignKeyName: "directus_versions_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_versions_user_updated_foreign"
            columns: ["user_updated"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
        ]
      }
      directus_webhooks: {
        Row: {
          actions: string
          collections: string
          data: boolean
          headers: Json | null
          id: number
          method: string
          migrated_flow: string | null
          name: string
          status: string
          url: string
          was_active_before_deprecation: boolean
        }
        Insert: {
          actions: string
          collections: string
          data?: boolean
          headers?: Json | null
          id?: number
          method?: string
          migrated_flow?: string | null
          name: string
          status?: string
          url: string
          was_active_before_deprecation?: boolean
        }
        Update: {
          actions?: string
          collections?: string
          data?: boolean
          headers?: Json | null
          id?: number
          method?: string
          migrated_flow?: string | null
          name?: string
          status?: string
          url?: string
          was_active_before_deprecation?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "directus_webhooks_migrated_flow_foreign"
            columns: ["migrated_flow"]
            isOneToOne: false
            referencedRelation: "directus_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          boucle: boolean
          created_at: string
          custom_data: Json | null
          custom_table_name: string | null
          id: string
          lead_email: string
          sales_user_id: string
          source_id: string
          source_table: string
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          boucle?: boolean
          created_at?: string
          custom_data?: Json | null
          custom_table_name?: string | null
          id?: string
          lead_email: string
          sales_user_id: string
          source_id: string
          source_table: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          boucle?: boolean
          created_at?: string
          custom_data?: Json | null
          custom_table_name?: string | null
          id?: string
          lead_email?: string
          sales_user_id?: string
          source_id?: string
          source_table?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_table_config: {
        Row: {
          column_config: Json
          created_at: string
          id: string
          sales_user_id: string
          table_name: string
          table_settings: Json | null
          updated_at: string
        }
        Insert: {
          column_config?: Json
          created_at?: string
          id?: string
          sales_user_id: string
          table_name: string
          table_settings?: Json | null
          updated_at?: string
        }
        Update: {
          column_config?: Json
          created_at?: string
          id?: string
          sales_user_id?: string
          table_name?: string
          table_settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      test: {
        Row: {
          created_at: string
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      test_directus: {
        Row: {
          date_created: string | null
          date_updated: string | null
          id: number
          name: string | null
          sort: number | null
          status: string
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          date_created?: string | null
          date_updated?: string | null
          id?: number
          name?: string | null
          sort?: number | null
          status?: string
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          date_created?: string | null
          date_updated?: string | null
          id?: number
          name?: string | null
          sort?: number | null
          status?: string
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_directus_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_directus_user_updated_foreign"
            columns: ["user_updated"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
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
      get_apollo_contacts_only: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          id: string
          nb_employees: number
          primary_email_last_verified_at: string
        }[]
      }
      get_contacts_crm_apollo: {
        Args: Record<PropertyKey, never>
        Returns: {
          aicademia_high_status: string
          aicademia_low_status: string
          apollo_account_id: string
          apollo_account_owner: string
          apollo_company: string
          apollo_company_linkedin: string
          apollo_contact_id: string
          apollo_contact_owner: string
          apollo_created_at: string
          apollo_departments: string
          apollo_email_open: boolean
          apollo_email_sent: boolean
          apollo_email_status: string
          apollo_firstname: string
          apollo_id: string
          apollo_industry: string
          apollo_last_contacted: string
          apollo_last_sync: string
          apollo_lastname: string
          apollo_linkedin_url: string
          apollo_lists: string
          apollo_mobile: string
          apollo_nb_employees: number
          apollo_phone: string
          apollo_replied: boolean
          apollo_seniority: string
          apollo_stage: string
          apollo_status: string
          apollo_title: string
          apollo_updated_at: string
          apollo_website: string
          arlynk_status: string
          contact_active: string
          crm_city: string
          crm_company: string
          crm_country: string
          crm_created_at: string
          crm_firstname: string
          crm_id: number
          crm_linkedin_url: string
          crm_mobile: string
          crm_name: string
          crm_updated_at: string
          email: string
          total_score: number
          zoho_status: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "sales" | "manager" | "admin"
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
      app_role: ["sales", "manager", "admin"],
    },
  },
} as const
