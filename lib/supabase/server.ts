import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a Supabase client with the service role key for admin operations
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Function to get goals using the service role
export const getGoalsServer = async (userId: string) => {
  try {
    console.log('Server: Fetching goals for user:', userId)
    
    const { data, error } = await supabaseServer
      .from('goals')
      .select(`
        *,
        tasks (*),
        milestones (*)
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Server: Error fetching goals:', error)
      return []
    }

    console.log('Server: Found goals:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('Server: Error in getGoals:', error)
    return []
  }
} 