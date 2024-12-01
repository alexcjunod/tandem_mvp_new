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

export interface Task {
  id: string
  title: string
  type: 'daily' | 'weekly' | 'custom'
  date: string
  goal_id: string
  user_id: string
  weekday?: number
  description?: string
  completed: boolean
}

export interface Milestone {
  id: string
  title: string
  date: string
  completed: boolean
  goal_id: string
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

export interface GoalStructure {
  general: string
  specific: string
  measurable: string
  timeframe: string
  category: string
} 