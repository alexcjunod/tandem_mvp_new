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
  tasks?: Task[]
  milestones?: Milestone[]
  reflections?: Reflection[]
  resources?: Resource[]
  created_at?: string
  updated_at?: string
}

export interface Milestone {
  id: string
  title: string
  date: string
  completed: boolean
  goal_id: string
  goalTitle?: string
  goalColor?: string
}

export interface Task {
  id: string
  title: string
  completed: boolean
  date: string
  goal_id?: string
  type: 'daily' | 'weekly' | 'custom'
  weekday?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  tag?: string
  user_id: string
}

export interface Reflection {
  id: string
  date: string
  content: string
  goal_id: string
  user_id: string
  created_at?: string
}

export interface Resource {
  id: string
  title: string
  url: string
  goal_id: string
  user_id: string
  created_at?: string
}

export interface SupabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}