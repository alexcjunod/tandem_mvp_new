import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})

// We'll use the service role for data operations instead of JWT auth
export const updateSupabaseAuthToken = async (token: string | null) => {
  try {
    if (!token) {
      await supabase.auth.signOut()
      return null
    }

    // Parse the token to check what we're sending
    const tokenData = JSON.parse(atob(token.split('.')[1]))
    console.log('Token payload:', tokenData)

    return { user: { id: tokenData.user_id } }
  } catch (error) {
    console.error('Error in updateSupabaseAuthToken:', error)
    return null
  }
} 