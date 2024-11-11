import { createClient } from '@supabase/supabase-js'
import { Goal } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export const getGoals = async (userId: string) => {
  try {
    console.log('Fetching goals for user:', userId)
    
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    console.log('Raw Supabase response:', { data, error })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getGoals:', error)
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

export const updateGoal = async (id: string, goal: Partial<Goal>) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .update(goal)
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