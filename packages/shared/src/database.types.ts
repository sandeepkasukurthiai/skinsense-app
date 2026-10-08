// Generated from the live Supabase project "derma-app" (kniwkgszwqqzgtecpory).
// Regenerate with: npm run db:types   (needs `npx supabase login` once)

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
      appointments: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          patient_id: string
          provider_id: string
          service_id: string | null
          source: Database["public"]["Enums"]["appt_source"]
          starts_at: string
          status: Database["public"]["Enums"]["appt_status"]
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          patient_id: string
          provider_id: string
          service_id?: string | null
          source?: Database["public"]["Enums"]["appt_source"]
          starts_at: string
          status?: Database["public"]["Enums"]["appt_status"]
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          patient_id?: string
          provider_id?: string
          service_id?: string | null
          source?: Database["public"]["Enums"]["appt_source"]
          starts_at?: string
          status?: Database["public"]["Enums"]["appt_status"]
        }
        Relationships: [
          { foreignKeyName: "appointments_patient_id_fkey"; columns: ["patient_id"]; isOneToOne: false; referencedRelation: "patients"; referencedColumns: ["id"] },
          { foreignKeyName: "appointments_provider_id_fkey"; columns: ["provider_id"]; isOneToOne: false; referencedRelation: "staff"; referencedColumns: ["id"] },
          { foreignKeyName: "appointments_service_id_fkey"; columns: ["service_id"]; isOneToOne: false; referencedRelation: "services"; referencedColumns: ["id"] },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          at: string
          entity: string
          entity_id: string | null
          id: number
          ip: unknown
          meta: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          at?: string
          entity: string
          entity_id?: string | null
          id?: number
          ip?: unknown
          meta?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          at?: string
          entity?: string
          entity_id?: string | null
          id?: number
          ip?: unknown
          meta?: Json
        }
        Relationships: []
      }
      clinical_notes: {
        Row: {
          amends_note_id: string | null
          appointment_id: string | null
          author_id: string
          created_at: string
          free_text: string | null
          id: string
          patient_id: string
          structured: Json
          template: string | null
        }
        Insert: {
          amends_note_id?: string | null
          appointment_id?: string | null
          author_id: string
          created_at?: string
          free_text?: string | null
          id?: string
          patient_id: string
          structured?: Json
          template?: string | null
        }
        Update: {
          amends_note_id?: string | null
          appointment_id?: string | null
          author_id?: string
          created_at?: string
          free_text?: string | null
          id?: string
          patient_id?: string
          structured?: Json
          template?: string | null
        }
        Relationships: [
          { foreignKeyName: "clinical_notes_appointment_id_fkey"; columns: ["appointment_id"]; isOneToOne: false; referencedRelation: "appointments"; referencedColumns: ["id"] },
          { foreignKeyName: "clinical_notes_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "staff"; referencedColumns: ["id"] },
          { foreignKeyName: "clinical_notes_patient_id_fkey"; columns: ["patient_id"]; isOneToOne: false; referencedRelation: "patients"; referencedColumns: ["id"] },
        ]
      }
      consents: {
        Row: {
          created_at: string
          evidence: Json
          granted_at: string | null
          granted_by_staff_id: string | null
          guardian_patient_id: string | null
          id: string
          kind: Database["public"]["Enums"]["consent_kind"]
          patient_id: string
          withdrawn_at: string | null
        }
        Insert: {
          created_at?: string
          evidence?: Json
          granted_at?: string | null
          granted_by_staff_id?: string | null
          guardian_patient_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["consent_kind"]
          patient_id: string
          withdrawn_at?: string | null
        }
        Update: {
          created_at?: string
          evidence?: Json
          granted_at?: string | null
          granted_by_staff_id?: string | null
          guardian_patient_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["consent_kind"]
          patient_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          { foreignKeyName: "consents_patient_id_fkey"; columns: ["patient_id"]; isOneToOne: false; referencedRelation: "patients"; referencedColumns: ["id"] },
        ]
      }
      invoices: {
        Row: {
          amount_paise: number
          created_at: string
          id: string
          lines: Json
          method: string | null
          paid_at: string | null
          patient_id: string
          plan_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
        }
        Insert: {
          amount_paise: number
          created_at?: string
          id?: string
          lines?: Json
          method?: string | null
          paid_at?: string | null
          patient_id: string
          plan_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
        }
        Update: {
          amount_paise?: number
          created_at?: string
          id?: string
          lines?: Json
          method?: string | null
          paid_at?: string | null
          patient_id?: string
          plan_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
        }
        Relationships: [
          { foreignKeyName: "invoices_patient_id_fkey"; columns: ["patient_id"]; isOneToOne: false; referencedRelation: "patients"; referencedColumns: ["id"] },
          { foreignKeyName: "invoices_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "treatment_plans"; referencedColumns: ["id"] },
        ]
      }
      message_log: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body: string
          channel: Database["public"]["Enums"]["msg_channel"]
          created_at: string
          id: string
          patient_id: string
          provider_msg_id: string | null
          response: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["msg_status"]
          template: string
          variables: Json
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body: string
          channel?: Database["public"]["Enums"]["msg_channel"]
          created_at?: string
          id?: string
          patient_id: string
          provider_msg_id?: string | null
          response?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["msg_status"]
          template: string
          variables?: Json
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body?: string
          channel?: Database["public"]["Enums"]["msg_channel"]
          created_at?: string
          id?: string
          patient_id?: string
          provider_msg_id?: string | null
          response?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["msg_status"]
          template?: string
          variables?: Json
        }
        Relationships: [
          { foreignKeyName: "message_log_patient_id_fkey"; columns: ["patient_id"]; isOneToOne: false; referencedRelation: "patients"; referencedColumns: ["id"] },
        ]
      }
      patients: {
        Row: {
          allergies: string | null
          auth_user_id: string | null
          created_at: string
          dob: string | null
          drug_history: string | null
          fitzpatrick: Database["public"]["Enums"]["fitzpatrick"] | null
          full_name: string
          guardian_patient_id: string | null
          guardian_relationship: string | null
          id: string
          phone: string
          presenting_concern: string | null
          sex: string | null
        }
        Insert: {
          allergies?: string | null
          auth_user_id?: string | null
          created_at?: string
          dob?: string | null
          drug_history?: string | null
          fitzpatrick?: Database["public"]["Enums"]["fitzpatrick"] | null
          full_name: string
          guardian_patient_id?: string | null
          guardian_relationship?: string | null
          id?: string
          phone: string
          presenting_concern?: string | null
          sex?: string | null
        }
        Update: {
          allergies?: string | null
          auth_user_id?: string | null
          created_at?: string
          dob?: string | null
          drug_history?: string | null
          fitzpatrick?: Database["public"]["Enums"]["fitzpatrick"] | null
          full_name?: string
          guardian_patient_id?: string | null
          guardian_relationship?: string | null
          id?: string
          phone?: string
          presenting_concern?: string | null
          sex?: string | null
        }
        Relationships: []
      }
      photo_sets: {
        Row: {
          angle: Database["public"]["Enums"]["photo_angle"]
          captured_at: string
          captured_by: string | null
          id: string
          patient_id: string
          plan_session_id: string | null
          storage_key: string
        }
        Insert: {
          angle?: Database["public"]["Enums"]["photo_angle"]
          captured_at?: string
          captured_by?: string | null
          id?: string
          patient_id: string
          plan_session_id?: string | null
          storage_key: string
        }
        Update: {
          angle?: Database["public"]["Enums"]["photo_angle"]
          captured_at?: string
          captured_by?: string | null
          id?: string
          patient_id?: string
          plan_session_id?: string | null
          storage_key?: string
        }
        Relationships: [
          { foreignKeyName: "photo_sets_patient_id_fkey"; columns: ["patient_id"]; isOneToOne: false; referencedRelation: "patients"; referencedColumns: ["id"] },
          { foreignKeyName: "photo_sets_plan_session_id_fkey"; columns: ["plan_session_id"]; isOneToOne: false; referencedRelation: "plan_sessions"; referencedColumns: ["id"] },
        ]
      }
      plan_sessions: {
        Row: {
          appointment_id: string | null
          due_from: string
          due_to: string
          id: string
          performed_at: string | null
          photo_required: boolean
          plan_id: string
          seq: number
        }
        Insert: {
          appointment_id?: string | null
          due_from: string
          due_to: string
          id?: string
          performed_at?: string | null
          photo_required?: boolean
          plan_id: string
          seq: number
        }
        Update: {
          appointment_id?: string | null
          due_from?: string
          due_to?: string
          id?: string
          performed_at?: string | null
          photo_required?: boolean
          plan_id?: string
          seq?: number
        }
        Relationships: [
          { foreignKeyName: "plan_sessions_appointment_id_fkey"; columns: ["appointment_id"]; isOneToOne: false; referencedRelation: "appointments"; referencedColumns: ["id"] },
          { foreignKeyName: "plan_sessions_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "treatment_plans"; referencedColumns: ["id"] },
        ]
      }
      prescriptions: {
        Row: {
          appointment_id: string | null
          id: string
          items: Json
          patient_id: string
          provider_id: string
          signed_at: string
          telemedicine: boolean
          valid_to: string | null
        }
        Insert: {
          appointment_id?: string | null
          id?: string
          items: Json
          patient_id: string
          provider_id: string
          signed_at?: string
          telemedicine?: boolean
          valid_to?: string | null
        }
        Update: {
          appointment_id?: string | null
          id?: string
          items?: Json
          patient_id?: string
          provider_id?: string
          signed_at?: string
          telemedicine?: boolean
          valid_to?: string | null
        }
        Relationships: [
          { foreignKeyName: "prescriptions_patient_id_fkey"; columns: ["patient_id"]; isOneToOne: false; referencedRelation: "patients"; referencedColumns: ["id"] },
          { foreignKeyName: "prescriptions_provider_id_fkey"; columns: ["provider_id"]; isOneToOne: false; referencedRelation: "staff"; referencedColumns: ["id"] },
        ]
      }
      protocol_steps: {
        Row: { description: string; protocol_id: string; seq: number }
        Insert: { description: string; protocol_id: string; seq: number }
        Update: { description?: string; protocol_id?: string; seq?: number }
        Relationships: [
          { foreignKeyName: "protocol_steps_protocol_id_fkey"; columns: ["protocol_id"]; isOneToOne: false; referencedRelation: "protocols"; referencedColumns: ["id"] },
        ]
      }
      protocols: {
        Row: {
          active: boolean
          contraindications: string[]
          created_at: string
          id: string
          interval_days: number
          interval_grace_days: number
          name: string
          package_price_paise: number | null
          photo_at: number[]
          service_id: string
          session_count: number
          version: number
        }
        Insert: {
          active?: boolean
          contraindications?: string[]
          created_at?: string
          id?: string
          interval_days: number
          interval_grace_days?: number
          name: string
          package_price_paise?: number | null
          photo_at?: number[]
          service_id: string
          session_count: number
          version?: number
        }
        Update: {
          active?: boolean
          contraindications?: string[]
          created_at?: string
          id?: string
          interval_days?: number
          interval_grace_days?: number
          name?: string
          package_price_paise?: number | null
          photo_at?: number[]
          service_id?: string
          session_count?: number
          version?: number
        }
        Relationships: [
          { foreignKeyName: "protocols_service_id_fkey"; columns: ["service_id"]; isOneToOne: false; referencedRelation: "services"; referencedColumns: ["id"] },
        ]
      }
      services: {
        Row: {
          active: boolean
          duration_min: number
          id: string
          line: Database["public"]["Enums"]["service_line"]
          list_price_paise: number | null
          name: string
        }
        Insert: {
          active?: boolean
          duration_min?: number
          id?: string
          line: Database["public"]["Enums"]["service_line"]
          list_price_paise?: number | null
          name: string
        }
        Update: {
          active?: boolean
          duration_min?: number
          id?: string
          line?: Database["public"]["Enums"]["service_line"]
          list_price_paise?: number | null
          name?: string
        }
        Relationships: []
      }
      session_records: {
        Row: {
          adverse_event: string | null
          device: string | null
          endpoint: string | null
          fluence: string | null
          id: string
          passes: number | null
          pih_watch: boolean
          plan_session_id: string
          pulse_width: string | null
          recorded_at: string
          recorded_by: string | null
        }
        Insert: {
          adverse_event?: string | null
          device?: string | null
          endpoint?: string | null
          fluence?: string | null
          id?: string
          passes?: number | null
          pih_watch?: boolean
          plan_session_id: string
          pulse_width?: string | null
          recorded_at?: string
          recorded_by?: string | null
        }
        Update: {
          adverse_event?: string | null
          device?: string | null
          endpoint?: string | null
          fluence?: string | null
          id?: string
          passes?: number | null
          pih_watch?: boolean
          plan_session_id?: string
          pulse_width?: string | null
          recorded_at?: string
          recorded_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "session_records_plan_session_id_fkey"; columns: ["plan_session_id"]; isOneToOne: true; referencedRelation: "plan_sessions"; referencedColumns: ["id"] },
        ]
      }
      staff: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          id: string
          nmc_reg_no: string | null
          qualification: string | null
          role: Database["public"]["Enums"]["app_role"]
          working_hours: Json
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name: string
          id: string
          nmc_reg_no?: string | null
          qualification?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          working_hours?: Json
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          id?: string
          nmc_reg_no?: string | null
          qualification?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          working_hours?: Json
        }
        Relationships: []
      }
      treatment_plans: {
        Row: {
          created_at: string
          id: string
          package_price_paise: number | null
          patient_id: string
          protocol_id: string
          protocol_version: number
          provider_id: string
          started_on: string
          status: Database["public"]["Enums"]["plan_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          package_price_paise?: number | null
          patient_id: string
          protocol_id: string
          protocol_version: number
          provider_id: string
          started_on?: string
          status?: Database["public"]["Enums"]["plan_status"]
        }
        Update: {
          created_at?: string
          id?: string
          package_price_paise?: number | null
          patient_id?: string
          protocol_id?: string
          protocol_version?: number
          provider_id?: string
          started_on?: string
          status?: Database["public"]["Enums"]["plan_status"]
        }
        Relationships: [
          { foreignKeyName: "treatment_plans_patient_id_fkey"; columns: ["patient_id"]; isOneToOne: false; referencedRelation: "patients"; referencedColumns: ["id"] },
          { foreignKeyName: "treatment_plans_protocol_id_fkey"; columns: ["protocol_id"]; isOneToOne: false; referencedRelation: "protocols"; referencedColumns: ["id"] },
          { foreignKeyName: "treatment_plans_provider_id_fkey"; columns: ["provider_id"]; isOneToOne: false; referencedRelation: "staff"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: {
      v_clinicians: {
        Row: {
          full_name: string | null
          id: string | null
          qualification: string | null
          role: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
      v_clinic_metrics: {
        Row: {
          active_courses: number | null
          course_completion_pct: number | null
          drift_count: number | null
          drift_value_paise: number | null
          median_drift_days: number | null
          no_show_pct: number | null
        }
        Relationships: []
      }
      v_day_board: {
        Row: {
          appointment_id: string | null
          clinical_consent_ok: boolean | null
          fitzpatrick: Database["public"]["Enums"]["fitzpatrick"] | null
          full_name: string | null
          is_minor: boolean | null
          patient_id: string | null
          phone: string | null
          protocol_name: string | null
          service_line: Database["public"]["Enums"]["service_line"] | null
          service_name: string | null
          session_count: number | null
          session_seq: number | null
          source: Database["public"]["Enums"]["appt_source"] | null
          starts_at: string | null
          status: Database["public"]["Enums"]["appt_status"] | null
        }
        Relationships: []
      }
      v_drift: {
        Row: {
          days_overdue: number | null
          due_to: string | null
          full_name: string | null
          patient_id: string | null
          phone: string | null
          plan_id: string | null
          plan_session_id: string | null
          protocol_name: string | null
          rank_score: number | null
          remaining_value_paise: number | null
          session_count: number | null
          session_seq: number | null
        }
        Relationships: []
      }
      v_retention: {
        Row: {
          delivered: number | null
          pct_still_attending: number | null
          seq: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_plan_from_protocol: {
        Args: { p_patient: string; p_protocol: string; p_provider: string; p_start?: string }
        Returns: string
      }
      current_patient_id: { Args: never; Returns: string }
      current_staff_role: { Args: never; Returns: Database["public"]["Enums"]["app_role"] }
      has_live_consent: {
        Args: { p_kind: Database["public"]["Enums"]["consent_kind"]; p_patient: string }
        Returns: boolean
      }
      is_clinician: { Args: never; Returns: boolean }
      is_minor: { Args: { p_dob: string }; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      my_patient_ids: { Args: never; Returns: string[] }
      seed_plan: {
        Args: { p_patient_name: string; p_performed: number; p_protocol_name: string; p_start_offset: number }
        Returns: string
      }
    }
    Enums: {
      app_role: "patient" | "front_desk" | "doctor" | "owner"
      appt_source: "app" | "phone" | "whatsapp" | "walk_in"
      appt_status: "booked" | "arrived" | "in_chair" | "completed" | "no_show" | "cancelled"
      consent_kind: "clinical" | "referral" | "marketing" | "telemed"
      fitzpatrick: "I" | "II" | "III" | "IV" | "V" | "VI"
      msg_channel: "whatsapp" | "sms" | "in_app"
      msg_status: "draft" | "pending_approval" | "queued" | "sent" | "delivered" | "failed" | "cancelled"
      photo_angle: "frontal" | "left_oblique" | "right_oblique" | "scalp" | "other"
      plan_status: "active" | "completed" | "lapsed" | "abandoned"
      service_line: "clinical" | "cosmetic" | "paediatric" | "surgery" | "venereology"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> =
  (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      app_role: ["patient", "front_desk", "doctor", "owner"],
      appt_source: ["app", "phone", "whatsapp", "walk_in"],
      appt_status: ["booked", "arrived", "in_chair", "completed", "no_show", "cancelled"],
      consent_kind: ["clinical", "referral", "marketing", "telemed"],
      fitzpatrick: ["I", "II", "III", "IV", "V", "VI"],
      msg_channel: ["whatsapp", "sms", "in_app"],
      msg_status: ["draft", "pending_approval", "queued", "sent", "delivered", "failed", "cancelled"],
      photo_angle: ["frontal", "left_oblique", "right_oblique", "scalp", "other"],
      plan_status: ["active", "completed", "lapsed", "abandoned"],
      service_line: ["clinical", "cosmetic", "paediatric", "surgery", "venereology"],
    },
  },
} as const
