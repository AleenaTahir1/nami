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
      attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          message_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          message_id: string
          storage_path: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          message_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_status: {
        Row: {
          delivered_at: string | null
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          delivered_at?: string | null
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          delivered_at?: string | null
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_status_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          deleted: boolean | null
          edited_at: string | null
          id: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted?: boolean | null
          edited_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted?: boolean | null
          edited_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string
          email: string
          id: string
          read_receipts_enabled: boolean | null
          show_online_status: boolean | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name: string
          email: string
          id?: string
          read_receipts_enabled?: boolean | null
          show_online_status?: boolean | null
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string
          email?: string
          id?: string
          read_receipts_enabled?: boolean | null
          show_online_status?: boolean | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          last_seen: string | null
          online: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          last_seen?: string | null
          online?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          last_seen?: string | null
          online?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_conversation_messages: {
        Args: { p_contact_id: string; p_limit?: number; p_user_id: string }
        Returns: {
          content: string
          created_at: string
          deleted: boolean
          edited_at: string
          id: string
          receiver_id: string
          sender_id: string
        }[]
      }
      get_user_contacts: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          display_name: string
          email: string
          id: string
          read_receipts_enabled: boolean
          show_online_status: boolean
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      update_user_presence: {
        Args: { p_online: boolean; p_user_id: string }
        Returns: undefined
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

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type MessageStatus = Database['public']['Tables']['message_status']['Row'];
export type UserPresence = Database['public']['Tables']['user_presence']['Row'];
export type Attachment = Database['public']['Tables']['attachments']['Row'];

export type MessageWithStatus = Message & {
  status?: MessageStatus;
};
