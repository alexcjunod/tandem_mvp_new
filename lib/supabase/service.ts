import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Goal, Task, Milestone } from '@/types'

// Export the supabase client
export const supabase = createClientComponentClient()

// Goals
export const getGoals = async (userId: string) => {
  try {
    console.log('Fetching goals for user:', userId)
    const { data, error } = await supabase
      .from('goals')
      .select(`
        *,
        tasks (*),
        milestones (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    console.log('Supabase response:', { data, error })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching goals:', error)
    return []
  }
}

export const createGoal = async (goal: Partial<Goal>) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .insert(goal)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating goal:', error)
    throw error
  }
}

export const updateGoal = async (id: string, updates: Partial<Goal>) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating goal:', error)
    throw error
  }
}

export const deleteGoal = async (id: string) => {
  try {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting goal:', error)
    throw error
  }
}

// Tasks
export const createTask = async (task: Partial<Task>) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating task:', error)
    throw error
  }
}

export const updateTask = async (id: string, updates: Partial<Task>) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating task:', error)
    throw error
  }
}

export const deleteTask = async (id: string) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting task:', error)
    throw error
  }
}

// Milestones
export const createMilestone = async (milestone: Partial<Milestone>) => {
  try {
    const { data, error } = await supabase
      .from('milestones')
      .insert(milestone)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating milestone:', error)
    throw error
  }
}

export const updateMilestone = async (id: string, updates: Partial<Milestone>) => {
  try {
    const { data, error } = await supabase
      .from('milestones')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating milestone:', error)
    throw error
  }
}

export const deleteMilestone = async (id: string) => {
  try {
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting milestone:', error)
    throw error
  }
}