export interface GoalStructure {
  title: string
  description: string
  smart_goal: {
    specific: string
    measurable: string
    achievable: string
    relevant: string
    timeBound: string
  }
  start_date: string
  end_date: string
  color: string
  reasoning: string
} 