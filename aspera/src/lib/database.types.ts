// AUTO-GENERATED from Supabase schema via mcp__supabase__generate_typescript_types.
// Regenerate with: ask Claude or run `npx supabase gen types typescript --project-id epfewtmwfpnbkwxcnohb`.
// Do not edit by hand — the next regen overwrites everything.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      browsing_sessions: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          received_at: string;
          tabs: Json;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          received_at?: string;
          tabs: Json;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          received_at?: string;
          tabs?: Json;
          user_id?: string | null;
        };
        Relationships: [];
      };
      daily_logs: {
        Row: {
          created_at: string;
          data: Json;
          date: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          data: Json;
          date: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          data?: Json;
          date?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      experiments: {
        Row: {
          control_days: number;
          created_at: string;
          ended_at: string | null;
          hypothesis: string;
          id: string;
          intervention_days: number;
          notes: string | null;
          started_at: string | null;
          status: string;
          target_variable: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          control_days: number;
          created_at?: string;
          ended_at?: string | null;
          hypothesis: string;
          id?: string;
          intervention_days: number;
          notes?: string | null;
          started_at?: string | null;
          status?: string;
          target_variable: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          control_days?: number;
          created_at?: string;
          ended_at?: string | null;
          hypothesis?: string;
          id?: string;
          intervention_days?: number;
          notes?: string | null;
          started_at?: string | null;
          status?: string;
          target_variable?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      mood_entries: {
        Row: {
          created_at: string;
          energy: number;
          id: string;
          mood: number;
          note: string | null;
          source: string | null;
          stress: number;
          timestamp: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          energy: number;
          id?: string;
          mood: number;
          note?: string | null;
          source?: string | null;
          stress: number;
          timestamp: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          energy?: number;
          id?: string;
          mood?: number;
          note?: string | null;
          source?: string | null;
          stress?: number;
          timestamp?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          expo_token: string;
          id: string;
          platform: string | null;
          registered_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          expo_token: string;
          id?: string;
          platform?: string | null;
          registered_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          expo_token?: string;
          id?: string;
          platform?: string | null;
          registered_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      search_cache: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          query: string;
          query_hash: string;
          response: Json;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          query: string;
          query_hash: string;
          response: Json;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          query?: string;
          query_hash?: string;
          response?: Json;
        };
        Relationships: [];
      };
      users: {
        Row: {
          created_at: string;
          display_name: string | null;
          email: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
