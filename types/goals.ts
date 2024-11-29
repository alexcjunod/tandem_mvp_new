export interface Goal {
  id: string
  title: string
  description: string
  progress: number
  color: string
  tasks: Task[]
  milestones: Milestone[]
  reflections?: Reflection[]
  resources?: Resource[]
}

export interface Task {
  id: string
  title: string
  completed: boolean
  date: string
  type: 'daily' | 'weekly' | 'custom'
  goal_id?: string | null
  user_id: string
  weekday?: number
}

export interface Milestone {
  id: string
  title: string
  date: string
  completed: boolean
  goal_id?: string
  goalTitle?: string
  goalColor?: string
}

export interface Reflection {
  id: string
  content: string
  date: string
  goal_id?: string | null
  user_id: string
}

export interface Resource {
  id: string
  title: string
  url: string
  goal_id?: string | null
  user_id: string
} 