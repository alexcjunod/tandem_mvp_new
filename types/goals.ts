export interface Goal {
  id: string
  title: string
  description: string
  smart_goal: {
    specific: string
    measurable: string
    achievable: string
    relevant: string
    timeBound: string
  }
  reasoning: string
  start_date: string
  end_date: string
  color: string
  progress: number
  milestones: Milestone[]
  tasks: Task[]
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
  goal_id: string
  type: 'daily' | 'weekly'
} 