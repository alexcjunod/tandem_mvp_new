export interface Community {
  id: number
  name: string
  description: string
  color: string
  member_count: number
  post_count: number
}

export interface Post {
  id: number
  content: string
  community_id: number
  author_name: string
  likes: number
  comments: number
  created_at: string
  image_url?: string
  profiles?: {
    full_name: string
    avatar_url: string
  }
}

export interface Comment {
  id: number
  content: string
  author_name: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  avatar_url: string
  updated_at: string
} 