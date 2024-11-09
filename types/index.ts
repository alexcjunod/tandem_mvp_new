export interface Post {
  id: number
  content: string
  image_url?: string
  community_id: number
  user_id: string
  author: {
    name: string
    avatar_url: string
  }
  likes: number
  comments: number
  created_at: string
}

export interface Community {
  id: number
  name: string
  description: string
  color: string
  member_count: number
  post_count: number
}

export interface Comment {
  id: number
  content: string
  author_name: string
  created_at: string
  post_id: number
  user_id: string
}

export interface CustomTask {
  id: string
  title: string
  date: Date
  completed: boolean
} 