export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      communities: {
        Row: {
          id: number
          name: string
          description: string
          color: string
          member_count: number
          post_count: number
          created_at: string
        }
        Insert: {
          name: string
          description: string
          color: string
          member_count?: number
          post_count?: number
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: number
          content: string
          community_id: number
          user_id: string
          likes: number
          comments: number
          created_at: string
          image_url?: string
        }
        Insert: {
          content: string
          community_id: number
          user_id: string
          image_url?: string
        }
      }
      community_members: {
        Row: {
          id: number
          community_id: number
          user_id: string
          created_at: string
        }
        Insert: {
          community_id: number
          user_id: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string
        }
      }
    }
  }
} 