import { supabase } from '@/lib/supabase'

export interface Goal {
  id: string
  title: string
  description?: string
  targetDate?: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  goalId: string
  title: string
  completed: boolean
  dueDate?: string
}

export const goalsService = {
  async createGoal(userId: string, goal: Partial<Goal>) {
    const { data, error } = await supabase
      .from('goals')
      .insert([
        {
          user_id: userId,
          title: goal.title,
          description: goal.description,
          target_date: goal.targetDate,
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getGoals(userId: string) {
    const { data, error } = await supabase
      .from('goals')
      .select(`
        *,
        tasks (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async updateGoal(goalId: string, updates: Partial<Goal>) {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async createTask(goalId: string, task: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          goal_id: goalId,
          title: task.title,
          due_date: task.dueDate,
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateTask(taskId: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    return data
  }
} 