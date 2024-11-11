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

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string
  progress: number
  start_date: string
  end_date: string
  color: string
  smart_goal: {
    specific: string
    measurable: string
    achievable: string
    relevant: string
    timeBound: string
  }
  reasoning: string
  tasks: Task[]
  milestones: Milestone[]
  created_at?: string
  updated_at?: string
}

export interface Milestone {
  id: string
  goal_id: string
  title: string
  date: string
  completed: boolean
}

export interface Task {
  id: string
  user_id: string
  goal_id: string
  title: string
  type: 'daily' | 'weekly'
  completed: boolean
  date: string
  tag?: string
}

export interface Reflection {
  id: string
  date: string
  content: string
  goalId: string
}

export interface Resource {
  id: string
  title: string
  url: string
  goalId: string
}

export interface SupabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}